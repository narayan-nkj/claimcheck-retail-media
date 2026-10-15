ClaimCheck — Retail Media Claim Checker

ClaimCheck is a prototype concept for checking selected factual claims in retail advertising copy against approved, timestamped product and offer data before publication.


Status: Early-stage project. Features and AMD runtime integration are planned and are not represented as implemented until verified in this repository.

Why

Retail ad copy may include claims about price, discounts, availability, shipping, or product attributes. ClaimCheck aims to help an operator review those claims by showing the supporting evidence and flagging missing, stale, conflicting, or ambiguous information.

Planned MVP

•
Select a sample product or campaign.

•
Generate or enter draft ad copy.

•
Check a small, explicitly supported set of factual claim types against synthetic product and offer data.

•
Return a clear result: ALLOW, REVIEW, or BLOCK, with reasons and evidence.

•
Save a replayable audit record for each decision.

•
If access is available, run the generation step on an approved AMD environment and document the actual model/runtime used.

Unknown or out-of-scope claims should be routed for human review rather than treated as verified.

Scope and limitations

The prototype is not legal advice, does not guarantee advertising-law compliance, and does not claim to detect every factual or implied claim. Synthetic demo data does not represent a live retailer integration. Human review remains important, especially for ambiguous claims, omissions, comparisons, and claims requiring legal or domain-specific judgment.

Getting started

Setup instructions will be added once the application structure and runtime are in place.

Bash


# TODO: Add install and run commands



Testing

Test instructions and a reproducible synthetic evaluation corpus will be added with the implementation.

Bash


# TODO: Add test command



AMD usage

AMD infrastructure is a project requirement for the hackathon submission. This section will document the verified AMD device or service, model, runtime, and reproducible command after the workload has been tested on that environment. Do not treat a local or non-AMD fallback run as proof of AMD execution.

Data and privacy

The planned demo uses synthetic or public data. Do not add private merchant/customer data, credentials, API keys, or tokens to the repository. Store secrets outside source control and provide only safe examples in configuration templates.

License

License to be decided before public release. Check all dependencies and included assets for compatibility with the event's submission requirements before publishing.

