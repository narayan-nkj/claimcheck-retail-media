import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAdCopyPolicy,
  PolicyStateMachine,
  createReviewQueueItem,
  canOperatorResolveItem,
  createChainedAuditEvent,
  verifyAuditChain,
  replayHistoricalCheck,
  computeCanonicalAuditDigest,
} from '../../src/index.ts';

describe('ClaimCheck End-to-End Retail Media Regression Corpus', () => {
  const baseTime = '2026-10-16T12:00:00Z';

  const baseCatalog = {
    schemaVersion: '1.0.0',
    productId: 'prod-4k-tv-55',
    sku: 'SKU-VISION-55-OLED',
    title: 'VisionView 55" 4K OLED Ultra Smart TV',
    brand: 'VisionView',
    category: 'Consumer Electronics',
    pricing: {
      amount: 899.99,
      currency: 'USD',
      regularAmount: 1199.99,
      discountPercentage: 25,
      effectiveFrom: '2026-10-01T00:00:00Z',
      effectiveTo: '2026-10-31T23:59:59Z',
      sourceSnapshotId: 'snap-pricing-01',
    },
    inventory: {
      stockStatus: 'IN_STOCK',
      availableQuantity: 42,
      leadTimeDays: 1,
      updatedAt: '2026-10-16T11:00:00Z',
    },
    shipping: [
      {
        carrierOrTier: 'White-Glove 2-Day',
        minTransitDays: 2,
        maxTransitDays: 2,
        isFreeShipping: true,
        geoRestrictions: [],
        validThrough: '2026-12-31T23:59:59Z',
      },
    ],
    attributes: [
      { key: 'resolution', value: '4K OLED', standardizedValue: 'resolution' },
    ],
    disclaimers: [],
    lastVerifiedAt: '2026-10-16T11:30:00Z',
  };

  it('Scenario 1 (Golden Pass): Valid multi-claim retail ad clears deterministic gate and publishes', () => {
    const claims = [
      {
        claimId: 'c1-price',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 11, text: 'Now $899.99' },
        normalizedStatement: 'Price is $899.99 USD',
        extractedParameters: { statedPrice: 899.99, statedCurrency: 'USD', statedDiscountPercent: 25 },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      },
      {
        claimId: 'c2-stock',
        claimClass: 'AVAILABILITY',
        rawSpan: { startIndex: 13, endIndex: 21, text: 'In stock' },
        normalizedStatement: 'In stock now',
        extractedParameters: { statedStockStatus: 'IN_STOCK' },
        extractorConfidence: 0.98,
        extractionSource: 'MODEL_GENERATED',
      },
      {
        claimId: 'c3-shipping',
        claimClass: 'SHIPPING_PROMISE',
        rawSpan: { startIndex: 23, endIndex: 40, text: 'Free 2-day delivery' },
        normalizedStatement: 'Delivery within 2 days with free shipping',
        extractedParameters: { statedDeliveryWindowDays: 2 },
        extractorConfidence: 0.97,
        extractionSource: 'MODEL_GENERATED',
      },
    ];

    const evidenceList = [
      {
        evidenceId: 'ev-c1',
        claimId: 'c1-price',
        sourceType: 'OPERATOR_ATTESTATION',
        sourceUri: 'https://admin.merchant.com/rates/tv',
        snapshotTimestamp: '2026-10-16T11:00:00Z',
        freshnessTtlSeconds: 86400,
        isFresh: true,
        expectedValue: 899.99,
        actualValue: 899.99,
        evidenceDigest: '1'.repeat(64),
      },
      {
        evidenceId: 'ev-c2',
        claimId: 'c2-stock',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://warehouse.merchant.com/stock/tv',
        snapshotTimestamp: '2026-10-16T11:55:00Z',
        freshnessTtlSeconds: 900,
        isFresh: true,
        expectedValue: 42,
        actualValue: 42,
        evidenceDigest: '2'.repeat(64),
      },
      {
        evidenceId: 'ev-c3',
        claimId: 'c3-shipping',
        sourceType: 'SHIPPING_SERVICE',
        sourceUri: 'https://carrier.merchant.com/white-glove',
        snapshotTimestamp: '2026-10-16T11:30:00Z',
        freshnessTtlSeconds: 43200,
        isFresh: true,
        expectedValue: 2,
        actualValue: 2,
        evidenceDigest: '3'.repeat(64),
      },
    ];

    const verdict = evaluateAdCopyPolicy({
      checkId: 'chk-scen-01',
      copyText: 'Now $899.99! In stock with Free 2-day delivery!',
      catalog: baseCatalog,
      claims,
      evidenceList,
      options: { asOf: baseTime },
    });

    assert.equal(verdict.compositeStatus, 'ALLOW');
    assert.equal(verdict.claimVerdicts.length, 3);
    assert.ok(verdict.claimVerdicts.every((c) => c.status === 'ALLOW'));

    // State machine publication flow
    const sm = new PolicyStateMachine();
    sm.evaluate(verdict);
    assert.equal(sm.getState(), 'DETERMINISTIC_PASS');

    sm.publish('sys-campaign-runner', 'Pre-publication validation cleared');
    assert.equal(sm.getState(), 'PUBLISHED');
  });

  it('Scenario 2 (Deceptive Price): False discount claim triggers fail-closed BLOCK and guards publication', () => {
    const claims = [
      {
        claimId: 'c-fake-price',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 16, text: 'Steal for $599.99' },
        normalizedStatement: 'Price is $599.99 USD',
        extractedParameters: { statedPrice: 599.99, statedCurrency: 'USD' },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      },
    ];

    const verdict = evaluateAdCopyPolicy({
      checkId: 'chk-scen-02',
      copyText: 'Steal for $599.99 today only!',
      catalog: baseCatalog,
      claims,
      evidenceList: [
        {
          evidenceId: 'ev-fake',
          claimId: 'c-fake-price',
          sourceType: 'CATALOG_DATABASE',
          sourceUri: 'https://cat.internal/tv',
          snapshotTimestamp: '2026-10-16T11:00:00Z',
          freshnessTtlSeconds: 86400,
          isFresh: true,
          expectedValue: 899.99,
          actualValue: 899.99,
          evidenceDigest: '4'.repeat(64),
        },
      ],
      options: { asOf: baseTime },
    });

    assert.equal(verdict.compositeStatus, 'BLOCK');
    assert.equal(verdict.claimVerdicts[0].primaryReason, 'PRICE_MISMATCH');

    const sm = new PolicyStateMachine();
    sm.evaluate(verdict);
    assert.equal(sm.getState(), 'REJECTED_BLOCK');

    // Attempted illegal bypass directly to PUBLISHED must throw
    assert.throws(
      () => sm.publish('rogue-operator', 'Bypassing block'),
      /Illegal state transition.*REJECTED_BLOCK/
    );
  });

  it('Scenario 3 (Flash-Sale Expiry): Impending deal expiration triggers Priority 95 and 15-minute SLA', () => {
    const claims = [
      {
        claimId: 'c-promo',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 10, text: 'Flash Sale' },
        normalizedStatement: 'Special Flash Sale',
        extractedParameters: { statedPrice: 899.99 },
        extractorConfidence: 0.95,
        extractionSource: 'MODEL_GENERATED',
      },
    ];

    // Evidence expires in 2 minutes (remaining 120s <= warningWindow 240s)
    const expiringEvidence = [
      {
        evidenceId: 'ev-exp',
        claimId: 'c-promo',
        sourceType: 'PROMOTION_ENGINE',
        sourceUri: 'https://promo.internal/flash',
        snapshotTimestamp: '2026-10-16T11:42:00Z',
        freshnessTtlSeconds: 1200,
        isFresh: true,
        expectedValue: 899.99,
        actualValue: 899.99,
        evidenceDigest: '5'.repeat(64),
      },
    ];

    const verdict = evaluateAdCopyPolicy({
      checkId: 'chk-scen-03',
      copyText: 'Flash Sale $899.99!',
      catalog: baseCatalog,
      claims,
      evidenceList: expiringEvidence,
      options: { asOf: baseTime },
    });

    assert.equal(verdict.compositeStatus, 'REVIEW');

    const queueItem = createReviewQueueItem(verdict, 'camp-flash-99', { asOf: baseTime });
    assert.equal(queueItem.priorityScore, 95);
    assert.equal(queueItem.slaMinutes, 15);
  });

  it('Scenario 4 (Feed Contradiction): Equal-precedence contradictory inventory feeds fail-closed to REVIEW', () => {
    const claims = [
      {
        claimId: 'c-stock-cont',
        claimClass: 'AVAILABILITY',
        rawSpan: { startIndex: 0, endIndex: 8, text: 'In stock' },
        normalizedStatement: 'In stock',
        extractedParameters: { statedStockStatus: 'IN_STOCK' },
        extractorConfidence: 0.98,
        extractionSource: 'MODEL_GENERATED',
      },
    ];

    const conflictingEvidence = [
      {
        evidenceId: 'ev-east',
        claimId: 'c-stock-cont',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://east.warehouse/stock',
        snapshotTimestamp: '2026-10-16T11:55:00Z',
        freshnessTtlSeconds: 900,
        isFresh: true,
        expectedValue: 50,
        actualValue: 50,
        evidenceDigest: '6'.repeat(64),
      },
      {
        evidenceId: 'ev-west',
        claimId: 'c-stock-cont',
        sourceType: 'INVENTORY_FEED',
        sourceUri: 'https://west.warehouse/stock',
        snapshotTimestamp: '2026-10-16T11:55:00Z',
        freshnessTtlSeconds: 900,
        isFresh: true,
        expectedValue: 0,
        actualValue: 0,
        evidenceDigest: '7'.repeat(64),
      },
    ];

    const verdict = evaluateAdCopyPolicy({
      checkId: 'chk-scen-04',
      copyText: 'In stock now!',
      catalog: baseCatalog,
      claims,
      evidenceList: conflictingEvidence,
      options: { asOf: baseTime },
    });

    assert.equal(verdict.compositeStatus, 'REVIEW');
    assert.equal(verdict.claimVerdicts[0].primaryReason, 'AMBIGUOUS_CLAIM');
    assert.match(verdict.claimVerdicts[0].detail, /Contradiction detected/);
  });

  it('Scenario 5 (Tamper-Evident Chaining & Replay): Replays historical check with bit-for-bit determinism', () => {
    const claims = [
      {
        claimId: 'c-clean-price',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 0, endIndex: 7, text: '$899.99' },
        normalizedStatement: 'Price is $899.99',
        extractedParameters: { statedPrice: 899.99, statedCurrency: 'USD' },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      },
    ];

    const evidenceList = [
      {
        evidenceId: 'ev-clean',
        claimId: 'c-clean-price',
        sourceType: 'CATALOG_DATABASE',
        sourceUri: 'https://cat.internal/prices',
        snapshotTimestamp: '2026-10-16T11:00:00Z',
        freshnessTtlSeconds: 86400,
        isFresh: true,
        expectedValue: 899.99,
        actualValue: 899.99,
        evidenceDigest: '8'.repeat(64),
      },
    ];

    const verdict = evaluateAdCopyPolicy({
      checkId: 'chk-scen-05',
      copyText: '$899.99 OLED TV',
      catalog: baseCatalog,
      claims,
      evidenceList,
      options: { asOf: baseTime },
    });

    const rawEvent = {
      auditId: 'aud-scen-05',
      schemaVersion: '1.0.0',
      checkId: 'chk-scen-05',
      timestamp: baseTime,
      adCopyText: '$899.99 OLED TV',
      catalogSnapshot: baseCatalog,
      extractedClaims: claims,
      evidenceSnapshots: evidenceList,
      overallVerdict: verdict,
    };
    const replayDigest = computeCanonicalAuditDigest(rawEvent);
    const auditEvent = { ...rawEvent, replayDigest };

    const chained = createChainedAuditEvent({
      auditEvent,
      sequenceNumber: 1,
      correlationId: 'corr-scen-05',
      traceId: 'trace-scen-05',
    });

    // 1. Verify chain
    const chainVerification = verifyAuditChain([chained]);
    assert.equal(chainVerification.valid, true);

    // 2. Replay check
    const replay = replayHistoricalCheck(auditEvent);
    assert.equal(replay.isReproducible, true);
    assert.equal(replay.digestIntegrityValid, true);
    assert.equal(replay.originalCompositeStatus, 'ALLOW');
    assert.equal(replay.replayedCompositeStatus, 'ALLOW');
    assert.equal(replay.discrepancies.length, 0);
  });
});
