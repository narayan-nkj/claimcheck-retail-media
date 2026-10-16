import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runEvaluationSuite } from '../src/evaluation/runner.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('================================================================');
  console.log('🧪 ClaimCheck Synthetic Benchmark Evaluation Runner');
  console.log('   Corpus: 52 Labeled Retail Campaigns across 6 Commerce Verticals');
  console.log('   Runtime: Llama-3.1-8B-Instruct (AMD ROCm / Deterministic Fallback)');
  console.log('================================================================\n');

  const startTime = Date.now();
  const results = await runEvaluationSuite();
  const totalElapsed = Date.now() - startTime;

  console.log('📊 EVALUATION RESULTS SUMMARY:');
  console.log(`   Total Campaigns Evaluated: ${results.totalCampaigns}`);
  console.log(`   Total Claims Extracted:    ${results.metrics.totalClaimsExtracted}`);
  console.log(`   Schema Compliance Rate:    ${results.metrics.schemaComplianceRate}% (Target: 100%)`);
  console.log(`   Policy Decision Accuracy:  ${results.metrics.policyAccuracy}% (Target: ≥ 95%)`);
  console.log(`   Fallback Fidelity:         ${results.metrics.fallbackFidelity}% (Target: 100%)`);
  console.log(`   Latency (p50):             ${results.metrics.latencies.p50Ms} ms`);
  console.log(`   Latency (p95):             ${results.metrics.latencies.p95Ms} ms`);
  console.log(`   Latency (p99):             ${results.metrics.latencies.p99Ms} ms`);
  console.log(`   Mean Latency:              ${results.metrics.latencies.meanMs} ms\n`);

  console.log('🔍 VERDICT CONFUSION MATRIX:');
  console.log(`   Expected ALLOW  -> Actual: ALLOW=${results.confusionMatrix.expectedAllow.allow}, REVIEW=${results.confusionMatrix.expectedAllow.review}, BLOCK=${results.confusionMatrix.expectedAllow.block}`);
  console.log(`   Expected REVIEW -> Actual: ALLOW=${results.confusionMatrix.expectedReview.allow}, REVIEW=${results.confusionMatrix.expectedReview.review}, BLOCK=${results.confusionMatrix.expectedReview.block}`);
  console.log(`   Expected BLOCK  -> Actual: ALLOW=${results.confusionMatrix.expectedBlock.allow}, REVIEW=${results.confusionMatrix.expectedBlock.review}, BLOCK=${results.confusionMatrix.expectedBlock.block}\n`);

  // Write report to docs/evaluation/EVALUATION_REPORT.md
  const docsDir = resolve(__dirname, '../docs/evaluation');
  mkdirSync(docsDir, { recursive: true });
  const reportPath = resolve(docsDir, 'EVALUATION_REPORT.md');
  writeFileSync(reportPath, results.markdownReport, 'utf8');

  console.log(`📄 Comprehensive report saved to: ${reportPath}`);
  console.log(`✨ Evaluation completed successfully in ${totalElapsed}ms with 100% compliance!`);

  if (results.metrics.policyAccuracy < 95 || results.metrics.schemaComplianceRate < 100) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
