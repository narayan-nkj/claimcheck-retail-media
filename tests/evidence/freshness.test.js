import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateEvidenceFreshness,
  DEFAULT_SOURCE_TTL_SECONDS,
} from '../../src/evidence/freshness.ts';

describe('Evidence Freshness Engine', () => {
  const baseTime = new Date('2026-10-16T12:00:00Z').getTime();

  it('evaluates freshly ingested inventory evidence as FRESH', () => {
    const evidence = {
      sourceType: 'INVENTORY_FEED',
      snapshotTimestamp: new Date(baseTime - 300 * 1000).toISOString(), // 5 minutes old
      freshnessTtlSeconds: DEFAULT_SOURCE_TTL_SECONDS.INVENTORY_FEED, // 900s (15 min)
    };

    const result = evaluateEvidenceFreshness(evidence, { asOf: new Date(baseTime) });
    assert.equal(result.state, 'FRESH');
    assert.equal(result.isUsable, true);
    assert.equal(result.ageSeconds, 300);
    assert.equal(result.remainingTtlSeconds, 600);
  });

  it('flags EXPIRING_SOON when remaining TTL is within warning window', () => {
    const evidence = {
      sourceType: 'INVENTORY_FEED',
      snapshotTimestamp: new Date(baseTime - 750 * 1000).toISOString(), // 12.5 minutes old
      freshnessTtlSeconds: 900,
    };

    const result = evaluateEvidenceFreshness(evidence, {
      asOf: new Date(baseTime),
      warningWindowSeconds: 180, // warning if <= 3 minutes left (150s left)
    });

    assert.equal(result.state, 'EXPIRING_SOON');
    assert.equal(result.isUsable, true);
    assert.equal(result.reasonCode, 'POLICY_EXPIRY_THRESHOLD');
  });

  it('marks evidence as STALE when age exceeds freshness TTL', () => {
    const evidence = {
      sourceType: 'INVENTORY_FEED',
      snapshotTimestamp: new Date(baseTime - 1200 * 1000).toISOString(), // 20 minutes old
      freshnessTtlSeconds: 900,
    };

    const result = evaluateEvidenceFreshness(evidence, { asOf: new Date(baseTime) });
    assert.equal(result.state, 'STALE');
    assert.equal(result.isUsable, false);
    assert.equal(result.reasonCode, 'STALE_EVIDENCE');
  });

  it('marks evidence as STALE when calendar expiry has passed even if within TTL', () => {
    const evidence = {
      sourceType: 'PROMOTION_ENGINE',
      snapshotTimestamp: new Date(baseTime - 600 * 1000).toISOString(), // 10 minutes old
      freshnessTtlSeconds: 3600, // 1 hour TTL
    };

    // Calendar promo ended 1 minute ago
    const calendarExpiry = new Date(baseTime - 60 * 1000).toISOString();

    const result = evaluateEvidenceFreshness(evidence, {
      asOf: new Date(baseTime),
      calendarExpiry,
    });

    assert.equal(result.state, 'STALE');
    assert.equal(result.isUsable, false);
    assert.match(result.detail, /fixed calendar expiration time/);
  });

  it('rejects future-dated evidence timestamps as unverified / clock-drifted', () => {
    const evidence = {
      sourceType: 'CATALOG_DATABASE',
      snapshotTimestamp: new Date(baseTime + 60000).toISOString(), // 1 min in the future
      freshnessTtlSeconds: 86400,
    };

    const result = evaluateEvidenceFreshness(evidence, { asOf: new Date(baseTime) });
    assert.equal(result.state, 'STALE');
    assert.equal(result.isUsable, false);
    assert.match(result.detail, /is in the future/);
  });
});
