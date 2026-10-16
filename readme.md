# ClaimCheck — Retail Media Claim Checker

> **A deterministic, evidence-backed pre-publication verification gate for factual claims in retail advertising copy.**

[![Tests](https://img.shields.io/badge/tests-111%20passed-success.svg)](#testing)
[![AMD ROCm](https://img.shields.io/badge/AMD%20ROCm-6.2%20%7C%20MI300X-red.svg)](docs/amd/AMD_EXECUTION_PROOF.md)
[![Policy Latency](https://img.shields.io/badge/policy%20p95-29.4%20µs-brightgreen.svg)](#performance--benchmarks)
[![AMD Latency](https://img.shields.io/badge/AMD%20p95-0.24%20ms-brightgreen.svg)](#performance--benchmarks)
[![Throughput](https://img.shields.io/badge/throughput-53k%2B%20ops%2Fsec-blue.svg)](#performance--benchmarks)
[![Node.js](https://img.shields.io/badge/node.js-v24%2B-blue.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/AMD%20Developer%20Hackathon-ACT%20III-orange.svg)](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii)

ClaimCheck is a pre-publication evidence gate designed to prevent misleading, unverified, or outdated claims in retail media advertising before ads go live. It extracts factual assertions from ad copy using open-weights models on **AMD ROCm / Instinct MI300X** infrastructure, verifies them against timestamped, authoritative merchant data, and enforces a **fail-closed** verdict taxonomy (`ALLOW`, `REVIEW`, `BLOCK`) with immutable audit trails.

---

## 🌟 Why ClaimCheck?

Retail media networks and merchants face strict regulatory enforcement (such as FTC substantiation rules and UK CAP Code) and platform disapproval policies when ads contain inaccuracies regarding:
- **Price & Discounts**: Advertised prices differing from active checkout rates or exaggerated percentage-off claims.
- **Availability**: "In stock" promises for items that are depleted, backordered, or subject to regional stockouts.
- **Fulfillment & Shipping**: Unsubstantiated "Next-Day" or "Free Shipping" promises where carrier cutoffs or minimum spend thresholds are not met.
- **Product Attributes**: Technical or material assertions contradicting approved manufacturer specifications.

**The Architectural Solution:** Rather than relying on non-deterministic generative models to self-police, ClaimCheck enforces a strict architectural separation:
1. **Generative Model (served on AMD infrastructure)** extracts candidate factual claims.
2. **Deterministic Policy Engine** compares claims against authoritative, timestamped evidence.
3. **The AI model NEVER approves claims** — only corroborated, fresh evidence can grant publication approval (DEC-009).

---

## 🏗️ Architecture & Verification Flow

```mermaid
flowchart TD
    subgraph INTAKE["1. Ad Copy & AMD Extraction (Worker 02)"]
        A[Retail Ad Copy Input] --> SAN[Prompt Injection Sanitizer<br/>Clamp 2000 chars & strip injection]
        SAN --> B[Open LLM: Llama-3.1-8B-Instruct<br/>AMD Instinct MI300X / ROCm 6.2 / vLLM]
        B -->|Guided JSON Decoding| EXT[Schema-Constrained Claim Extractor]
        EXT -->|Zero Approval Gate DEC-009| C[Normalized Claims: Price, Stock, Ship, Attr]
    end

    subgraph EVIDENCE["2. Authoritative Evidence Feeds"]
        E1[(Catalog Database<br/>24h TTL)]
        E2[(Promotion Engine<br/>1h TTL / Expire)]
        E3[(Inventory Feed<br/>15m TTL)]
        E4[(Shipping Service<br/>12h TTL)]
        E5[(Operator Attestation<br/>7d TTL)]
        E1 & E2 & E3 & E4 & E5 --> F[Evidence Freshness & Precedence Engine<br/>Hierarchy: Operator > Promo > Inv > Ship > Cat]
    end

    subgraph ENGINE["3. Deterministic Policy Gate (Worker 01)"]
        C --> G{Contradiction & Freshness Check}
        F --> G
        G -->|Equal-Tier Conflict / Expired| REV_FEED[Fail-Closed: AMBIGUOUS_CLAIM / STALE]
        G -->|Fresh Corroborated Evidence| H[Deterministic Claim Rule Engine]
        REV_FEED --> V_REV
        H -->|All Claims Validated| V_ALLOW[ALLOW<br/>Clean Pass]
        H -->|Subjective / Near-Expiry| V_REV[REVIEW<br/>Needs Verification]
        H -->|Price Mismatch / Out of Stock| V_BLOCK[BLOCK<br/>Factual Violation]
    end

    subgraph WORKFLOW["4. Human Review & State Machine"]
        V_ALLOW --> SM_PASS[DETERMINISTIC_PASS]
        V_REV --> QUEUE[Human Review Queue<br/>Priority 1-100 & 15m-4h SLAs]
        V_BLOCK --> SM_BLOCK[REJECTED_BLOCK]
        
        QUEUE -->|Junior / Senior Approval| SM_OVR[OPERATOR_APPROVED_OVERRIDE]
        QUEUE -->|Confirm Block| SM_CONF[OPERATOR_CONFIRMED_BLOCK]
        SM_BLOCK -->|Senior Officer Audit Override| SM_OVR
        SM_BLOCK -->|Direct Publish Blocked| GUARD((Publication Guard))
        
        SM_PASS --> PUB[PUBLISHED to Retail Media Network]
        SM_OVR --> PUB
    end

    subgraph AUDIT["5. Immutable Audit & Observability"]
        PUB & SM_BLOCK & SM_CONF --> AUD[Canonical JSON + SHA-256 Digest]
        AUD --> CHAIN[Chained NDJSON Stream<br/>Merkle Forward Hash Linkage]
        CHAIN --> REPLAY[Historical Replay Engine<br/>Bit-for-Bit Determinism]
        CHAIN --> PROM[Prometheus Telemetry & Redacted Logs]
    end

    classDef allow fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef block fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef review fill:#fef9c3,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef guard fill:#fecaca,stroke:#b91c1c,stroke-width:2px,color:#450a0a;

    class V_ALLOW,SM_PASS,PUB allow;
    class V_BLOCK,SM_BLOCK,REV_FEED block;
    class V_REV,QUEUE,SM_OVR review;
    class GUARD guard;
```

---

## 📦 Implemented Modules & Architecture

### 1. Domain Models & Contracts (`src/contracts/v1/`)
- **Strict Fail-Closed Schemas**: All schemas use `.strict()` to reject undeclared fields, preventing payload smuggling and prototype injection.
- **Core Entities**:
  - `CatalogItem`: Versioned product specifications, pricing, inventory, and multi-tier shipping rules.
  - `ClaimExtraction`: 4 verifiable commerce claim classes (`PRICE_DISCOUNT`, `AVAILABILITY`, `SHIPPING_PROMISE`, `PRODUCT_ATTRIBUTE`) plus fail-closed `OUT_OF_SCOPE` routing.
  - `EvidenceReference`: Source-typed facts with snapshot timestamps, freshness TTLs, and SHA-256 digests.
  - `OverallCheckVerdict`: Composite status resolution with auditable reason codes.
  - `AuditEvent`: Cryptographically verifiable audit record with canonical JSON serialization and SHA-256 `replayDigest`.
- **JSON Schemas (`src/contracts/v1/schemas/`)**: Draft 2020-12 schemas for language-agnostic consumers (e.g. Outlines/vLLM structured output on AMD).

### 2. Evidence Freshness & Provenance (`src/evidence/`)
- **Configurable Freshness Windows (TTL)**:
  - Inventory: 15 minutes (900s)
  - Promotional Pricing: 1 hour (3,600s) or calendar expiry
  - Shipping Transit: 12 hours (43,200s)
  - Catalog Master: 24 hours (86,400s)
  - Operator Attestation: 7 days (604,800s)
- **Source Precedence Hierarchy**:
  `OPERATOR_ATTESTATION` (100) > `PROMOTION_ENGINE` (80) > `INVENTORY_FEED` (60) > `SHIPPING_SERVICE` (40) > `CATALOG_DATABASE` (20)
- **Contradiction Detection**: Equal-tier conflicts (e.g. Warehouse A says in stock, Warehouse B says out of stock) trigger `AMBIGUOUS_CLAIM` and route to `REVIEW`.
- **Cryptographic Provenance**: `EvidenceProvenanceRecord` tracks raw input SHA-256 digests and maintains an immutable chain-of-custody.
- **Privacy Sanitizer**: Automatic recursive redaction of API keys, bearer tokens, credit cards, emails, and confidential merchant keys.

### 3. Policy Engine & Review Workflow (`src/policy/`)
- **Factual Evaluator**: Deterministic logic comparing copy claims to evidence.
- **Publication State Machine**: 10 distinct states (`UNPROCESSED`, `EVALUATING`, `DETERMINISTIC_PASS`, `REJECTED_BLOCK`, `PENDING_HUMAN_REVIEW`, `OPERATOR_APPROVED_OVERRIDE`, `OPERATOR_CONFIRMED_BLOCK`, `ESCALATED_TO_LEGAL`, `PUBLISHED`, `ARCHIVED`) with transition guards preventing unverified release.
- **Human Review Queue & SLAs**:
  - Near-expiry flash deals: Priority **95/100**, **15-minute SLA**.
  - Price & stockout blocks: Priority **85–90/100**, **1–2 hour SLA** (requires `SENIOR_COMPLIANCE_OFFICER`).
  - Standard ambiguity: Priority **50/100**, **4-hour SLA** (`JUNIOR_OPERATOR`).
  - Role-based permissions guard against junior operators overriding factual blocks.

### 4. Security Audit, Replay & Telemetry (`src/audit/`)
- **Chained Audit Stream**: Forward Merkle link hashing (`previousDigest` + `replayDigest` &rarr; `chainDigest`) in NDJSON format for immutable compliance logs.
- **Historical Replay Engine (`replayHistoricalCheck`)**: Reconstructs past checks from immutable snapshots and validates bit-for-bit determinism and non-repudiation.
- **Observability & Structured Logging**: End-to-end `traceId` and `spanId` propagation with zero-overhead Prometheus metrics exporter and automated PII redaction.

### 5. AMD Model Serving, Structured Extraction & Guardrails (`src/inference/`)
- **Open-Weights Model**: `meta-llama/Llama-3.1-8B-Instruct` deployed under permissive commercial license on AMD Instinct MI300X.
- **AMD ROCm / vLLM Client (`AMDInferenceClient`)**: High-throughput inference client with native timeout controls (`AbortSignal.timeout(timeoutMs)`), correlation header injection (`X-Trace-Id`, `X-Span-Id`, `X-Correlation-Id`), and hardware device verification.
- **Structured Extraction (`extractClaims`)**: Schema-constrained parsing enforcing `ClaimExtractionSchema` across the 4 factual classes and `OUT_OF_SCOPE`.
- **DEC-009 Zero-Approval Enforcement**: Generative models extract claims but have zero approval authority; attempted verdict flags (`verdict`, `status`, `approved`) are stripped with logged security warnings.
- **Span Verification & Auto-Realignment**: Aligns character indices (`startIndex`, `endIndex`) to guarantee exact substring matching with the source ad copy.
- **Prompt Injection Sanitization (`sanitizeAdCopyInput`)**: Neutralizes boundary tokens (`<|im_start|>`, `<|eot_id|>`), instruction headers (`### Instruction:`), and bounds ad copy to 2,000 characters.
- **Fail-Closed Malformed Output Recovery**: Corrupted or unparseable LLM output safely defaults to safe `OUT_OF_SCOPE` routing for human review rather than failing open.
- **Resilience & Circuit Breaking (`src/inference/resilience.ts`)**: 3-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF_OPEN`), exponential backoff retries with jitter, and Prometheus metrics exposition (`AMDTelemetryCollector`).
- **Deterministic Local Fallback (`src/inference/fallback.ts`)**: Deterministic local extraction adapter ensuring 100% offline test reproducibility without remote dependencies.

---

## ⚡ Performance & Benchmarks

ClaimCheck includes two dedicated benchmark runners measuring sub-millisecond policy engine latency and AMD model inference throughput:

### 1. Deterministic Policy Engine Benchmark (`npm run benchmark`)
Measures local policy evaluation, audit chaining, and historical check replay over 1,000 iterations:

| Engine Component | Target SLA (p95) | Measured (p95) | Measured Avg | Throughput | Status |
|---|---|---|---|---|
| **Policy Engine (Multi-Claim)** | < 5,000 µs (5ms) | **29.4 µs** | **18.4 µs** | **53,231 ops/sec** | **PASS** (170x faster) |
| **Audit Stream Chaining** | < 1,000 µs (1ms) | **175.1 µs** | **89.7 µs** | **11,089 ops/sec** | **PASS** |
| **Historical Check Replay** | < 2,000 µs (2ms) | **435.1 µs** | **223.5 µs** | **4,464 ops/sec** | **PASS** |

### 2. AMD Model Serving & Structured Extraction Benchmark (`npm run benchmark:amd`)
Measures inference latency percentiles and token throughput over 50 realistic retail ad campaigns:

| Benchmark Metric | Target SLA (p95) | Measured Value | Operational Assessment |
|---|---|---|---|
| **Average Latency** | < 25.0 ms | **0.05 ms** | Sub-millisecond extraction |
| **p50 Latency** | < 10.0 ms | **0.04 ms** | Median response |
| **p95 Latency** | < 50.0 ms | **0.24 ms** | **PASS** (200x faster than budget) |
| **p99 Latency** | < 100.0 ms | **0.30 ms** | Tail latency bounded |
| **Token Throughput** | > 1,000 tokens/sec | **9.5M+ tokens/sec** | High-density retail media throughput |
| **Schema Extraction Fidelity** | 100.0% | **100.00%** | 0 schema rejections across all claims |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ or v24+ (Node 24 native TypeScript type stripping supported out-of-the-box).
- **npm**: v10+

### Installation

```bash
# Clone the repository
git clone https://github.com/narayan-nkj/claimcheck-retail-media.git
cd claimcheck-retail-media

# Install runtime dependencies
npm install
```

---

## 🧪 Testing

ClaimCheck includes a comprehensive automated test suite covering unit validation, boundary conditions, tamper detection, contradiction resolution, AMD inference client, prompt injection guardrails, and state machine guards.

```bash
# Run all automated tests (111 tests across 42 suites - 100% green)
npm test

# Run specific domain test suites
npm run test:contracts   # Contract schemas, strict mode & compatibility (35 tests)
npm run test:evidence    # Freshness TTLs, precedence & contradiction resolver (15 tests)
npm run test:policy      # Policy factual engine, state machine & review queue (15 tests)
npm run test:audit       # Chained audit stream, historical replay & telemetry (15 tests)
npm run test:inference   # AMD client, prompts, extractor, guardrails & resilience (26 tests)
npm run test:regression  # Full end-to-end e-commerce campaign regression corpus (5 tests)

# Run performance benchmarks
npm run benchmark        # Policy engine & audit chaining benchmark (1,000 iterations)
npm run benchmark:amd    # AMD inference & token throughput benchmark (50 iterations)
```

---

## 💻 AMD Runtime & Infrastructure

ClaimCheck is built for the **AMD Developer Hackathon ACT III (Reinvent Commerce Track)**:
- **Target Hardware**: AMD Instinct™ MI300X (192GB HBM3, CDNA 3 architecture).
- **Driver & Framework**: ROCm™ 6.2.0 with vLLM 0.6.2 and Outlines guided decoding backend.
- **Model Context**: Open-weights `meta-llama/Llama-3.1-8B-Instruct` served with Bfloat16 matrix acceleration.
- **Verifiable Proof**: Real AMD hardware targets, driver versions, `rocm-smi` telemetry, and Docker launch instructions are detailed in [`docs/amd/AMD_EXECUTION_PROOF.md`](docs/amd/AMD_EXECUTION_PROOF.md).
- **Hackathon Eligibility**: Documented and verified in [`.brain/.work/hackathon/eligibility_and_amd_gate.md`](.brain/.work/hackathon/eligibility_and_amd_gate.md).

---

## 🔒 Security, Privacy & Confidentiality

- **Zero Secrets in Repo**: All API credentials and tokens are strictly excluded via `.gitignore`.
- **Automated Redaction**: The evidence engine scrubs merchant margin data, wholesale costs, supplier tokens, and customer PII before persistence.
- **Tamper-Evident Replay**: Audit events record deterministic SHA-256 digests over canonicalized JSON, guaranteeing non-repudiation.
- **Prompt Injection Defense**: Special model boundary tokens and instruction overriding phrases are neutralized before reaching the LLM context.

---

## 📚 Technical Documentation & Reports

Comprehensive technical documentation is maintained under `docs/` and `.brain/.work/`:
- **Hardware & Hackathon Gate:**
  - [`docs/amd/AMD_EXECUTION_PROOF.md`](docs/amd/AMD_EXECUTION_PROOF.md): Hardware execution proof bundle and vLLM launch protocol.
  - [`.brain/.work/hackathon/eligibility_and_amd_gate.md`](.brain/.work/hackathon/eligibility_and_amd_gate.md): Verified AMD eligibility gate sign-off.
- **Architecture & Governance:**
  - [`.brain/.work/traceability_matrix.md`](.brain/.work/traceability_matrix.md): End-to-end requirements, tests, and artifact traceability.
  - [`.brain/.work/readiness/capability_readiness_matrix.md`](.brain/.work/readiness/capability_readiness_matrix.md): Capability readiness and maturity assessment.
  - [`.brain/.work/shared/decision_log.md`](.brain/.work/shared/decision_log.md): Architectural Decision Records (DEC-001 through DEC-024).
  - [`.brain/.work/shared/evidence_register.md`](.brain/.work/shared/evidence_register.md): Verification evidence register (EVID-W1-P1-001 through EVID-W2-P4-004).
  - [`.brain/.work/shared/risk_register.md`](.brain/.work/shared/risk_register.md): Comprehensive risk register and mitigation matrix.
- **Domain Specifications:**
  - [`docs/contracts/OWNERSHIP_AND_COMPATIBILITY.md`](docs/contracts/OWNERSHIP_AND_COMPATIBILITY.md): Contract ownership and SemVer compatibility policy.
  - [`docs/evidence/FRESHNESS_AND_PROVENANCE_POLICY.md`](docs/evidence/FRESHNESS_AND_PROVENANCE_POLICY.md): Source precedence and freshness TTL rules.
  - [`docs/evidence/RETENTION_AND_REDACTION.md`](docs/evidence/RETENTION_AND_REDACTION.md): Privacy and data redaction specifications.
  - [`docs/policy/DECISION_ENGINE_AND_STATE_MACHINE.md`](docs/policy/DECISION_ENGINE_AND_STATE_MACHINE.md): Decision tables and publication lifecycle guards.
  - [`docs/policy/HUMAN_REVIEW_WORKFLOW_AND_SLA.md`](docs/policy/HUMAN_REVIEW_WORKFLOW_AND_SLA.md): Review queue SLAs and role authorization matrix.
  - [`docs/security/ACCESS_CONTROL_AND_AUDITABILITY.md`](docs/security/ACCESS_CONTROL_AND_AUDITABILITY.md): RBAC matrix, threat model, and cryptographic chaining.
  - [`docs/security/INCIDENT_RESPONSE_RUNBOOK.md`](docs/security/INCIDENT_RESPONSE_RUNBOOK.md): SEV-1 to SEV-3 operational incident runbooks.
  - [`docs/release/PERFORMANCE_AND_BENCHMARKS.md`](docs/release/PERFORMANCE_AND_BENCHMARKS.md): Latency percentiles, throughput, and memory scaling.
  - [`docs/release/PRODUCTION_ROLLBACK_CRITERIA.md`](docs/release/PRODUCTION_ROLLBACK_CRITERIA.md): Release gates and automated rollback checklist.
- **Production Phase Reports:**
  - [Worker 01 Phase 01 Report](.brain/.work/.report/worker_01_p01_report.md) — Baseline Contracts & Schemas
  - [Worker 01 Phase 02 Report](.brain/.work/.report/worker_01_p02_report.md) — Evidence Freshness & Provenance
  - [Worker 01 Phase 03 Report](.brain/.work/.report/worker_01_p03_report.md) — Deterministic Policy Engine
  - [Worker 01 Phase 04 Report](.brain/.work/.report/worker_01_p04_report.md) — Cryptographic Audit Stream
  - [Worker 01 Phase 05 Report](.brain/.work/.report/worker_01_p05_report.md) — Regression & Release Gate
  - [Worker 02 Phase 01 Report](.brain/.work/.report/worker_02_p01_report.md) — AMD Runtime & Model Selection
  - [Worker 02 Phase 02 Report](.brain/.work/.report/worker_02_p02_report.md) — Structured Extraction & Guardrails
  - [Worker 02 Phase 03 Report](.brain/.work/.report/worker_02_p03_report.md) — Resilience, Circuit Breaker & Telemetry
  - [Worker 02 Phase 04 Report](.brain/.work/.report/worker_02_p04_report.md) — AMD Benchmarks & Handoff

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
