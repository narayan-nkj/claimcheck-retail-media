import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTransition,
  executeTransition,
  stateFromDeterministicVerdict,
} from '../../src/policy/stateMachine.ts';

describe('Policy State Machine', () => {
  it('correctly maps deterministic verdicts to initial evaluation states', () => {
    assert.equal(stateFromDeterministicVerdict('ALLOW'), 'DETERMINISTIC_PASS');
    assert.equal(stateFromDeterministicVerdict('BLOCK'), 'REJECTED_BLOCK');
    assert.equal(stateFromDeterministicVerdict('REVIEW'), 'PENDING_HUMAN_REVIEW');
  });

  it('permits valid publication flow: UNPROCESSED -> EVALUATING -> DETERMINISTIC_PASS -> PUBLISHED', () => {
    const t1 = executeTransition('UNPROCESSED', 'EVALUATING', {
      actor: 'system-ingest',
      reason: 'Ad submitted for verification',
    });
    assert.equal(t1.newState, 'EVALUATING');

    const t2 = executeTransition('EVALUATING', 'DETERMINISTIC_PASS', {
      actor: 'policy-engine',
      reason: 'All claims substantiated by evidence',
    });
    assert.equal(t2.newState, 'DETERMINISTIC_PASS');

    const t3 = executeTransition('DETERMINISTIC_PASS', 'PUBLISHED', {
      actor: 'campaign-publisher',
      reason: 'Published to ad network',
    });
    assert.equal(t3.newState, 'PUBLISHED');
  });

  it('guards against illegal transition from REJECTED_BLOCK directly to PUBLISHED', () => {
    assert.equal(isValidTransition('REJECTED_BLOCK', 'PUBLISHED'), false);

    assert.throws(
      () =>
        executeTransition('REJECTED_BLOCK', 'PUBLISHED', {
          actor: 'unauthorized-caller',
          reason: 'Bypassing policy',
        }),
      /Illegal state transition requested/
    );
  });

  it('permits override workflow: REJECTED_BLOCK -> OPERATOR_APPROVED_OVERRIDE -> PUBLISHED', () => {
    const override = executeTransition('REJECTED_BLOCK', 'OPERATOR_APPROVED_OVERRIDE', {
      actor: 'senior-officer-adity',
      reason: 'Offline distributor certificate verified for temporary promotion',
    });
    assert.equal(override.newState, 'OPERATOR_APPROVED_OVERRIDE');

    const publish = executeTransition('OPERATOR_APPROVED_OVERRIDE', 'PUBLISHED', {
      actor: 'campaign-publisher',
      reason: 'Published with override',
    });
    assert.equal(publish.newState, 'PUBLISHED');
  });
});
