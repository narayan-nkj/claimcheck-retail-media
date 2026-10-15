# AMD Developer Hackathon ACT III — ClaimCheck Project Planning Prompt

## Purpose

Copy this prompt into a capable planning/research/coding agent after placing the project research archive in the repository. The agent must create a complete, traceable, execution-ready planning system for the AMD Developer Hackathon project **A074 — Retail Media Claim Checker**, working name **ClaimCheck**.

This version is intentionally specialized for the AMD project. It adapts the supplied generic orchestration prompt to the actual product thesis, AMD eligibility requirements, team constraints, evidence standards, hackathon delivery window, and the required `.brain/` planning artifact structure.

---

## 1. Role and mission

Act simultaneously as:

1. AMD Developer Hackathon ACT III strategy director and skeptical chief judge.
2. Product strategist for retail media, advertising operations, and merchant workflows.
3. Senior TypeScript/full-stack solution architect.
4. AI application and open-model serving architect familiar with vLLM and AMD infrastructure.
5. Advertising-claims and evidence researcher.
6. Deterministic-policy and fail-closed workflow architect.
7. Security, privacy, and abuse-case reviewer.
8. Evaluation scientist and measurement auditor.
9. UX and live-demo planner.
10. Technical writer and open-source release planner.
11. Red-team reviewer and hostile hackathon judge.
12. Execution-risk manager for a short student hackathon build.
13. Research orchestrator, QA planner, documentation architect, and release-readiness lead.

### Mission

Turn the available research into a complete, repo-ready **production-first planning system** for ClaimCheck. The planning system must enable a small team to build a production-quality, secure, observable, maintainable, and judge-ready web application within the real hackathon constraints.

Do not build the application during this planning task. Do not create application source code, runtime logic, deployment code, or production implementation outside the `.brain/` planning area. Create planning artifacts that are specific enough for workers to implement later without repeating the research and decomposition work.

The planning must be decisive. Preserve, narrow, or reject the product thesis based on evidence and implementation reality. Do not optimize for technical spectacle at the expense of a complete, reliable, demonstrable production-quality baseline.

---

## 2. Product thesis to validate

The proposed product is:

> An open model served through vLLM on AMD infrastructure generates retail advertising copy from approved product facts. A deterministic, evidence-backed policy gate checks defined factual claims against current catalog, inventory, shipping, discount, expiry, and policy data before publication. Unsupported, stale, ambiguous, or unverifiable claims are blocked or routed to a human. The verdict, evidence, timestamp, and reason are recorded in an audit log.

Treat this as a hypothesis, not as a proven requirement or implemented capability.

The planning must explicitly test whether the product should:

- remain ClaimCheck;
- narrow its supported claim classes;
- change the primary user or workflow;
- remove risky or unnecessary features; or
- pivot only if an evidence-backed blocker makes the current concept non-viable.

The preferred production baseline should show one simple end-to-end business action:

1. Generate or submit retail ad copy.
2. Extract only supported claim classes.
3. Compare claims with timestamped synthetic evidence.
4. Return `ALLOW`, `WARN`, `BLOCK`, or `HUMAN_REVIEW`.
5. Show cited evidence and the before/after copy state.
6. Record the decision in an NDJSON audit trail.

Do not claim to detect every factual claim. Define exactly which claim classes are parsed and tested. Unknown or ambiguous claims must go to human review rather than being silently approved.

---

## 3. AMD and hackathon constraints to verify

Before making planning decisions, verify the official event information from:

- https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii

Record the access date, verified facts, inaccessible information, and discrepancies in the planning artifacts. The following are supplied research inputs and must be rechecked rather than blindly trusted:

- Event: AMD Developer Hackathon: ACT III.
- Reported online build window: 12–18 October 2026.
- Reported selected-participant onsite phase: 17–18 October 2026 in Rome, Milan, and Imperia.
- Reported prize pool: $12,000+.
- Reported main tracks: Intelligent Industry, Health and Wellbeing, Reinvent Commerce, and Create a New Kind of Experience.
- ClaimCheck is intended for Reinvent Commerce if the current official page supports that track.
- AMD use is reportedly mandatory for prize eligibility.
- AMD must perform a meaningful workload in the working product shown to judges; a logo, README claim, hosting label, or unused deployment is insufficient.
- Reported judging dimensions include Application of Technology, Presentation, Business Value, and Originality.
- Reported submission materials include a title, short and long descriptions, selected challenge, technology tags, working prototype, cover image, demo video, slide presentation, public GitHub repository, demo platform, and application URL.
- AMD AI Developer Program enrollment and credit details must be verified from current official sources.
- Evolus is reportedly an optional partner award, not a replacement for a main track. Treat it as optional and do not let it endanger the core production baseline.

If any requirement is inaccessible or changes, label it `UNVERIFIED`, record the limitation, and plan a conservative fallback. Never convert an unverified event detail into a hard requirement without evidence.

### AMD workload requirement

The planning must define a concrete, inspectable AMD workload that is part of the product path, for example:

- open-model inference through vLLM on AMD Developer Cloud;
- a visible generation or verification step executed on the AMD endpoint;
- measured inference latency, throughput, or cost proxy;
- an offline fallback for development that is clearly labeled and never misrepresented as AMD execution.

The plan must specify how the team will prove AMD usage in the demo and documentation. Do not plan to use AMD only for hosting a static frontend.

### Commerce-track boundary

Do not add demand forecasting, sales forecasting, or customer-behavior prediction unless the plan includes a separately justified deterministic/statistical calculation and evaluation. ClaimCheck is primarily a claim-verification and publication-gating workflow, not a forecasting system.

### Optional Evolus boundary

Only plan Evolus integration if it is verified, available, and does not threaten the core production baseline. If included, the plan must document:

- the exact Evolus building blocks used;
- REST/API-driven usage;
- the containerized application requirement;
- the public repository and runnable README;
- the separation between Evolus work and AMD-hosted vLLM inference;
- workspace configuration and usage evidence;
- no committed secrets;
- a fallback path that still produces a complete AMD production baseline if Evolus is unavailable.

Do not imply that Evolus reading, AI tools, or knowledge indexing calls are AMD inference.

---

## 4. Team and execution assumptions

Treat the following as planning assumptions and verify them against current repository files:

- Team: PhantomDeps.
- Intended project: ClaimCheck.
- Student team with approximately six build days plus submission buffer.
- No enterprise or private data.
- Demo data must be synthetic, public, or mock data.
- Team can build web apps, APIs, dashboards, workflows, and lightweight AI integrations.
- Strongest known asset: PhantomDeps, a TypeScript fail-closed decision engine with `ALLOW`, `WARN`, and `BLOCK` logic, NDJSON audit logs, and an evaluation corpus with tests.
- PhantomDeps APIs and tests must be inspected before any reuse is planned.
- No feature may be credited to PhantomDeps unless the repository proves it exists.
- Known weak points: no computer-vision engineering, no RL fine-tuning, and limited ROCm/vLLM experience.
- Reported availability of AMD Developer Cloud credits and open models through vLLM must be verified before becoming a dependency.
- Team strategy: ship a tight, correct, observable, and demoable product rather than an over-ambitious platform.

If the repository contradicts any assumption, update the decision log, assumptions log, dependency graph, and workstream plan.

---

## 5. Planning-only scope boundary

### Allowed

Create or update only planning, research, QA, architecture, traceability, documentation, handoff, and merge-gate artifacts inside `.brain/`.

### Forbidden

Do not:

- build the ClaimCheck web application;
- create React, TypeScript, Python, API, database, or runtime source code;
- install or configure production dependencies;
- deploy services;
- create accounts or publish anything externally;
- commit secrets or real private data;
- overwrite the immutable research archive;
- fabricate benchmark results, event requirements, AMD execution, or completed implementation;
- represent mockups, designs, or planned tests as completed functionality.

Every planned capability must be labeled as one of:

- `IMPLEMENTED AND TESTED` — only if existing repository evidence proves it;
- `IMPLEMENTED BUT UNTESTED`;
- `DESIGNED ONLY`;
- `PROPOSED`;
- `ROADMAP`;
- `UNKNOWN`.

---

## 6. Source-of-truth inputs

Inspect all available inputs before planning:

- `.brain/.ORG_research/` — immutable raw research archive;
- `.brain/.research/` — refined research, findings, papers, and project analysis;
- `.brain/.demo/` — demo assets, demo instructions, or demo references;
- repository source, tests, fixtures, scripts, CI, configuration, and documentation;
- PhantomDeps source and test contracts, if present;
- existing `.brain/.work/` planning artifacts, if present;
- official AMD hackathon page and relevant official AMD/vLLM documentation;
- any supplied public research links.

Never overwrite `.brain/.ORG_research/`. If the archive is missing, say so clearly and create a blocked planning state rather than inventing research conclusions.

---

## 7. Evidence and truth rules

Apply these rules to research, event facts, architecture choices, metrics, demo statements, and planning decisions:

1. Verify the official event page before treating event requirements as facts.
2. Prefer sources in this order: official event or government source; official product documentation; academic, standards, or public-sector source; credible industry source; vendor marketing; anecdote.
3. Separate verified fact, source claim, team measurement, assumption, inference, and recommendation.
4. If a link is inaccessible, write `LINK INACCESSIBLE` and state exactly what could not be confirmed.
5. If a claim is unsupported, write `NOT VERIFIED BY SOURCE`.
6. Do not assume private data, unavailable datasets, proprietary APIs, model access, GPU quota, or partner access.
7. Do not treat candidate scores, self-reported win-fit ratings, or marketing claims as evidence.
8. Do not claim legal or advertising-law compliance. Plan a limitation statement: ClaimCheck is a prototype and not legal advice or a guarantee of compliance.
9. Do not claim universal claim detection. Unknown and ambiguous cases must be routed to human review.
10. Do not report accuracy, latency, cost, or error-reduction numbers until the test data, denominator, protocol, and execution environment are defined.
11. Do not quote more than 15 consecutive words from any source; paraphrase instead.
12. Preserve source URLs, access dates, confidence, and the planning decision affected by each source.

---

## 8. Mandatory repository-state check

Before creating or modifying any planning phase, inspect the current state:

- repository root and branch;
- `git status` and recent commits;
- existing `.brain/` structure;
- raw and refined research files;
- demo assets;
- existing work plans, reports, logs, merge files, and traceability matrix;
- PhantomDeps source, tests, and public contracts;
- current implementation versus design-only claims;
- any uncommitted user changes.

Do not overwrite or duplicate existing planning work without documenting the decision. If another update changes dependencies or scope, revise the plan before proceeding.

---

## 9. Research digestion requirements

Create a complete research index before designing workstreams. For every research file or meaningful research topic, record:

- source filename or identifier;
- topic and subtopic;
- source type and credibility tier;
- important findings;
- direct quote avoided or paraphrase used;
- relevance to ClaimCheck;
- production-baseline impact;
- production impact;
- implementation or architecture consequence;
- testing consequence;
- confidence and unresolved conflict;
- mapped planning artifact.

Identify:

- duplicate findings;
- contradictions;
- missing evidence;
- unsupported assumptions;
- event requirements that require re-verification;
- ideas intentionally excluded from the production baseline;
- research items that do not become code but still require a decision, assumption, acceptance criterion, test, or documentation item.

No research item may remain unmapped.

---

## 10. Required ClaimCheck Production Baseline

The planning must define a production-quality baseline with an explicit release cut line. The baseline must be small enough to ship but must not knowingly defer essential security, validation, observability, reliability, accessibility, privacy, or operational controls.

### Required production-baseline capabilities

- A merchant/operator submits product facts and candidate ad copy.
- The system uses an AMD-hosted open model to generate or revise copy.
- A deterministic checker parses only declared claim classes, such as:
  - availability or stock;
  - shipping or delivery promise;
  - discount or price;
  - expiry or promotion window;
  - selected product attributes where evidence is structured.
- Each claim is checked against timestamped synthetic catalog, inventory, shipping, promotion, and policy records.
- A verdict is returned: `ALLOW`, `WARN`, `BLOCK`, or `HUMAN_REVIEW`.
- Each verdict shows the matched evidence, timestamp, rule, reason, and stale-data status.
- Blocked or review-required copy cannot be treated as publishable.
- The user can see a before/after state change.
- Decisions are written to an NDJSON audit log.
- A small reproducible evaluation corpus demonstrates supported, unsupported, stale, contradictory, and ambiguous cases.
- The UI can be exercised reliably in a short recorded demo.

### Explicit non-baseline scope unless proven necessary

- universal legal compliance;
- autonomous publishing;
- real merchant integrations;
- private customer data;
- broad web crawling;
- computer vision;
- demand forecasting;
- RL or custom model training;
- complex multi-agent orchestration;
- unsupported claim classes;
- production-scale multi-tenant security;
- optional partner features that risk the core demo.

Every exclusion must be recorded with a reason, risk owner, mitigation, and traceability link.

---

## 11. Architecture and interface planning requirements

Define shared contracts before worker planning. At minimum, plan interfaces for:

- product/catalog evidence;
- inventory and timestamp freshness;
- shipping policy evidence;
- promotions and discount evidence;
- claim extraction output;
- claim normalization;
- deterministic rule evaluation;
- verdict and reason codes;
- human-review queue item;
- evidence citation;
- model-generation request/response;
- AMD inference metadata;
- NDJSON audit event;
- evaluation case and expected result;
- frontend/API boundary;
- error, timeout, and fallback behavior.

For each interface, specify:

- schema or field-level contract;
- owner;
- consumers;
- versioning rule;
- validation rule;
- failure behavior;
- test fixture requirement;
- merge-conflict risk.

The deterministic policy engine must remain the authority for publishability. The LLM may generate copy, extract candidate claims, or assist with fuzzy interpretation, but it must not override a failed rule or approve unsupported evidence.

Plan fail-closed behavior for:

- missing evidence;
- stale evidence;
- contradictory evidence;
- malformed model output;
- model timeout;
- unavailable AMD endpoint;
- unsupported claim type;
- low-confidence extraction;
- policy configuration error;
- audit-log write failure.

---

## 12. Dynamic production workstream model

Create **three worker workstreams and two tester workstreams**. Phase counts must be decided independently for each workstream and validation stream. Never force equal phase counts, identical phase names, or a fixed number such as three. Split work when production risk, dependency, or acceptance criteria require it; combine phases only when doing so does not weaken review or release quality. Each phase must have a clear gate and measurable exit criteria.

### Worker 01 — Core policy and evidence engine

Plan the deterministic claim model, evidence schemas, freshness rules, rule evaluation, verdict taxonomy, fail-closed behavior, and audit events. Prioritize reuse of PhantomDeps only after inspecting its real API and tests.

### Worker 02 — AMD model-serving and generation path

Plan the open-model/vLLM integration on AMD infrastructure, prompt and structured-output contract, timeout and fallback behavior, AMD execution evidence, latency measurement, and reproducible local/development fallback labeling.

### Worker 03 — Web application, evaluation, demo, operations, and release workflow

Plan the production-quality UI/API flow: submit or generate copy, inspect claims, view evidence, see verdict, route to human review, compare before/after, and inspect audit history. Own the synthetic-data strategy, evaluation corpus, metrics and denominator, threat/abuse review, API and UI reliability, accessibility, configuration, operational documentation, README, architecture documentation, demo script, presentation inputs, submission checklist, cross-module coordination, and final integration support. Split these into as many phases as the work requires; do not collapse security, observability, evaluation, or release readiness merely to match the other workers.

### Tester 01 — Functional and system validation

Plan deep validation of claim extraction, deterministic rules, evidence freshness, verdicts, fail-closed behavior, model path, UI flow, audit logging, and end-to-end scenarios.

### Tester 02 — Integration, regression, evidence, and release validation

Plan cross-module integration, regression, AMD proof, reproducibility, documentation, security/privacy, unsupported-claim handling, demo reliability, submission completeness, and judge-readiness.

Reassign boundaries if the research indicates a better decomposition, but document the reason and preserve the three-worker/two-tester operating model. If one worker becomes a bottleneck, split that worker's phases sequentially or move work to the best-aligned owner. Do not invent a fourth worker merely to equalize phase counts.

---



### Exhaustive execution and GitHub synchronization rule

Interpret “make the phases 1000 times deeper” as a requirement for **exhaustive production-grade decomposition**, not as a literal request to create redundant phases. Do not inflate the plan with duplicate paperwork. Instead, decompose every phase into atomic, reviewable steps until no material implementation, security, reliability, testing, documentation, handoff, or release risk is hidden.

Every atomic step must end with this sequence before the next atomic step begins:

1. Implement or document only that step’s scope.
2. Run the tests specific to that step.
3. Run relevant linting, type checks, schema checks, security checks, or documentation checks.
4. Fix failures before proceeding.
5. Update the phase report, decision log, risk register, traceability matrix, and handoff notes when affected.
6. Inspect the diff for secrets, generated noise, unrelated changes, and accidental user-file overwrites.
7. Create a small, descriptive Git commit for that atomic step.
8. Push that commit to the authorized GitHub remote and branch.
9. Record the commit hash, push result, test commands, test result, and remote/branch in the report.

A phase cannot be marked complete until every atomic step has its own test result and commit/push record, the phase-level test suite passes, the phase report is complete, and the phase handoff is updated. If GitHub access, remote configuration, branch protection, or push permission is unavailable, stop at the push gate, record the blocker, preserve the tested commit locally, and do not falsely report a successful push. Never push secrets, credentials, private data, unreviewed generated artifacts, failing tests, or unrelated changes.

Each phase file must therefore contain: atomic step IDs; step inputs and outputs; exact validation scope; expected test commands; security and privacy checks; documentation updates; commit message convention; push target; rollback procedure; and a final phase test-and-push gate.

---

## 13. Production-first delivery planning

The production baseline is the primary target. Any later expansion must be explicitly separated as post-baseline work.

### Production baseline planning

Plan directly for a production-quality baseline. Every worker must have its own dynamically sized delivery phases with:

- objective;
- inputs;
- scope;
- dependencies;
- outputs;
- shared contracts used;
- phase-level validation;
- acceptance criteria;
- risks and mitigations;
- handoff target;
- report mapping;
- traceability links;
- atomic step list with step-level tests;
- step-level commit and GitHub push record;
- phase-level test suite and release gate;
- rollback and recovery plan.

Create `merging_phase_production.md` only after all production-baseline planning is covered. It must state:

- included capabilities;
- excluded capabilities;
- integration points;
- interface alignment;
- tester gates;
- unresolved risks;
- remaining production work;
- production-baseline demo and release criteria.

### Production hardening and expansion

Do not treat security, observability, reliability, accessibility, privacy, auditability, evaluation, or operational readiness as optional enhancements. Plan them in the production baseline. Additional post-baseline work may include:

- security hardening;
- stronger authentication and authorization design;
- more robust policy configuration;
- performance optimization;
- better evidence versioning;
- broader claim classes;
- observability;
- accessibility polish;
- deployment hardening;
- additional regression coverage;
- partner integration after core stability.

Do not create an MVP-only shortcut that knowingly leaves production-critical gaps. Create `merging_phase_production.md` as the primary release gate and, if additional post-baseline phases are planned, create `merging_allphase_prod.md` for the later full-system gate.

---



### Ethical visibility and community-engagement rule

Plan a legitimate visibility workstream for the public GitHub repository and the lablab project page. The goal is to earn genuine GitHub stars, repository views, meaningful issues/discussions, demo visits, and lablab hearts through a useful README, working demo, clear video, strong project page, direct team/community outreach, mentor feedback, and transparent progress updates.

Never buy, automate, exchange, manipulate, or misrepresent engagement. Do not create fake accounts, use bots, click farms, vote rings, spam, mass unsolicited messages, duplicate submissions, or coordinated activity intended to distort judging or platform metrics. Follow the ACT III page, lablab rules, GitHub Terms, and community rules. Metrics are outcome indicators, not release gates and never substitute for product quality, AMD proof, or submission compliance.

Every visibility activity must record its date, channel, audience, message, destination URL, owner, consent/safety check, and measured result. Report GitHub stars and views and lablab hearts as observed platform metrics with an access timestamp; do not promise a target count or claim causation without evidence.

---

## 14. Testing and evaluation planning

Workers must test every atomic step and then run phase-level checks for their own scope. Testers plan comprehensive validation and must verify the step-level test, commit, and GitHub-push evidence before signing off.

### Required test categories

- unit and contract tests;
- supported-claim cases;
- unsupported-claim cases;
- stale evidence;
- contradictory evidence;
- ambiguous claim extraction;
- malformed model output;
- model timeout;
- AMD endpoint unavailable;
- missing evidence;
- policy configuration errors;
- audit logging failures;
- human-review routing;
- end-to-end operator flow;
- browser/UI error states;
- regression across modules;
- accessibility and responsive behavior;
- secrets and privacy review;
- reproducible evaluation corpus;
- demo reset and repeatability;
- README fresh-clone run-through;
- AMD workload proof.

### Metrics planning

Define metrics before any implementation claims, including:

- supported/unsupported claim decision accuracy;
- false-allow and false-block counts;
- stale-data detection rate;
- human-review routing rate;
- claim-extraction coverage for declared claim classes;
- model latency and end-to-end latency;
- evaluation corpus size and composition;
- denominator and exclusions;
- environment and model version;
- reproducibility steps.

Never plan a metric without a measurement protocol and a place to publish its limitations.

---

## 15. Demo and submission planning

The plan must produce a judge-ready demonstration that is understandable in approximately 30 seconds and repeatable in a few minutes.

Recommended demo sequence:

1. Show approved facts and current timestamps.
2. Generate or submit apparently plausible ad copy.
3. Show one stale, unsupported, or contradictory promise.
4. Show the claim-level verdict and cited evidence.
5. Show `BLOCK` or `HUMAN_REVIEW` and the before/after state.
6. Show the audit event.
7. Show AMD model inference evidence and one honest metric.

Plan:

- a short live demo path;
- a recorded-demo fallback;
- deterministic seeded data;
- reset instructions;
- failure recovery steps;
- screenshots or cover-image requirements;
- slide outline;
- short and long project descriptions;
- public GitHub and README checklist;
- application URL and demo URL checklist;
- technology tags;
- limitation statement;
- attribution and license notes.

No planned demo step may depend on an unverified external service without a fallback.

---

## 16. Required `.brain/` structure

Create only planning artifacts under `.brain/` and preserve existing research folders. At minimum, create:

```text
.brain/
  .ORG_research/
  .research/
  .demo/
  .work/
    README.md
    00_master_plan.md
    research_index.md
    traceability_matrix.md
    merging_phase_production.md
    merging_allphase_prod.md              # only if production planning is undertaken
    .report/
    shared/
      task_assignment.md
      dependency_graph.md
      interface_contracts.md
      acceptance_criteria.md
      conventions.md
      blocker_log.md
      decision_log.md
      assumptions.md
      merge_checklist.md
      test_matrix.md
      status_board.md
      source_register.md
      evidence_register.md
      risk_register.md
      demo_plan.md
      submission_checklist.md
    webapp/
      worker_01/
        role.md
        phase_index.md
        production_phases/
        prod_phases/
        handoff.md
        status.md
      worker_02/
        role.md
        phase_index.md
        production_phases/
        prod_phases/
        handoff.md
        status.md
      worker_03/
        role.md
        phase_index.md
        production_phases/
        prod_phases/
        handoff.md
        status.md
    testers/
      tester_01/
        role.md
        test_plan.md
        validation_log.md
        doc_updates.md
        signoff.md
      tester_02/
        role.md
        test_plan.md
        validation_log.md
        doc_updates.md
        signoff.md
```

Do not create application source code outside `.brain/` during this planning task.

---

## 17. Traceability requirements

Create a matrix mapping:

```text
research source/topic
→ verified finding or assumption
→ product decision
→ workstream
→ phase
→ interface or artifact
→ test/validation
→ report
→ MVP or production merge gate
```

The traceability review is not complete until:

- every raw and refined research file is represented;
- every material research topic is mapped;
- every excluded item has a documented reason;
- every phase has acceptance criteria and a report mapping;
- every tester validation has a signoff condition;
- every AMD/event requirement has evidence status;
- every major risk has an owner and mitigation;
- every planned capability has a maturity label.

---

## 18. Reporting and handoff requirements

Create report templates or mappings for every worker phase and tester validation cycle in `.brain/.work/.report/`.

Each report must include:

- title;
- date/timestamp placeholder;
- owner;
- phase or validation identifier;
- objective;
- planned work or validation;
- files/artifacts affected;
- dependencies;
- acceptance criteria;
- planned tests;
- expected results;
- blockers and assumptions;
- traceability links;
- handoff target;
- next steps;
- merge-gate impact.

Each handoff must include:

- completed planning scope;
- pending scope;
- files created or modified;
- dependencies and blockers;
- validation planned;
- expected results;
- report path;
- documentation updates;
- merge notes;
- recommended next action.

---

## 19. Quality gates

Before marking planning complete, verify:

- research was indexed before decomposition;
- the raw archive was not modified;
- all research items are mapped;
- event and AMD requirements have evidence status;
- ClaimCheck has a narrow but production-quality release cut line;
- AMD has a meaningful product-path workload;
- deterministic policy remains authoritative;
- unsupported and ambiguous cases route safely;
- shared interfaces are defined before parallel work;
- workstreams minimize coupling and merge risk;
- each phase has inputs, outputs, dependencies, tests, acceptance criteria, and handoff;
- testers have broad validation plans;
- reports and signoffs are mapped;
- every atomic step has a test and commit/push record;
- no phase is marked complete with an unverified GitHub push;
- demo and submission plans are executable;
- assumptions, blockers, decisions, and risks are recorded;
- documentation includes prototype/legal limitations;
- production-baseline merge gate is complete;
- the post-baseline merge gate exists only if additional expansion work is undertaken;
- the final planning summary is present.

When multiple options are valid, choose the simplest option that satisfies the production baseline without creating an unmanaged security, reliability, privacy, observability, or maintenance gap. Document the decision.

---

## 20. Final deliverables

At the end of this planning run:

1. Validate the entire `.brain/` structure.
2. Confirm that only planning artifacts were created or changed.
3. Confirm that `.brain/.ORG_research/` remains untouched.
4. Confirm research-to-plan traceability coverage.
5. Confirm all worker and tester files are present.
6. Confirm production-baseline merge planning is complete.
7. Confirm any post-baseline expansion is clearly separated from the production baseline.
8. Create a concise final planning report inside `.brain/.work/` covering:
   - completed planning artifacts;
   - evidence status;
   - selected production-baseline scope;
   - workstream assignments;
   - major risks and blockers;
   - unresolved verification tasks;
   - next implementation actions.
9. Compress only the `.brain/` directory into `.brain.zip`.
10. Ensure the zip contains the `.brain/` directory and its contents, with no unrelated files.

The final output of the planning run must be:

```text
.brain.zip
```

Do not claim that ClaimCheck is implemented. The result of this task is a complete, evidence-backed planning system from which the implementation team can safely begin.

---

## 21. Start now

Begin in this order:

1. Inspect repository state and all available inputs.
2. Read and index the research archive.
3. Verify the official AMD hackathon page and record discrepancies.
4. Inspect PhantomDeps and determine what is actually reusable.
5. Decide whether ClaimCheck remains the best project and define the narrow production baseline.
6. Create the `.brain/.work/` planning structure.
7. Build the source/evidence register, dependency graph, interface contracts, risk register, and traceability matrix.
8. Assign the three workers and two testers.
9. Decide the dynamic production phases independently for each worker and tester.
10. Create phase plans, report mappings, handoffs, tester plans, acceptance criteria, operational controls, and merge gates.
11. Create the demo and submission plan.
12. Run the planning quality gates.
13. Create `.brain.zip` containing only `.brain/`.

Be proactive, structured, evidence-based, decisive, and concise in status updates. Continue through the complete planning workflow unless blocked by a critical missing input. Document blockers instead of silently stopping.
