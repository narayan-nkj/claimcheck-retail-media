import { z } from 'zod';
import { createHash } from 'node:crypto';
import { AuditEventSchema, verifyAuditDigest } from '../contracts/v1/audit.js';
export const GENESIS_PREVIOUS_DIGEST = '0'.repeat(64);
/**
 * Chained Audit Event Schema
 * Incorporates forward cryptographic linkage for immutable audit streams.
 */
export const ChainedAuditEventSchema = AuditEventSchema.extend({
    sequenceNumber: z.number().int().positive(),
    previousDigest: z.string().regex(/^[a-f0-9]{64}$/i),
    chainDigest: z.string().regex(/^[a-f0-9]{64}$/i),
    correlationId: z.string().min(1).max(128),
    traceId: z.string().min(1).max(128),
}).strict();
/**
 * Compute the combined cryptographic link hash between previous event and current event
 */
export function computeChainDigest(previousDigest, currentReplayDigest) {
    const payload = `${previousDigest.toLowerCase()}:${currentReplayDigest.toLowerCase()}`;
    return createHash('sha256').update(payload, 'utf8').digest('hex');
}
/**
 * Wraps an AuditEvent into a ChainedAuditEvent
 */
export function createChainedAuditEvent(params) {
    const prevDigest = params.previousDigest ?? GENESIS_PREVIOUS_DIGEST;
    const chainDigest = computeChainDigest(prevDigest, params.auditEvent.replayDigest);
    const chained = {
        ...params.auditEvent,
        sequenceNumber: params.sequenceNumber,
        previousDigest: prevDigest,
        chainDigest,
        correlationId: params.correlationId,
        traceId: params.traceId,
    };
    return ChainedAuditEventSchema.parse(chained);
}
/**
 * Serialize a chained audit event to a single-line NDJSON string
 */
export function serializeToNdjson(event) {
    return JSON.stringify(event) + '\n';
}
/**
 * Parse an NDJSON line into a verified ChainedAuditEvent
 */
export function parseFromNdjson(line) {
    const trimmed = line.trim();
    if (!trimmed) {
        throw new Error('Cannot parse empty NDJSON line');
    }
    const parsed = JSON.parse(trimmed);
    return ChainedAuditEventSchema.parse(parsed);
}
/**
 * Verifies the mathematical integrity and sequence of an audit log stream
 */
export function verifyAuditChain(events) {
    if (!events || events.length === 0) {
        return { valid: true };
    }
    for (let i = 0; i < events.length; i++) {
        const current = events[i];
        // Check 1: Sequence numbering
        const expectedSeq = i + 1;
        if (current.sequenceNumber !== expectedSeq) {
            return {
                valid: false,
                errorIndex: i,
                reason: `Broken sequence numbering at index ${i}: expected ${expectedSeq}, got ${current.sequenceNumber}.`,
            };
        }
        // Check 2: Payload internal integrity
        if (!verifyAuditDigest(current)) {
            return {
                valid: false,
                errorIndex: i,
                reason: `Payload tamper detected at index ${i} (auditId: ${current.auditId}): replayDigest does not match canonical payload.`,
            };
        }
        // Check 3: Genesis previousDigest linkage
        if (i === 0) {
            if (current.previousDigest.toLowerCase() !== GENESIS_PREVIOUS_DIGEST.toLowerCase()) {
                return {
                    valid: false,
                    errorIndex: i,
                    reason: `Invalid genesis block at index 0: previousDigest must be ${GENESIS_PREVIOUS_DIGEST}.`,
                };
            }
        }
        else {
            // Check 4: Inter-event cryptographic chaining
            const previous = events[i - 1];
            if (current.previousDigest.toLowerCase() !== previous.chainDigest.toLowerCase()) {
                return {
                    valid: false,
                    errorIndex: i,
                    reason: `Chain broken at index ${i}: previousDigest (${current.previousDigest}) does not match predecessor chainDigest (${previous.chainDigest}).`,
                };
            }
        }
        // Check 5: chainDigest calculation
        const expectedChainDigest = computeChainDigest(current.previousDigest, current.replayDigest);
        if (current.chainDigest.toLowerCase() !== expectedChainDigest.toLowerCase()) {
            return {
                valid: false,
                errorIndex: i,
                reason: `Invalid chainDigest at index ${i}: expected ${expectedChainDigest}, got ${current.chainDigest}.`,
            };
        }
    }
    return { valid: true };
}
