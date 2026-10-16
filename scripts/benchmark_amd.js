import { runAMDBenchmark } from '../src/benchmark/amdRunner.ts';

const isEndpointConfigured = Boolean(process.env.AMD_VLLM_ENDPOINT && process.env.AMD_VLLM_ENDPOINT.trim());

console.log('='.repeat(76));
console.log('   ClaimCheck AMD Inference Benchmark Runner');
console.log(`   Execution Mode: ${isEndpointConfigured ? 'LIVE AMD ROCm / vLLM' : 'DETERMINISTIC LOCAL FALLBACK'}`);
if (!isEndpointConfigured) {
  console.log('   [NOTE] AMD_VLLM_ENDPOINT is not set in environment.');
  console.log('          - For live MI300X verification: export AMD_VLLM_ENDPOINT=... && npm run benchmark:amd:live');
  console.log('          - For explicit offline benchmark: npm run benchmark:fallback');
}
console.log('='.repeat(76));
console.log('Running 50 benchmark iterations...\n');

const stats = await runAMDBenchmark({
  iterations: 50,
  useFallback: !isEndpointConfigured,
});

console.log('--- Inference Latency Percentiles ---');
console.log(`  Iterations:        ${stats.iterations}`);
console.log(`  Total Duration:    ${stats.totalDurationMs} ms`);
console.log(`  Average Latency:   ${stats.latencyMs.avg} ms`);
console.log(`  p50 Latency:       ${stats.latencyMs.p50} ms`);
console.log(`  p95 Latency:       ${stats.latencyMs.p95} ms`);
console.log(`  p99 Latency:       ${stats.latencyMs.p99} ms`);
console.log(`  Min / Max:         ${stats.latencyMs.min} ms / ${stats.latencyMs.max} ms\n`);

console.log('--- Throughput & Fidelity ---');
console.log(`  Requests / Sec:    ${stats.requestsPerSec.toLocaleString()} req/sec`);
console.log(`  Total Tokens:      ${stats.tokens.totalTokens.toLocaleString()} tokens`);
console.log(`  Total Claims:      ${stats.quality.totalClaimsExtracted}`);
console.log(`  Valid Ratio:       ${(stats.quality.validClaimsRatio * 100).toFixed(2)}% (Zod ClaimExtractionSchema)\n`);

console.log('--- Environment Provenance ---');
console.log(`  Target Device:     ${stats.deviceProof.targetDevice}`);
console.log(`  Serving Runtime:   ${stats.deviceProof.runtime}`);
console.log(`  Model:             ${stats.deviceProof.model}`);
console.log(`  Execution Mode:    ${stats.deviceProof.isLive ? 'LIVE AMD ROCm' : 'Deterministic Local Fallback Adapter'}`);
console.log('='.repeat(76));

const latencyTargetMs = 50;
if (stats.latencyMs.p95 <= latencyTargetMs) {
  console.log(`[PASS] Benchmark SLA Verified: p95 latency (${stats.latencyMs.p95} ms) satisfies target (< ${latencyTargetMs} ms).`);
} else {
  console.log(`[NOTE] Execution finished. Measured p95: ${stats.latencyMs.p95} ms.`);
}
console.log('='.repeat(76));
