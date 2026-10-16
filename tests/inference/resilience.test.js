import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  executeWithRetry,
  AMDTelemetryCollector,
  executeWithResilience,
} from '../../src/inference/resilience.ts';
import { AMDInferenceError } from '../../src/inference/client.ts';
import { createCorrelationContext } from '../../src/audit/telemetry.ts';

describe('Inference Resilience, Circuit Breaker & Telemetry (Phase 03)', () => {
  let collector;

  beforeEach(() => {
    collector = new AMDTelemetryCollector();
  });

  describe('Circuit Breaker State Transitions', () => {
    it('starts in CLOSED state and allows execution', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 100 });
      assert.equal(cb.getState(), 'CLOSED');
      assert.equal(cb.canExecute(), true);
    });

    it('trips to OPEN state when consecutive failures reach threshold', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 200 });

      // First 2 failures
      await assert.rejects(async () => cb.execute(async () => { throw new Error('Fail 1'); }));
      assert.equal(cb.getState(), 'CLOSED');

      await assert.rejects(async () => cb.execute(async () => { throw new Error('Fail 2'); }));
      assert.equal(cb.getState(), 'CLOSED');

      // 3rd failure trips the breaker
      await assert.rejects(async () => cb.execute(async () => { throw new Error('Fail 3'); }));
      assert.equal(cb.getState(), 'OPEN');
      assert.equal(cb.canExecute(), false);

      // Subsequent call fast-fails without executing function
      let executed = false;
      await assert.rejects(
        async () => {
          await cb.execute(async () => {
            executed = true;
            return 'not called';
          });
        },
        (err) => {
          assert.ok(err instanceof CircuitBreakerOpenError);
          return true;
        }
      );
      assert.equal(executed, false, 'Underlying function must not be called when circuit breaker is OPEN');
    });

    it('transitions to HALF_OPEN after cooldown and closes upon reaching success threshold', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 50, successThreshold: 2 });

      // Trip to OPEN
      await assert.rejects(async () => cb.execute(async () => { throw new Error('Fail 1'); }));
      await assert.rejects(async () => cb.execute(async () => { throw new Error('Fail 2'); }));
      assert.equal(cb.getState(), 'OPEN');

      // Wait for cooldown
      await new Promise((r) => setTimeout(r, 60));
      assert.equal(cb.getState(), 'HALF_OPEN');

      // Probe 1 in HALF_OPEN
      const res1 = await cb.execute(async () => 'probe-1-success');
      assert.equal(res1, 'probe-1-success');
      assert.equal(cb.getState(), 'HALF_OPEN');

      // Probe 2 in HALF_OPEN recovers to CLOSED
      const res2 = await cb.execute(async () => 'probe-2-success');
      assert.equal(res2, 'probe-2-success');
      assert.equal(cb.getState(), 'CLOSED');
    });
  });

  describe('Exponential Backoff & Retries', () => {
    it('retries transient failures and succeeds on subsequent attempt', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new AMDInferenceError('Server overloaded', 'HTTP_ERROR', 503);
        }
        return 'success';
      };

      const result = await executeWithRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      assert.equal(result, 'success');
      assert.equal(attempts, 3);
    });

    it('fails fast on non-retryable authentication or client errors without retrying', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts += 1;
        throw new AMDInferenceError('Unauthorized token', 'AUTH_ERROR', 401);
      };

      await assert.rejects(
        async () => {
          await executeWithRetry(fn, {
            maxRetries: 3,
            initialDelayMs: 10,
          });
        },
        (err) => {
          assert.equal(err.code, 'AUTH_ERROR');
          return true;
        }
      );

      assert.equal(attempts, 1, 'Non-retryable auth error must not trigger retries');
    });
  });

  describe('AMD Prometheus Telemetry Exposition', () => {
    it('records requests, tokens, latencies, and exports standard Prometheus format', () => {
      collector.recordInference({
        status: 'SUCCESS',
        latencyMs: 120,
        promptTokens: 45,
        completionTokens: 25,
        circuitBreakerState: 'CLOSED',
      });
      collector.recordInference({
        status: 'ERROR',
        latencyMs: 80,
        errorCode: 'TIMEOUT',
        circuitBreakerState: 'CLOSED',
      });
      collector.recordInference({
        status: 'FALLBACK',
        latencyMs: 15,
        circuitBreakerState: 'OPEN',
      });

      const prom = collector.exportPrometheus();

      assert.ok(prom.includes('claimcheck_amd_inference_requests_total{status="SUCCESS"} 1'));
      assert.ok(prom.includes('claimcheck_amd_inference_requests_total{status="ERROR"} 1'));
      assert.ok(prom.includes('claimcheck_amd_inference_requests_total{status="FALLBACK"} 1'));
      assert.ok(prom.includes('claimcheck_amd_tokens_total{type="PROMPT"} 45'));
      assert.ok(prom.includes('claimcheck_amd_tokens_total{type="COMPLETION"} 25'));
      assert.ok(prom.includes('claimcheck_amd_circuit_breaker_state{state="OPEN"} 1'));
      assert.ok(prom.includes('claimcheck_amd_inference_errors_total{code="TIMEOUT"} 1'));
    });
  });

  describe('Full Resilience Pipeline Integration', () => {
    it('seamlessly invokes fallback handler and records telemetry when endpoint fails', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 1 });
      const context = createCorrelationContext();

      const result = await executeWithResilience(
        async () => {
          throw new AMDInferenceError('Connection timeout to AMD ROCm host', 'TIMEOUT');
        },
        {
          circuitBreaker: cb,
          telemetryCollector: collector,
          correlationContext: context,
          retryOptions: { maxRetries: 1, initialDelayMs: 10 },
          onFallback: async () => 'safe-fallback-claims',
        }
      );

      assert.equal(result, 'safe-fallback-claims');
      const snap = collector.getSnapshot();
      assert.equal(snap.requestsTotal.FALLBACK, 1);
    });
  });
});
