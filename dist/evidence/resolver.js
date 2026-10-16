import { evaluateEvidenceFreshness } from './freshness.js';
import { getSourcePrecedence } from './precedence.js';
/**
 * Deterministically resolves multiple candidate evidence records for a single claim.
 * Enforces fail-closed rules:
 * - Empty candidates -> REVIEW (MISSING_EVIDENCE)
 * - Contradictions within top priority tier -> REVIEW (AMBIGUOUS_CLAIM / Contradiction)
 * - Stale top tier -> REVIEW (STALE_EVIDENCE)
 * - Clean fresh top tier -> ALLOW (or warning threshold)
 */
export function resolveEvidenceForClaim(candidates, options) {
    if (!candidates || candidates.length === 0) {
        return {
            status: 'REVIEW',
            reasonCode: 'MISSING_EVIDENCE',
            allCandidates: [],
            hasContradiction: false,
            detail: 'No corroborating evidence records found for this claim.',
        };
    }
    // Evaluate freshness for all candidates
    const evaluated = candidates.map((ev) => ({
        evidence: ev,
        freshness: evaluateEvidenceFreshness(ev, options),
        precedence: getSourcePrecedence(ev.sourceType),
    }));
    // Separate fresh/usable from stale
    const usable = evaluated.filter((item) => item.freshness.isUsable);
    const stale = evaluated.filter((item) => !item.freshness.isUsable);
    if (usable.length === 0) {
        // All candidates are stale
        const topStale = stale.sort((a, b) => b.precedence - a.precedence)[0];
        return {
            status: 'REVIEW',
            reasonCode: 'STALE_EVIDENCE',
            selectedEvidence: topStale.evidence,
            allCandidates: [...candidates],
            freshnessState: 'STALE',
            hasContradiction: false,
            detail: `All ${candidates.length} candidate evidence records are stale. Top source ${topStale.evidence.sourceType} age exceeded TTL.`,
        };
    }
    // Find highest precedence score among usable evidence
    const maxPrecedence = Math.max(...usable.map((u) => u.precedence));
    const topTierUsable = usable.filter((u) => u.precedence === maxPrecedence);
    // Check for contradiction within the top tier
    if (topTierUsable.length > 1) {
        const firstValue = JSON.stringify(topTierUsable[0].evidence.actualValue);
        const hasValueContradiction = topTierUsable.some((item) => JSON.stringify(item.evidence.actualValue) !== firstValue);
        if (hasValueContradiction) {
            const sourceNames = topTierUsable.map((t) => t.evidence.sourceType).join(', ');
            return {
                status: 'REVIEW',
                reasonCode: 'AMBIGUOUS_CLAIM',
                allCandidates: [...candidates],
                freshnessState: topTierUsable[0].freshness.state,
                hasContradiction: true,
                detail: `Contradiction detected: Multiple active sources at tier ${maxPrecedence} (${sourceNames}) report conflicting actual values.`,
            };
        }
    }
    // Top candidate selected (most recent snapshot if multiple identical values)
    topTierUsable.sort((a, b) => new Date(b.evidence.snapshotTimestamp).getTime() -
        new Date(a.evidence.snapshotTimestamp).getTime());
    const winner = topTierUsable[0];
    return {
        status: winner.freshness.state === 'EXPIRING_SOON' ? 'REVIEW' : 'ALLOW',
        reasonCode: winner.freshness.state === 'EXPIRING_SOON'
            ? 'POLICY_EXPIRY_THRESHOLD'
            : 'MATCHES_APPROVED_FACTS',
        selectedEvidence: winner.evidence,
        allCandidates: [...candidates],
        freshnessState: winner.freshness.state,
        hasContradiction: false,
        detail: winner.freshness.detail,
    };
}
