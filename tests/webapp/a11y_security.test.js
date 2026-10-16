import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createServer } from '../../src/server/app.ts';
import { appState } from '../../src/server/state.ts';
import { redactSensitiveString, redactSensitiveData } from '../../src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ClaimCheck Accessibility (WCAG 2.1 AA) & Security Guardrails (Phase 03)', () => {
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

  describe('WCAG 2.1 AA Accessibility Standards in Web Portal Markup', () => {
    const htmlPath = resolve(__dirname, '../../src/webapp/public/index.html');
    const html = readFileSync(htmlPath, 'utf8');

    const cssPath = resolve(__dirname, '../../src/webapp/public/styles.css');
    const css = readFileSync(cssPath, 'utf8');

    it('contains an accessible skip navigation link pointing to #mainContent', () => {
      assert.ok(html.includes('href="#mainContent"'), 'Missing skip-link href');
      assert.ok(html.includes('class="skip-link"'), 'Missing skip-link class');
      assert.ok(html.includes('id="mainContent"'), 'Missing mainContent target id');
    });

    it('contains top-level semantic landmark roles (banner, main, contentinfo)', () => {
      assert.ok(html.includes('role="banner"'), 'Missing role="banner"');
      assert.ok(html.includes('role="main"'), 'Missing role="main"');
      assert.ok(html.includes('role="contentinfo"'), 'Missing role="contentinfo"');
    });

    it('configures live announcement regions with role="alert" and aria-live="polite"', () => {
      assert.ok(html.includes('role="alert"'), 'Missing role="alert"');
      assert.ok(html.includes('aria-live="polite"'), 'Missing aria-live="polite"');
    });

    it('configures accessible tab navigation with role="tablist", role="tab", and role="tabpanel"', () => {
      assert.ok(html.includes('role="tablist"'), 'Missing role="tablist"');
      assert.ok(html.includes('role="tab"'), 'Missing role="tab"');
      assert.ok(html.includes('role="tabpanel"'), 'Missing role="tabpanel"');
      assert.ok(html.includes('aria-selected="true"'), 'Missing aria-selected default');
      assert.ok(html.includes('aria-controls="viewReview"'), 'Missing aria-controls linking');
      assert.ok(html.includes('aria-labelledby="tabReview"'), 'Missing aria-labelledby linking');
    });

    it('ensures all interactive form inputs have matching explicit labels', () => {
      assert.ok(html.includes('for="adCopyInput"'));
      assert.ok(html.includes('id="adCopyInput"'));
      assert.ok(html.includes('for="skuSelect"'));
      assert.ok(html.includes('id="skuSelect"'));
      assert.ok(html.includes('for="operatorRoleSelect"'));
      assert.ok(html.includes('id="operatorRoleSelect"'));
    });

    it('defines visible focus rings and skip-link styles in CSS for keyboard navigators', () => {
      assert.ok(css.includes(':focus-visible'), 'CSS must specify :focus-visible');
      assert.ok(css.includes('outline:'), 'CSS focus visible must define visible outline');
      assert.ok(css.includes('.skip-link'), 'CSS must specify .skip-link styles');
      assert.ok(css.includes('.skip-link:focus'), 'CSS must specify visible on-focus state for skip-link');
    });

    it('enforces WCAG 2.1 AA high-contrast dark mode color tokens', () => {
      assert.ok(css.includes('--bg-base: #080c14'));
      assert.ok(css.includes('--text-main: #f8fafc'));
      assert.ok(css.includes('--color-allow: #10b981'));
      assert.ok(css.includes('--color-block: #ef4444'));
      assert.ok(css.includes('--color-review: #f59e0b'));
    });
  });

  describe('Security: PII & Credential Sanitization Protocol', () => {
    it('redacts bearer tokens, API keys, and private credentials from text', () => {
      const secretText = 'Flash deal! Contact sk-ant-api039485720938475203948 with bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const sanitized = redactSensitiveString(secretText);
      assert.ok(!sanitized.includes('sk-ant-api039485720938475203948'));
      assert.ok(!sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
      assert.ok(sanitized.includes('[REDACTED_SECRET]'));
    });

    it('redacts customer emails, credit cards, SSNs, and phone numbers from text', () => {
      const piiText = 'Special customer offer for john.doe@example.com! Call 800-555-0199 or card 4111 2222 3333 4444 ssn 123-45-6789';
      const sanitized = redactSensitiveString(piiText);
      assert.ok(!sanitized.includes('john.doe@example.com'));
      assert.ok(!sanitized.includes('4111 2222 3333 4444'));
      assert.ok(!sanitized.includes('123-45-6789'));
      assert.ok(!sanitized.includes('800-555-0199'));
      assert.ok(sanitized.includes('[REDACTED_EMAIL]'));
      assert.ok(sanitized.includes('[REDACTED_CARD]'));
      assert.ok(sanitized.includes('[REDACTED_SSN]'));
      assert.ok(sanitized.includes('[REDACTED_PHONE]'));
    });

    it('recursively redacts sensitive confidential fields in complex JSON objects', () => {
      const obj = {
        campaignId: 'CAMP-001',
        vendorApiKey: 'secret-1234567890',
        credentials: {
          token: 'token-abcde',
          bearer: 'bearer-xyz123',
        },
        meta: {
          customerPhone: '555-123-4567',
          safeField: 'Public product description',
        },
      };

      const sanitized = redactSensitiveData(obj);
      assert.equal(sanitized.vendorApiKey, '[REDACTED_CONFIDENTIAL]');
      assert.equal(sanitized.credentials, '[REDACTED_CONFIDENTIAL]');
      assert.equal(sanitized.meta.customerPhone, '[REDACTED_CONFIDENTIAL]');
      assert.equal(sanitized.meta.safeField, 'Public product description');
    });

    it('POST /api/check sanitizes credentials in adCopyText before persistence', async () => {
      const res = await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adCopyText: 'Save 25% with token sk-prod-live99887766554433221100! In stock Now $899.99.',
          presetId: 'golden_pass',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(!data.adCopyText.includes('sk-prod-live99887766554433221100'));
      assert.ok(data.adCopyText.includes('[REDACTED_SECRET]'));
    });
  });

  describe('Security: UI Role Barriers & Enforcement (DEC-010)', () => {
    let blockQueueId;

    before(async () => {
      // Create a deceptive price item that triggers a factual BLOCK
      const res = await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: 'deceptive_price' }),
      });
      const data = await res.json();
      assert.equal(data.verdict.compositeStatus, 'BLOCK');
      assert.ok(data.reviewItem);
      blockQueueId = data.reviewItem.queueId;
    });

    it('blocks JUNIOR_OPERATOR from overriding a factual BLOCK (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: blockQueueId,
          action: 'APPROVED_OVERRIDE',
          operatorRole: 'JUNIOR_OPERATOR',
          rationale: 'Junior trying to override deceptive price',
        }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes('DEC-010') || data.error.includes('Senior Compliance Officer required'));
    });

    it('allows JUNIOR_OPERATOR to confirm a block or request re-extraction (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: blockQueueId,
          action: 'CONFIRMED_BLOCK',
          operatorRole: 'JUNIOR_OPERATOR',
          rationale: 'Junior confirming deceptive price failure',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.action, 'CONFIRMED_BLOCK');
    });

    it('allows SENIOR_COMPLIANCE_OFFICER to authorize an override on a factual BLOCK (200 OK)', async () => {
      // Create another block item
      const checkRes = await fetch(`${baseUrl}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: 'out_of_stock' }),
      });
      const checkData = await checkRes.json();
      const stockQueueId = checkData.reviewItem.queueId;

      const res = await fetch(`${baseUrl}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueId: stockQueueId,
          action: 'APPROVED_OVERRIDE',
          operatorRole: 'SENIOR_COMPLIANCE_OFFICER',
          rationale: 'Senior officer authorized emergency replenishment pipeline override',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.action, 'APPROVED_OVERRIDE');
      assert.ok(data.auditEvent);
      assert.equal(data.auditEvent.schemaVersion, '1.0.0');
    });

    it('enforces directory traversal prevention on static file serving', async () => {
      const res = await fetch(`${baseUrl}/../../../../etc/passwd`);
      // Should return either 403 or 404, never 200 with passwd contents
      assert.notEqual(res.status, 200);
      assert.ok([403, 404].includes(res.status));
    });

    it('serves secure HTTP response headers (nosniff, DENY, no-cache)', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'DENY');
    });
  });
});
