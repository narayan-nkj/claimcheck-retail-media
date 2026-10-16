import { performance } from 'node:perf_hooks';
import { evaluateAdCopyPolicy } from '../policy/engine.js';
import { createChainedAuditEvent } from '../audit/stream.js';
import { replayHistoricalCheck } from '../audit/replay.js';
import { computeCanonicalAuditDigest } from '../contracts/v1/audit.js';
function calculatePercentiles(latenciesUs) {
    const sorted = [...latenciesUs].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)] ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;
    return { p50, p95, p99, max };
}
/**
 * Standardized Benchmark Fixtures
 */
export function getStandardBenchmarkFixtures() {
    const mockCatalog = {
        schemaVersion: '1.0.0',
        productId: 'bench-prod-001',
        sku: 'BENCH-SKU-99',
        title: 'Precision Acoustic Wireless Headphones',
        brand: 'SonicPro',
        category: 'Audio',
        pricing: {
            amount: 149.99,
            currency: 'USD',
            regularAmount: 199.99,
            discountPercentage: 25,
            effectiveFrom: '2026-10-01T00:00:00Z',
            effectiveTo: '2026-10-31T23:59:59Z',
            sourceSnapshotId: 'snap-bench-01',
        },
        inventory: {
            stockStatus: 'IN_STOCK',
            availableQuantity: 250,
            leadTimeDays: 1,
            updatedAt: '2026-10-16T10:00:00Z',
        },
        shipping: [
            {
                carrierOrTier: 'Express 2-Day',
                minTransitDays: 2,
                maxTransitDays: 2,
                isFreeShipping: true,
                geoRestrictions: [],
                validThrough: '2026-12-31T23:59:59Z',
            },
        ],
        attributes: [
            { key: 'batteryLife', value: '40 hours', standardizedValue: 'batteryLife' },
            { key: 'connectivity', value: 'Bluetooth 5.3', standardizedValue: 'connectivity' },
        ],
        disclaimers: [],
        lastVerifiedAt: '2026-10-16T11:00:00Z',
    };
    const claims = [
        {
            claimId: 'c-price',
            claimClass: 'PRICE_DISCOUNT',
            rawSpan: { startIndex: 0, endIndex: 12, text: 'Only $149.99' },
            normalizedStatement: 'Price is $149.99 USD',
            extractedParameters: { statedPrice: 149.99, statedCurrency: 'USD', statedDiscountPercent: 25 },
            extractorConfidence: 0.99,
            extractionSource: 'MODEL_GENERATED',
        },
        {
            claimId: 'c-stock',
            claimClass: 'AVAILABILITY',
            rawSpan: { startIndex: 14, endIndex: 22, text: 'In stock' },
            normalizedStatement: 'Product is currently in stock',
            extractedParameters: { statedStockStatus: 'IN_STOCK' },
            extractorConfidence: 0.98,
            extractionSource: 'MODEL_GENERATED',
        },
        {
            claimId: 'c-ship',
            claimClass: 'SHIPPING_PROMISE',
            rawSpan: { startIndex: 24, endIndex: 42, text: 'Free 2-day delivery' },
            normalizedStatement: 'Delivery within 2 days with free shipping',
            extractedParameters: { statedDeliveryWindowDays: 2 },
            extractorConfidence: 0.97,
            extractionSource: 'MODEL_GENERATED',
        },
    ];
    const evidenceList = [
        {
            evidenceId: 'ev-price-01',
            claimId: 'c-price',
            sourceType: 'OPERATOR_ATTESTATION',
            sourceUri: 'https://admin.retail.internal/pricing/99',
            snapshotTimestamp: '2026-10-16T11:30:00Z',
            freshnessTtlSeconds: 86400,
            isFresh: true,
            expectedValue: 149.99,
            actualValue: 149.99,
            evidenceDigest: '1'.repeat(64),
        },
        {
            evidenceId: 'ev-stock-01',
            claimId: 'c-stock',
            sourceType: 'INVENTORY_FEED',
            sourceUri: 'https://feed.retail.internal/inventory/99',
            snapshotTimestamp: '2026-10-16T11:45:00Z',
            freshnessTtlSeconds: 900,
            isFresh: true,
            expectedValue: 250,
            actualValue: 250,
            evidenceDigest: '2'.repeat(64),
        },
        {
            evidenceId: 'ev-ship-01',
            claimId: 'c-ship',
            sourceType: 'SHIPPING_SERVICE',
            sourceUri: 'https://carrier.api.internal/rates/express',
            snapshotTimestamp: '2026-10-16T10:00:00Z',
            freshnessTtlSeconds: 43200,
            isFresh: true,
            expectedValue: 2,
            actualValue: 2,
            evidenceDigest: '3'.repeat(64),
        },
    ];
    return { mockCatalog, claims, evidenceList };
}
/**
 * Execute comprehensive performance benchmark across all core policy components
 */
export async function runPerformanceBenchmark(iterations = 1000) {
    const { mockCatalog, claims, evidenceList } = getStandardBenchmarkFixtures();
    // 1. Warm-up JIT compiler
    for (let i = 0; i < 50; i++) {
        evaluateAdCopyPolicy({
            checkId: `warmup-${i}`,
            copyText: 'Only $149.99 with free 2-day delivery!',
            catalog: mockCatalog,
            claims,
            evidenceList,
        });
    }
    // --- Benchmark 1: Policy Engine Evaluation ---
    const policyLatenciesUs = [];
    const startMem = process.memoryUsage().heapUsed;
    const policyStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const t0 = performance.now();
        evaluateAdCopyPolicy({
            checkId: `bench-chk-${i}`,
            copyText: 'Only $149.99 with free 2-day delivery!',
            catalog: mockCatalog,
            claims,
            evidenceList,
        });
        const t1 = performance.now();
        policyLatenciesUs.push((t1 - t0) * 1000);
    }
    const policyTotalMs = performance.now() - policyStart;
    const policyPercentiles = calculatePercentiles(policyLatenciesUs);
    const policyHeapMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);
    // --- Benchmark 2: Cryptographic Audit Stream Chaining ---
    const chainLatenciesUs = [];
    const sampleVerdict = evaluateAdCopyPolicy({
        checkId: 'bench-sample',
        copyText: 'Only $149.99 with free 2-day delivery!',
        catalog: mockCatalog,
        claims,
        evidenceList,
    });
    const rawEvent = {
        auditId: 'bench-aud-01',
        schemaVersion: '1.0.0',
        checkId: 'bench-chk-sample',
        timestamp: '2026-10-16T12:00:00Z',
        adCopyText: 'Only $149.99 with free 2-day delivery!',
        catalogSnapshot: mockCatalog,
        extractedClaims: claims,
        evidenceSnapshots: evidenceList,
        overallVerdict: sampleVerdict,
    };
    const replayDigest = computeCanonicalAuditDigest(rawEvent);
    const auditEvent = { ...rawEvent, replayDigest };
    const chainStart = performance.now();
    let prevDigest = undefined;
    for (let i = 0; i < iterations; i++) {
        const t0 = performance.now();
        const chained = createChainedAuditEvent({
            auditEvent,
            sequenceNumber: i + 1,
            previousDigest: prevDigest,
            correlationId: `corr-${i}`,
            traceId: `trace-${i}`,
        });
        prevDigest = chained.chainDigest;
        const t1 = performance.now();
        chainLatenciesUs.push((t1 - t0) * 1000);
    }
    const chainTotalMs = performance.now() - chainStart;
    const chainPercentiles = calculatePercentiles(chainLatenciesUs);
    // --- Benchmark 3: Deterministic Historical Replay ---
    const replayLatenciesUs = [];
    const replayStart = performance.now();
    for (let i = 0; i < iterations; i++) {
        const t0 = performance.now();
        replayHistoricalCheck(auditEvent);
        const t1 = performance.now();
        replayLatenciesUs.push((t1 - t0) * 1000);
    }
    const replayTotalMs = performance.now() - replayStart;
    const replayPercentiles = calculatePercentiles(replayLatenciesUs);
    return {
        timestamp: new Date().toISOString(),
        policyEngine: {
            operations: iterations,
            totalTimeMs: Number(policyTotalMs.toFixed(2)),
            opsPerSec: Math.round((iterations / policyTotalMs) * 1000),
            avgLatencyUs: Number((policyLatenciesUs.reduce((a, b) => a + b, 0) / iterations).toFixed(2)),
            p50LatencyUs: Number(policyPercentiles.p50.toFixed(2)),
            p95LatencyUs: Number(policyPercentiles.p95.toFixed(2)),
            p99LatencyUs: Number(policyPercentiles.p99.toFixed(2)),
            maxLatencyUs: Number(policyPercentiles.max.toFixed(2)),
            heapUsedMb: Number(policyHeapMb.toFixed(2)),
        },
        auditChaining: {
            operations: iterations,
            totalTimeMs: Number(chainTotalMs.toFixed(2)),
            opsPerSec: Math.round((iterations / chainTotalMs) * 1000),
            avgLatencyUs: Number((chainLatenciesUs.reduce((a, b) => a + b, 0) / iterations).toFixed(2)),
            p50LatencyUs: Number(chainPercentiles.p50.toFixed(2)),
            p95LatencyUs: Number(chainPercentiles.p95.toFixed(2)),
            p99LatencyUs: Number(chainPercentiles.p99.toFixed(2)),
            maxLatencyUs: Number(chainPercentiles.max.toFixed(2)),
            heapUsedMb: 0,
        },
        historicalReplay: {
            operations: iterations,
            totalTimeMs: Number(replayTotalMs.toFixed(2)),
            opsPerSec: Math.round((iterations / replayTotalMs) * 1000),
            avgLatencyUs: Number((replayLatenciesUs.reduce((a, b) => a + b, 0) / iterations).toFixed(2)),
            p50LatencyUs: Number(replayPercentiles.p50.toFixed(2)),
            p95LatencyUs: Number(replayPercentiles.p95.toFixed(2)),
            p99LatencyUs: Number(replayPercentiles.p99.toFixed(2)),
            maxLatencyUs: Number(replayPercentiles.max.toFixed(2)),
            heapUsedMb: 0,
        },
    };
}
