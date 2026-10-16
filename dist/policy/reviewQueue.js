import { z } from 'zod';
/**
 * Compliance operator authorization roles
 */
export const OperatorRoleSchema = z.enum([
    'JUNIOR_OPERATOR',
    'SENIOR_COMPLIANCE_OFFICER',
    'LEGAL_COUNSEL',
]);
/**
 * Calculate review priority score and SLA deadline based on claim severity
 */
export function calculateQueuePriority(verdict, options) {
    const asOfTime = options?.asOf ? new Date(options.asOf).getTime() : Date.now();
    const reasons = verdict.claimVerdicts.map((v) => v.primaryReason);
    // Near-expiry deals have critical urgency (15 min SLA)
    if (reasons.includes('POLICY_EXPIRY_THRESHOLD')) {
        return {
            priorityScore: 95,
            slaMinutes: 15,
            requiredRole: 'JUNIOR_OPERATOR',
        };
    }
    // Price discrepancy blocks (high regulatory risk, requires senior officer)
    if (reasons.includes('PRICE_MISMATCH') || reasons.includes('DISCOUNT_UNSUPPORTED')) {
        return {
            priorityScore: 90,
            slaMinutes: 60,
            requiredRole: 'SENIOR_COMPLIANCE_OFFICER',
        };
    }
    // Inventory stockout blocks
    if (reasons.includes('PRODUCT_OUT_OF_STOCK')) {
        return {
            priorityScore: 85,
            slaMinutes: 120,
            requiredRole: 'SENIOR_COMPLIANCE_OFFICER',
        };
    }
    // Subjective / out-of-scope advertising claims
    if (reasons.includes('OUT_OF_SCOPE_CLAIM')) {
        return {
            priorityScore: 70,
            slaMinutes: 180,
            requiredRole: 'LEGAL_COUNSEL',
        };
    }
    // Standard ambiguous claims or missing attribute specs
    return {
        priorityScore: 50,
        slaMinutes: 240, // 4 hours
        requiredRole: 'JUNIOR_OPERATOR',
    };
}
/**
 * Enqueue a check verdict for human operator review
 */
export function createReviewQueueItem(verdict, copyText, options) {
    const asOfTime = options?.asOf ? new Date(options.asOf).getTime() : Date.now();
    const { priorityScore, slaMinutes, requiredRole } = calculateQueuePriority(verdict, options);
    const slaDeadline = new Date(asOfTime + slaMinutes * 60 * 1000).toISOString();
    const flaggedReasons = Array.from(new Set(verdict.claimVerdicts.map((v) => v.primaryReason)));
    return {
        queueId: `queue-${verdict.checkId}`,
        checkId: verdict.checkId,
        adCopyText: copyText,
        compositeStatus: verdict.compositeStatus === 'BLOCK' ? 'BLOCK' : 'REVIEW',
        flaggedReasons,
        priorityScore,
        slaMinutes,
        slaDeadline,
        requiredRole,
        status: 'QUEUED',
    };
}
/**
 * Role-based permission guard for resolving queue items
 */
export function canOperatorResolveItem(operatorRole, queueItem, decision) {
    // Confirming a BLOCK or requesting re-extraction can be done by any operator
    if (decision === 'CONFIRMED_BLOCK' || decision === 'RE_EXTRACT_REQUESTED') {
        return { allowed: true };
    }
    // Escalating to legal can be done by any operator
    if (decision === 'ESCALATED_LEGAL') {
        return { allowed: true };
    }
    // Overriding a BLOCK requires SENIOR_COMPLIANCE_OFFICER or LEGAL_COUNSEL
    if (decision === 'APPROVED_OVERRIDE') {
        if (queueItem.compositeStatus === 'BLOCK') {
            if (operatorRole === 'JUNIOR_OPERATOR') {
                return {
                    allowed: false,
                    reason: 'Junior operators are prohibited from approving overrides on factual BLOCK verdicts. Escalation to Senior Compliance Officer required.',
                };
            }
        }
        if (queueItem.requiredRole === 'LEGAL_COUNSEL' && operatorRole !== 'LEGAL_COUNSEL') {
            return {
                allowed: false,
                reason: 'This item involves out-of-scope regulatory claims and can only be approved by Legal Counsel.',
            };
        }
    }
    return { allowed: true };
}
