import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalizeJson,
  computeCanonicalAuditDigest,
  verifyAuditDigest,
  validateAuditEvent,
} from '../../src/contracts/v1/audit.ts';

describe('Audit Event Contract & Replay Digest Verification (v1)', () => {
  const sampleEventWithoutDigest = {
    auditId: 'aud-7701',
    schemaVersion: '1.0.0',
    checkId: 'chk-8800',
    timestamp: '2026-10-15T19:10:00Z',
    adCopyText: 'Save 20% on AcousticWave Pro Soundbar — only $199.99 with free 2-day delivery!',
    catalogSnapshot: {
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
        sourceSnapshotId: 'snap-pricing-001',
      },
      inventory: {
        stockStatus: 'IN_STOCK',
        availableQuantity: 142,
        leadTimeDays: 1,
        updatedAt: '2026-10-15T18:00:00Z',
      },
      shipping: [
        {
          carrierOrTier: 'Standard 2-Day Ground',
          minTransitDays: 2,
          maxTransitDays: 2,
          isFreeShipping: true,
          geoRestrictions: ['US-CONUS'],
          validThrough: '2026-12-31T23:59:59Z',
        },
      ],
      attributes: [],
      disclaimers: [],
      lastVerifiedAt: '2026-10-15T18:30:00Z',
    },
    extractedClaims: [
      {
        claimId: 'claim-1',
        claimClass: 'PRICE_DISCOUNT',
        rawSpan: { startIndex: 44, endIndex: 51, text: '$199.99' },
        normalizedStatement: 'Price is $199.99 USD',
        extractedParameters: { statedPrice: 199.99, statedCurrency: 'USD' },
        extractorConfidence: 0.99,
        extractionSource: 'MODEL_GENERATED',
      },
    ],
    evidenceSnapshots: [
      {
        evidenceId: 'ev-1',
        claimId: 'claim-1',
        sourceType: 'CATALOG_DATABASE',
        sourceUri: 'merchant://catalog/prod-48219/price',
        snapshotTimestamp: '2026-10-15T18:00:00Z',
        freshnessTtlSeconds: 3600,
        isFresh: true,
        expectedValue: 199.99,
        actualValue: 199.99,
        evidenceDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    ],
    overallVerdict: {
      verdictId: 'vrd-9001',
      checkId: 'chk-8800',
      compositeStatus: 'ALLOW',
      claimVerdicts: [
        {
          claimId: 'claim-1',
          claimClass: 'PRICE_DISCOUNT',
          status: 'ALLOW',
          primaryReason: 'MATCHES_APPROVED_FACTS',
          detail: 'Price claim matches approved catalog record.',
          evidenceReferences: [],
          evaluatedAt: '2026-10-15T19:05:00Z',
        },
      ],
      summary: 'All claims substantiated by fresh merchant evidence.',
      evaluatedAt: '2026-10-15T19:05:00Z',
      policyVersion: '2026.10-act3',
    },
    modelServingContext: {
      runtime: 'vLLM-0.6.2-rocm6.1',
      modelId: 'meta-llama/Llama-3.1-8B-Instruct',
      hardwareTarget: 'AMD Instinct MI300X',
      servedThroughVllm: true,
    },
  };

  it('guarantees deterministic canonical JSON serialization regardless of key ordering', () => {
    const objA = { b: 2, a: 1, c: { y: 'bar', x: 'foo' } };
    const objB = { a: 1, c: { x: 'foo', y: 'bar' }, b: 2 };

    const canonA = canonicalizeJson(objA);
    const canonB = canonicalizeJson(objB);

    assert.equal(canonA, canonB);
    assert.equal(canonA, '{"a":1,"b":2,"c":{"x":"foo","y":"bar"}}');
  });

  it('computes and verifies valid SHA-256 replay digest', () => {
    const digest = computeCanonicalAuditDigest(sampleEventWithoutDigest);
    assert.match(digest, /^[a-f0-9]{64}$/);

    const fullEvent = {
      ...sampleEventWithoutDigest,
      replayDigest: digest,
    };

    assert.equal(verifyAuditDigest(fullEvent), true);
    assert.doesNotThrow(() => validateAuditEvent(fullEvent));
  });

  it('detects tampering when payload fields are modified after digest calculation', () => {
    const digest = computeCanonicalAuditDigest(sampleEventWithoutDigest);
    const fullEvent = {
      ...sampleEventWithoutDigest,
      replayDigest: digest,
    };

    // Tampering test 1: Modify ad text
    const tamperedText = structuredClone(fullEvent);
    tamperedText.adCopyText = 'Save 50% on AcousticWave Pro Soundbar!';
    assert.equal(verifyAuditDigest(tamperedText), false);
    assert.throws(() => validateAuditEvent(tamperedText), /replayDigest does not match/);

    // Tampering test 2: Modify verdict from ALLOW to BLOCK
    const tamperedVerdict = structuredClone(fullEvent);
    tamperedVerdict.overallVerdict.compositeStatus = 'BLOCK';
    assert.equal(verifyAuditDigest(tamperedVerdict), false);
  });
});
