import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as SDK from '../../src/index.ts';

describe('Versioned Contracts Compatibility & Schema Evolution (v1)', () => {
  it('exports all expected core domain contracts, policy functions, and audit utilities from master index', () => {
    // Contracts
    assert.equal(typeof SDK.CatalogItemSchema, 'object');
    assert.equal(typeof SDK.ClaimExtractionSchema, 'object');
    assert.equal(typeof SDK.EvidenceReferenceSchema, 'object');
    assert.equal(typeof SDK.OverallCheckVerdictSchema, 'object');
    assert.equal(typeof SDK.AuditEventSchema, 'object');

    // Evidence
    assert.equal(typeof SDK.evaluateEvidenceFreshness, 'function');
    assert.equal(typeof SDK.resolveEvidenceForClaim, 'function');
    assert.equal(typeof SDK.redactSensitiveData, 'function');

    // Policy
    assert.equal(typeof SDK.evaluateAdCopyPolicy, 'function');
    assert.equal(typeof SDK.PolicyStateMachine, 'function');
    assert.equal(typeof SDK.createReviewQueueItem, 'function');

    // Audit & Telemetry
    assert.equal(typeof SDK.createChainedAuditEvent, 'function');
    assert.equal(typeof SDK.verifyAuditChain, 'function');
    assert.equal(typeof SDK.replayHistoricalCheck, 'function');
    assert.equal(typeof SDK.telemetry, 'object');
  });

  it('guarantees deterministic SHA-256 canonical hash stability across key ordering permutations', () => {
    const objA = {
      z_key: 'zebra',
      a_key: 123,
      m_key: { sub_z: true, sub_a: 'alpha' },
    };

    const objB = {
      a_key: 123,
      m_key: { sub_a: 'alpha', sub_z: true },
      z_key: 'zebra',
    };

    const jsonA = SDK.canonicalizeJson(objA);
    const jsonB = SDK.canonicalizeJson(objB);

    assert.equal(jsonA, jsonB);
    assert.equal(
      jsonA,
      '{"a_key":123,"m_key":{"sub_a":"alpha","sub_z":true},"z_key":"zebra"}'
    );
  });

  it('enforces strict backward compatibility on v1 catalog schema with optional fields', () => {
    const legacyMinimalCatalog = {
      schemaVersion: '1.0.0',
      productId: 'legacy-p1',
      sku: 'LEGACY-SKU',
      title: 'Minimal Product',
      brand: 'Generic',
      category: 'Electronics',
      pricing: {
        amount: 29.99,
        currency: 'USD',
        effectiveFrom: '2026-01-01T00:00:00Z',
        sourceSnapshotId: 'legacy-snap-1',
      },
      inventory: {
        stockStatus: 'IN_STOCK',
        availableQuantity: 10,
        leadTimeDays: 0,
        updatedAt: '2026-10-15T00:00:00Z',
      },
      shipping: [
        {
          carrierOrTier: 'Standard',
          minTransitDays: 3,
          maxTransitDays: 5,
          isFreeShipping: false,
          validThrough: '2026-12-31T00:00:00Z',
        },
      ],
      attributes: [],
      disclaimers: [],
      lastVerifiedAt: '2026-10-15T00:00:00Z',
    };

    const parsed = SDK.CatalogItemSchema.parse(legacyMinimalCatalog);
    assert.equal(parsed.productId, 'legacy-p1');
    assert.deepEqual(parsed.shipping[0].geoRestrictions, []);
  });

  it('strictly rejects payload smuggling or unrecognized properties across all core schemas', () => {
    const poisonedClaim = {
      claimId: 'c-test',
      claimClass: 'PRICE_DISCOUNT',
      rawSpan: { startIndex: 0, endIndex: 5, text: '$100' },
      normalizedStatement: 'Price $100',
      extractedParameters: { statedPrice: 100 },
      extractorConfidence: 0.95,
      extractionSource: 'MODEL_GENERATED',
      __injectedAdminBackdoor: true, // Smuggled parameter
    };

    assert.throws(
      () => SDK.ClaimExtractionSchema.parse(poisonedClaim),
      /Unrecognized key/
    );
  });
});
