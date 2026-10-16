import { z } from 'zod';
/**
 * Authoritative evidence source systems
 */
export const EvidenceSourceTypeSchema = z.enum([
    'CATALOG_DATABASE',
    'INVENTORY_FEED',
    'PROMOTION_ENGINE',
    'SHIPPING_SERVICE',
    'OPERATOR_ATTESTATION',
]);
/**
 * Value types allowed in evidence comparison
 */
export const EvidenceValueSchema = z.union([
    z.string().max(1000),
    z.number(),
    z.boolean(),
]);
/**
 * Evidence Reference and Snapshot Contract
 */
export const EvidenceReferenceSchema = z
    .object({
    evidenceId: z.string().min(1).max(64),
    claimId: z.string().min(1).max(64),
    sourceType: EvidenceSourceTypeSchema,
    sourceUri: z.string().min(1).max(500),
    snapshotTimestamp: z.string().datetime({ message: 'snapshotTimestamp must be valid ISO-8601 UTC string' }),
    freshnessTtlSeconds: z.number().int().positive({ message: 'freshnessTtlSeconds must be > 0' }),
    isFresh: z.boolean(),
    expectedValue: EvidenceValueSchema,
    actualValue: EvidenceValueSchema,
    evidenceDigest: z
        .string()
        .regex(/^[a-f0-9]{64}$/i, { message: 'evidenceDigest must be a 64-character SHA-256 hex string' }),
})
    .strict();
/**
 * Validator function for evidence references
 */
export function validateEvidence(payload) {
    return EvidenceReferenceSchema.parse(payload);
}
