/**
 * ClaimCheck Core SDK (v1.0.0)
 * Deterministic Evidence-Backed Pre-Publication Claim Checker for Retail Media
 */

// Contracts (v1)
export * from './contracts/v1/index.ts';

// Evidence Freshness, Precedence, Provenance & Privacy Redaction
export * from './evidence/index.ts';

// Deterministic Policy Engine, Publication State Machine & Human Review Queue
export * from './policy/index.ts';

// Immutable Chained Audit Stream, Deterministic Replay & Telemetry
export * from './audit/index.ts';

// AMD Model Serving, Structured Extraction & Guardrails
export * from './inference/index.ts';

// Performance Benchmark Runners
export * from './benchmark/runner.ts';
export * from './benchmark/amdRunner.ts';
