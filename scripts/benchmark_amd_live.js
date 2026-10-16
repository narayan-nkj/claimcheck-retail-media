import { runAMDBenchmark } from '../src/benchmark/amdRunner.ts';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logPath = resolve(__dirname, '../docs/amd/benchmark_live_run.json');

console.log('='.repeat(76));
console.log('   ClaimCheck LIVE AMD Instinct MI300X Inference Benchmark');
console.log('   Mode: Remote ROCm 6.2 vLLM Execution (Zero-Fallback Policy)');
console.log('='.repeat(76));

const endpoint = process.env.AMD_VLLM_ENDPOINT;
if (!endpoint || !endpoint.trim()) {
  console.error('\n❌ [ERROR] AMD_VLLM_ENDPOINT environment variable is required.');
  console.error('   Please configure your live AMD ROCm vLLM server:');
  console.error('     export AMD_VLLM_ENDPOINT=http://<amd-mi300x-host>:8000/v1');
  console.error('\n   To benchmark the deterministic local adapter without GPU hardware, run:');
  console.error('     npm run benchmark:fallback\n');
  process.exit(1);
}

console.log(`Connecting to live AMD endpoint: ${endpoint}`);
console.log('Verifying remote /models endpoint and hardware execution proof...\n');

try {
  const stats = await runAMDBenchmark({
    iterations: 50,
    requireLive: true,
    logPath,
  });

  console.log('--- AMD Hardware Execution Proof ---');
  console.log(`  Target Device:        ${stats.deviceProof.targetDevice}`);
  console.log(`  Serving Runtime:      ${stats.deviceProof.runtime}`);
  console.log(`  Model:                ${stats.deviceProof.model}`);
  console.log(`  Endpoint:             ${stats.deviceProof.endpoint}`);
  console.log(`  Remote Verified:      ${stats.deviceProof.verifiedRemoteModel ?? 'Yes'}`);
  console.log(`  Fallback Active:      ${stats.deviceProof.isFallback ? 'YES (FAIL)' : 'NO (Verified Live)'}\n`);

  console.log('--- AMD Inference Latency Percentiles (Live) ---');
  console.log(`  Iterations:           ${stats.iterations}`);
  console.log(`  Total Duration:       ${stats.totalDurationMs} ms`);
  console.log(`  Average Latency:      ${stats.latencyMs.avg} ms`);
  console.log(`  p50 Latency:          ${stats.latencyMs.p50} ms`);
  console.log(`  p95 Latency:          ${stats.latencyMs.p95} ms`);
  console.log(`  p99 Latency:          ${stats.latencyMs.p99} ms`);
  console.log(`  Min / Max:            ${stats.latencyMs.min} ms / ${stats.latencyMs.max} ms\n`);

  console.log('--- Live Token Throughput ---');
  console.log(`  Requests / Sec:       ${stats.requestsPerSec.toLocaleString()} req/sec`);
  console.log(`  Total Tokens:         ${stats.tokens.totalTokens.toLocaleString()} tokens`);
  console.log(`  Prompt Tokens:        ${stats.tokens.totalPrompt.toLocaleString()} (${stats.promptTokensPerSec} tokens/sec)`);
  console.log(`  Output Tokens:        ${stats.tokens.totalCompletion.toLocaleString()} (${stats.completionTokensPerSec} tokens/sec)`);
  console.log(`  Total Throughput:     ${stats.tokensPerSec.toLocaleString()} tokens/sec\n`);

  console.log('--- Extraction Fidelity ---');
  console.log(`  Extracted Claims:     ${stats.quality.totalClaimsExtracted}`);
  console.log(`  Valid Schema Ratio:   ${(stats.quality.validClaimsRatio * 100).toFixed(2)}%\n`);

  console.log(`📄 Raw benchmark execution log saved to: ${logPath}`);
  console.log('='.repeat(76));
  console.log('✨ Live AMD Instinct MI300X benchmark completed successfully!');
  console.log('='.repeat(76));
} catch (err) {
  console.error('\n❌ [FAIL] Live AMD benchmark execution failed:');
  console.error(`   ${err.message}\n`);
  process.exit(1);
}
