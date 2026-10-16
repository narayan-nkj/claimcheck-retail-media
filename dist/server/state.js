import { createChainedAuditEvent, GENESIS_PREVIOUS_DIGEST } from '../audit/stream.js';
export class AppState {
    auditStream = [];
    reviewQueue = [];
    checks = new Map();
    totalChecksProcessed = 0;
    totalOverrides = 0;
    totalBlocks = 0;
    totalPasses = 0;
    latencies = [];
    reset() {
        this.auditStream = [];
        this.reviewQueue = [];
        this.checks.clear();
        this.totalChecksProcessed = 0;
        this.totalOverrides = 0;
        this.totalBlocks = 0;
        this.totalPasses = 0;
        this.latencies = [];
    }
    recordAuditEvent(event, correlationId, traceId) {
        const sequenceNumber = this.auditStream.length + 1;
        const previousDigest = this.auditStream.length > 0
            ? this.auditStream[this.auditStream.length - 1].chainDigest
            : GENESIS_PREVIOUS_DIGEST;
        const chained = createChainedAuditEvent({
            auditEvent: event,
            sequenceNumber,
            previousDigest,
            correlationId,
            traceId,
        });
        this.auditStream.push(chained);
        return chained;
    }
    getAuditStream() {
        return [...this.auditStream];
    }
    getAuditEvent(auditId) {
        return this.auditStream.find((e) => e.auditId === auditId);
    }
    addReviewItem(item) {
        const existingIndex = this.reviewQueue.findIndex((q) => q.queueId === item.queueId);
        if (existingIndex >= 0) {
            this.reviewQueue[existingIndex] = item;
        }
        else {
            this.reviewQueue.unshift(item); // Prioritize recent items
        }
    }
    getReviewQueue() {
        return [...this.reviewQueue];
    }
    getReviewItem(queueId) {
        return this.reviewQueue.find((q) => q.queueId === queueId || q.checkId === queueId);
    }
    updateReviewItem(queueId, updates) {
        const index = this.reviewQueue.findIndex((q) => q.queueId === queueId || q.checkId === queueId);
        if (index === -1)
            return undefined;
        this.reviewQueue[index] = {
            ...this.reviewQueue[index],
            ...updates,
        };
        return this.reviewQueue[index];
    }
    recordCheck(checkId, result, auditEvent, latencyMs) {
        this.totalChecksProcessed++;
        if (result.compositeStatus === 'ALLOW')
            this.totalPasses++;
        else if (result.compositeStatus === 'BLOCK')
            this.totalBlocks++;
        if (typeof latencyMs === 'number' && latencyMs > 0) {
            this.latencies.push(latencyMs);
        }
        this.checks.set(checkId, {
            result,
            auditEvent,
            timestamp: new Date().toISOString(),
            latencyMs,
        });
    }
    getCheck(checkId) {
        return this.checks.get(checkId);
    }
    recordOverride() {
        this.totalOverrides++;
    }
    getStats() {
        const sorted = [...this.latencies].sort((a, b) => a - b);
        const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0.8;
        const avg = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0.5;
        return {
            totalChecks: this.totalChecksProcessed,
            totalPasses: this.totalPasses,
            totalBlocks: this.totalBlocks,
            totalOverrides: this.totalOverrides,
            queueDepth: this.reviewQueue.filter((q) => q.status !== 'RESOLVED').length,
            auditChainLength: this.auditStream.length,
            avgLatencyMs: Math.round(avg * 100) / 100,
            p95LatencyMs: Math.round(p95 * 100) / 100,
        };
    }
}
export const appState = new AppState();
