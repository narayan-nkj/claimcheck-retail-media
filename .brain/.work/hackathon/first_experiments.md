# First Experiments and Go/No-Go Gates

These experiments come directly from the repository-grounded readiness report and are ordered by risk reduction.

## E1 — AMD smoke test and workload provenance

Run a real ClaimCheck inference/validation path on approved AMD infrastructure. Pass only when execution is repeatable, visible in the product, and backed by saved provenance.

## E2 — Claim/evidence decision matrix

Create 20–30 synthetic cases across exact match, stale, conflicting, missing, paraphrased, unsupported superlative, ambiguous/implied, and out-of-scope claims. Pass only with deterministic expected outcomes and zero false accepts for the curated safety set.

## E3 — Replayable audit artifact

Record input copy, claim span, normalized claim, evidence IDs, source/timestamp/expiry, policy version, model/runtime metadata, verdict, and reason. Pass only when replay produces the same decision.

## E4 — Comparator boundary demo

Explain how ClaimCheck complements feed-quality, moderation, placement-safety, and generic guardrail tools without claiming replacement. Pass only when the distinction is understandable in the presentation.

## E5 — Usability and business-action test

Give a merchant/operator failed cases and verify that the interface answers what failed, why, what evidence is missing/stale/conflicting, and what action to take. Pass only when the user can resolve or route the issue quickly.
