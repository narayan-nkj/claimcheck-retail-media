# ClaimCheck Production Rollback Criteria & Release Gates

## 1. Release Acceptance Criteria

Before any candidate version of ClaimCheck can be promoted to production retail media ad servers, it must pass all 6 mandatory release gates:

1. **Automated Test Suite**: 100% pass rate across contracts, evidence, policy, audit, and regression suites (`npm test`).
2. **Performance SLA**: `npm run benchmark` confirms policy engine p95 latency is strictly under 5,000 µs (5ms).
3. **Fail-Closed Guardrails**: Verified negative test cases confirming that unverified claims or illegal state transitions throw exceptions.
4. **Zero Unredacted Credentials**: Verification that no private keys, passwords, or customer PII are emitted in structured logs.
5. **Replay Reproducibility**: 100% bit-for-bit replay matches across the regression corpus.
6. **Documentation & Handoff**: Completed production phase reports and updated consumer handoff contracts.

---

## 2. Measurable Production Rollback Triggers

An automated or manual production rollback MUST be initiated immediately if any of the following operational conditions are met:

| Severity | Rollback Trigger Metric | Measurement Threshold | Monitoring Source |
|---|---|---|---|
| **SEV-1** | Audit Chain Tamper Alert | `verifyAuditChain` returns `valid: false` on any active stream | Prometheus `claimcheck_tamper_alerts` |
| **SEV-1** | Unhandled Policy Exceptions | > 0.01% unhandled errors during policy evaluation | Prometheus `claimcheck_evaluation_errors` |
| **SEV-2** | Latency SLA Degradation | Policy engine p95 latency exceeds 15.0 ms over a 5-minute rolling window | Prometheus / OpenTelemetry |
| **SEV-2** | Memory Leak Detection | Process heap growth exceeds 150 MB/hour under steady-state load | Node runtime metrics |
| **SEV-2** | False-Block Surge | `BLOCK` verdicts surge by > 200% above historical baseline without catalog price updates | Policy Telemetry Collector |

---

## 3. Rollback Runbook (Step-by-Step)

If a rollback trigger is breached:

1. **Traffic Diversion (Blue/Green Switch)**:
   - Immediately switch ad traffic router upstream to the previous stable release artifact.
   - Route in-flight evaluation requests through the fail-closed standby cluster.
2. **Freeze Audit Ledger**:
   - Snapshot the current NDJSON audit chain to an isolated immutable compliance bucket for forensic examination.
3. **State Machine Lock**:
   - Prevent any pending human review items from transitioning to `PUBLISHED` until forensic verification passes.
4. **Forensic Replay**:
   - Execute `replayHistoricalCheck` on the anomalous checks to isolate whether drift was caused by code regression or feed data corruption.
5. **Post-Mortem**:
   - File SEV report linking `checkId`, `traceId`, and the exact commit hash that triggered the rollback.
