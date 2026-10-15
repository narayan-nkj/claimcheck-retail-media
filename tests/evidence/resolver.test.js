import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEvidenceForClaim } from '../../src/evidence/resolver.ts';

describe('Evidence Precedence and Contradiction Resolver', () => {
  const baseTime = '2026-10-16T12:00:00Z';

  const catalogPriceEvidence = {
    evidenceId: 'ev-cat-01',
    claimId: 'claim-price-1',
    sourceType: 'CATALOG_DATABASE',
    sourceUri: 'merchant://catalog/master/item-01',
    snapshotTimestamp: '2026-10-16T08:00:00Z', // 4 hours old, within 24h TTL
    freshnessTtlSeconds: 86400,
    isFresh: true,
    expectedValue: 249.99,
    actualValue: 249.99,
    evidenceDigest: 'a'.repeat(64),
  };

  const promoPriceEvidence = {
    evidenceId: 'ev-promo-01',
    claimId: 'claim-price-1',
    sourceType: 'PROMOTION_ENGINE',
    sourceUri: 'merchant://promo/deals/fall-sale-01',
    snapshotTimestamp: '2026-10-16T11:45:00Z', // 15 minutes old, within 1h TTL
    freshnessTtlSeconds: 3600,
    isFresh: true,
    expectedValue: 199.99,
    actualValue: 199.99,
    evidenceDigest: 'b'.repeat(64),
  };

  it('fails-closed with REVIEW (MISSING_EVIDENCE) when no evidence candidates exist', () => {
    const result = resolveEvidenceForClaim([], { asOf: baseTime });
    assert.equal(result.status, 'REVIEW');
    assert.equal(result.reasonCode, 'MISSING_EVIDENCE');
    assert.equal(result.hasContradiction, false);
  });

  it('allows higher-precedence PROMOTION_ENGINE to override CATALOG_DATABASE when fresh', () => {
    const result = resolveEvidenceForClaim([catalogPriceEvidence, promoPriceEvidence], {
      asOf: baseTime,
    });

    assert.equal(result.status, 'ALLOW');
    assert.equal(result.reasonCode, 'MATCHES_APPROVED_FACTS');
    assert.equal(result.selectedEvidence?.evidenceId, 'ev-promo-01');
    assert.equal(result.selectedEvidence?.actualValue, 199.99);
    assert.equal(result.hasContradiction, false);
  });

  it('detects contradiction between two sources at the same precedence tier (Fail-Closed)', () => {
    const warehouseA = {
      evidenceId: 'ev-wh-a',
      claimId: 'claim-stock-1',
      sourceType: 'INVENTORY_FEED',
      sourceUri: 'merchant://inventory/warehouse-east',
      snapshotTimestamp: '2026-10-16T11:55:00Z',
      freshnessTtlSeconds: 900,
      isFresh: true,
      expectedValue: 'IN_STOCK',
      actualValue: 'IN_STOCK',
      evidenceDigest: 'c'.repeat(64),
    };

    const warehouseB = {
      evidenceId: 'ev-wh-b',
      claimId: 'claim-stock-1',
      sourceType: 'INVENTORY_FEED',
      sourceUri: 'merchant://inventory/warehouse-west',
      snapshotTimestamp: '2026-10-16T11:56:00Z',
      freshnessTtlSeconds: 900,
      isFresh: true,
      expectedValue: 'IN_STOCK',
      actualValue: 'OUT_OF_STOCK', // Contradicts Warehouse A!
      evidenceDigest: 'd'.repeat(64),
    };

    const result = resolveEvidenceForClaim([warehouseA, warehouseB], { asOf: baseTime });

    assert.equal(result.status, 'REVIEW');
    assert.equal(result.reasonCode, 'AMBIGUOUS_CLAIM');
    assert.equal(result.hasContradiction, true);
    assert.match(result.detail, /Contradiction detected/);
  });

  it('fails-closed with REVIEW (STALE_EVIDENCE) when all candidates are stale', () => {
    const staleEvidence = {
      ...catalogPriceEvidence,
      snapshotTimestamp: '2026-10-14T00:00:00Z', // 2.5 days old (exceeds 24h TTL)
    };

    const result = resolveEvidenceForClaim([staleEvidence], { asOf: baseTime });

    assert.equal(result.status, 'REVIEW');
    assert.equal(result.reasonCode, 'STALE_EVIDENCE');
    assert.equal(result.freshnessState, 'STALE');
  });
});
