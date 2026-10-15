# Evidence Register

| Evidence ID | Date | Artifact / System | Evidence Description | Hash / Verification | Owner |
|---|---|---|---|---|---|
| EVID-W1-P1-001 | 2026-10-16 | `tests/contracts/*.test.js` | 31 automated unit, contract, fail-closed, and tamper-detection tests | Passed (31 pass, 0 fail in 488ms via Node v24 test runner) | Worker 01 |
| EVID-W1-P1-002 | 2026-10-16 | `src/contracts/v1/schemas/*.json` | JSON Schema definitions (Draft 2020-12) for Catalog, Claim, Verdict, and Audit | Canonical schemas verified against Draft 2020-12 spec | Worker 01 |
| EVID-W1-P1-003 | 2026-10-16 | `src/contracts/v1/audit.ts` | SHA-256 canonical digest algorithm for tamper-evident replayability | Verified deterministic key-sort hashing across reordered test objects | Worker 01 |
| EVID-W1-P1-004 | 2026-10-16 | `docs/contracts/OWNERSHIP_AND_COMPATIBILITY.md` | Contract ownership matrix and SemVer compatibility policy | Baseline v1.0.0 established | Worker 01 |
| EVID-W1-P2-001 | 2026-10-16 | `tests/evidence/freshness.test.js` | 5 unit tests verifying TTL expiration, near-expiry warnings, and calendar-based promo deadlines | Passed (5 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P2-002 | 2026-10-16 | `tests/evidence/resolver.test.js` | 4 unit tests verifying source precedence ranking, equal-tier contradiction detection, and stale fallback | Passed (4 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P2-003 | 2026-10-16 | `tests/evidence/provenance.test.js` | 3 unit tests verifying SHA-256 raw payload digest and unbroken chain-of-custody linkage | Passed (3 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P2-004 | 2026-10-16 | `tests/evidence/redaction.test.js` | 3 unit tests verifying redaction of API keys, bearer tokens, credit cards, emails, and sensitive merchant keys | Passed (3 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P3-001 | 2026-10-16 | `tests/policy/engine.test.js` | 7 unit tests verifying factual claim evaluation across price, stockout, shipping, attribute, and out-of-scope rules | Passed (7 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P3-002 | 2026-10-16 | `tests/policy/stateMachine.test.js` | 4 unit tests verifying lifecycle transitions and guard enforcement blocking unverified publication | Passed (4 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P3-003 | 2026-10-16 | `tests/policy/reviewQueue.test.js` | 4 unit tests verifying queue priority scoring, SLA deadlines (15m to 4h), and role-based override authorization | Passed (4 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P4-001 | 2026-10-16 | `tests/audit/stream.test.js` | 4 unit tests verifying NDJSON parsing/serialization, 3-block chain verification, payload tamper detection, and broken link detection | Passed (4 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P4-002 | 2026-10-16 | `tests/audit/replay.test.js` | 4 unit tests verifying historical check replay reproducibility, hash tamper detection, payload tamper detection, and status drift | Passed (4 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P4-003 | 2026-10-16 | `tests/audit/telemetry.test.js` | 7 unit tests verifying correlation ID generation, metrics recording, Prometheus format export, reset, and sanitized logging | Passed (7 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P4-004 | 2026-10-16 | `docs/security/*.md` | Security Architecture and Incident Response Runbooks for SEV-1 to SEV-3 operational incidents | Verified complete runbooks covering tamper, contradiction surges, and retractions | Worker 01 |
| EVID-W1-P5-001 | 2026-10-16 | `src/benchmark/runner.ts`, `scripts/benchmark.js` | 1,000-iteration performance benchmark measuring policy engine latency (p95: 29.4 µs) and throughput (53k+ ops/sec) | Passed: Confirmed p95 latency is 170x faster than 5ms SLA | Worker 01 |
| EVID-W1-P5-002 | 2026-10-16 | `tests/contracts/compatibility.test.js` | 4 unit tests verifying SDK master exports, canonical JSON stability, and strict rejection of payload smuggling | Passed (4 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P5-003 | 2026-10-16 | `tests/regression/corpus.test.js` | 5 end-to-end integration tests verifying Golden Pass, Deceptive Price Block, Flash-Sale Urgency SLA, Feed Contradiction, and Audit Replay | Passed (5 pass, 0 fail via Node test runner) | Worker 01 |
| EVID-W1-P5-004 | 2026-10-16 | `docs/release/*.md` | Performance and benchmark report and production rollback runbooks with measurable triggers | Complete specifications established | Worker 01 |
