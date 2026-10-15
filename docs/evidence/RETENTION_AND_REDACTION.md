# Evidence Retention & Confidentiality Redaction Policy

## 1. Data Minimization & Privacy Principles

ClaimCheck operates under a strict principle of **data minimization**:
- Only factual values necessary to substantiate ad claims are retained in evidence snapshots.
- No personally identifiable customer information (PII) is stored or processed.
- Merchant internal secrets (API keys, wholesale costs, margin figures, supplier contracts) are redacted before evidence is persisted to audit records.

---

## 2. Redaction Rules

Before evidence is written to audit logs or displayed in operator interfaces, the `redactSensitiveData` filter is applied:

1. **Key-Based Redaction**:
   Any JSON field matching patterns such as `api_key`, `secret`, `token`, `password`, `wholesale_cost`, `profit_margin`, or `customer_*` is masked with `[REDACTED_CONFIDENTIAL]`.
2. **Value-Based Redaction**:
   - Authorization headers (`Bearer ...`, API tokens) -> `[REDACTED_SECRET]`
   - Payment card numbers -> `[REDACTED_CARD]`
   - Email addresses -> `[REDACTED_EMAIL]`

---

## 3. Evidence Retention Lifecycle

- **Active Review Window (0–7 days)**: Full evidence records with raw snapshot digests are held in active cache for replay and human operator adjudication.
- **Audit Archival (8–90 days)**: Redacted audit records and SHA-256 digests are retained in immutable storage for regulatory reporting.
- **Purge / Expiry (> 90 days)**: Expired evidence feeds are purged. Cryptographic hashes and final publish verdicts remain for non-repudiation.
