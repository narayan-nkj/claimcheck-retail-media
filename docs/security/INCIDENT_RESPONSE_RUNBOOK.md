# Incident Response & Operations Runbook

## 1. Incident Severity Definitions

- **SEV-1 (Critical)**: Audit chain tampering detected (`verifyAuditChain` failure); published ad contains severe false price claim resulting in consumer complaints; data leak of unredacted merchant API keys.
- **SEV-2 (High)**: Multiple warehouse feeds in persistent contradiction; review queue SLA breach on high-priority flash sale (> 30 min delay); AMD serving endpoint unavailable causing fallback.
- **SEV-3 (Medium)**: Single stale evidence feed detected; unexpected increase in `OUT_OF_SCOPE` claims requiring legal review.

---

## 2. Operational Alert Runbooks

### Runbook A: Audit Chain Tamper Alert (`verifyAuditChain` Failure)
1. **Detection**: `verifyAuditChain` returns `valid: false` with specific `errorIndex`.
2. **Immediate Action**:
   - Isolate the affected NDJSON audit log file.
   - Halt automated campaign syndication until integrity is confirmed.
3. **Investigation**:
   - Run `replayHistoricalCheck` on the event at `errorIndex`.
   - Check file system write logs / S3 bucket versioning for unauthorized write events.
   - Cross-reference `traceId` and `correlationId` in structured logs to identify actor or process that modified the record.
4. **Remediation**:
   - Restore canonical record from immutable backup ledger.
   - Rotate signing keys and file access tokens.

---

### Runbook B: Contradictory Feed Alert (`claimcheck_contradictions_total` Surge)
1. **Detection**: Prometheus metric `claimcheck_contradictions_total` increases by > 10 in a 1-hour window.
2. **Immediate Action**:
   - Review top contradictory sources in `resolveEvidenceForClaim` logs.
   - Confirm fail-closed behavior: Verify that all conflicting claims are routed to `PENDING_HUMAN_REVIEW` with `AMBIGUOUS_CLAIM`.
3. **Investigation**:
   - Check latency / sync delays between regional warehouse feeds.
4. **Resolution**:
   - Contact merchant inventory engineering to reconcile conflicting feed partitions.

---

### Runbook C: Emergency Campaign Retraction SLA
If an ad copy is published with an approved override that is later discovered to be inaccurate:
1. Operator issues state transition: `PUBLISHED` -> `ARCHIVED` (reason: `EMERGENCY_RETRACTION`).
2. Immediate notification sent to ad network via publisher webhook.
3. Post-mortem documented linking `checkId` to `AuditEvent` and operator override justification.
