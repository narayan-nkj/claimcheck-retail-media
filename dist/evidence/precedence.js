/**
 * Precedence ranks for authoritative evidence sources.
 * Higher number = higher precedence.
 */
export const SOURCE_PRECEDENCE_RANKS = {
    OPERATOR_ATTESTATION: 100, // Explicit human review override
    PROMOTION_ENGINE: 80, // Active promotional pricing overrides catalog
    INVENTORY_FEED: 60, // Live warehouse stock overrides static catalog inventory
    SHIPPING_SERVICE: 40, // Live carrier delivery estimates
    CATALOG_DATABASE: 20, // Master product catalog baseline
};
/**
 * Get numerical precedence rank for a source type
 */
export function getSourcePrecedence(sourceType) {
    return SOURCE_PRECEDENCE_RANKS[sourceType] ?? 0;
}
/**
 * Compares two source types by precedence
 * Returns > 0 if A has higher precedence than B
 */
export function comparePrecedence(a, b) {
    return getSourcePrecedence(a) - getSourcePrecedence(b);
}
