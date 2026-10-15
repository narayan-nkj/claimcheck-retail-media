# Security, Access Control & Auditability Architecture

## 1. Threat Model & Security Posture

ClaimCheck operates at the high-risk boundary where automated AI generation meets regulatory advertising compliance. The threat landscape addresses:

1. **Ad Copy Manipulation & Injection**: Advertisers attempting to evade policy gates through prompt manipulation, hidden unicode, or deceptive phrasing.
2. **Untracked Hallucinations**: Generative LLMs inventing prices, free shipping offers, or false certifications without documentary substantiation.
3. **Audit Trail Tampering**: Internal or external actors attempting to alter historical decisions, timestamps, or verdicts to obscure compliance violations.
4. **Data Exfiltration**: Sensitive merchant margins, wholesale costs, supplier contracts, or customer PII leaking through audit logs.

---

## 2. Role-Based Access Control (RBAC)

| Role | Permissions | Security Boundary |
|---|---|---|
| `API_CLIENT` / `AD_SUBMITTER` | Submit ad copy and campaign ID for evaluation; read evaluation verdict | Cannot read unredacted merchant margins or internal warehouse logs |
| `JUNIOR_OPERATOR` | View review queue; resolve ambiguous claims; confirm blocks; request re-extraction | **Prohibited** from overriding factual `BLOCK` violations |
| `SENIOR_COMPLIANCE_OFFICER` | All Junior actions + approve `BLOCK` overrides with mandatory audit rationale | Must supply verified documentary attestation |
| `LEGAL_COUNSEL` | Adjudicate `OUT_OF_SCOPE` claims; review regulatory escalations | Sole authority on subjective and external regulatory claims |
| `SYSTEM_AUDITOR` | Verify cryptographic chain integrity; inspect replay records; export compliance reports | Read-only access to immutable audit stream |

---

## 3. Tamper-Evident Chained Audit Stream

ClaimCheck implements forward cryptographic linkage across audit events:

```
[ Genesis Block ]  (previousDigest = 000...000)
       │
       ▼
[ Chained Event #1 ] ──► chainDigest = SHA-256(prevDigest : replayDigest)
       │
       ▼
[ Chained Event #2 ] ──► chainDigest = SHA-256(Event#1.chainDigest : Event#2.replayDigest)
       │
       ▼
[ Chained Event #3 ] ──► chainDigest = SHA-256(Event#2.chainDigest : Event#3.replayDigest)
```

- If an attacker tampers with ad text, verdicts, or timestamps in Event #2:
  1. Event #2 `replayDigest` no longer matches its canonical JSON payload.
  2. Event #2 `chainDigest` becomes invalid.
  3. The link between Event #2 and Event #3 breaks, triggering an immediate security alert in `verifyAuditChain`.

---

## 4. Correlation & Tracing Headers

Every evaluation request generates a `CorrelationContext`:
- `traceId`: 128-bit hex UUID tracking the end-to-end user request.
- `spanId`: 64-bit hex identifier for the specific policy or evidence evaluation step.
- `correlationId`: Human-readable identifier prefixing all structured JSON logs.
