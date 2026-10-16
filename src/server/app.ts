import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import {
  extractClaims,
  sanitizeAdCopyInput,
  evaluateAdCopyPolicy,
  createReviewQueueItem,
  canOperatorResolveItem,
  computeCanonicalAuditDigest,
  verifyAuditChain,
  replayHistoricalCheck,
  telemetry,
  amdTelemetry,
  AMDInferenceClient,
  PolicyStateMachine,
  redactSensitiveString,
  redactSensitiveData,
  type PolicyState,
} from '../index.ts';

import { PRESET_SCENARIOS, buildCorroboratingEvidence, type PresetScenario } from './presets.ts';
import { appState } from './state.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const PUBLIC_DIR = resolve(__dirname, '../webapp/public');

// Initialize shared AMD inference client with deterministic fallback
const amdClient = new AMDInferenceClient({
  endpoint: process.env.AMD_VLLM_ENDPOINT || 'http://localhost:8000/v1',
  useFallback: true,
  timeoutMs: 3000,
});

/**
 * Parses JSON from incoming request body with strict size limit (1MB)
 */
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolvePromise, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large (> 1MB)'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolvePromise({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolvePromise(parsed);
      } catch (err: any) {
        reject(new Error(`Malformed JSON body: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Sends a structured JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  res.end(payload);
}

/**
 * Serves static web assets from src/webapp/public
 */
function serveStaticFile(reqPath: string, res: ServerResponse): boolean {
  let relativePath = reqPath === '/' ? 'index.html' : reqPath.replace(/^\//, '');
  // Sanitize path against directory traversal
  const safePath = join(PUBLIC_DIR, relativePath);
  if (!safePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return true;
  }

  if (!existsSync(safePath)) {
    return false;
  }

  const ext = safePath.split('.').pop()?.toLowerCase();
  let contentType = 'text/plain; charset=utf-8';
  if (ext === 'html') contentType = 'text/html; charset=utf-8';
  else if (ext === 'css') contentType = 'text/css; charset=utf-8';
  else if (ext === 'js') contentType = 'application/javascript; charset=utf-8';
  else if (ext === 'json') contentType = 'application/json; charset=utf-8';
  else if (ext === 'svg') contentType = 'image/svg+xml';
  else if (ext === 'png') contentType = 'image/png';
  else if (ext === 'webp') contentType = 'image/webp';

  try {
    const fileBytes = readFileSync(safePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileBytes.length,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(fileBytes);
    return true;
  } catch (err: any) {
    sendJson(res, 500, { error: `Failed to read static file: ${err.message}` });
    return true;
  }
}

/**
 * ClaimCheck HTTP Request Handler
 */
export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const correlationId = (req.headers['x-correlation-id'] as string) || `corr-${randomUUID().slice(0, 8)}`;
  const traceId = (req.headers['x-trace-id'] as string) || `trace-${randomUUID().slice(0, 16)}`;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  // Handle Unsupported HTTP Methods (PUT, DELETE, PATCH, etc.)
  if (['DELETE', 'PUT', 'PATCH', 'TRACE', 'CONNECT'].includes(req.method || '')) {
    sendJson(res, 405, { success: false, error: `Method Not Allowed: ${req.method}` });
    return;
  }

  try {
    // 1. GET /api/health
    if (req.method === 'GET' && pathname === '/api/health') {
      const health = await amdClient.checkHealth();
      const deviceProof = amdClient.getDeviceProof();
      const stats = appState.getStats();
      sendJson(res, 200, {
        status: 'healthy',
        version: '0.1.0',
        service: 'ClaimCheck Operator Web Application',
        timestamp: new Date().toISOString(),
        amdInference: {
          ...health,
          device: deviceProof,
        },
        metrics: stats,
        uptimeSeconds: process.uptime(),
        memory: process.memoryUsage(),
      });
      return;
    }

  // 2. GET /metrics (Prometheus standard exposition)
  if (req.method === 'GET' && pathname === '/metrics') {
    const coreMetrics = telemetry.exportPrometheus();
    const amdProm = amdTelemetry.exportPrometheus();
    const body = `${coreMetrics}\n\n${amdProm}\n`;
    res.writeHead(200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
    return;
  }

  // 3. GET /api/presets
  if (req.method === 'GET' && pathname === '/api/presets') {
    sendJson(res, 200, {
      success: true,
      presets: Object.values(PRESET_SCENARIOS).map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        expectedVerdict: p.expectedVerdict,
        expectedReason: p.expectedReason,
        sku: p.sku,
        adCopyText: p.adCopyText,
        explanation: p.explanation,
      })),
    });
    return;
  }

  // 4. GET /api/review/queue
  if (req.method === 'GET' && pathname === '/api/review/queue') {
    const items = appState.getReviewQueue();
    sendJson(res, 200, {
      success: true,
      count: items.length,
      items,
    });
    return;
  }

  // 5. GET /api/audit/stream
  if (req.method === 'GET' && pathname === '/api/audit/stream') {
    const stream = appState.getAuditStream();
    const chainVerification = verifyAuditChain(stream);
    sendJson(res, 200, {
      success: true,
      length: stream.length,
      chainIntegrityValid: chainVerification.valid,
      chainError: chainVerification.reason,
      events: stream.slice(-50), // Return last 50 events
    });
    return;
  }

  // 6. POST /api/check (Run Evidence-Backed Claim Check)
  if (req.method === 'POST' && pathname === '/api/check') {
    const startTime = performance.now();
    try {
      const body = await parseJsonBody(req);
      const presetId = body.presetId as string | undefined;
      const rawText = (body.adCopyText || (presetId && PRESET_SCENARIOS[presetId]?.adCopyText) || '').trim();
      if (!rawText) {
        sendJson(res, 400, { success: false, error: 'adCopyText is required and must not be empty' });
        return;
      }

      const sku = (body.sku as string) || (presetId && PRESET_SCENARIOS[presetId]?.sku) || 'SKU-GENERAL';
      
      let catalogItem = body.catalogItem;
      let evidenceList = body.evidenceList || [];

      if (presetId && PRESET_SCENARIOS[presetId]) {
        const preset = PRESET_SCENARIOS[presetId];
        catalogItem = catalogItem || preset.catalogItem;
        if (!evidenceList || evidenceList.length === 0) {
          evidenceList = preset.evidenceList;
        }
      } else {
        // Match preset by SKU if available
        const matchedPreset = Object.values(PRESET_SCENARIOS).find((p) => p.sku === sku);
        if (matchedPreset) {
          catalogItem = catalogItem || matchedPreset.catalogItem;
          if (!evidenceList || evidenceList.length === 0) {
            evidenceList = matchedPreset.evidenceList;
          }
        } else if (!catalogItem) {
          catalogItem = PRESET_SCENARIOS.golden_pass.catalogItem;
        }
      }

      // Step 1: Sanitize ad copy text (Prompt Injection, length boundaries, and credential/PII redaction)
      const sanitizedText = redactSensitiveString(sanitizeAdCopyInput(rawText));
      const checkId = `chk-${randomUUID().slice(0, 8)}`;

      // Step 2: Extract factual claims using AMD inference client (with deterministic fallback)
      const extraction = await extractClaims(sanitizedText, {
        client: amdClient,
      });
      const claims = extraction.claims;

      // Build corroborating evidence for the extracted claims
      const finalEvidence = buildCorroboratingEvidence(claims, catalogItem, presetId);

      // Step 3: Evaluate deterministic policy rules against evidence
      const policyVerdict = evaluateAdCopyPolicy({
        checkId,
        copyText: sanitizedText,
        catalog: catalogItem,
        claims,
        evidenceList: finalEvidence,
      });

      // Step 4: If not ALLOW, enqueue in operator review queue
      let reviewQueueItem = undefined;
      if (policyVerdict.compositeStatus !== 'ALLOW') {
        reviewQueueItem = createReviewQueueItem(policyVerdict, sanitizedText);
        appState.addReviewItem(reviewQueueItem);
      }

      // Step 5: Construct immutable AuditEvent & cryptographically link into audit chain
      const nowIso = new Date().toISOString();
      const baseAuditData = {
        auditId: `aud-${checkId}`,
        schemaVersion: '1.0.0' as const,
        checkId,
        timestamp: nowIso,
        adCopyText: sanitizedText,
        catalogSnapshot: redactSensitiveData(catalogItem),
        extractedClaims: claims,
        evidenceSnapshots: redactSensitiveData(finalEvidence),
        overallVerdict: policyVerdict,
      };

      const auditEventPayload = {
        ...baseAuditData,
        replayDigest: computeCanonicalAuditDigest(baseAuditData),
      };

      const latencyMs = performance.now() - startTime;
      const chainedAuditEvent = appState.recordAuditEvent(auditEventPayload, correlationId, traceId);
      appState.recordCheck(checkId, policyVerdict, chainedAuditEvent, latencyMs);

      telemetry.recordEvaluation(policyVerdict.compositeStatus, {
        claims: claims.map((c) => ({ claimClass: c.claimClass })),
      });

      sendJson(res, 200, {
        success: true,
        checkId,
        adCopyText: sanitizedText,
        sku: catalogItem.sku,
        extractedClaims: claims,
        verdict: policyVerdict,
        reviewItem: reviewQueueItem,
        auditEvent: chainedAuditEvent,
        latencyMs: Math.round(latencyMs * 100) / 100,
      });
    } catch (err: any) {
      if (err instanceof SyntaxError || err.message?.includes('JSON')) {
        sendJson(res, 400, { success: false, error: 'Malformed JSON payload: failed to parse body' });
        return;
      }
      sendJson(res, 500, { success: false, error: err.message || 'Internal check execution error' });
    }
    return;
  }

  // 7. POST /api/review (Human Review Resolution & Authorization Gate)
  if (req.method === 'POST' && pathname === '/api/review') {
    try {
      const body = await parseJsonBody(req);
      const { queueId, action, operatorRole, rationale, operatorId } = body;

      if (!queueId || !action || !operatorRole) {
        sendJson(res, 400, {
          success: false,
          error: 'Missing required parameters: queueId, action, and operatorRole are required.',
        });
        return;
      }

      const queueItem = appState.getReviewItem(queueId);
      if (!queueItem) {
        sendJson(res, 404, { success: false, error: `Review queue item "${queueId}" not found.` });
        return;
      }

      // Enforce DEC-010 Role-Based Authorization Guardrail
      const authorization = canOperatorResolveItem(operatorRole, queueItem, action);
      if (!authorization.allowed) {
        sendJson(res, 403, {
          success: false,
          error: authorization.reason || 'Operator role unauthorized to perform this review action.',
          operatorRole,
          action,
        });
        return;
      }

      // Update Review Queue Item
      const newStatus = action === 'APPROVED_OVERRIDE' || action === 'CONFIRMED_BLOCK' ? 'RESOLVED' : 'IN_REVIEW';
      const updatedItem = appState.updateReviewItem(queueId, {
        status: newStatus,
        assignedOperatorId: operatorId || operatorRole,
      });

      if (action === 'APPROVED_OVERRIDE') {
        appState.recordOverride();
      }

      // Record audit event for human review action
      const reviewAuditId = `aud-rev-${randomUUID().slice(0, 8)}`;
      const storedCheck = appState.getCheck(queueItem.checkId);
      const catalogSnapshot = storedCheck ? storedCheck.auditEvent.catalogSnapshot : PRESET_SCENARIOS.golden_pass.catalogItem;

      const cleanRationale = redactSensitiveString(rationale || '');
      const nowRevIso = new Date().toISOString();
      const baseRevData = {
        auditId: reviewAuditId,
        schemaVersion: '1.0.0' as const,
        checkId: queueItem.checkId,
        timestamp: nowRevIso,
        adCopyText: queueItem.adCopyText,
        catalogSnapshot: redactSensitiveData(catalogSnapshot),
        extractedClaims: storedCheck ? storedCheck.auditEvent.extractedClaims : [],
        evidenceSnapshots: storedCheck ? storedCheck.auditEvent.evidenceSnapshots : [],
        overallVerdict: storedCheck ? {
          ...storedCheck.result,
          summary: `Resolved via ${action} by ${operatorRole}: ${cleanRationale || 'No rationale provided'}`,
        } : {
          verdictId: `vrd-rev-${queueItem.checkId}`,
          checkId: queueItem.checkId,
          compositeStatus: queueItem.compositeStatus,
          claimVerdicts: [],
          summary: `Resolved via ${action} by ${operatorRole}: ${cleanRationale || 'No rationale provided'}`,
          evaluatedAt: nowRevIso,
          policyVersion: '1.0.0',
        },
      };

      const reviewAuditEvent = {
        ...baseRevData,
        replayDigest: computeCanonicalAuditDigest(baseRevData),
      };

      const chained = appState.recordAuditEvent(reviewAuditEvent, correlationId, traceId);

      sendJson(res, 200, {
        success: true,
        queueItem: updatedItem,
        action,
        rationale: cleanRationale || 'Operator action confirmed',
        operatorRole,
        auditEvent: chained,
      });
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message || 'Internal review error' });
    }
    return;
  }

  // 8. POST /api/audit/replay (1-Click Historical Replay Verification)
  if (req.method === 'POST' && pathname === '/api/audit/replay') {
    try {
      const body = await parseJsonBody(req);
      const auditId = body.auditId;
      let auditEvent = body.auditEvent;

      if (auditId && !auditEvent) {
        auditEvent = appState.getAuditEvent(auditId);
      }

      if (!auditEvent) {
        sendJson(res, 404, { success: false, error: 'Audit event not found for replay.' });
        return;
      }

      const replayResult = replayHistoricalCheck(auditEvent);

      sendJson(res, 200, {
        success: true,
        replayResult,
      });
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message || 'Audit replay error' });
    }
    return;
  }

  // 9. Static File Serving (fallback for all other GET requests)
  if (req.method === 'GET') {
    const served = serveStaticFile(pathname, res);
    if (served) return;
  }

  // 404 Not Found
  sendJson(res, 404, { success: false, error: `Endpoint not found: ${req.method} ${pathname}` });
  } catch (err: any) {
    sendJson(res, 500, { success: false, error: `Unhandled server error: ${err.message}` });
  }
}

/**
 * Creates and returns configured HTTP server
 */
export function createServer() {
  return createHttpServer(handleRequest);
}
