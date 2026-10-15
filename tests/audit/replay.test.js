import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { replayHistoricalCheck } from '../../src/audit/replay.ts';
import { computeCanonicalAuditDigest } from '../../src/contracts/v1/audit.ts';
import { evaluateAdCopyPolicy } from '../../src/policy/engine.ts';

describe('Historical Replay Engine & Non-Repudiation', () => {
  const baseTime = '2026-10-16T12:00:00Z';

  const mockCatalog = {
    schemaVersion: '1.0.0',
    productId: 'prod-48219',
    sku: 'SKU-ULTRA-SOUNDBAR',
    title: 'AcousticWave Pro Soundbar 300W',
    brand: 'AcousticWave',
    category: 'Home Audio',
    pricing: {
      amount: 199.99,
      currency: 'USD',
      regularAmount: 249.99,
      discountPercentage: 20,
      effectiveFrom: '2026-10-01T00:00:00Z',
      effectiveTo: '2026-10-31T23:59:59Z',
      sourceSnapshotId: 'snap-pricing-001',
    },
    inventory: {
      stockStatus: 'IN_STOCK',
      availableQuantity: 45,
      leadTimeDays: 1,
      updatedAt: '2026-10-16T11:00:00Z',
    },
    shipping: [
      {
        carrierOrTier: 'Standard 2-Day',
        minTransitDays: 2,
        maxTransitDays: 2,
        isFreeShipping: true,
        geoRestrictions: [],
        validThrough: '2026-12-31T23:59:59Z',
      },
    ],
    attributes: [],
    disclaimers: [],
    lastVerifiedAt: '2026-10-16T11:30:00Z',
  };

  const validEvidencePrice = {
    evidenceId: 'ev-pricing-001',
    claimId: 'claim-price-1',
    sourceType: 'OPERATOR_OVERRIDE',
    sourceUri: 'https://admin.retailer.com/overrides/101',
    snapshotTimestamp: '2026-10-16T11:45:00Z',
    freshnessTtlSeconds: 86400,
    isFresh: true,
    expectedValue: 199.99,
    actualValue: 199.99,
    evidenceDigest: 'a'.repeat(64),
  };

  const validPriceClaim = {
    claimId: 'claim-price-1',
    claimClass: 'PRICE_DISCOUNT',
    rawSpan: { startIndex: 0, endIndex: 12, text: 'Only $199.99' },
    normalizedStatement: 'Price is $199.99 USD',
    extractedParameters: { statedPrice: 199.99, statedCurrency: 'USD' },
    extractorConfidence: 0.99,
    extractionSource: 'MODEL_GENERATED',
  };

  function createSampleAuditEvent(checkId, claims, evidence) {
    const verdict = evaluateAdCopyPolicy({
      checkId,
      copyText: 'Only $199.99 today!',
      catalog: mockCatalog,
      claims,
      evidenceList: evidence,
      options: {
        asOf: baseTime,
        policyVersion: '2026.10-act3',
      },
    });

    const rawEvent = {
      auditId: `aud-${checkId}`,
      schemaVersion: '1.0.0',
      checkId,
      timestamp: baseTime,
      adCopyText: 'Only $199.99 today!',
      catalogSnapshot: mockCatalog,
      extractedClaims: claims,
      evidenceSnapshots: evidence,
      overallVerdict: verdict,
    };

    const replayDigest = computeCanonicalAuditDigest(rawEvent);
    return { ...rawEvent, replayDigest };
  }

  it('replays a historical check with bit-for-bit determinism and confirms reproducibility', () => {
    const auditEvent = createSampleAuditEvent('chk-replay-001', [validPriceClaim], [validEvidencePrice]);

    const result = replayHistoricalCheck(auditEvent);
    assert.equal(result.isReproducible, true);
    assert.equal(result.digestIntegrityValid, true);
    assert.equal(result.originalCompositeStatus, 'ALLOW');
    assert.equal(result.replayedCompositeStatus, 'ALLOW');
    assert.equal(result.claimVerdictMatches, true);
    assert.equal(result.discrepancies.length, 0);
  });

  it('detects cryptographic digest tampering if replayDigest is altered', () => {
    const auditEvent = createSampleAuditEvent('chk-replay-002', [validPriceClaim], [validEvidencePrice]);
    auditEvent.replayDigest = '0'.repeat(64);

    const result = replayHistoricalCheck(auditEvent);
    assert.equal(result.isReproducible, false);
    assert.equal(result.digestIntegrityValid, false);
    assert.ok(result.discrepancies.some((d) => d.includes('Cryptographic digest mismatch')));
  });

  it('detects payload tampering if historical inputs were modified after hash creation', () => {
    const auditEvent = createSampleAuditEvent('chk-replay-003', [validPriceClaim], [validEvidencePrice]);
    // Attacker modifies catalog snapshot amount without recomputing replayDigest
    auditEvent.catalogSnapshot = structuredClone(mockCatalog);
    auditEvent.catalogSnapshot.pricing.amount = 299.99;

    const result = replayHistoricalCheck(auditEvent);
    assert.equal(result.isReproducible, false);
    assert.equal(result.digestIntegrityValid, false);
    assert.ok(result.discrepancies.length > 0);
  });

  it('detects logic drift if original recorded status diverges from replayed status', () => {
    const auditEvent = createSampleAuditEvent('chk-replay-004', [validPriceClaim], [validEvidencePrice]);
    // Artificially change recorded status to BLOCK to test disagreement detector
    auditEvent.overallVerdict.compositeStatus = 'BLOCK';
    // Recompute digest to isolate the status check logic
    const { replayDigest, ...rest } = auditEvent;
    auditEvent.replayDigest = computeCanonicalAuditDigest(rest);

    const result = replayHistoricalCheck(auditEvent);
    assert.equal(result.isReproducible, false);
    assert.equal(result.digestIntegrityValid, true);
    assert.equal(result.originalCompositeStatus, 'BLOCK');
    assert.equal(result.replayedCompositeStatus, 'ALLOW');
    assert.ok(result.discrepancies.some((d) => d.includes('Composite status mismatch')));
  });
});
