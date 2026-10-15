import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQueuePriority,
  createReviewQueueItem,
  canOperatorResolveItem,
} from '../../src/policy/reviewQueue.ts';

describe('Human Review Queue & SLA Authorization Engine', () => {
  const baseTime = '2026-10-16T12:00:00Z';

  const expiryVerdict = {
    verdictId: 'v-exp',
    checkId: 'chk-1',
    compositeStatus: 'REVIEW',
    claimVerdicts: [
      {
        claimId: 'c1',
        claimClass: 'PRICE_DISCOUNT',
        status: 'REVIEW',
        primaryReason: 'POLICY_EXPIRY_THRESHOLD',
        detail: 'Deal expires in 10 minutes',
        evidenceReferences: [],
        evaluatedAt: baseTime,
      },
    ],
    summary: 'Near-expiry promotion requires fast-track review.',
    evaluatedAt: baseTime,
    policyVersion: '2026.10-act3',
  };

  const priceMismatchBlockVerdict = {
    verdictId: 'v-block',
    checkId: 'chk-2',
    compositeStatus: 'BLOCK',
    claimVerdicts: [
      {
        claimId: 'c2',
        claimClass: 'PRICE_DISCOUNT',
        status: 'BLOCK',
        primaryReason: 'PRICE_MISMATCH',
        detail: 'Price discrepancy detected',
        evidenceReferences: [],
        evaluatedAt: baseTime,
      },
    ],
    summary: 'False price claim blocked.',
    evaluatedAt: baseTime,
    policyVersion: '2026.10-act3',
  };

  it('assigns urgent Priority 95 and 15-minute SLA to impending expiry promotions', () => {
    const queueItem = createReviewQueueItem(expiryVerdict, 'Flash sale: save 20%!', { asOf: baseTime });

    assert.equal(queueItem.priorityScore, 95);
    assert.equal(queueItem.slaMinutes, 15);
    assert.equal(queueItem.slaDeadline, '2026-10-16T12:15:00.000Z');
  });

  it('assigns Priority 90 and requires SENIOR_COMPLIANCE_OFFICER for price blocks', () => {
    const queueItem = createReviewQueueItem(priceMismatchBlockVerdict, 'Huge sale: $99 soundbar!', {
      asOf: baseTime,
    });

    assert.equal(queueItem.priorityScore, 90);
    assert.equal(queueItem.requiredRole, 'SENIOR_COMPLIANCE_OFFICER');
  });

  it('prevents JUNIOR_OPERATOR from approving overrides on factual BLOCK verdicts', () => {
    const queueItem = createReviewQueueItem(priceMismatchBlockVerdict, 'Fake price copy', {
      asOf: baseTime,
    });

    const checkJunior = canOperatorResolveItem('JUNIOR_OPERATOR', queueItem, 'APPROVED_OVERRIDE');
    assert.equal(checkJunior.allowed, false);
    assert.match(checkJunior.reason, /prohibited from approving overrides on factual BLOCK/);

    const checkSenior = canOperatorResolveItem('SENIOR_COMPLIANCE_OFFICER', queueItem, 'APPROVED_OVERRIDE');
    assert.equal(checkSenior.allowed, true);
  });

  it('allows JUNIOR_OPERATOR to confirm blocks or request re-extraction', () => {
    const queueItem = createReviewQueueItem(priceMismatchBlockVerdict, 'Bad copy', { asOf: baseTime });

    assert.equal(canOperatorResolveItem('JUNIOR_OPERATOR', queueItem, 'CONFIRMED_BLOCK').allowed, true);
    assert.equal(canOperatorResolveItem('JUNIOR_OPERATOR', queueItem, 'RE_EXTRACT_REQUESTED').allowed, true);
  });
});
