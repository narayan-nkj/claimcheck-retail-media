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
