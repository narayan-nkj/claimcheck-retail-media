import { z } from 'zod';
/**
 * Freshness states for evidence items
 */
export const FreshnessStateSchema = z.enum(['FRESH', 'EXPIRING_SOON', 'STALE']);
/**
 * Standard TTL configuration (in seconds) by evidence source type
 */
export const DEFAULT_SOURCE_TTL_SECONDS = {
    INVENTORY_FEED: 900, // 15 minutes - high volatility
    PROMOTION_ENGINE: 3600, // 1 hour - promotional price updates
    SHIPPING_SERVICE: 43200, // 12 hours - daily carrier cutoff schedules
    CATALOG_DATABASE: 86400, // 24 hours - core product master data
    OPERATOR_ATTESTATION: 604800, // 7 days - explicit human sign-off window
};
/**
 * Warning threshold (in seconds) before TTL expiration to flag near-expiry
 */
export const DEFAULT_EXPIRY_WARNING_SECONDS = 300; // 5 minutes
/**
 * Evaluate the freshness of an evidence reference against an evaluation timestamp
 * @param evidence - The evidence reference to evaluate
 * @param options - Optional asOf timestamp and warning window override
 */
export function evaluateEvidenceFreshness(evidence, options) {
    const asOfTime = options?.asOf ? new Date(options.asOf).getTime() : Date.now();
    const snapshotTime = new Date(evidence.snapshotTimestamp).getTime();
    if (isNaN(asOfTime)) {
        throw new Error('Invalid asOf timestamp provided to evaluateEvidenceFreshness');
    }
    if (isNaN(snapshotTime)) {
        throw new Error(`Invalid evidence snapshotTimestamp: ${evidence.snapshotTimestamp}`);
    }
    // Check future-dated snapshots (clock drift or malformed input)
    if (snapshotTime > asOfTime + 5000) {
        return {
            state: 'STALE',
            isUsable: false,
            ageSeconds: 0,
            remainingTtlSeconds: 0,
            reasonCode: 'STALE_EVIDENCE',
            detail: `Evidence timestamp (${evidence.snapshotTimestamp}) is in the future relative to evaluation time.`,
        };
    }
    const ageSeconds = Math.max(0, Math.floor((asOfTime - snapshotTime) / 1000));
    const remainingTtlSeconds = evidence.freshnessTtlSeconds - ageSeconds;
    const warningWindow = options?.warningWindowSeconds ?? Math.min(DEFAULT_EXPIRY_WARNING_SECONDS, Math.floor(evidence.freshnessTtlSeconds * 0.2));
    // Check calendar-based expiry (e.g. promo effectiveTo or shipping validThrough)
    if (options?.calendarExpiry) {
        const calendarExpiryTime = new Date(options.calendarExpiry).getTime();
        if (!isNaN(calendarExpiryTime) && asOfTime >= calendarExpiryTime) {
            return {
                state: 'STALE',
                isUsable: false,
                ageSeconds,
                remainingTtlSeconds: 0,
                reasonCode: 'STALE_EVIDENCE',
                detail: `Evidence has passed its fixed calendar expiration time (${new Date(calendarExpiryTime).toISOString()}).`,
            };
        }
    }
    if (remainingTtlSeconds <= 0) {
        return {
            state: 'STALE',
            isUsable: false,
            ageSeconds,
            remainingTtlSeconds: 0,
            reasonCode: 'STALE_EVIDENCE',
            detail: `Evidence is stale. Age (${ageSeconds}s) exceeds configured freshness TTL (${evidence.freshnessTtlSeconds}s).`,
        };
    }
    if (remainingTtlSeconds <= warningWindow) {
        return {
            state: 'EXPIRING_SOON',
            isUsable: true,
            ageSeconds,
            remainingTtlSeconds,
            reasonCode: 'POLICY_EXPIRY_THRESHOLD',
            detail: `Evidence will expire within ${remainingTtlSeconds}s (warning threshold is ${warningWindow}s). Human review recommended.`,
        };
    }
    return {
        state: 'FRESH',
        isUsable: true,
        ageSeconds,
        remainingTtlSeconds,
        reasonCode: 'MATCHES_APPROVED_FACTS',
        detail: `Evidence is fresh. Age is ${ageSeconds}s of ${evidence.freshnessTtlSeconds}s TTL.`,
    };
}
