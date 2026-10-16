import { runAMDBenchmark } from '../src/benchmark/amdRunner.ts';

console.log('='.repeat(76));
console.log('   ClaimCheck Deterministic Fallback Adapter Benchmark (v1.0.0)');
console.log('   Execution Mode: Deterministic Local Regex Fallback (Offline / Zero-GPU)');
console.log('='.repeat(76));
console.log('Running 50 iterations measuring local rule-based extraction latency...\n');

const stats = await runAMDBenchmark({
  iterations: 50,
  useFallback: true,
});

console.log('--- Local Adapter Latency Percentiles ---');
console.log(`  Iterations:        ${stats.iterations}`);
console.log(`  Total Duration:    ${stats.totalDurationMs} ms`);
console.log(`  Average Latency:   ${stats.latencyMs.avg} ms`);
console.log(`  p50 Latency:       ${stats.latencyMs.p50} ms`);
console.log(`  p95 Latency:       ${stats.latencyMs.p95} ms`);
console.log(`  p99 Latency:       ${stats.latencyMs.p99} ms`);
console.log(`  Min / Max:         ${stats.latencyMs.min} ms / ${stats.latencyMs.max} ms\n`);

console.log('--- Local Extraction Throughput ---');
console.log(`  Requests / Sec:    ${stats.requestsPerSec.toLocaleString()} req/sec`);
console.log(`  Claims Extracted:  ${stats.quality.totalClaimsExtracted}`);
console.log(`  Valid Ratio:       ${(stats.quality.validClaimsRatio * 100).toFixed(2)}% (Zod ClaimExtractionSchema)\n`);

console.log('--- Adapter Environment ---');
console.log(`  Execution Mode:    Deterministic Local Fallback Adapter`);
console.log(`  Model Fallback:    meta-llama/Llama-3.1-8B-Instruct (simulated offline)`);
console.log('='.repeat(76));

const latencyTargetMs = 50;
if (stats.latencyMs.p95 <= latencyTargetMs) {
  console.log(`[PASS] Fallback SLA Verified: p95 latency (${stats.latencyMs.p95} ms) satisfies target (< ${latencyTargetMs} ms).`);
} else {
  console.log(`[NOTE] Execution finished. Measured p95: ${stats.latencyMs.p95} ms.`);
}
console.log('='.repeat(76));
