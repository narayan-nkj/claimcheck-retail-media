# AMD Developer Hackathon ACT III / A074 — Initial Repository-Grounded Readiness Report

**Assessment date:** 13 October 2026  
**Scope:** Initial readiness synthesis from the supplied source findings and workspace inspection; not an implementation review, legal opinion, or confirmation of access.  
**Requested project context:** A074, apparently aimed at a commerce/ad-creative evidence and readiness checker. Track placement remains a team decision, not organizer approval.

> **Bottom line:** The concept has a credible, narrow differentiation if it is demonstrated as a **fail-closed pre-publication gate for defined factual commerce claims**, linking each claim to current, sourceable merchant evidence and routing stale, conflicting, unsupported, or ambiguous cases to human review. However, the repository and implementation are currently unverified: no Git repository, source files, tests, AMD account/quota/endpoint, or Evolus workspace were found or connected. With the stated event window of **12–18 October 2026** and the current date of **13 October 2026**, this is a timing-pressure situation, not evidence that the ordinary submission cutoff has passed. A go decision is justified only for a tightly scoped proof slice, conditional on an AMD smoke test and reproducible evidence artifacts within the first day.

## 1. Executive decision

### Current verdict: **CONDITIONAL GO for a six-day proof sprint; NO-GO for a broad production claim**

- **Go condition:** Build and demonstrate one narrow, deterministic end-to-end path: structured merchant/catalog evidence + generated ad copy → extract a small defined set of claims → compare them with timestamped evidence → produce **PASS / REVIEW / BLOCK** decisions with reasons, evidence references, freshness, and a replayable audit artifact.
- **Non-negotiable gate:** Verify that a meaningful workload actually runs on an approved AMD environment and is present in the working product demonstrated to judges. A screenshot or unsupported assertion of AMD use is insufficient under the event requirements.
- **Do not promise:** Universal legal compliance, complete implied-claim detection, automatic clearance of arbitrary advertising, live merchant integrations, market adoption, or production readiness.
- **Confidence:** **Medium for the product/evaluation direction; low-to-medium for event execution readiness** because implementation, access, team eligibility, and exact submission cutoff are unknown.

## 2. What was inspected, and what was not available

### Exact workspace/repository inspection

The supplied workspace inspection found:

- **`/home/ubuntu/`** — inspected as the available workspace root; no Git repository was found.
- **No project implementation files** were found beyond the user-supplied master prompt/source findings.
- **No tests, package manifests, lockfiles, deployment configuration, README, public repository, or demo application** were available to verify.
- **No connected AMD Developer Cloud account, AMD GPU quota, model endpoint, ROCm environment, or model compatibility** was verified.
- **No connected Evolus workspace, kickoff code, vLLM endpoint, API credentials, or platform usage** was verified.
- **Shared replay URL:** [https://manus.im/share/cIo2L2rjImcKgHgiX6pOJD](https://manus.im/share/cIo2L2rjImcKgHgiX6pOJD). It displayed only “Manus task replay completed” with “Watch again” / “Try it yourself”; it did not expose source code or further instructions.

These are **confirmed inspection results**, not claims that no implementation exists elsewhere. No source repository URL or project directory was supplied for additional verification.

### Evidence taxonomy used in this report

| Label | Meaning |
|---|---|
| **Confirmed** | Directly stated in the supplied findings or directly observed in the workspace/replay inspection. |
| **Inference** | A bounded conclusion drawn from confirmed facts; useful for planning but not itself source evidence. |
| **Assumption** | A working design or planning assumption that must be validated. |
| **Unknown** | Not established by the inspected sources or workspace; do not convert it into a product claim. |

## 3. Event and eligibility readiness

### Confirmed event facts

- The official event page describes an **online build phase from 12–18 October 2026** and a selected-participant onsite phase on **17–18 October 2026** in Rome, Milan, and Imperia. Travel and accommodation are not covered. It advertises a **$12,000+ prize pool** and free **$100 AMD credits for new members**, but credit eligibility and use details beyond that statement are unknown. ([official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii))
- The four tracks are **Intelligent Industry; Health and Wellbeing; Reinvent Commerce; Create a New Kind of Experience**. A074 is a plausible **Reinvent Commerce** entry, but this is not organizer-approved track selection. The commerce description calls for a real customer/merchant problem, a useful commercial action, and a demo translating customer or business data into a recommendation/action. If predicting demand, sales, or customer behavior, the event says to explain the calculation and not use an LLM as the sole forecasting method. **Forecasting is not required merely by choosing this track.** ([official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii))
- **AMD is required for prize eligibility.** A meaningful part of the workload must run on AMD infrastructure/hardware, and the AMD component must be in the working product demonstrated to judges. The page lists AMD Developer Cloud, Instinct, ROCm, Ryzen AI, Radeon, or other approved AMD-powered infrastructure. ([official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii))
- The main judging criteria are **Application of Technology, Presentation, Business Value, and Originality**. The reviewed page provides no numerical weights. ([official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii))
- The event materials name a project title, short and long descriptions, selected challenge, technology tags, working prototype, cover image, demo/video presentation, pitch/slide presentation, and clear problem/intended-user explanation. The app/repository checklist names a public GitHub repository, demo application platform, and application URL. The linked rulebook specifies a 16:9 PNG/JPG cover, mandatory MP4 video and PDF slides, public GitHub repository, demo platform, and app URL. ([event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii); [general rulebook](https://lablab.ai/hackathon-rules))
- Participants must sign up for the **AMD AI Developer Program** to be approved for the hackathon. This is distinct from the advertised new-member credit offer. ([official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii))
- The linked rulebook requires originality and MIT-compliant submissions. How that applies to every dependency or project asset is not established by the reviewed sources. ([general rulebook](https://lablab.ai/hackathon-rules))

### Deadline discrepancy and timing pressure

- The event page says the online phase ends **18 October**, but the reviewed page and rulebook do **not** expose an explicit ordinary submission cutoff time or time zone.
- The rulebook's six-hour manual-submission provision applies only for valid reasons and prior organizer/mentor approval; it is **not** evidence of the ordinary deadline.
- Therefore, **13 October 2026 is a planning constraint with roughly six calendar days remaining in the stated window, not proof that a deadline has passed**. Confirm the live submission form or organizer announcement before allocating the final hours.

### Evolus optional track

The official event material describes Evolus as an optional partner track/prize, potentially combinable with the main challenge prize. Its stated requirements include a free event workspace using the kickoff code; the team's open model served through its own vLLM endpoint on AMD Developer Cloud; at least two Evolus building blocks; API-driven use; a containerized app; a public GitHub repository; a runnable README; and no committed API keys. Evolus reviews workspace configuration and usage statistics, including endpoint, blocks, and API calls. The workspace is stated as free through 31 October 2026 for up to six members with 50,000 platform credits. ([official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii))

The same material says document reading, AI Tools, and knowledge indexing run on Evolus and consume workspace credits; these workloads must **not** be attributed to AMD. Evolus requirements and actual access remain **unknown until verified in use**.

## 4. Product proposition and narrow differentiation

### Working product definition (inference, not an implemented capability)

A074 should be framed narrowly as:

> **A pre-publication evidence gate for selected factual commerce claims in ad copy. It extracts only claims the system is designed to recognize, compares them with timestamped merchant/catalog/offer/shipping evidence, and returns a fail-closed decision with citations and an auditable reason. Ambiguous or unsupported cases go to human review rather than being declared compliant.**

Example supported claim classes for the first slice:

1. **Price / discount:** advertised price or discount matches the approved offer record.
2. **Availability:** “in stock” or equivalent matches a current inventory/status record.
3. **Shipping promise:** a stated delivery or dispatch promise is supported by a dated fulfillment record and applicable operational assumptions.
4. **Product attribute:** named size, color, material, or feature exists in the approved catalog record.

This is deliberately narrower than “AI legal compliance,” “brand safety,” or “fact-checks every ad.”

### Strongest evidence for the product

- FTC materials support having a reasonable basis before disseminating objective express or implied advertising claims, and emphasize that evidence requirements depend on the claim and context. They support evidence records and escalation, but do not establish that structured-field matching alone is legally sufficient. ([FTC advertising substantiation policy](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation); [FTC small-business advertising FAQ](https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business))
- FTC merchandise-order guidance supports checking shipping representations against anticipated demand, supply, fulfillment capacity, and records. This is shipment guidance, not a universal requirement that all ads state a date or that a checker satisfies seller duties. ([FTC rule summary](https://www.ftc.gov/legal-library/browse/rules/mail-internet-or-telephone-order-merchandise-rule); [FTC business guide](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule))
- UK CAP Code Section 3 says marketers must hold documentary evidence before distributing or submitting objective claims and addresses misleading claims and material omissions. The ASA notes overall consumer impression and says its advice is not legal advice. ([CAP Code Section 3](https://www.asa.org.uk/type/non_broadcast/code_section/03.html); [ASA misleading advertising advice](https://www.asa.org.uk/advice-online/misleading-advertising.html))
- Google documents product price/availability fields, landing-page consistency checks, diagnostics, policy review, disapproval, and AI-content metadata. The reviewed documentation does **not** establish claim-by-claim matching of generated copy to timestamped stock or offer evidence. ([Google product data specification](https://support.google.com/merchants/answer/7052112?hl=en); [Merchant Center issues](https://support.google.com/merchants/answer/12153802?hl=en); [automatic updates](https://support.google.com/merchants/answer/12157888?hl=en); [misrepresentation policy](https://support.google.com/merchants/answer/6150127?hl=en); [AI-generated content requirements](https://support.google.com/merchants/answer/14743464?hl=en))
- Amazon documents ad moderation, unsupported-claim policy controls, product metadata, inventory/buyability states, and pre-moderation. Its materials do not establish a universal independent evidence snapshot for every factual sentence. ([Amazon ad review](https://advertising.amazon.com/help/GJ7L9LZCWSGTX8GS); [claims and substantiation](https://advertising.amazon.com/help/G6UU66YLSCUYDULQ); [unified pre-moderation](https://advertising.amazon.com/API/docs/en-us/guides/moderation/pre-moderation); [product metadata](https://advertising.amazon.com/API/docs/en-us/product-metadata); [computed status](https://advertising.amazon.com/API/docs/en-us/reference/concepts/computed-status))

### Strongest evidence against overclaiming / product boundaries

- IAS documents pre-bid brand-safety/suitability and post-bid media-quality verification. It is adjacent to placement/context and impression verification, not evidence of copy-claim substantiation against merchant facts. ([IAS approach](https://integralads.com/insider/approach-to-brand-safety-suitability/); [IAS ad verification](https://integralads.com/solutions/ad-verification/))
- DataFeedWatch documents feed mapping, field rules, categorization, diagnostics, and channel-readiness review. The reviewed material does not establish semantic parsing of campaign prose, claim-to-evidence entailment, freshness/expiry evaluation across external sources, or a deterministic publish/block gate. ([Feed Review](https://www.datafeedwatch.com/blog/feed-review); [feed rules](https://www.datafeedwatch.com/blog/google-merchant-feed-rules-datafeedwatch); [upload workflow](https://www.datafeedwatch.com/blog/upload-product-feed))
- Guardrails AI documents structured outputs, validators, pass/fail results, and on-fail actions. The reviewed documentation does not establish merchant-authority binding, timestamped freshness rechecks, or a built-in human approval queue. ([Guardrails overview](https://guardrailsai.com/guardrails/docs); [validators](https://guardrailsai.com/guardrails/docs/concepts/validators); [structured data](https://guardrailsai.com/guardrails/docs/how-to-guides/generate_structured_data); [on-fail actions](https://guardrailsai.com/guardrails/docs/concepts/validator_on_fail_actions))
- The FTC Fashion Nova release describes allegations resolved through a stipulated settlement/final order; it must not be presented as a contested-trial finding or as a general one-day shipping rule. ([FTC 2020 release](https://www.ftc.gov/news-events/news/press-releases/2020/04/fashion-nova-will-pay-93-million-consumer-refunds-settle-ftc-charges-it-violated-rules-shipping))

### Differentiation statement

**Narrow differentiation:** Unlike feed-quality tools, placement-safety systems, generic LLM validators, and platform moderation, A074 can show a **claim-level chain of custody** for a bounded class of commerce claims: *copy span → normalized claim → source record → evidence timestamp/expiry → deterministic decision → reviewer/action*. This is a design hypothesis to prove, not an established market or technical fact.

The differentiation is strongest when the demo visibly fails closed on stale or contradictory evidence and produces a useful audit artifact. It is weakest if the demo is only a text-generation wrapper, a generic “truth score,” or a legal-compliance claim.

## 5. Capability readiness taxonomy

| Capability | Status | Evidence / implication |
|---|---|---|
| Narrow claim extraction | **Unknown / first experiment** | No implementation exists in the inspected workspace. Must constrain claim grammar and measure extraction precision/recall. |
| Structured evidence matching | **Unknown / first experiment** | FTC, CAP, Google, and Amazon sources support the rationale for evidence-based checks; none validates this implementation. |
| Timestamp/freshness enforcement | **Unknown / first experiment** | Required for differentiation; source findings do not show an existing project mechanism. |
| Fail-closed PASS / REVIEW / BLOCK decision | **Unknown / first experiment** | Must be explicit and replayable; do not equate a model confidence score with clearance. |
| Human-review handoff and audit trail | **Unknown / required design** | Sources support escalation conceptually; no reviewer workflow is available. |
| AMD workload in demonstrated product | **Unverified blocker** | Event requirement is confirmed; account, quota, endpoint, compatibility, and actual execution are unknown. |
| Evolus integration | **Optional and unverified** | Requirements are documented; workspace and vLLM access are unknown. Keep it out of the critical path until AMD core path works. |
| Live Google/Amazon/merchant integrations | **Unknown** | Official platform docs describe controls, not this team's credentials or access. Use synthetic fixtures for the first proof. |
| Legal/compliance determination | **Not a product capability** | Human/legal review remains necessary for implied claims, omissions, context, jurisdiction, and specialized claims. |
| Forecasting | **Not required for initial concept** | Avoid unnecessary demand/sales prediction; if added later, document a non-LLM calculation and evaluation. |
| Public repo/demo/submission package | **Not started / unverified** | No repository or app URL was found. Event materials require these artifacts. |

## 6. Top five first experiments

Prioritize experiments that reduce the largest go/no-go uncertainties, not breadth.

### Experiment 1 — AMD smoke test and workload provenance

**Question:** Can the actual product run a meaningful inference or validation workload on an approved AMD environment, and can the team capture proof?

- Run one small, deterministic model/validator path on AMD Developer Cloud/approved AMD hardware.
- Capture environment identity, AMD GPU/device information, ROCm/runtime versions where applicable, model/endpoint identity, request/response timestamp, and a short screen recording or logs.
- Repeat the same fixture locally or on a non-AMD fallback only for comparison; do not present fallback execution as satisfying AMD eligibility.
- **Pass:** AMD execution is repeatable, visible in the working demo path, and produces a saved proof artifact.
- **Fail:** No account/quota/endpoint, incompatible model, or inability to capture provenance. Escalate immediately; narrow the demo or stop the AMD-dependent plan.

### Experiment 2 — Claim/evidence decision matrix

Create 20–30 synthetic ad/evidence cases across price, discount, availability, shipping, and product attributes:

- exact match;
- stale evidence;
- conflicting evidence;
- missing evidence;
- paraphrase with supported fact;
- unsupported superlative;
- ambiguous/implied claim;
- out-of-scope claim.

**Pass criterion:** deterministic expected outcomes for the defined grammar, with no “PASS” for missing, stale, or contradictory evidence. Record false accepts and false rejects by class.

### Experiment 3 — Replayable audit artifact

For every decision, emit a human-readable record containing input copy, extracted span, normalized claim, evidence IDs, source/timestamp/expiry, comparison result, policy version, model/runtime metadata, final decision, and reason. Test replay from the same fixture to the same result.

**Pass criterion:** a judge can inspect one artifact and understand why a claim was allowed, routed, or blocked without relying on an opaque score.

### Experiment 4 — Comparator boundary demo

Use one or two documented platform controls as context, not as a live integration claim:

- demonstrate that a feed-quality or platform policy check can report structured data issues;
- demonstrate the distinct A074 check on generated copy against a supplied evidence snapshot.

**Pass criterion:** the presentation clearly shows complementarity and does not claim replacement of Google, Amazon, IAS, DataFeedWatch, Guardrails, legal review, or platform moderation.

### Experiment 5 — Usability and business-action test

Give a hypothetical merchant/operator five failed cases and observe whether the output answers: **what claim failed, which evidence is missing/stale/conflicting, what action should the operator take, and can the claim be safely revised?**

**Pass criterion:** a user can resolve or route the issue in under a few minutes using the evidence artifact; otherwise reduce scope and improve explanations before adding integrations.

## 7. AMD smoke test, proof artifacts, and fallback

### Required smoke-test path

1. Confirm AMD AI Developer Program/hackathon approval and available AMD Developer Cloud account/quota or another approved AMD target.
2. Confirm the selected model/runtime is compatible with the target; record the exact endpoint or execution environment.
3. Run a small workload that is genuinely part of the product: for example, claim extraction or normalization followed by the evidence decision path. Do not run an unrelated hello-world workload and call that product integration.
4. Capture repeatable output on at least one pass case and one fail/review case.
5. Save provenance and replay artifacts in the repository, excluding keys and personal credentials.

### Minimum proof package

- `README` section: AMD target, why the workload is meaningful, setup, command, expected output, and limitations.
- Sanitized runtime log with timestamp, target/device, ROCm/runtime or service metadata, model/endpoint, request hash or fixture ID, and response hash.
- Screenshot or short MP4 showing the working product path and AMD execution evidence.
- Synthetic fixture and expected-decision file so a reviewer can replay the result.
- One audit artifact linking the copy claim to evidence and decision.
- Dependency/license inventory consistent with the MIT-compliant submission requirement; do not commit API keys.

### Fallback if AMD access fails

- **Do not claim AMD compliance.** Record the failed access/compatibility attempt and immediately contact organizers/mentors or the relevant AMD program channel.
- Keep developing against a local/synthetic stub or non-AMD environment only as a **development fallback**, clearly labeled as such.
- If access is restored, rerun the exact same fixture on AMD and replace the proof artifact with real provenance.
- If AMD cannot be verified before the submission decision point, the honest verdict is **no-go for prize eligibility**, even if the product concept works.

## 8. Smallest credible end-to-end slice

### User story

A merchant operator pastes an ad draft for one product and supplies a small approved evidence bundle. The system checks four bounded factual claim classes and returns a publication recommendation with evidence.

### Inputs

- One product record: SKU, title, attributes, price, availability, and last-updated time.
- One offer/shipping record: discount, dispatch/delivery promise, fulfillment capacity/status, timestamp, and expiry policy.
- One ad draft containing two or three claims, such as “20% off,” “in stock,” and “ships in two days.”

### Processing

1. Extract only supported claim types; label unsupported or ambiguous language as **REVIEW**, not as fact.
2. Normalize values and units.
3. Match each claim to an approved evidence record.
4. Check exact/allowed tolerance, freshness, and conflicts.
5. Produce per-claim and overall decisions.

### Outputs

- **PASS:** all supported claims match fresh, non-conflicting evidence.
- **REVIEW:** ambiguous, implied, unsupported, missing, or out-of-scope claim; human review required.
- **BLOCK:** explicit contradiction, stale evidence where the policy requires current evidence, unavailable offer, or known mismatch.
- Evidence panel and downloadable JSON/Markdown audit record.

### Explicit non-goals

No arbitrary legal conclusion, no universal implied-claim interpretation, no live ad publishing, no demand forecasting, no broad platform integration, and no claim that the system replaces compliance counsel or platform moderation.

## 9. Six-day plan adjusted for 13 October 2026

The plan assumes the stated online build window ends 18 October, but the ordinary submission cutoff remains unknown. Treat the end of each day as a decision checkpoint.

| Date | Must accomplish | Exit evidence / decision |
|---|---|---|
| **13 Oct (today)** | Confirm team/event eligibility, track intent, live submission fields/cutoff, AMD access request/status, and source-of-truth product scope. Run AMD smoke test immediately. Freeze four claim classes and synthetic schema. | AMD pass with provenance, or documented blocker/escalation. One-page scope and 20–30-case fixture matrix. If no AMD path by end of day, escalate/no-go review. |
| **14 Oct** | Implement/build the narrow extraction + deterministic evidence matcher and PASS/REVIEW/BLOCK outputs. Create replayable audit artifact. | All fixture cases produce expected decisions; no secrets in artifacts. |
| **15 Oct** | Put the AMD workload in the demonstrated product path; add freshness/conflict handling and a minimal operator-facing view. | End-to-end screen recording on AMD for pass and fail/review cases. |
| **16 Oct** | Run reproducible evaluation, error analysis, and usability test. Tighten claims and documentation; prepare public-repo README and dependency/license review. | Metrics table, known limitations, replay instructions, and a stable demo build. |
| **17 Oct** | Freeze feature scope. Record final demo/video, cover image, pitch/slides, and proof artifacts. Validate public repo/demo URL and submission checklist. | Submission package is complete except any still-unknown live form fields; no new integrations. |
| **18 Oct** | Submit as early as the live form permits; retain confirmation. If selected for onsite, use the same frozen story and artifacts. | Submission receipt or documented organizer guidance. Do not rely on the six-hour exception without prior approval. |

**Parallel but non-critical:** Explore Evolus only after AMD core path passes. If used, verify the own-vLLM-on-AMD requirement, two building blocks, API-driven calls, container, runnable README, workspace usage statistics, and no committed keys. Do not spend the critical path on optional partner integration before the main proof works.

## 10. Reproducible synthetic evaluation plan

### Dataset design

Create a versioned, synthetic dataset with no real customer personal data. Each case includes:

- `case_id`, product/offer IDs;
- ad copy and expected claim spans;
- normalized expected claims;
- evidence records with source, timestamp, expiry, value, and authority label;
- expected per-claim decision and rationale;
- difficulty/category tags.

Use at least 40 cases for the final report if time permits, with a minimum balanced set across:

| Category | Required examples |
|---|---|
| Supported | Exact and paraphrased price, discount, availability, attribute, shipping claims. |
| Stale | Evidence older than the configured freshness window; boundary at expiry. |
| Conflicting | Copy, catalog, offer, and landing-page-like fixtures disagree. |
| Missing | Claim has no evidence record. |
| Ambiguous/implied | “Best,” “fast,” “limited,” or context-dependent language. |
| Out of scope | Health, competitor, environmental, or predictive claims not handled by the slice. |
| Adversarial formatting | Currency/units, percentages, negation, ranges, punctuation, and near-match values. |

### Metrics and acceptance gates

Report counts and confidence intervals where appropriate, not a single opaque score:

- **Claim extraction precision/recall/F1** for the supported grammar.
- **Decision accuracy** per class.
- **False-accept rate** for stale, contradictory, unsupported, or missing evidence. This is the most important safety metric; target **0 false accepts** on the curated gate set before demo freeze.
- **False-block/review rate** on clearly supported claims; investigate usability impact.
- **Evidence-link completeness:** percentage of PASS/REVIEW/BLOCK outputs with source ID, timestamp, and reason.
- **Replay determinism:** repeated runs on pinned fixtures produce the same decision and audit fields, or differences are explicitly explained.
- **Latency/cost:** measure the AMD path separately from any local fallback; do not generalize from synthetic timing to production.

### Reproduction instructions to include in the repo

- Fixture version/hash and expected-output version/hash.
- Environment/runtime/model/endpoint metadata.
- One documented command or UI sequence for replay.
- A sample sanitized result and audit record.
- Known nondeterminism and how it is controlled (temperature/seed/model version, where applicable).
- Clear statement that synthetic results do not prove legal compliance, production reliability, or market performance.

## 11. Questions requiring answers from the user or organizers

### User/team

1. What is the actual repository URL or project directory, if one exists outside `/home/ubuntu`?
2. What is the intended product name, team membership, and confirmed A074 track/challenge selection?
3. Does the team have AMD AI Developer Program approval, AMD Developer Cloud credentials, quota, and a usable model endpoint? Which AMD target is available?
4. Is there an existing implementation, demo, or test suite that should be inspected rather than rebuilt?
5. Which merchant evidence sources are authoritative for the demo: catalog, inventory, offer, shipping, landing page, or synthetic fixtures?
6. What claim classes and jurisdictions are intentionally in scope? Who provides human/legal review for ambiguous claims?
7. Is Evolus a required target for the team, or only an optional prize exploration? Is a workspace and kickoff code available?
8. Can the team publish a public GitHub repository and demo URL, and what dependencies/licenses are already selected?

### Organizers / platform

1. What is the **ordinary submission cutoff date, exact time, and time zone**, and where is it shown in the live form?
2. What qualifies as “meaningful” AMD workload, and what proof do judges expect for AMD Developer Cloud versus local AMD hardware?
3. Are AMD credits available to this team, and what are the actual eligibility, quota, expiration, and endpoint/model restrictions?
4. Is A074 formally assigned to Reinvent Commerce, or is the team free to select another track?
5. What exact character limits, required fields, public/private repository rules, and demo URL requirements appear in the logged-in form?
6. Does the optional Evolus track require a particular kickoff code, workspace configuration, vLLM image/model, or usage threshold?
7. How should teams handle a temporary AMD service outage or unavailable quota without misrepresenting execution?

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No AMD account/quota/compatible endpoint | Prize ineligibility and no credible demo | Run smoke test today; preserve fallback only as development; escalate early. |
| Deadline/cutoff unknown | Missed submission despite working demo | Inspect live form and ask organizers; submit early on 18 Oct or sooner. |
| Scope creep into “legal compliance” | Misleading claim and weak judging story | Use bounded factual claim classes; label human/legal review boundary. |
| LLM hallucination or opaque scoring | Unsafe false accepts | Deterministic normalization, evidence binding, fail-closed policy, replay artifacts. |
| Stale or conflicting merchant data | False clearance | Timestamp, expiry, authority, conflict checks; default to REVIEW/BLOCK. |
| Optional Evolus integration consumes critical time | Core submission incomplete | Gate Evolus work behind AMD/core-slice pass. |
| Source/dependency/license issue | Submission non-compliance | Public README, dependency inventory, MIT-compatible review, no committed secrets. |
| Synthetic demo overstates real-world capability | Credibility loss | Show synthetic scope and limitations prominently; do not claim live integrations/access. |

## 13. Source ledger and fact boundaries

### Official event sources

- [AMD Developer Hackathon ACT III official event page](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii) — event dates, tracks, AMD requirement, judging themes, submission components, AMD program signup, Evolus information; accessed 13 Oct 2026.
- [lablab.ai general hackathon rulebook](https://lablab.ai/hackathon-rules) — submission/media/repository rules and manual-submission exception; accessed 13 Oct 2026.
- [Shared replay URL](https://manus.im/share/cIo2L2rjImcKgHgiX6pOJD) — only completion screen observed; no source code or further instructions exposed.

### Regulatory and industry context

- [FTC advertising substantiation policy](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation)
- [FTC advertising FAQ for small business](https://www.ftc.gov/business-guidance/resources/advertising-faqs-guide-small-business)
- [FTC Mail/Internet/Telephone Order Merchandise Rule](https://www.ftc.gov/legal-library/browse/rules/mail-internet-or-telephone-order-merchandise-rule) and [business guide](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule)
- [FTC Fashion Nova 2020 release](https://www.ftc.gov/news-events/news/press-releases/2020/04/fashion-nova-will-pay-93-million-consumer-refunds-settle-ftc-charges-it-violated-rules-shipping) — allegations and stipulated settlement/final-order context; not a litigated factual finding.
- [IAB/MRC Retail Media Measurement Guidelines](https://www.iab.com/wp-content/uploads/2024/01/IAB_Retail_Media_Measurement_Guidelines_January2024.pdf) — retail-media measurement scope, not a copy-substantiation rule.
- [ASA misleading advertising advice](https://www.asa.org.uk/advice-online/misleading-advertising.html) and [CAP Code Section 3](https://www.asa.org.uk/type/non_broadcast/code_section/03.html) — UK non-broadcast advertising context and documentary substantiation requirement; advice is not legal advice.

### Platform and comparator sources

- [Google product data specification](https://support.google.com/merchants/answer/7052112?hl=en), [Merchant Center issues](https://support.google.com/merchants/answer/12153802?hl=en), [automatic updates](https://support.google.com/merchants/answer/12157888?hl=en), [misrepresentation policy](https://support.google.com/merchants/answer/6150127?hl=en), [Google Ads review](https://support.google.com/google-ads/answer/1722120?hl=en), [Google Ads misrepresentation policy](https://support.google.com/adspolicy/answer/6020955?hl=en), [disapproval/appeal flow](https://support.google.com/google-ads/answer/9338593?hl=en), [AI-generated content requirements](https://support.google.com/merchants/answer/14743464?hl=en).
- Amazon Ads: [ad review](https://advertising.amazon.com/help/GJ7L9LZCWSGTX8GS), [Sponsored Brands moderation](https://advertising.amazon.com/help/GJB8YEKP7UJYKSR2), [unified pre-moderation](https://advertising.amazon.com/API/docs/en-us/guides/moderation/pre-moderation), [claims and substantiation](https://advertising.amazon.com/help/G6UU66YLSCUYDULQ), [product metadata](https://advertising.amazon.com/API/docs/en-us/product-metadata), [product advertising guidance](https://advertising.amazon.com/library/guides/improve-your-products-for-advertising), [computed status](https://advertising.amazon.com/API/docs/en-us/reference/concepts/computed-status).
- [IAS brand safety/suitability approach](https://integralads.com/insider/approach-to-brand-safety-suitability/), [IAS brand safety/suitability](https://integralads.com/solutions/brand-safety-suitability/), [IAS ad verification](https://integralads.com/solutions/ad-verification/), [IAS open web](https://integralads.com/solutions/open-web/).
- [DataFeedWatch overview](https://www.datafeedwatch.com/), [Feed Review](https://www.datafeedwatch.com/blog/feed-review), [feed rules](https://www.datafeedwatch.com/blog/google-merchant-feed-rules-datafeedwatch), [upload workflow](https://www.datafeedwatch.com/blog/upload-product-feed), [categorization help](https://help.datafeedwatch.com/article/3fyv9bnmn2-3202730-adding-categories-using-categorize-products-tab), [AI optimization](https://www.datafeedwatch.com/blog/datafeedwatch-ai-optimization).
- [Guardrails AI overview](https://guardrailsai.com/guardrails/docs), [validator concepts](https://guardrailsai.com/guardrails/docs/concepts/validators), [structured data guide](https://guardrailsai.com/guardrails/docs/how-to-guides/generate_structured_data), [Guard API](https://guardrailsai.com/guardrails/docs/concepts/guard), [on-fail actions](https://guardrailsai.com/guardrails/docs/concepts/validator_on_fail_actions).

## Final stop/go checklist

### **GO** only if all are true

- [ ] Live submission cutoff and required fields are confirmed.
- [ ] Team/event approval and chosen track are confirmed.
- [ ] AMD account/quota/endpoint or approved hardware works.
- [ ] A meaningful AMD workload is in the working product path.
- [ ] AMD provenance artifacts are captured without secrets.
- [ ] Narrow fixture evaluation has zero curated false accepts for stale/conflicting/missing evidence.
- [ ] Every decision has a replayable evidence chain and a human-readable reason.
- [ ] Public repository, README, demo URL, video, slides, cover image, and dependency/license checks are ready.

### **STOP or re-scope** if any are true

- [ ] AMD use can only be asserted, not demonstrated.
- [ ] The demo depends on unavailable live merchant/platform credentials.
- [ ] The product story requires claiming universal legal compliance.
- [ ] The system passes unsupported, stale, or contradictory claims.
- [ ] The team cannot publish the required repository/demo/submission artifacts.
- [ ] The remaining time is insufficient to prove the narrow slice and package the evidence.

**Final assessment:** **Conditional GO** for a narrow, evidence-first commerce proof with immediate AMD verification. **No-go** for broad automation, live-integration promises, or prize eligibility until access and workload provenance are actually verified. This report records readiness gaps; it does not claim that an implementation, account, endpoint, workspace, market product, or legal-compliance result exists.
