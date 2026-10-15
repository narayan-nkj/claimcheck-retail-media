# ClaimCheck Contract Ownership, Versioning & Compatibility Policy

## 1. Scope & Authority

This document defines the schema ownership, versioning rules, compatibility guarantees, and migration policies for **ClaimCheck**.

### Workstream Ownership Matrix

| Contract / Schema | Authoritative Owner | Consumers | Tester Gate |
|---|---|---|---|
| `CatalogItemSchema` | Worker 01 | Worker 03 (UI/Demo), Tester 01 | Functional validation |
| `ClaimExtractionSchema` | Worker 01 | Worker 02 (vLLM AMD output), Worker 03 | Structured generation gate |
| `EvidenceReferenceSchema` | Worker 01 | Worker 02, Worker 03 | Provenance & freshness gate |
| `OverallCheckVerdictSchema` | Worker 01 | Worker 03 (Operator dashboard), Tester 01 | Decision correctness gate |
| `HumanReviewActionSchema` | Worker 01 | Worker 03 (Review workflow) | Human escalation gate |
| `AuditEventSchema` | Worker 01 | Worker 03, Tester 02 | Tamper-evident replay gate |

---

## 2. Versioning Specification

ClaimCheck schemas follow **Semantic Versioning (SemVer 2.0.0)**:

- **MAJOR (`X.0.0`)**: Incompatible changes.
  - Removing a field or enum value.
  - Adding a required field.
  - Altering the canonical digest calculation algorithm or hash format.
  - Modifying verdict composition logic (e.g., changing fail-closed precedence).
- **MINOR (`1.X.0`)**: Backward-compatible additive changes.
  - Adding optional fields.
  - Introducing new helper validators or descriptive metadata.
- **PATCH (`1.0.X`)**: Bug fixes or documentation corrections in schemas without changing validation outcomes.

---

## 3. Fail-Closed Contract Rules

1. **Strict Key Enforcement (`.strict()`)**:
   All schemas reject undeclared properties. This prevents attribute spoofing, hidden payload smuggling, and silent typos.
2. **Fail-Closed Defaulting**:
   - Empty claim extraction results in `REVIEW`, never `ALLOW`.
   - Stale evidence beyond `freshnessTtlSeconds` results in `REVIEW`, never `ALLOW`.
   - Any claim evaluated as `BLOCK` triggers an overall verdict of `BLOCK`.
   - Any unverified claim class is marked `OUT_OF_SCOPE` and escalated to human review.
3. **Digest Non-Repudiation**:
   Every `AuditEvent` requires a verified SHA-256 `replayDigest` calculated over recursively key-sorted canonical JSON. Any discrepancy invalidates the audit event.

---

## 4. Multi-Language & Multi-Worker Interoperability

- **TypeScript / Node.js**: Authoritative Zod definitions in `src/contracts/v1/`.
- **Python / vLLM (Worker 02)**: Pre-compiled JSON Schemas in `src/contracts/v1/schemas/` for JSON Schema guided decoding (Outlines / vLLM guided generation).
- **Frontend / React (Worker 03)**: Direct TypeScript type exports and runtime validators in `src/contracts/index.ts`.
