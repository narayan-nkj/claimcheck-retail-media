import { z } from 'zod';
/**
 * Human operator review decision types
 */
export const ReviewDecisionSchema = z.enum([
    'APPROVED_OVERRIDE',
    'CONFIRMED_BLOCK',
    'RE_EXTRACT_REQUESTED',
    'ESCALATED_LEGAL',
]);
/**
 * Claim-level operator review note
 */
export const ClaimReviewItemSchema = z
    .object({
    claimId: z.string().min(1).max(64),
    decision: ReviewDecisionSchema,
    note: z.string().max(500).optional(),
})
    .strict();
/**
 * Human Review Action Contract
 * Requires meaningful operator justification (>= 10 chars) for full auditability.
 */
export const HumanReviewActionSchema = z
    .object({
    reviewId: z.string().min(1).max(64),
    checkId: z.string().min(1).max(64),
    operatorId: z.string().min(1).max(64),
    decision: ReviewDecisionSchema,
    rationale: z
        .string()
        .min(10, { message: 'Review rationale must be at least 10 characters to document decision basis' })
        .max(2000),
    reviewedClaims: z.array(ClaimReviewItemSchema).default([]),
    timestamp: z.string().datetime({ message: 'timestamp must be valid ISO-8601 UTC string' }),
})
    .strict();
/**
 * Validator function for human review actions
 */
export function validateReviewAction(payload) {
    return HumanReviewActionSchema.parse(payload);
}
