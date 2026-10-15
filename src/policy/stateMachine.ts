import { z } from 'zod';
import type { VerdictStatus } from '../contracts/v1/verdict.ts';

/**
 * ClaimCheck publication lifecycle states
 */
export const PolicyStateSchema = z.enum([
  'UNPROCESSED',
  'EVALUATING',
  'DETERMINISTIC_PASS',
  'REJECTED_BLOCK',
  'PENDING_HUMAN_REVIEW',
  'OPERATOR_APPROVED_OVERRIDE',
  'OPERATOR_CONFIRMED_BLOCK',
  'ESCALATED_TO_LEGAL',
  'PUBLISHED',
  'ARCHIVED',
]);
export type PolicyState = z.infer<typeof PolicyStateSchema>;

/**
 * Permissible state transitions matrix
 */
const VALID_TRANSITIONS: Record<PolicyState, readonly PolicyState[]> = {
  UNPROCESSED: ['EVALUATING', 'ARCHIVED'],
  EVALUATING: ['DETERMINISTIC_PASS', 'REJECTED_BLOCK', 'PENDING_HUMAN_REVIEW'],
  DETERMINISTIC_PASS: ['PUBLISHED', 'ARCHIVED'],
  REJECTED_BLOCK: ['OPERATOR_APPROVED_OVERRIDE', 'OPERATOR_CONFIRMED_BLOCK', 'ARCHIVED'],
  PENDING_HUMAN_REVIEW: [
    'OPERATOR_APPROVED_OVERRIDE',
    'OPERATOR_CONFIRMED_BLOCK',
    'ESCALATED_TO_LEGAL',
    'ARCHIVED',
  ],
  OPERATOR_APPROVED_OVERRIDE: ['PUBLISHED', 'ARCHIVED'],
  OPERATOR_CONFIRMED_BLOCK: ['ARCHIVED'],
  ESCALATED_TO_LEGAL: [
    'OPERATOR_APPROVED_OVERRIDE',
    'OPERATOR_CONFIRMED_BLOCK',
    'ARCHIVED',
  ],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: [],
};

export interface StateTransitionEvent {
  fromState: PolicyState;
  toState: PolicyState;
  actor: string;
  timestamp: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

/**
 * Validates whether a state transition is legally permissible
 */
export function isValidTransition(from: PolicyState, to: PolicyState): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Computes the initial evaluation state based on deterministic overall verdict
 */
export function stateFromDeterministicVerdict(verdict: VerdictStatus): PolicyState {
  switch (verdict) {
    case 'ALLOW':
      return 'DETERMINISTIC_PASS';
    case 'BLOCK':
      return 'REJECTED_BLOCK';
    case 'REVIEW':
      return 'PENDING_HUMAN_REVIEW';
  }
}

/**
 * Executes a controlled state transition, enforcing guard rails and auditability
 */
export function executeTransition(
  currentState: PolicyState,
  targetState: PolicyState,
  context: {
    actor: string;
    reason: string;
    timestamp?: string;
  }
): { newState: PolicyState; transitionEvent: StateTransitionEvent } {
  if (!isValidTransition(currentState, targetState)) {
    throw new Error(
      `Illegal state transition requested: Cannot transition from ${currentState} to ${targetState}.`
    );
  }

  // Guard: transitions to PUBLISHED require verified justification
  if (targetState === 'PUBLISHED' && currentState !== 'DETERMINISTIC_PASS' && currentState !== 'OPERATOR_APPROVED_OVERRIDE') {
    throw new Error(
      `Publication Guard: Copy can only be published from DETERMINISTIC_PASS or OPERATOR_APPROVED_OVERRIDE. Current state: ${currentState}`
    );
  }

  const transitionEvent: StateTransitionEvent = {
    fromState: currentState,
    toState: targetState,
    actor: context.actor,
    timestamp: context.timestamp ?? new Date().toISOString(),
    reason: context.reason,
  };

  return {
    newState: targetState,
    transitionEvent,
  };
}
