import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runEvaluationSuite } from '../../src/evaluation/runner.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ClaimCheck Synthetic Data & Evaluation Benchmark Suite (Phase 02)', () => {
  const corpusPath = join(__dirname, '../../src/evaluation/corpus.json');
  const rawCorpus = readFileSync(corpusPath, 'utf8');
  const corpus = JSON.parse(rawCorpus);

  it('Corpus contains at least 50 realistic retail campaigns', () => {
    assert.ok(Array.isArray(corpus));
    assert.ok(corpus.length >= 50, `Expected at least 50 campaigns, found ${corpus.length}`);
  });

  it('Corpus spans across core retail verticals (Electronics, Groceries, Apparel, Home Goods)', () => {
    const categories = new Set(corpus.map((c) => c.category));
    assert.ok(categories.has('Consumer Electronics'));
    assert.ok(categories.has('Groceries & Gourmet'));
    assert.ok(categories.has('Apparel & Footwear'));
    assert.ok(categories.has('Home & Kitchen'));
    assert.ok(categories.has('Health & Beauty'));
    assert.ok(categories.has('Sports & Outdoors'));
  });

  it('Corpus covers all three tri-state verdicts (ALLOW, REVIEW, BLOCK)', () => {
    const verdicts = new Set(corpus.map((c) => c.expectedVerdict));
    assert.ok(verdicts.has('ALLOW'));
    assert.ok(verdicts.has('REVIEW'));
    assert.ok(verdicts.has('BLOCK'));
  });

  it('Every corpus campaign has well-formed catalog evidence, SKU, and testIntent', () => {
    for (const item of corpus) {
      assert.ok(item.id, `Missing ID in campaign`);
      assert.ok(item.name, `Missing name in campaign ${item.id}`);
      assert.ok(item.sku, `Missing SKU in campaign ${item.id}`);
      assert.ok(item.adCopyText && item.adCopyText.length > 0);
      assert.ok(item.testIntent && item.testIntent.length > 0);
      assert.ok(item.catalog, `Campaign ${item.id} must have catalog`);
      assert.ok(item.catalog.pricing, `Campaign ${item.id} must have catalog.pricing`);
      assert.ok(item.catalog.inventory, `Campaign ${item.id} must have catalog.inventory`);
    }
  });

  it('Evaluation runner executes and achieves 100% schema compliance', async () => {
    const results = await runEvaluationSuite({ corpusPath });
    assert.equal(results.totalCampaigns, corpus.length);
    assert.equal(results.metrics.schemaComplianceRate, 100.0, 'Schema compliance must be strictly 100%');
  });

  it('Evaluation runner achieves >= 95% policy decision accuracy against ground truth', async () => {
    const results = await runEvaluationSuite({ corpusPath });
    assert.ok(
      results.metrics.policyAccuracy >= 95.0,
      `Expected accuracy >= 95.0%, got ${results.metrics.policyAccuracy}%`
    );
    assert.equal(results.metrics.policyAccuracy, 100.0, 'Engine achieved 100% accuracy on evaluated corpus');
  });

  it('Evaluation runner validates 100% fallback fidelity for deterministic deployment', async () => {
    const results = await runEvaluationSuite({ corpusPath });
    assert.equal(results.metrics.fallbackFidelity, 100.0, 'Fallback fidelity must be 100%');
  });

  it('Evaluation runner records sub-millisecond p95 latency under local deterministic evaluation', async () => {
    const results = await runEvaluationSuite({ corpusPath });
    assert.ok(
      results.metrics.latencies.p95Ms < 20,
      `p95 latency was ${results.metrics.latencies.p95Ms}ms, expected sub-20ms`
    );
  });

  it('Confusion matrix has non-zero diagonal entries and zero off-diagonal misclassifications', async () => {
    const results = await runEvaluationSuite({ corpusPath });
    const cm = results.confusionMatrix;
    assert.ok(cm.expectedAllow.allow > 0);
    assert.ok(cm.expectedReview.review > 0);
    assert.ok(cm.expectedBlock.block > 0);
    assert.equal(cm.expectedAllow.review, 0);
    assert.equal(cm.expectedAllow.block, 0);
    assert.equal(cm.expectedReview.allow, 0);
    assert.equal(cm.expectedReview.block, 0);
    assert.equal(cm.expectedBlock.allow, 0);
    assert.equal(cm.expectedBlock.review, 0);
  });
});
