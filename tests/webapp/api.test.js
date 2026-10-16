import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../src/server/app.ts';
import { appState } from '../../src/server/state.ts';

describe('ClaimCheck Operator Web Application REST API (Phase 01)', () => {
  let server;
  let baseUrl;

  before(async () => {
    appState.reset();
    server = createServer();
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (typeof server?.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('GET /api/health returns healthy operational status and AMD telemetry', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'ClaimCheck Operator Web Application');
    assert.ok(data.amdInference);
    assert.ok(data.metrics);
    assert.equal(typeof data.uptimeSeconds, 'number');
  });

  it('GET /api/presets returns 4 standard retail compliance scenarios', async () => {
    const res = await fetch(`${baseUrl}/api/presets`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(Array.isArray(data.presets), true);
    assert.equal(data.presets.length, 4);

    const ids = data.presets.map((p) => p.id);
    assert.ok(ids.includes('golden_pass'));
    assert.ok(ids.includes('deceptive_price'));
    assert.ok(ids.includes('out_of_stock'));
    assert.ok(ids.includes('warehouse_contradiction'));
  });

  it('GET /metrics exposes Prometheus format with AMD telemetry counters', async () => {
    const res = await fetch(`${baseUrl}/metrics`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('claimcheck_evaluations_total') || text.includes('claimcheck_amd_inference_requests_total'));
  });

  it('POST /api/check executes Golden Pass scenario and yields deterministic ALLOW', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'golden_pass' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.verdict.compositeStatus, 'ALLOW');
    assert.equal(data.extractedClaims.length > 0, true);
    assert.equal(data.reviewItem, undefined);
    assert.ok(data.auditEvent);
    assert.ok(data.auditEvent.chainDigest);
    assert.ok(data.auditEvent.replayDigest);
  });

  it('POST /api/check executes Deceptive Price scenario, triggers BLOCK and enqueues in review queue', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'deceptive_price' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.verdict.compositeStatus, 'BLOCK');
    assert.ok(data.reviewItem);
    assert.equal(data.reviewItem.compositeStatus, 'BLOCK');
    assert.equal(data.reviewItem.requiredRole, 'SENIOR_COMPLIANCE_OFFICER');

    // Verify it appears in GET /api/review/queue
    const qRes = await fetch(`${baseUrl}/api/review/queue`);
    const qData = await qRes.json();
    assert.ok(qData.count >= 1);
    const found = qData.items.find((i) => i.queueId === data.reviewItem.queueId);
    assert.ok(found);
  });

  it('POST /api/check executes Out of Stock scenario, triggers BLOCK', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'out_of_stock' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.verdict.compositeStatus, 'BLOCK');
    assert.ok(data.reviewItem);
  });

  it('POST /api/check executes Warehouse Contradiction scenario, triggers REVIEW (fail-closed)', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'warehouse_contradiction' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.verdict.compositeStatus, 'REVIEW');
    assert.ok(data.reviewItem);
  });

  it('POST /api/check fails-closed with 400 when adCopyText is empty', async () => {
    const res = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adCopyText: '   ' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.error);
  });

  it('POST /api/review enforces DEC-010: Junior Operator cannot override factual BLOCK', async () => {
    // First create a block item
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'deceptive_price' }),
    });
    const checkData = await checkRes.json();
    const queueId = checkData.reviewItem.queueId;

    // Junior operator attempts APPROVED_OVERRIDE
    const revRes = await fetch(`${baseUrl}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        action: 'APPROVED_OVERRIDE',
        operatorRole: 'JUNIOR_OPERATOR',
        rationale: 'Junior override attempt',
      }),
    });

    assert.equal(revRes.status, 403);
    const revData = await revRes.json();
    assert.equal(revData.success, false);
    assert.ok(revData.error.includes('Junior operators are prohibited'));
  });

  it('POST /api/review allows Senior Compliance Officer to override factual BLOCK', async () => {
    // Create another check
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'deceptive_price' }),
    });
    const checkData = await checkRes.json();
    const queueId = checkData.reviewItem.queueId;

    // Senior Compliance Officer authorizes APPROVED_OVERRIDE
    const revRes = await fetch(`${baseUrl}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        action: 'APPROVED_OVERRIDE',
        operatorRole: 'SENIOR_COMPLIANCE_OFFICER',
        rationale: 'Merchant provided legal attestation of promotional price waiver',
      }),
    });

    assert.equal(revRes.status, 200);
    const revData = await revRes.json();
    assert.equal(revData.success, true);
    assert.equal(revData.queueItem.status, 'RESOLVED');
  });

  it('POST /api/audit/replay verifies 100% bit-for-bit determinism', async () => {
    // Run a check to generate audit event
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presetId: 'golden_pass' }),
    });
    const checkData = await checkRes.json();
    const auditId = checkData.auditEvent.auditId;

    // Replay audit event
    const repRes = await fetch(`${baseUrl}/api/audit/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId }),
    });

    assert.equal(repRes.status, 200);
    const repData = await repRes.json();
    assert.equal(repData.success, true);
    assert.equal(repData.replayResult.isReproducible, true);
    assert.equal(repData.replayResult.digestIntegrityValid, true);
    assert.equal(repData.replayResult.originalCompositeStatus, 'ALLOW');
    assert.equal(repData.replayResult.replayedCompositeStatus, 'ALLOW');
    assert.equal(repData.replayResult.discrepancies.length, 0);
  });

  it('Static file serving serves index.html, styles.css, and app.js', async () => {
    const htmlRes = await fetch(`${baseUrl}/`);
    assert.equal(htmlRes.status, 200);
    const htmlText = await htmlRes.text();
    assert.ok(htmlText.includes('ClaimCheck'));

    const cssRes = await fetch(`${baseUrl}/styles.css`);
    assert.equal(cssRes.status, 200);
    const cssText = await cssRes.text();
    assert.ok(cssText.includes('--bg-base'));

    const jsRes = await fetch(`${baseUrl}/app.js`);
    assert.equal(jsRes.status, 200);
    const jsText = await jsRes.text();
    assert.ok(jsText.includes('runVerificationCheck'));
  });
});
