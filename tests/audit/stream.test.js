import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_PREVIOUS_DIGEST,
  createChainedAuditEvent,
  serializeToNdjson,
  parseFromNdjson,
  verifyAuditChain,
} from '../../src/audit/stream.ts';
import { computeCanonicalAuditDigest } from '../../src/contracts/v1/audit.ts';

describe('Tamper-Evident Chained Audit Stream', () => {
  function makeMockAuditEvent(checkId, text) {
    const raw = {
      auditId: `aud-${checkId}`,
      schemaVersion: '1.0.0',
      checkId,
      timestamp: '2026-10-16T12:00:00Z',
      adCopyText: text,
      catalogSnapshot: {
        schemaVersion: '1.0.0',
        productId: 'p-1',
        sku: 'SKU-1',
        title: 'Title',
        brand: 'Brand',
        category: 'Category',
        pricing: { amount: 100, currency: 'USD', effectiveFrom: '2026-10-01T00:00:00Z', sourceSnapshotId: 's1' },
        inventory: { stockStatus: 'IN_STOCK', availableQuantity: 10, leadTimeDays: 1, updatedAt: '2026-10-16T10:00:00Z' },
        shipping: [{ carrierOrTier: 'Ground', minTransitDays: 2, maxTransitDays: 3, isFreeShipping: true, geoRestrictions: [], validThrough: '2026-12-31T00:00:00Z' }],
        attributes: [],
        disclaimers: [],
        lastVerifiedAt: '2026-10-16T10:00:00Z',
      },
      extractedClaims: [],
      evidenceSnapshots: [],
      overallVerdict: {
        verdictId: `v-${checkId}`,
        checkId,
        compositeStatus: 'REVIEW',
        claimVerdicts: [],
        summary: 'No claims',
        evaluatedAt: '2026-10-16T12:00:00Z',
        policyVersion: '2026.10-act3',
      },
    };
    const digest = computeCanonicalAuditDigest(raw);
    return { ...raw, replayDigest: digest };
  }

  it('serializes and parses NDJSON line roundtrip accurately', () => {
    const baseEvent = makeMockAuditEvent('chk-001', 'Sale 20% off');
    const chained = createChainedAuditEvent({
      auditEvent: baseEvent,
      sequenceNumber: 1,
      correlationId: 'corr-001',
      traceId: 'trace-001',
    });

    const ndjsonLine = serializeToNdjson(chained);
    assert.ok(ndjsonLine.endsWith('\n'));

    const parsed = parseFromNdjson(ndjsonLine);
    assert.equal(parsed.auditId, chained.auditId);
    assert.equal(parsed.sequenceNumber, 1);
    assert.equal(parsed.previousDigest, GENESIS_PREVIOUS_DIGEST);
    assert.equal(parsed.chainDigest, chained.chainDigest);
  });

  it('verifies a valid 3-event audit chain', () => {
    const ev1 = makeMockAuditEvent('chk-001', 'First copy');
    const chain1 = createChainedAuditEvent({
      auditEvent: ev1,
      sequenceNumber: 1,
      correlationId: 'corr-1',
      traceId: 'trace-1',
    });

    const ev2 = makeMockAuditEvent('chk-002', 'Second copy');
    const chain2 = createChainedAuditEvent({
      auditEvent: ev2,
      sequenceNumber: 2,
      previousDigest: chain1.chainDigest,
      correlationId: 'corr-2',
      traceId: 'trace-2',
    });

    const ev3 = makeMockAuditEvent('chk-003', 'Third copy');
    const chain3 = createChainedAuditEvent({
      auditEvent: ev3,
      sequenceNumber: 3,
      previousDigest: chain2.chainDigest,
      correlationId: 'corr-3',
      traceId: 'trace-3',
    });

    const verification = verifyAuditChain([chain1, chain2, chain3]);
    assert.equal(verification.valid, true);
  });

  it('detects tampering in chained audit stream when a middle payload is altered', () => {
    const ev1 = makeMockAuditEvent('chk-001', 'First copy');
    const chain1 = createChainedAuditEvent({ auditEvent: ev1, sequenceNumber: 1, correlationId: 'c1', traceId: 't1' });

    const ev2 = makeMockAuditEvent('chk-002', 'Second copy');
    const chain2 = createChainedAuditEvent({ auditEvent: ev2, sequenceNumber: 2, previousDigest: chain1.chainDigest, correlationId: 'c2', traceId: 't2' });

    const ev3 = makeMockAuditEvent('chk-003', 'Third copy');
    const chain3 = createChainedAuditEvent({ auditEvent: ev3, sequenceNumber: 3, previousDigest: chain2.chainDigest, correlationId: 'c3', traceId: 't3' });

    // Attacker modifies text in chain2 without updating replayDigest
    const tamperedChain2 = structuredClone(chain2);
    tamperedChain2.adCopyText = 'Attacker altered text!';

    const verification = verifyAuditChain([chain1, tamperedChain2, chain3]);
    assert.equal(verification.valid, false);
    assert.equal(verification.errorIndex, 1);
    assert.match(verification.reason ?? '', /Payload tamper detected/);
  });

  it('detects broken chaining when an event previousDigest does not match predecessor', () => {
    const ev1 = makeMockAuditEvent('chk-001', 'First copy');
    const chain1 = createChainedAuditEvent({ auditEvent: ev1, sequenceNumber: 1, correlationId: 'c1', traceId: 't1' });

    const ev2 = makeMockAuditEvent('chk-002', 'Second copy');
    const chain2 = createChainedAuditEvent({ auditEvent: ev2, sequenceNumber: 2, previousDigest: chain1.chainDigest, correlationId: 'c2', traceId: 't2' });

    // Broken linkage: chain2 previousDigest does not match chain1
    const brokenChain2 = structuredClone(chain2);
    brokenChain2.previousDigest = 'f'.repeat(64);

    const verification = verifyAuditChain([chain1, brokenChain2]);
    assert.equal(verification.valid, false);
    assert.match(verification.reason ?? '', /Chain broken/);
  });
});
