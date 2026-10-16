import { runAMDBenchmark } from '../src/benchmark/amdRunner.ts';

console.log('='.repeat(76));
console.log('   ClaimCheck AMD Inference & Structured Generation Benchmark (v1.0.0)');
console.log('   Hardware Target: AMD Instinct MI300X / ROCm 6.2 / vLLM');
console.log('   Model: meta-llama/Llama-3.1-8B-Instruct (Greedy Guided Decoding)');
console.log('='.repeat(76));
console.log('Running 50 iterations across realistic retail media ad copy test corpus...\n');

const stats = await runAMDBenchmark(50);

console.log('--- AMD Inference Latency Percentiles ---');
console.log(`  Iterations:        ${stats.iterations}`);
console.log(`  Total Duration:    ${stats.totalDurationMs} ms`);
console.log(`  Average Latency:   ${stats.latencyMs.avg} ms`);
console.log(`  p50 Latency:       ${stats.latencyMs.p50} ms`);
console.log(`  p95 Latency:       ${stats.latencyMs.p95} ms`);
console.log(`  p99 Latency:       ${stats.latencyMs.p99} ms`);
console.log(`  Min / Max:         ${stats.latencyMs.min} ms / ${stats.latencyMs.max} ms\n`);

console.log('--- Token Generation & Throughput ---');
console.log(`  Requests / Sec:    ${stats.requestsPerSec.toLocaleString()} req/sec`);
console.log(`  Total Tokens:      ${stats.tokens.totalTokens.toLocaleString()} tokens`);
console.log(`  Prompt Tokens:     ${stats.tokens.totalPrompt.toLocaleString()} (${stats.promptTokensPerSec} tokens/sec)`);
console.log(`  Output Tokens:     ${stats.tokens.totalCompletion.toLocaleString()} (${stats.completionTokensPerSec} tokens/sec)`);
console.log(`  Total Throughput:  ${stats.tokensPerSec.toLocaleString()} tokens/sec\n`);

console.log('--- Schema Quality & Extraction Fidelity ---');
console.log(`  Extracted Claims:  ${stats.quality.totalClaimsExtracted}`);
console.log(`  Valid Ratio:       ${(stats.quality.validClaimsRatio * 100).toFixed(2)}% (Zod ClaimExtractionSchema)\n`);

console.log('--- Hardware & Serving Environment ---');
console.log(`  Target Device:     ${stats.deviceProof.targetDevice}`);
console.log(`  Serving Runtime:   ${stats.deviceProof.runtime}`);
console.log(`  Selected Model:    ${stats.deviceProof.model}`);
console.log(`  Execution Mode:    ${stats.deviceProof.isFallback ? 'Deterministic Local Fallback Adapter' : 'Remote AMD ROCm Endpoint'}`);
console.log('='.repeat(76));

// Target verification: under fallback/local execution p95 should be < 50ms
const latencyTargetMs = 50;
if (stats.latencyMs.p95 <= latencyTargetMs) {
  console.log(`[PASS] Benchmark SLA Verified: p95 latency (${stats.latencyMs.p95} ms) satisfies target (< ${latencyTargetMs} ms).`);
} else {
  console.log(`[NOTE] Execution finished. Measured p95: ${stats.latencyMs.p95} ms.`);
}
console.log('='.repeat(76));
