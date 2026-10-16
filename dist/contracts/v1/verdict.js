import { z } from 'zod';
import { ClaimClassSchema } from './claim.js';
import { EvidenceReferenceSchema } from './evidence.js';
/**
 * Three-tier verdict taxonomy
 * Fail-closed: ALLOW requires complete, fresh, corroborating evidence.
 */
export const VerdictStatusSchema = z.enum(['ALLOW', 'REVIEW', 'BLOCK']);
/**
 * Specific, auditable reason codes
 */
export const VerdictReasonCodeSchema = z.enum([
    'MATCHES_APPROVED_FACTS',
    'PRICE_MISMATCH',
    'DISCOUNT_UNSUPPORTED',
    'PRODUCT_OUT_OF_STOCK',
    'SHIPPING_TIMELINE_UNSUPPORTED',
    'ATTRIBUTE_CONTRADICTED',
    'STALE_EVIDENCE',
    'AMBIGUOUS_CLAIM',
    'OUT_OF_SCOPE_CLAIM',
    'MISSING_EVIDENCE',
    'LOW_EXTRACTOR_CONFIDENCE',
    'POLICY_EXPIRY_THRESHOLD',
    'UNSUPPORTED_CLAIM_CLASS',
]);
/**
 * Decision on an individual extracted claim
 */
export const ClaimVerdictSchema = z
    .object({
    claimId: z.string().min(1).max(64),
    claimClass: ClaimClassSchema,
    status: VerdictStatusSchema,
    primaryReason: VerdictReasonCodeSchema,
    detail: z.string().min(1).max(500),
    evidenceReferences: z.array(EvidenceReferenceSchema).default([]),
    evaluatedAt: z.string().datetime({ message: 'evaluatedAt must be valid ISO-8601 UTC string' }),
})
    .strict();
/**
 * Overall check verdict encompassing all claims in the ad copy
 */
export const OverallCheckVerdictSchema = z
    .object({
    verdictId: z.string().min(1).max(64),
    checkId: z.string().min(1).max(64),
    compositeStatus: VerdictStatusSchema,
    claimVerdicts: z.array(ClaimVerdictSchema),
    summary: z.string().min(1).max(1000),
    evaluatedAt: z.string().datetime({ message: 'evaluatedAt must be valid ISO-8601 UTC string' }),
    policyVersion: z.string().min(1).max(50),
})
    .strict();
/**
 * Fail-closed composition algorithm
 * - If any claim is BLOCK -> overall status is BLOCK
 * - Else if any claim is REVIEW or list is empty -> overall status is REVIEW
 * - Only if ALL claims are ALLOW and non-empty -> overall status is ALLOW
 */
export function determineCompositeVerdict(claimVerdicts) {
    if (!claimVerdicts || claimVerdicts.length === 0) {
        return 'REVIEW'; // No claims verified is fail-closed REVIEW
    }
    const hasBlock = claimVerdicts.some((v) => v.status === 'BLOCK');
    if (hasBlock)
        return 'BLOCK';
    const hasReview = claimVerdicts.some((v) => v.status === 'REVIEW');
    if (hasReview)
        return 'REVIEW';
    return 'ALLOW';
}
/**
 * Validator function for overall check verdicts
 */
export function validateVerdict(payload) {
    return OverallCheckVerdictSchema.parse(payload);
}
