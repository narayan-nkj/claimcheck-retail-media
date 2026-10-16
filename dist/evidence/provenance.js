import { z } from 'zod';
import { createHash } from 'node:crypto';
import { EvidenceSourceTypeSchema } from '../contracts/v1/evidence.js';
/**
 * Data classification tiers for privacy and audit retention
 */
export const DataClassificationSchema = z.enum([
    'PUBLIC_CATALOG',
    'MERCHANT_CONFIDENTIAL',
    'COMPLIANCE_INTERNAL',
]);
/**
 * Immutable link in the evidence chain-of-custody
 */
export const ProvenanceChainItemSchema = z
    .object({
    stepId: z.string().min(1).max(64),
    action: z.enum(['INGESTED', 'NORMALIZED', 'EVALUATED', 'MANUALLY_OVERRIDDEN', 'REDACTED']),
    actor: z.string().min(1).max(64),
    timestamp: z.string().datetime(),
    inputDigest: z.string().regex(/^[a-f0-9]{64}$/i),
    outputDigest: z.string().regex(/^[a-f0-9]{64}$/i),
})
    .strict();
/**
 * Full provenance record for an evidence entity
 */
export const EvidenceProvenanceRecordSchema = z
    .object({
    evidenceId: z.string().min(1).max(64),
    sourceType: EvidenceSourceTypeSchema,
    originUri: z.string().min(1).max(500),
    classification: DataClassificationSchema,
    ingestionBatchId: z.string().min(1).max(64),
    rawPayloadDigest: z.string().regex(/^[a-f0-9]{64}$/i),
    chainOfCustody: z.array(ProvenanceChainItemSchema).min(1),
})
    .strict();
/**
 * Compute SHA-256 hash of any raw evidence payload or string
 */
export function computePayloadDigest(payload) {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createHash('sha256').update(serialized, 'utf8').digest('hex');
}
/**
 * Factory for creating a new provenance record upon ingestion
 */
export function createIngestionProvenance(params) {
    const ts = params.timestamp ?? new Date().toISOString();
    const rawDigest = computePayloadDigest(params.rawPayload);
    const initialChainItem = {
        stepId: `step-init-${params.evidenceId}`,
        action: 'INGESTED',
        actor: params.actor,
        timestamp: ts,
        inputDigest: rawDigest,
        outputDigest: rawDigest,
    };
    return {
        evidenceId: params.evidenceId,
        sourceType: params.sourceType,
        originUri: params.originUri,
        classification: params.classification ?? 'PUBLIC_CATALOG',
        ingestionBatchId: params.ingestionBatchId,
        rawPayloadDigest: rawDigest,
        chainOfCustody: [initialChainItem],
    };
}
/**
 * Append a verified transformation step to the chain-of-custody
 */
export function appendProvenanceStep(record, step) {
    const lastStep = record.chainOfCustody[record.chainOfCustody.length - 1];
    const newDigest = computePayloadDigest(step.newPayload);
    const newStep = {
        stepId: `step-${record.chainOfCustody.length + 1}-${record.evidenceId}`,
        action: step.action,
        actor: step.actor,
        timestamp: step.timestamp ?? new Date().toISOString(),
        inputDigest: lastStep.outputDigest,
        outputDigest: newDigest,
    };
    return {
        ...record,
        chainOfCustody: [...record.chainOfCustody, newStep],
    };
}
