import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVerdict,
  determineCompositeVerdict,
} from '../../src/contracts/v1/verdict.ts';

describe('Verdict Contract & Fail-Closed Logic (v1)', () => {
  const allowClaim = {
    claimId: 'claim-101',
    claimClass: 'PRICE_DISCOUNT',
    status: 'ALLOW',
    primaryReason: 'MATCHES_APPROVED_FACTS',
    detail: 'Advertised price matches current catalog record.',
    evidenceReferences: [],
    evaluatedAt: '2026-10-15T19:00:00Z',
  };

  const reviewClaim = {
    claimId: 'claim-102',
    claimClass: 'SHIPPING_PROMISE',
    status: 'REVIEW',
    primaryReason: 'AMBIGUOUS_CLAIM',
    detail: 'Delivery promise does not specify destination region.',
    evidenceReferences: [],
    evaluatedAt: '2026-10-15T19:00:00Z',
  };

  const blockClaim = {
    claimId: 'claim-103',
    claimClass: 'AVAILABILITY',
    status: 'BLOCK',
    primaryReason: 'PRODUCT_OUT_OF_STOCK',
    detail: 'Copy claims item is in stock, but inventory count is 0.',
    evidenceReferences: [],
    evaluatedAt: '2026-10-15T19:00:00Z',
  };

  describe('determineCompositeVerdict (Fail-Closed Rules)', () => {
    it('returns REVIEW if claim list is empty (no unsubstantiated ad allowed)', () => {
      assert.equal(determineCompositeVerdict([]), 'REVIEW');
    });

    it('returns ALLOW only when all claims are ALLOW', () => {
      assert.equal(determineCompositeVerdict([allowClaim]), 'ALLOW');
    });

    it('returns REVIEW if any claim is REVIEW and none are BLOCK', () => {
      assert.equal(determineCompositeVerdict([allowClaim, reviewClaim]), 'REVIEW');
    });

    it('returns BLOCK if ANY claim is BLOCK (even if others are ALLOW or REVIEW)', () => {
      assert.equal(determineCompositeVerdict([allowClaim, reviewClaim, blockClaim]), 'BLOCK');
      assert.equal(determineCompositeVerdict([allowClaim, blockClaim]), 'BLOCK');
    });
  });

  describe('OverallCheckVerdict Schema Validation', () => {
    const validVerdictPayload = {
      verdictId: 'vrd-9001',
      checkId: 'chk-8800',
      compositeStatus: 'BLOCK',
      claimVerdicts: [allowClaim, blockClaim],
      summary: 'Ad copy contains 1 unverified stock claim and cannot be published.',
      evaluatedAt: '2026-10-15T19:05:00Z',
      policyVersion: '2026.10-act3',
    };

    it('validates a complete OverallCheckVerdict payload', () => {
      const parsed = validateVerdict(validVerdictPayload);
      assert.equal(parsed.compositeStatus, 'BLOCK');
      assert.equal(parsed.claimVerdicts.length, 2);
    });

    it('rejects invalid reason codes', () => {
      const invalid = structuredClone(validVerdictPayload);
      invalid.claimVerdicts[0].primaryReason = 'UNKNOWN_CUSTOM_REASON';
      assert.throws(() => validateVerdict(invalid));
    });

    it('fail-closed: rejects extra fields', () => {
      const invalid = structuredClone(validVerdictPayload);
      invalid.extraUnauthorizedProperty = 123;
      assert.throws(() => validateVerdict(invalid));
    });
  });
});
