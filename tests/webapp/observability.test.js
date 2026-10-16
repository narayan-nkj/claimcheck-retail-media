import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from '../../src/server/app.ts';
import { appState } from '../../src/server/state.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ClaimCheck Reliability, Observability & Live Telemetry (Phase 04)', () => {
  let server;
  let baseUrl;

  before(async () => {
    appState.reset();
    server = createServer();
    await new Promise((res) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        res();
      });
    });
  });

  after(async () => {
    if (typeof server?.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise((res) => {
      server.close(res);
    });
  });

  describe('Unified /api/health Endpoint & Live Status Telemetry', () => {
    it('returns 200 healthy status with system uptime and memory stats', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.status, 'healthy');
      assert.equal(data.service, 'ClaimCheck Operator Web Application');
      assert.equal(data.version, '0.1.0');
      assert.ok(data.uptimeSeconds >= 0);
      assert.ok(data.memory && data.memory.heapUsed > 0);
    });

    it('exposes AMD ROCm inference health and hardware device proof', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      const data = await res.json();

      assert.ok(data.amdInference);
      assert.ok(data.amdInference.device);
      assert.ok(data.amdInference.device.targetDevice.includes('MI300X'));
      assert.ok(data.amdInference.device.rocmVersion.includes('6.2.0'));
      assert.ok(data.amdInference.device.runtime.includes('vLLM') || data.amdInference.device.runtime.includes('rocm'));
    });

    it('accurately tracks real-time operational stats across checks and reviews', async () => {
      // Execute 1 golden pass and 1 deceptive price check
      await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: 'golden_pass' }),
      });

      await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: 'deceptive_price' }),
      });

      const res = await fetch(`${baseUrl}/api/health`);
      const data = await res.json();
      const stats = data.metrics;

      assert.equal(stats.totalChecks, 2);
      assert.equal(stats.totalPasses, 1);
      assert.equal(stats.totalBlocks, 1);
      assert.ok(stats.queueDepth >= 1);
      assert.equal(stats.auditChainLength, 2);
      assert.ok(typeof stats.avgLatencyMs === 'number');
      assert.ok(typeof stats.p95LatencyMs === 'number');
    });
  });

  describe('Prometheus /metrics Exposition & Performance Metrics', () => {
    it('exposes standard Prometheus format with policy and AMD telemetry counters', async () => {
      const res = await fetch(`${baseUrl}/metrics`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain; version=0.0.4; charset=utf-8');

      const body = await res.text();
      assert.ok(body.includes('# HELP'));
      assert.ok(body.includes('# TYPE'));
      assert.ok(body.includes('claimcheck_evaluations_total'));
      assert.ok(body.includes('claimcheck_amd_inference_requests_total'));
      assert.ok(body.includes('claimcheck_amd_tokens_total'));
      assert.ok(body.includes('claimcheck_amd_circuit_breaker_state'));
    });

    it('records and reflects ALLOW and BLOCK evaluation counts in Prometheus metrics', async () => {
      const res = await fetch(`${baseUrl}/metrics`);
      const body = await res.text();

      assert.ok(body.includes('claimcheck_evaluations_total{verdict="ALLOW"}'));
      assert.ok(body.includes('claimcheck_evaluations_total{verdict="BLOCK"}'));
    });
  });

  describe('Client-Side & Server-Side Error Boundaries and Fail-Closed Resilience', () => {
    const htmlPath = resolve(__dirname, '../../src/webapp/public/index.html');
    const html = readFileSync(htmlPath, 'utf8');

    const cssPath = resolve(__dirname, '../../src/webapp/public/styles.css');
    const css = readFileSync(cssPath, 'utf8');

    const jsPath = resolve(__dirname, '../../src/webapp/public/app.js');
    const js = readFileSync(jsPath, 'utf8');

    it('contains global network error boundary banner in DOM markup', () => {
      assert.ok(html.includes('id="networkErrorBanner"'));
      assert.ok(html.includes('id="networkErrorMessage"'));
      assert.ok(html.includes('id="btnDismissNetworkError"'));
      assert.ok(html.includes('role="alert"'));
      assert.ok(html.includes('aria-live="assertive"'));
    });

    it('styles network error banner and telemetry pills for active, fallback, and offline states', () => {
      assert.ok(css.includes('.network-error-banner'));
      assert.ok(css.includes('.status-dot.active'));
      assert.ok(css.includes('.status-dot.fallback'));
      assert.ok(css.includes('.status-dot.offline'));
    });

    it('implements client-side error boundary catch blocks in app.js for network drops', () => {
      assert.ok(js.includes('showNetworkErrorBanner'));
      assert.ok(js.includes('hideNetworkErrorBanner'));
      assert.ok(js.includes('Operational Telemetry Offline'));
      assert.ok(js.includes('Verification Check Failed'));
    });

    it('fails-closed gracefully on malformed JSON request bodies without crashing', async () => {
      const res = await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-{broken',
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes('JSON'));
    });

    it('fails-closed with 404 on unknown API endpoints', async () => {
      const res = await fetch(`${baseUrl}/api/unknown-endpoint`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes('Endpoint not found'));
    });

    it('fails-closed with 405 on unsupported HTTP methods', async () => {
      const res = await fetch(`${baseUrl}/api/presets`, { method: 'DELETE' });
      assert.equal(res.status, 405);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes('Method Not Allowed'));
    });
  });
});
