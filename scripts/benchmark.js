import { runPerformanceBenchmark } from '../src/benchmark/runner.ts';

console.log('='.repeat(72));
console.log('   ClaimCheck Core Performance & Latency Benchmark (v1.0.0)');
console.log('='.repeat(72));
console.log('Running 1,000 iterations across core policy, audit, and replay engines...\n');

const report = await runPerformanceBenchmark(1000);

console.log('--- Policy Engine (Deterministic Multi-Claim Evaluation) ---');
console.log(`  Operations:     ${report.policyEngine.operations}`);
console.log(`  Throughput:     ${report.policyEngine.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Total Time:     ${report.policyEngine.totalTimeMs} ms`);
console.log(`  Avg Latency:    ${report.policyEngine.avgLatencyUs} µs`);
console.log(`  p50 Latency:    ${report.policyEngine.p50LatencyUs} µs`);
console.log(`  p95 Latency:    ${report.policyEngine.p95LatencyUs} µs`);
console.log(`  p99 Latency:    ${report.policyEngine.p99LatencyUs} µs`);
console.log(`  Max Latency:    ${report.policyEngine.maxLatencyUs} µs\n`);

console.log('--- Cryptographic Audit Stream (NDJSON + Merkle Link Hash) ---');
console.log(`  Throughput:     ${report.auditChaining.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Avg Latency:    ${report.auditChaining.avgLatencyUs} µs`);
console.log(`  p95 Latency:    ${report.auditChaining.p95LatencyUs} µs\n`);

console.log('--- Historical Replay Engine (Audit Digest & Policy Reproducibility) ---');
console.log(`  Throughput:     ${report.historicalReplay.opsPerSec.toLocaleString()} ops/sec`);
console.log(`  Avg Latency:    ${report.historicalReplay.avgLatencyUs} µs`);
console.log(`  p95 Latency:    ${report.historicalReplay.p95LatencyUs} µs\n`);

console.log('='.repeat(72));
const slaTargetUs = 5000; // 5ms SLA target
if (report.policyEngine.p95LatencyUs < slaTargetUs) {
  console.log(`[PASS] Performance SLA Verified: p95 latency (${report.policyEngine.p95LatencyUs} µs) is well within target (< 5,000 µs / 5ms).`);
} else {
  console.error(`[FAIL] Performance SLA breached: p95 latency (${report.policyEngine.p95LatencyUs} µs) exceeds 5ms target.`);
  process.exit(1);
}
console.log('='.repeat(72));
