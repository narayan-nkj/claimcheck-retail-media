import type { CorrelationContext } from '../audit/telemetry.ts';
import { logStructured } from '../audit/telemetry.ts';
import { redactSensitiveData } from '../evidence/redaction.ts';
import { AMDInferenceError, type AMDInferenceErrorCode } from './client.ts';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number; // default: 5
  cooldownMs?: number; // default: 5000 ms
  successThreshold?: number; // default: 2 in half-open
}

export class CircuitBreakerOpenError extends Error {
  public readonly code: string = 'CIRCUIT_BREAKER_OPEN';
  constructor(message = 'Inference circuit breaker is OPEN. Fast-failing request.') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Three-state circuit breaker for protecting downstream AMD inference endpoints.
 * CLOSED -> (failures >= threshold) -> OPEN -> (cooldown elapsed) -> HALF_OPEN -> (successes >= threshold) -> CLOSED
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastStateChangeTimestamp: number = Date.now();

  public readonly failureThreshold: number;
  public readonly cooldownMs: number;
  public readonly successThreshold: number;

  constructor(config?: CircuitBreakerConfig) {
    this.failureThreshold = config?.failureThreshold ?? 5;
    this.cooldownMs = config?.cooldownMs ?? 5000;
    this.successThreshold = config?.successThreshold ?? 2;
  }

  public getState(): CircuitBreakerState {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastStateChangeTimestamp;
      if (elapsed >= this.cooldownMs) {
        this.state = 'HALF_OPEN';
        this.consecutiveSuccesses = 0;
      }
    }
    return this.state;
  }

  public canExecute(): boolean {
    const currentState = this.getState();
    return currentState === 'CLOSED' || currentState === 'HALF_OPEN';
  }

  public recordSuccess(): void {
    const currentState = this.getState();
    if (currentState === 'HALF_OPEN') {
      this.consecutiveSuccesses += 1;
      if (this.consecutiveSuccesses >= this.successThreshold) {
        this.state = 'CLOSED';
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.lastStateChangeTimestamp = Date.now();
      }
    } else if (currentState === 'CLOSED') {
      this.consecutiveFailures = 0;
    }
  }

  public recordFailure(_err?: unknown): void {
    const currentState = this.getState();
    if (currentState === 'HALF_OPEN') {
      // In half-open, any single failure forces back to OPEN
      this.state = 'OPEN';
      this.consecutiveFailures += 1;
      this.consecutiveSuccesses = 0;
      this.lastStateChangeTimestamp = Date.now();
    } else if (currentState === 'CLOSED') {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.lastStateChangeTimestamp = Date.now();
      }
    }
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastStateChangeTimestamp = Date.now();
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError();
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(err);
      throw err;
    }
  }
}

export interface RetryOptions {
  maxRetries?: number; // default: 3
  initialDelayMs?: number; // default: 50 ms
  maxDelayMs?: number; // default: 1000 ms
  backoffMultiplier?: number; // default: 2
  isRetryable?: (err: unknown) => boolean;
}

export function isDefaultRetryable(err: unknown): boolean {
  if (err instanceof CircuitBreakerOpenError) {
    return false;
  }

  if (err instanceof AMDInferenceError) {
    if (err.code === 'AUTH_ERROR') return false;
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429) {
      return false; // 400, 404, 422 etc. are deterministic client errors
    }
    return true; // 429, 500, 502, 503, 504, TIMEOUT, CONNECTION_FAILED
  }

  const errObj = err as { code?: string; name?: string; status?: number };
  if (errObj?.code === 'ECONNREFUSED' || errObj?.code === 'ECONNRESET' || errObj?.name === 'TimeoutError') {
    return true;
  }

  if (errObj?.status === 429 || (errObj?.status && errObj.status >= 500)) {
    return true;
  }

  return false;
}

/**
 * Executes a function with exponential backoff and jitter on transient errors.
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelayMs ?? 50;
  const maxDelay = options?.maxDelayMs ?? 1000;
  const multiplier = options?.backoffMultiplier ?? 2;
  const isRetryable = options?.isRetryable ?? isDefaultRetryable;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries || !isRetryable(err)) {
        throw err;
      }

      // Calculate exponential backoff with 15% jitter
      const baseDelay = Math.min(maxDelay, initialDelay * Math.pow(multiplier, attempt));
      const jitter = baseDelay * 0.15 * (Math.random() * 2 - 1);
      const delay = Math.max(10, Math.round(baseDelay + jitter));

      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export interface AMDInferenceMetricsSnapshot {
  requestsTotal: {
    SUCCESS: number;
    ERROR: number;
    FALLBACK: number;
  };
  tokensTotal: {
    prompt: number;
    completion: number;
  };
  errorsTotal: Record<string, number>;
  latenciesMs: number[];
  circuitBreakerState: CircuitBreakerState;
}

/**
 * Observability Collector for AMD ROCm Inference Telemetry
 */
export class AMDTelemetryCollector {
  private metrics: AMDInferenceMetricsSnapshot = {
    requestsTotal: { SUCCESS: 0, ERROR: 0, FALLBACK: 0 },
    tokensTotal: { prompt: 0, completion: 0 },
    errorsTotal: {},
    latenciesMs: [],
    circuitBreakerState: 'CLOSED',
  };

  public recordInference(options: {
    status: 'SUCCESS' | 'ERROR' | 'FALLBACK';
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
    errorCode?: string;
    circuitBreakerState?: CircuitBreakerState;
  }): void {
    this.metrics.requestsTotal[options.status] += 1;
    this.metrics.latenciesMs.push(options.latencyMs);

    if (options.promptTokens) {
      this.metrics.tokensTotal.prompt += options.promptTokens;
    }
    if (options.completionTokens) {
      this.metrics.tokensTotal.completion += options.completionTokens;
    }
    if (options.errorCode) {
      this.metrics.errorsTotal[options.errorCode] =
        (this.metrics.errorsTotal[options.errorCode] ?? 0) + 1;
    }
    if (options.circuitBreakerState) {
      this.metrics.circuitBreakerState = options.circuitBreakerState;
    }
  }

  public getSnapshot(): AMDInferenceMetricsSnapshot {
    return structuredClone(this.metrics);
  }

  public reset(): void {
    this.metrics = {
      requestsTotal: { SUCCESS: 0, ERROR: 0, FALLBACK: 0 },
      tokensTotal: { prompt: 0, completion: 0 },
      errorsTotal: {},
      latenciesMs: [],
      circuitBreakerState: 'CLOSED',
    };
  }

  /**
   * Exports metrics formatted in standard Prometheus exposition format.
   */
  public exportPrometheus(): string {
    const latencies = [...this.metrics.latenciesMs].sort((a, b) => a - b);
    const count = latencies.length;
    const avg = count > 0 ? (latencies.reduce((a, b) => a + b, 0) / count).toFixed(2) : '0';
    const p50 = count > 0 ? latencies[Math.floor(count * 0.5)] : 0;
    const p95 = count > 0 ? latencies[Math.floor(count * 0.95)] : 0;
    const p99 = count > 0 ? latencies[Math.floor(count * 0.99)] : 0;

    const lines: string[] = [
      '# HELP claimcheck_amd_inference_requests_total Total AMD inference requests by status.',
      '# TYPE claimcheck_amd_inference_requests_total counter',
      `claimcheck_amd_inference_requests_total{status="SUCCESS"} ${this.metrics.requestsTotal.SUCCESS}`,
      `claimcheck_amd_inference_requests_total{status="ERROR"} ${this.metrics.requestsTotal.ERROR}`,
      `claimcheck_amd_inference_requests_total{status="FALLBACK"} ${this.metrics.requestsTotal.FALLBACK}`,
      '',
      '# HELP claimcheck_amd_tokens_total Total tokens processed on AMD hardware.',
      '# TYPE claimcheck_amd_tokens_total counter',
      `claimcheck_amd_tokens_total{type="PROMPT"} ${this.metrics.tokensTotal.prompt}`,
      `claimcheck_amd_tokens_total{type="COMPLETION"} ${this.metrics.tokensTotal.completion}`,
      '',
      '# HELP claimcheck_amd_inference_latency_ms AMD inference latency summary in milliseconds.',
      '# TYPE claimcheck_amd_inference_latency_ms summary',
      `claimcheck_amd_inference_latency_ms{quantile="0.5"} ${p50}`,
      `claimcheck_amd_inference_latency_ms{quantile="0.95"} ${p95}`,
      `claimcheck_amd_inference_latency_ms{quantile="0.99"} ${p99}`,
      `claimcheck_amd_inference_latency_ms_sum ${(latencies.reduce((a, b) => a + b, 0)).toFixed(1)}`,
      `claimcheck_amd_inference_latency_ms_count ${count}`,
      '',
      '# HELP claimcheck_amd_circuit_breaker_state Current state of inference circuit breaker (1 if active).',
      '# TYPE claimcheck_amd_circuit_breaker_state gauge',
      `claimcheck_amd_circuit_breaker_state{state="CLOSED"} ${this.metrics.circuitBreakerState === 'CLOSED' ? 1 : 0}`,
      `claimcheck_amd_circuit_breaker_state{state="OPEN"} ${this.metrics.circuitBreakerState === 'OPEN' ? 1 : 0}`,
      `claimcheck_amd_circuit_breaker_state{state="HALF_OPEN"} ${this.metrics.circuitBreakerState === 'HALF_OPEN' ? 1 : 0}`,
    ];

    if (Object.keys(this.metrics.errorsTotal).length > 0) {
      lines.push('', '# HELP claimcheck_amd_inference_errors_total Total AMD inference errors by code.', '# TYPE claimcheck_amd_inference_errors_total counter');
      for (const [code, errCount] of Object.entries(this.metrics.errorsTotal)) {
        lines.push(`claimcheck_amd_inference_errors_total{code="${code}"} ${errCount}`);
      }
    }

    return lines.join('\n') + '\n';
  }
}

export const amdTelemetry = new AMDTelemetryCollector();

export interface ResilienceExecutionOptions {
  circuitBreaker?: CircuitBreaker;
  retryOptions?: RetryOptions;
  correlationContext?: CorrelationContext;
  onFallback?: () => Promise<unknown>;
  telemetryCollector?: AMDTelemetryCollector;
}

/**
 * Resilient Execution Pipeline:
 * Integrates Circuit Breaker, Exponential Retries, Credential Redaction,
 * Correlation Context propagation, and Prometheus Telemetry recording.
 */
export async function executeWithResilience<T>(
  fn: () => Promise<T>,
  options?: ResilienceExecutionOptions
): Promise<T> {
  const cb = options?.circuitBreaker ?? new CircuitBreaker();
  const collector = options?.telemetryCollector ?? amdTelemetry;
  const start = Date.now();

  try {
    const result = await cb.execute(async () => {
      return await executeWithRetry(fn, options?.retryOptions);
    });

    const elapsed = Date.now() - start;
    collector.recordInference({
      status: 'SUCCESS',
      latencyMs: elapsed,
      circuitBreakerState: cb.getState(),
    });

    if (options?.correlationContext) {
      logStructured('INFO', 'AMD inference call completed successfully', {
        correlation: options.correlationContext,
        details: { latencyMs: elapsed },
      });
    }

    return result;
  } catch (err) {
    const elapsed = Date.now() - start;
    const errorCode = (err as { code?: string })?.code ?? 'UNKNOWN_ERROR';

    // If fallback is provided and circuit breaker is open or retries exhausted
    if (options?.onFallback) {
      collector.recordInference({
        status: 'FALLBACK',
        latencyMs: elapsed,
        errorCode,
        circuitBreakerState: cb.getState(),
      });

      if (options.correlationContext) {
        logStructured('WARN', `AMD inference failed (${errorCode}). Executing fallback adapter.`, {
          correlation: options.correlationContext,
          details: redactSensitiveData({ error: (err as Error).message, latencyMs: elapsed }),
        });
      }

      return (await options.onFallback()) as T;
    }

    collector.recordInference({
      status: 'ERROR',
      latencyMs: elapsed,
      errorCode,
      circuitBreakerState: cb.getState(),
    });

    if (options?.correlationContext) {
      logStructured('ERROR', `AMD inference failed permanently: ${(err as Error).message}`, {
        correlation: options.correlationContext,
        details: redactSensitiveData({ error: (err as Error).message, errorCode }),
      });
    }

    throw err;
  }
}
