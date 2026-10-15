# Human Review Workflow, Roles & Escalation SLAs

## 1. Operator Authorization Roles

| Role | Permitted Actions | Restrictions |
|---|---|---|
| `JUNIOR_OPERATOR` | Resolve `REVIEW` items; confirm `BLOCK`; request re-extraction; escalate | **Cannot** override factual `BLOCK` verdicts on price or inventory. |
| `SENIOR_COMPLIANCE_OFFICER` | All Junior actions + approve `BLOCK` overrides with mandatory audit justification | Must hold senior operational compliance credentials. |
| `LEGAL_COUNSEL` | All Senior actions + evaluate `OUT_OF_SCOPE` claims and regulatory compliance | Sole authority to clear external legal/regulatory claims. |

---

## 2. Queue Priority & Escalation SLAs

Urgency is calculated dynamically upon ingestion:

- **Tier 1: Flash Deal & Expiry Urgency** (`POLICY_EXPIRY_THRESHOLD`):
  - **SLA:** **15 minutes**.
  - Priority Score: **95/100**.
  - Justification: Ads for expiring deals become invalid rapidly; human operators must adjudicate before campaign launch window closes.
- **Tier 2: Pricing Discrepancy & Stockout** (`PRICE_MISMATCH`, `PRODUCT_OUT_OF_STOCK`):
  - **SLA:** **60–120 minutes**.
  - Priority Score: **85–90/100**.
  - Required Role: `SENIOR_COMPLIANCE_OFFICER`.
- **Tier 3: Legal & Regulatory Scope** (`OUT_OF_SCOPE_CLAIM`):
  - **SLA:** **3 hours (180 minutes)**.
  - Priority Score: **70/100**.
  - Required Role: `LEGAL_COUNSEL`.
- **Tier 4: Standard Ambiguity & Missing Specs** (`AMBIGUOUS_CLAIM`, `MISSING_EVIDENCE`):
  - **SLA:** **4 hours (240 minutes)**.
  - Priority Score: **50/100**.
  - Required Role: `JUNIOR_OPERATOR`.

---

## 3. Override Traceability & Audit Standards

- Any human override requires an explicit `rationale` of at least 10 characters documenting the verifiable documentary evidence (e.g. offline catalog insert, signed supplier attestation).
- The override event is recorded with the operator ID, timestamp, and previous verdict in the immutable `AuditEvent`.
