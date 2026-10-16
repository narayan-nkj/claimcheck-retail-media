import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { createServer } from '../../src/server/app.ts';
import { appState } from '../../src/server/state.ts';
import { verifyAuditChain } from '../../src/index.ts';

describe('ClaimCheck End-to-End Enterprise Workflow Integration Suite (Phase 06)', () => {
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

  it('Journey 1: Golden Pass Ad Copy -> Extraction -> Verification -> Publication -> Audit Replay', async () => {
    // 1. Submit Ad Copy Check
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presetId: 'golden_pass',
      }),
    });

    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();

    // Verify Output Structure
    assert.equal(checkData.success, true);
    assert.ok(checkData.checkId.startsWith('chk-'));
    assert.equal(checkData.verdict.compositeStatus, 'ALLOW');
    assert.ok(checkData.extractedClaims.length >= 3);
    assert.equal(checkData.reviewItem, undefined); // ALLOWs do not require review queue

    // Verify Chained Audit Persistence
    const auditRes = await fetch(`${baseUrl}/api/audit/stream`);
    const auditData = await auditRes.json();
    assert.equal(auditData.success, true);
    assert.equal(auditData.chainIntegrityValid, true);
    assert.ok(auditData.events.length >= 1);

    const latestEvent = auditData.events[auditData.events.length - 1];
    assert.equal(latestEvent.checkId, checkData.checkId);
    assert.equal(latestEvent.overallVerdict.compositeStatus, 'ALLOW');

    // Verify 1-Click Historical Replay Determinism
    const replayRes = await fetch(`${baseUrl}/api/audit/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId: latestEvent.auditId }),
    });

    assert.equal(replayRes.status, 200);
    const replayData = await replayRes.json();
    assert.equal(replayData.success, true);
    assert.equal(replayData.replayResult.isReproducible, true);
    assert.equal(replayData.replayResult.discrepancies.length, 0);
  });

  it('Journey 2: Deceptive Price -> Extraction -> BLOCK -> Review Queue -> Senior Officer Override', async () => {
    // 1. Submit Deceptive Price Check (50% claimed vs 25% approved)
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presetId: 'deceptive_price',
      }),
    });

    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.equal(checkData.verdict.compositeStatus, 'BLOCK');
    assert.ok(checkData.reviewItem);
    const queueId = checkData.reviewItem.queueId;

    // 2. Verify Item Present in Review Queue
    const queueRes = await fetch(`${baseUrl}/api/review/queue`);
    const queueData = await queueRes.json();
    assert.equal(queueData.success, true);
    const foundQueueItem = queueData.items.find((i) => i.queueId === queueId);
    assert.ok(foundQueueItem);
    assert.equal(foundQueueItem.compositeStatus, 'BLOCK');
    assert.equal(foundQueueItem.status, 'QUEUED');

    // 3. Attempt Override as Junior Operator -> Must be Blocked with 403 (DEC-010)
    const juniorRes = await fetch(`${baseUrl}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        action: 'APPROVED_OVERRIDE',
        operatorRole: 'JUNIOR_OPERATOR',
        rationale: 'Unauthorized junior override attempt',
      }),
    });
    assert.equal(juniorRes.status, 403);
    const juniorData = await juniorRes.json();
    assert.equal(juniorData.success, false);
    assert.ok(juniorData.error.includes('DEC-010') || juniorData.error.includes('Senior Compliance Officer required'));

    // 4. Authorize Override as Senior Compliance Officer -> Must Succeed (200 OK)
    const seniorRes = await fetch(`${baseUrl}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        action: 'APPROVED_OVERRIDE',
        operatorRole: 'SENIOR_COMPLIANCE_OFFICER',
        rationale: 'Senior officer authorized special manufacturer clearance discount',
        operatorId: 'OFFICER-007',
      }),
    });
    assert.equal(seniorRes.status, 200);
    const seniorData = await seniorRes.json();
    assert.equal(seniorData.success, true);
    assert.equal(seniorData.action, 'APPROVED_OVERRIDE');
    assert.equal(seniorData.queueItem.status, 'RESOLVED');

    // 5. Verify Override Audit Event in Chain
    const auditRes = await fetch(`${baseUrl}/api/audit/stream`);
    const auditData = await auditRes.json();
    const reviewAuditEvent = auditData.events[auditData.events.length - 1];
    assert.ok(reviewAuditEvent.auditId.startsWith('aud-rev-'));
    assert.equal(reviewAuditEvent.checkId, checkData.checkId);
    assert.ok(reviewAuditEvent.overallVerdict.summary.includes('Resolved via APPROVED_OVERRIDE'));
  });

  it('Journey 3: Feed Contradiction -> Extraction -> Fail-Closed REVIEW -> Junior Confirmation', async () => {
    // 1. Submit Conflicting Warehouse Feeds Check
    const checkRes = await fetch(`${baseUrl}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presetId: 'warehouse_contradiction',
      }),
    });

    assert.equal(checkRes.status, 200);
    const checkData = await checkRes.json();
    assert.equal(checkData.verdict.compositeStatus, 'REVIEW');
    assert.ok(checkData.reviewItem);
    const queueId = checkData.reviewItem.queueId;

    // 2. Junior Operator Confirms Block / Triage
    const resolveRes = await fetch(`${baseUrl}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        action: 'CONFIRMED_BLOCK',
        operatorRole: 'JUNIOR_OPERATOR',
        rationale: 'Junior confirmed feed conflict; routed to warehouse inventory engineering',
      }),
    });

    assert.equal(resolveRes.status, 200);
    const resolveData = await resolveRes.json();
    assert.equal(resolveData.success, true);
    assert.equal(resolveData.action, 'CONFIRMED_BLOCK');
    assert.equal(resolveData.queueItem.status, 'RESOLVED');
  });

  it('Journey 4: Complete Audit Stream Cryptographic Integrity & Replay Verification', async () => {
    const stream = appState.getAuditStream();
    assert.ok(stream.length >= 4, `Expected at least 4 chained events, found ${stream.length}`);

    // Verify mathematical link across entire stream
    const verification = verifyAuditChain(stream);
    assert.equal(verification.valid, true, `Audit chain verification failed: ${verification.reason}`);

    // Verify replay determinism on every single event in sequence
    for (const chainedEvent of stream) {
      const res = await fetch(`${baseUrl}/api/audit/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId: chainedEvent.auditId }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.replayResult.isReproducible, true);
    }
  });

  it('Journey 5: Operational Telemetry & Prometheus Metric Reconciliation', async () => {
    // Check /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();

    assert.equal(health.status, 'healthy');
    assert.ok(health.metrics.totalChecks >= 3);
    assert.ok(health.metrics.totalOverrides >= 1);
    assert.ok(health.metrics.p95LatencyMs < 250, `Expected p95 < 250ms, got ${health.metrics.p95LatencyMs}`);

    // Check Prometheus /metrics
    const metricsRes = await fetch(`${baseUrl}/metrics`);
    assert.equal(metricsRes.status, 200);
    const metrics = await metricsRes.text();

    assert.ok(metrics.includes('claimcheck_evaluations_total{verdict="ALLOW"}'));
    assert.ok(metrics.includes('claimcheck_evaluations_total{verdict="BLOCK"}'));
    assert.ok(metrics.includes('claimcheck_evaluations_total{verdict="REVIEW"}'));
    assert.ok(metrics.includes('claimcheck_amd_inference_requests_total'));
  });
});
