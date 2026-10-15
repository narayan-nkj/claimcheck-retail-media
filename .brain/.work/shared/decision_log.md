# Decision Log

| Date | ID | Decision | Rationale | Affected Phases | Owner |
|---|---|---|---|---|---|
| 2026-10-16 | DEC-001 | Narrow claim scope strictly to 4 factual classes (`PRICE_DISCOUNT`, `AVAILABILITY`, `SHIPPING_PROMISE`, `PRODUCT_ATTRIBUTE`) | FTC substantiation and retailer compliance requirements require objective documentary evidence. Subjective claims and out-of-scope assertions must fail-closed to `REVIEW`. | Worker 01 (P-01..P-03), Worker 02 (P-02), Worker 03 (P-01) | Worker 01 |
| 2026-10-16 | DEC-002 | Enforce strict schema validation (`.strict()`) on all domain contracts | Disallowing extraneous properties prevents prototype pollution, hidden payload smuggling, and untracked attribute hallucinations. | All Worker 01 phases, Worker 02, Worker 03 | Worker 01 |
| 2026-10-16 | DEC-003 | Three-tier fail-closed verdict taxonomy (`ALLOW`, `REVIEW`, `BLOCK`) | `ALLOW` is only granted when all extracted claims have corroborating, fresh evidence. Any `BLOCK` forces overall `BLOCK`; empty or ambiguous claims force `REVIEW`. | Worker 01 (P-01, P-03), Worker 03 (P-01) | Worker 01 |
| 2026-10-16 | DEC-004 | Canonical JSON serialization + SHA-256 for `replayDigest` | Guarantees deterministic, tamper-evident audit logs across different platforms and runtimes. | Worker 01 (P-01, P-04), Tester 02 | Worker 01 |
| 2026-10-16 | DEC-005 | Dual-representation contracts: TypeScript Zod + JSON Schema Draft 2020-12 | Provides type safety and runtime validation in Node.js while enabling grammar-constrained decoding (Outlines/vLLM) on AMD hardware for Worker 02. | Worker 01 (P-01), Worker 02 (P-01, P-02) | Worker 01 |
