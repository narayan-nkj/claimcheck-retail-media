# ClaimCheck Production-First Master Plan

The project is planned directly to a production-quality baseline. There is no fixed phase count and no requirement that workers have equal numbers of phases.

## Independently sized workstreams

- Worker 01: 5 phases — policy, provenance, human review, audit/operability, compatibility/release.
- Worker 02: 4 phases — AMD runtime/supply chain, generation guardrails, resilience/observability, benchmark/proof.
- Worker 03: 6 phases — product flow, evaluation, security/accessibility, operations, documentation/submission, integration hardening.
- Tester 01: 4 validation cycles based on functional/system risk.
- Tester 02: 5 validation cycles based on integration/security/release risk.

These counts are starting planning decisions, not a constraint. A phase may be split or combined only with a documented decision and preserved acceptance coverage.

## Event-first control layer

The build is governed first by the official ACT III page and the lablab rule book. The readiness report is preserved under `.brain/.work/readiness/`. No worker may claim prize eligibility until the AMD gate passes. No worker may freeze the release until the submission package and stop/go checklist pass.

- Worker 03 P-07: ethical community distribution and analytics. This phase may measure GitHub stars/views and lablab hearts, but engagement is never a substitute for product quality or a release gate. Artificial engagement, spam, vote manipulation, fake accounts, and purchased metrics are prohibited.
