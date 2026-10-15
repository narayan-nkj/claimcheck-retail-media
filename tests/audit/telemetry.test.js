import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCorrelationContext,
  generateTraceId,
  generateSpanId,
  telemetry,
  logStructured,
} from '../../src/audit/telemetry.ts';

describe('Audit Telemetry, Observability & Structured Logging', () => {
  beforeEach(() => {
    telemetry.reset();
  });

  describe('Correlation Context', () => {
    it('generates distinct trace and span identifiers', () => {
      const traceId = generateTraceId();
      const spanId = generateSpanId();

      assert.equal(typeof traceId, 'string');
      assert.equal(traceId.length, 32);
      assert.equal(typeof spanId, 'string');
      assert.equal(spanId.length, 16);
    });

    it('creates correlation context with propagated traceId if provided', () => {
      const parentTraceId = '1234567890abcdef1234567890abcdef';
      const ctx = createCorrelationContext(parentTraceId);

      assert.equal(ctx.traceId, parentTraceId);
      assert.ok(ctx.correlationId.startsWith('corr-12345678-'));
      assert.equal(ctx.spanId.length, 16);
    });
  });

  describe('Telemetry Metrics Collector', () => {
    it('records check evaluations, contradictions, and claim counts', () => {
      telemetry.recordEvaluation('ALLOW', {
        claims: [{ claimClass: 'PRICE_DISCOUNT' }, { claimClass: 'SHIPPING_PROMISE' }],
      });
      telemetry.recordEvaluation('BLOCK', {
        claims: [{ claimClass: 'PRICE_DISCOUNT' }],
        hasContradiction: true,
      });
      telemetry.recordEvaluation('REVIEW');

      const snapshot = telemetry.getSnapshot();
      assert.equal(snapshot.evaluationsTotal.ALLOW, 1);
      assert.equal(snapshot.evaluationsTotal.BLOCK, 1);
      assert.equal(snapshot.evaluationsTotal.REVIEW, 1);
      assert.equal(snapshot.contradictionsDetectedTotal, 1);
      assert.equal(snapshot.claimsExtractedTotal.PRICE_DISCOUNT, 2);
      assert.equal(snapshot.claimsExtractedTotal.SHIPPING_PROMISE, 1);
    });

    it('records stale evidence, human overrides, and SLA breaches', () => {
      telemetry.recordStaleEvidence('CATALOG_FEED');
      telemetry.recordStaleEvidence('CATALOG_FEED');
      telemetry.recordStaleEvidence('PROMOTION_SERVICE');
      telemetry.recordHumanOverride('SENIOR_COMPLIANCE_OFFICER');
      telemetry.recordSlaBreach();

      const snapshot = telemetry.getSnapshot();
      assert.equal(snapshot.staleEvidenceTotal.CATALOG_FEED, 2);
      assert.equal(snapshot.staleEvidenceTotal.PROMOTION_SERVICE, 1);
      assert.equal(snapshot.humanOverridesTotal.SENIOR_COMPLIANCE_OFFICER, 1);
      assert.equal(snapshot.slaBreachesTotal, 1);
    });

    it('exports metrics in standard Prometheus exposition text format', () => {
      telemetry.recordEvaluation('ALLOW');
      telemetry.recordEvaluation('ALLOW');
      telemetry.recordEvaluation('BLOCK', { hasContradiction: true });
      telemetry.recordStaleEvidence('ERP_INVENTORY');
      telemetry.recordHumanOverride('LEGAL_COUNSEL');
      telemetry.recordSlaBreach();

      const promOutput = telemetry.exportPrometheus();

      assert.ok(promOutput.includes('claimcheck_evaluations_total{verdict="ALLOW"} 2'));
      assert.ok(promOutput.includes('claimcheck_evaluations_total{verdict="BLOCK"} 1'));
      assert.ok(promOutput.includes('claimcheck_contradictions_total 1'));
      assert.ok(promOutput.includes('claimcheck_sla_breaches_total 1'));
      assert.ok(promOutput.includes('claimcheck_stale_evidence_total{source="ERP_INVENTORY"} 1'));
      assert.ok(promOutput.includes('claimcheck_human_overrides_total{role="LEGAL_COUNSEL"} 1'));
    });

    it('resets all metrics accurately', () => {
      telemetry.recordEvaluation('ALLOW');
      telemetry.recordSlaBreach();
      telemetry.reset();

      const snapshot = telemetry.getSnapshot();
      assert.equal(snapshot.evaluationsTotal.ALLOW, 0);
      assert.equal(snapshot.slaBreachesTotal, 0);
    });
  });

  describe('Structured Logging with Privacy Redaction', () => {
    it('produces valid JSON log line with correlation identifiers and automatic redaction', () => {
      const ctx = createCorrelationContext();
      const logLine = logStructured('SECURITY_ALERT', 'Potential feed tampering detected', {
        correlation: ctx,
        checkId: 'chk-alert-99',
        details: {
          feedUrl: 'https://partner.feed/items',
          apiKey: 'AIzaSyD-secret-key-12345',
          customerEmail: 'compliance-officer@retailer.com',
          supportNotes: 'Contact representative at support@retailer.com for details',
          ipAddress: '192.168.1.100',
        },
      });

      const parsed = JSON.parse(logLine);
      assert.equal(parsed.level, 'SECURITY_ALERT');
      assert.equal(parsed.message, 'Potential feed tampering detected');
      assert.equal(parsed.checkId, 'chk-alert-99');
      assert.equal(parsed.traceId, ctx.traceId);
      assert.equal(parsed.correlationId, ctx.correlationId);

      // Verify automatic sanitization of sensitive fields
      assert.equal(parsed.details.feedUrl, 'https://partner.feed/items');
      assert.equal(parsed.details.apiKey, '[REDACTED_CONFIDENTIAL]');
      assert.equal(parsed.details.customerEmail, '[REDACTED_CONFIDENTIAL]');
      assert.equal(parsed.details.supportNotes, 'Contact representative at [REDACTED_EMAIL] for details');
    });
  });
});
