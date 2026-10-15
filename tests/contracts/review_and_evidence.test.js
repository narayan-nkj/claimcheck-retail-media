import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence, EvidenceReferenceSchema } from '../../src/contracts/v1/evidence.ts';
import { validateReviewAction, HumanReviewActionSchema } from '../../src/contracts/v1/review.ts';

describe('Evidence Reference Contract (v1)', () => {
  const validEvidence = {
    evidenceId: 'ev-301',
    claimId: 'claim-001',
    sourceType: 'INVENTORY_FEED',
    sourceUri: 'merchant://feeds/inventory/warehouse-east/sku-123',
    snapshotTimestamp: '2026-10-15T18:00:00Z',
    freshnessTtlSeconds: 1800,
    isFresh: true,
    expectedValue: 'IN_STOCK',
    actualValue: 'IN_STOCK',
    evidenceDigest: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  };

  it('validates compliant evidence reference payload', () => {
    const parsed = validateEvidence(validEvidence);
    assert.equal(parsed.evidenceId, 'ev-301');
    assert.equal(parsed.isFresh, true);
    assert.equal(parsed.freshnessTtlSeconds, 1800);
  });

  it('rejects evidence with non-positive freshness TTL', () => {
    const invalid = structuredClone(validEvidence);
    invalid.freshnessTtlSeconds = 0;
    assert.throws(() => validateEvidence(invalid), /freshnessTtlSeconds must be > 0/);
  });

  it('rejects invalid evidenceDigest format (must be 64-character SHA-256 hex string)', () => {
    const invalid = structuredClone(validEvidence);
    invalid.evidenceDigest = 'invalid-hex';
    assert.throws(() => validateEvidence(invalid), /evidenceDigest must be a 64-character SHA-256 hex string/);
  });

  it('rejects unknown source type to prevent untracked evidence', () => {
    const invalid = structuredClone(validEvidence);
    invalid.sourceType = 'UNVERIFIED_BLOG_POST';
    assert.throws(() => validateEvidence(invalid));
  });

  it('fail-closed: rejects unexpected extra fields', () => {
    const invalid = structuredClone(validEvidence);
    invalid.injectedField = 'exploit';
    assert.throws(() => validateEvidence(invalid));
  });
});

describe('Human Review Action Contract (v1)', () => {
  const validReviewAction = {
    reviewId: 'rev-501',
    checkId: 'chk-8800',
    operatorId: 'operator-adity',
    decision: 'APPROVED_OVERRIDE',
    rationale: 'Verified manufacturer packaging insert manually. Free shipping claim applies under fall promotional flyer.',
    reviewedClaims: [
      {
        claimId: 'claim-001',
        decision: 'APPROVED_OVERRIDE',
        note: 'Matches paper catalog supplement batch #440',
      },
    ],
    timestamp: '2026-10-15T19:30:00Z',
  };

  it('validates compliant human review action with reasoned justification', () => {
    const parsed = validateReviewAction(validReviewAction);
    assert.equal(parsed.reviewId, 'rev-501');
    assert.equal(parsed.decision, 'APPROVED_OVERRIDE');
    assert.equal(parsed.reviewedClaims.length, 1);
  });

  it('rejects short or empty rationale (< 10 chars) to prevent unsubstantiated approvals', () => {
    const invalid = structuredClone(validReviewAction);
    invalid.rationale = 'ok';
    assert.throws(() => validateReviewAction(invalid), /Review rationale must be at least 10 characters/);
  });

  it('rejects unapproved review decision types', () => {
    const invalid = structuredClone(validReviewAction);
    invalid.decision = 'BLINDLY_ALLOW';
    assert.throws(() => validateReviewAction(invalid));
  });

  it('fail-closed: rejects unexpected extra fields', () => {
    const invalid = structuredClone(validReviewAction);
    invalid.bypassAudit = true;
    assert.throws(() => validateReviewAction(invalid));
  });
});
