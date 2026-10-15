import { z } from 'zod';
import { createHash } from 'node:crypto';
import { CatalogItemSchema } from './catalog.ts';
import { ClaimExtractionSchema } from './claim.ts';
import { EvidenceReferenceSchema } from './evidence.ts';
import { OverallCheckVerdictSchema } from './verdict.ts';
import { HumanReviewActionSchema } from './review.ts';

/**
 * Context regarding AMD model serving environment
 */
export const ModelServingContextSchema = z
  .object({
    runtime: z.string().min(1).max(100),
    modelId: z.string().min(1).max(100),
    hardwareTarget: z.string().min(1).max(100),
    servedThroughVllm: z.boolean().default(false),
  })
  .strict();
export type ModelServingContext = z.infer<typeof ModelServingContextSchema>;

/**
 * Full Replayable Audit Event Contract
 * Provides tamper-evident non-repudiation for ad claim checks.
 */
export const AuditEventSchema = z
  .object({
    auditId: z.string().min(1).max(64),
    schemaVersion: z.literal('1.0.0'),
    checkId: z.string().min(1).max(64),
    timestamp: z.string().datetime({ message: 'timestamp must be valid ISO-8601 UTC string' }),
    adCopyText: z.string().min(1).max(5000),
    catalogSnapshot: CatalogItemSchema,
    extractedClaims: z.array(ClaimExtractionSchema),
    evidenceSnapshots: z.array(EvidenceReferenceSchema),
    overallVerdict: OverallCheckVerdictSchema,
    humanReview: HumanReviewActionSchema.optional(),
    modelServingContext: ModelServingContextSchema.optional(),
    replayDigest: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, { message: 'replayDigest must be a valid 64-character SHA-256 hex string' }),
  })
  .strict();
export type AuditEvent = z.infer<typeof AuditEventSchema>;

/**
 * Canonical JSON serialization helper (sorts object keys recursively)
 * Ensures deterministic string representation for cryptographic hashing.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }

  const entries = Object.entries(obj as Record<string, unknown>)
    .filter(([_, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  return '{' + entries.map(([k, v]) => JSON.stringify(k) + ':' + canonicalizeJson(v)).join(',') + '}';
}

/**
 * Compute SHA-256 replay digest over the canonicalized payload
 */
export function computeCanonicalAuditDigest(eventWithoutDigest: Omit<AuditEvent, 'replayDigest'>): string {
  const canonicalString = canonicalizeJson(eventWithoutDigest);
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Extract canonical AuditEvent payload fields (excluding replayDigest and external chaining metadata)
 */
export function extractAuditEventPayload(event: AuditEvent): Omit<AuditEvent, 'replayDigest'> {
  return {
    auditId: event.auditId,
    schemaVersion: event.schemaVersion,
    checkId: event.checkId,
    timestamp: event.timestamp,
    adCopyText: event.adCopyText,
    catalogSnapshot: event.catalogSnapshot,
    extractedClaims: event.extractedClaims,
    evidenceSnapshots: event.evidenceSnapshots,
    overallVerdict: event.overallVerdict,
    ...(event.humanReview !== undefined ? { humanReview: event.humanReview } : {}),
    ...(event.modelServingContext !== undefined ? { modelServingContext: event.modelServingContext } : {}),
  };
}

/**
 * Verify whether an AuditEvent's replayDigest matches its canonical payload
 */
export function verifyAuditDigest(event: AuditEvent): boolean {
  const payload = extractAuditEventPayload(event);
  const computed = computeCanonicalAuditDigest(payload);
  return computed.toLowerCase() === event.replayDigest.toLowerCase();
}

/**
 * Validator function for AuditEvent
 */
export function validateAuditEvent(payload: unknown): AuditEvent {
  const parsed = AuditEventSchema.parse(payload);
  if (!verifyAuditDigest(parsed)) {
    throw new Error(`Audit digest verification failed for check ${parsed.checkId}: replayDigest does not match canonical payload hash`);
  }
  return parsed;
}
