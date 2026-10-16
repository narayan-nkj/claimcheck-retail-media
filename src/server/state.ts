import type { AuditEvent } from '../contracts/v1/audit.ts';
import type { ChainedAuditEvent } from '../audit/stream.ts';
import { createChainedAuditEvent, GENESIS_PREVIOUS_DIGEST } from '../audit/stream.ts';
import type { ReviewQueueItem } from '../policy/reviewQueue.ts';

export class AppState {
  private auditStream: ChainedAuditEvent[] = [];
  private reviewQueue: ReviewQueueItem[] = [];
  private checks: Map<string, any> = new Map();
  private totalChecksProcessed = 0;
  private totalOverrides = 0;
  private totalBlocks = 0;
  private totalPasses = 0;

  public reset(): void {
    this.auditStream = [];
    this.reviewQueue = [];
    this.checks.clear();
    this.totalChecksProcessed = 0;
    this.totalOverrides = 0;
    this.totalBlocks = 0;
    this.totalPasses = 0;
  }

  public recordAuditEvent(
    event: AuditEvent,
    correlationId: string,
    traceId: string
  ): ChainedAuditEvent {
    const sequenceNumber = this.auditStream.length + 1;
    const previousDigest =
      this.auditStream.length > 0
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

  public getAuditStream(): ChainedAuditEvent[] {
    return [...this.auditStream];
  }

  public getAuditEvent(auditId: string): ChainedAuditEvent | undefined {
    return this.auditStream.find((e) => e.auditId === auditId);
  }

  public addReviewItem(item: ReviewQueueItem): void {
    const existingIndex = this.reviewQueue.findIndex((q) => q.queueId === item.queueId);
    if (existingIndex >= 0) {
      this.reviewQueue[existingIndex] = item;
    } else {
      this.reviewQueue.unshift(item); // Prioritize recent items
    }
  }

  public getReviewQueue(): ReviewQueueItem[] {
    return [...this.reviewQueue];
  }

  public getReviewItem(queueId: string): ReviewQueueItem | undefined {
    return this.reviewQueue.find((q) => q.queueId === queueId || q.checkId === queueId);
  }

  public updateReviewItem(
    queueId: string,
    updates: Partial<ReviewQueueItem>
  ): ReviewQueueItem | undefined {
    const index = this.reviewQueue.findIndex((q) => q.queueId === queueId || q.checkId === queueId);
    if (index === -1) return undefined;

    this.reviewQueue[index] = {
      ...this.reviewQueue[index],
      ...updates,
    };
    return this.reviewQueue[index];
  }

  public recordCheck(checkId: string, result: any, auditEvent: ChainedAuditEvent): void {
    this.totalChecksProcessed++;
    if (result.compositeStatus === 'ALLOW') this.totalPasses++;
    else if (result.compositeStatus === 'BLOCK') this.totalBlocks++;

    this.checks.set(checkId, {
      result,
      auditEvent,
      timestamp: new Date().toISOString(),
    });
  }

  public getCheck(checkId: string): any {
    return this.checks.get(checkId);
  }

  public recordOverride(): void {
    this.totalOverrides++;
  }

  public getStats() {
    return {
      totalChecks: this.totalChecksProcessed,
      totalPasses: this.totalPasses,
      totalBlocks: this.totalBlocks,
      totalOverrides: this.totalOverrides,
      queueDepth: this.reviewQueue.filter((q) => q.status !== 'RESOLVED').length,
      auditChainLength: this.auditStream.length,
    };
  }
}

export const appState = new AppState();
