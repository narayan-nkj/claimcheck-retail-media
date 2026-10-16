# ClaimCheck End-to-End Traceability Matrix

This matrix establishes complete forward and backward traceability between system requirements, architectural contracts, implementation modules, automated test suites, governance decisions, and operational verification artifacts.

---

## 1. Requirements & Verification Traceability

| Requirement ID | Requirement Description | Implementation Module | Automated Test Suite | Decision Reference | Evidence ID | Owner | Gate Status |
|---|---|---|---|---|---|---|---|
| **REQ-001** | Strict Schema Enforcement & Rejection of Payload Smuggling | `src/contracts/v1/*.ts`, `src/contracts/v1/schemas/*.json` | `tests/contracts/*.test.js` (35 tests) | DEC-002, DEC-005 | EVID-W1-P1-001, EVID-W1-P5-002 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-002** | 4 Objective Factual Claim Classes (`PRICE`, `STOCK`, `SHIPPING`, `ATTR`) | `src/contracts/v1/claim.ts`, `src/inference/prompts.ts` | `tests/contracts/claim.test.js`, `tests/inference/extractor.test.js` | DEC-001, DEC-019 | EVID-W1-P1-001, EVID-W2-P2-001 | Worker 01, Worker 02 | **VERIFIED (PASS)** |
| **REQ-003** | Source Precedence Ranking & TTL Freshness Enforcement | `src/evidence/freshness.ts`, `src/evidence/resolver.ts` | `tests/evidence/freshness.test.js`, `tests/evidence/resolver.test.js` (9 tests) | DEC-006, DEC-007 | EVID-W1-P2-001, EVID-W1-P2-002 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-004** | Fail-Closed Equal-Tier Contradiction Resolution (`REVIEW`) | `src/evidence/resolver.ts`, `src/contracts/v1/verdict.ts` | `tests/evidence/resolver.test.js`, `tests/policy/engine.test.js` | DEC-003, DEC-007 | EVID-W1-P2-002, EVID-W1-P3-001 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-005** | Pre-Storage Merchant Secret & PII Redaction | `src/evidence/redaction.ts` | `tests/evidence/redaction.test.js` (3 tests) | DEC-008, DEC-022 | EVID-W1-P2-004 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-006** | Deterministic 3-Tier Policy Evaluation (`ALLOW`, `REVIEW`, `BLOCK`) | `src/policy/engine.ts` | `tests/policy/engine.test.js` (7 tests) | DEC-003 | EVID-W1-P3-001 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-007** | Role-Based Human Review Escalation Queue & SLAs (15m to 4h) | `src/policy/reviewQueue.ts` | `tests/policy/reviewQueue.test.js` (4 tests) | DEC-010 | EVID-W1-P3-003 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-008** | Publication Lifecycle State Machine with Transition Guards | `src/policy/stateMachine.ts` | `tests/policy/stateMachine.test.js` (4 tests) | DEC-011 | EVID-W1-P3-002 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-009** | Forward-Linked Merkle Audit Stream (`ChainedAuditEvent`) | `src/audit/stream.ts` | `tests/audit/stream.test.js` (4 tests) | DEC-012 | EVID-W1-P4-001 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-010** | Bit-for-Bit Deterministic Historical Replay Verification | `src/audit/replay.ts` | `tests/audit/replay.test.js` (4 tests) | DEC-004, DEC-013 | EVID-W1-P4-002 | Worker 01 | **VERIFIED (PASS)** |
| **REQ-011** | End-to-End Correlation Context & Prometheus Telemetry | `src/audit/telemetry.ts`, `src/inference/resilience.ts` | `tests/audit/telemetry.test.js`, `tests/inference/resilience.test.js` | DEC-014, DEC-022 | EVID-W1-P4-003, EVID-W2-P3-001 | Worker 01, Worker 02 | **VERIFIED (PASS)** |
| **REQ-012** | Open-Weights Model Selection (Llama-3.1-8B-Instruct on AMD ROCm/vLLM) | `src/inference/config.ts`, `src/inference/client.ts` | `tests/inference/client.test.js` (10 tests) | DEC-017, DEC-024 | EVID-W2-P1-001, EVID-W2-P1-003 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-013** | Deterministic Local Fallback Adapter for Offline Test Isolation | `src/inference/fallback.ts` | `tests/inference/client.test.js`, `tests/inference/fallback.ts` | DEC-018 | EVID-W2-P1-002 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-014** | Generative Model Zero Approval Authority (DEC-009 Enforcement) | `src/inference/extractor.ts`, `src/inference/prompts.ts` | `tests/inference/guardrails.test.js` (5 tests) | DEC-009 | EVID-W2-P2-002, EVID-W2-P2-003 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-015** | Prompt Injection Sanitization & 2,000-Char Length Bounding | `src/inference/prompts.ts` | `tests/inference/guardrails.test.js` | DEC-020 | EVID-W2-P2-002 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-016** | Span Coordinate Exact Text Boundary Auto-Realignment | `src/inference/extractor.ts` | `tests/inference/extractor.test.js` (4 tests) | DEC-020 | EVID-W2-P2-001 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-017** | Fail-Closed Malformed / Corrupted LLM Response Recovery | `src/inference/extractor.ts` | `tests/inference/guardrails.test.js` | DEC-019 | EVID-W2-P2-002 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-018** | Three-State Circuit Breaker (`CLOSED`/`OPEN`/`HALF_OPEN`) | `src/inference/resilience.ts` | `tests/inference/resilience.test.js` (7 tests) | DEC-021 | EVID-W2-P3-001, EVID-W2-P3-002 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-019** | Exponential Backoff with Jitter for Transient HTTP 429/503 | `src/inference/resilience.ts` | `tests/inference/resilience.test.js` | DEC-021 | EVID-W2-P3-001 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-020** | Standardized AMD Inference Benchmark Suite & Latency SLA | `src/benchmark/amdRunner.ts`, `scripts/benchmark_amd.js` | `npm run benchmark:amd` (50 iterations) | DEC-023 | EVID-W2-P4-001 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-021** | Reproducible AMD Instinct MI300X Execution Proof Bundle | `docs/amd/AMD_EXECUTION_PROOF.md` | Hardware telemetry logs & vLLM boot logs | DEC-024 | EVID-W2-P4-002 | Worker 02 | **VERIFIED (PASS)** |
| **REQ-022** | Master SDK Entrypoint Unification (`src/index.ts`) | `src/index.ts` | `tests/contracts/compatibility.test.js` | DEC-015 | EVID-W1-P5-002, EVID-W2-P4-003 | Worker 01, Worker 02 | **VERIFIED (PASS)** |
| **REQ-023** | End-to-End Retail Media Regression Corpus (Golden, Deceptive, Expiry, Contradiction, Replay) | `tests/regression/corpus.test.js` | `tests/regression/corpus.test.js` (5 tests) | DEC-016 | EVID-W1-P5-003 | Worker 01, Tester 01 | **VERIFIED (PASS)** |

---

## 2. Test Suite Execution Summary

| Test Domain | Target Path | Test Count | Pass Count | Failure Count | Execution Time |
|---|---|---|---|---|---|
| **Contract Schemas** | `tests/contracts/*.test.js` | 35 | 35 | 0 | ~50 ms |
| **Evidence Engine** | `tests/evidence/*.test.js` | 15 | 15 | 0 | ~25 ms |
| **Policy Engine** | `tests/policy/*.test.js` | 15 | 15 | 0 | ~25 ms |
| **Audit & Replay** | `tests/audit/*.test.js` | 15 | 15 | 0 | ~35 ms |
| **Inference & AMD** | `tests/inference/*.test.js` | 26 | 26 | 0 | ~180 ms |
| **Regression Corpus** | `tests/regression/*.test.js` | 5 | 5 | 0 | ~15 ms |
| **Total Test Suite** | `npm test` | **111** | **111** | **0** | **~420 ms** |

---

## 3. Governance & Quality Gate Approval

- **Contract & Policy Architecture:** Worker 01 (Adi) — *Signed Off*
- **AMD Inference & Guardrails Architecture:** Worker 02 (Narayan) — *Signed Off*
- **Regression Verification:** Tester 01 — *Signed Off*
- **Compliance & Operational Audit:** Tester 02 — *Signed Off*
- **Release Status:** **PRODUCTION READY / ELIGIBILITY GATE CLEARED**
