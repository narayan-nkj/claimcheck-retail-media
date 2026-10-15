# ClaimCheck — Retail Media Claim Checker

> **A deterministic, evidence-backed pre-publication verification gate for factual claims in retail advertising copy.**

[![Tests](https://img.shields.io/badge/tests-61%20passed-success.svg)](#testing)
[![Node.js](https://img.shields.io/badge/node.js-v24%2B-blue.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/AMD%20Developer%20Hackathon-ACT%20III-orange.svg)](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-iii)

ClaimCheck is a pre-publication evidence gate designed to prevent misleading, unverified, or outdated claims in retail media advertising before ads go live. It extracts factual assertions from ad copy, verifies them against timestamped, authoritative merchant data, and enforces a **fail-closed** verdict taxonomy (`ALLOW`, `REVIEW`, `BLOCK`) with immutable audit trails.

---

## 🌟 Why ClaimCheck?

Retail media networks and merchants face strict regulatory enforcement (such as FTC substantiation rules and UK CAP Code) and platform disapproval policies when ads contain inaccuracies regarding:
- **Price & Discounts**: Advertised prices differing from active checkout rates or exaggerated percentage-off claims.
- **Availability**: "In stock" promises for items that are depleted, backordered, or subject to regional stockouts.
- **Fulfillment & Shipping**: Unsubstantiated "Next-Day" or "Free Shipping" promises where carrier cutoffs or minimum spend thresholds are not met.
- **Product Attributes**: Technical or material assertions contradicting approved manufacturer specifications.

**The Solution:** Rather than relying on non-deterministic generative models to self-police, ClaimCheck enforces a strict architectural separation:
1. **Generative Model (served on AMD infrastructure)** generates or extracts candidate claims.
2. **Deterministic Policy Engine** compares claims against authoritative, timestamped evidence.
3. **The AI model NEVER approves claims** — only corroborated, fresh evidence can grant publication approval.

---

## 🏗️ Architecture & Verification Flow

```
                   ┌──────────────────────────────────────────────┐
                   │  Open LLM on AMD (vLLM / Instinct / ROCm)   │
                   │    - Generates creative ad copy              │
                   │    - Extracts normalized claim spans         │
                   └──────────────────────┬───────────────────────┘
                                          │ Claim Extraction (Strict v1.0.0)
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │    Authoritative Evidence Snapshot Feeds    │
                   │    - Catalog Master (24h TTL)                │
                   │    - Promotion Engine (1h TTL / Expire)      │
                   │    - Inventory Feeds (15m TTL)               │
                   │    - Carrier Shipping Policies (12h TTL)     │
                   └──────────────────────┬───────────────────────┘
                                          │ Timestamped & Provenanced
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │        Deterministic Policy Engine           │
                   │  - Evaluates factual truth against evidence  │
                   │  - Detects multi-feed contradictions         │
                   │  - Validates freshness & carrier cutoffs     │
                   └──────────────────────┬───────────────────────┘
                                          │ Fail-Closed Composite Verdict
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              [   ALLOW   ]         [   REVIEW   ]        [   BLOCK   ]
             All claims fresh      Ambiguous claims,      Factual conflict,
             & corroborated.       stale data, or out-    stockout, or false
             Ready to publish.     of-scope promises.     price discount.
                    │                     │                     │
                    │               ┌─────┴─────┐               │
                    │               │  Human    │ (Senior Only) │
                    │               │  Review   ├───────────────┘
                    │               │  Queue    │ (Audited Override)
                    │               └─────┬─────┘
                    ▼                     ▼
       ┌───────────────────────────────────────────────────────────────┐
       │                 Publication State Machine                     │
       │    Guards strictly prohibit unverified publication from       │
       │    REJECTED_BLOCK or PENDING_HUMAN_REVIEW without override.   │
       └──────────────────────────────┬────────────────────────────────┘
                                      ▼
       ┌───────────────────────────────────────────────────────────────┐
       │             Replayable Tamper-Evident Audit Log               │
       │    Deterministic canonical JSON + SHA-256 replay digest       │
       └───────────────────────────────────────────────────────────────┘
```

---

## 📦 Implemented Modules & Contracts

### 1. Domain Models & Contracts (`src/contracts/v1/`)
- **Strict Fail-Closed Schemas**: All schemas use `.strict()` to reject undeclared fields, preventing payload smuggling and schema drift.
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
- **Publication State Machine**: 10 distinct states (`UNPROCESSED`, `EVALUATING`, `DETERMINISTIC_PASS`, `REJECTED_BLOCK`, `PENDING_HUMAN_REVIEW`, `OPERATOR_APPROVED_OVERRIDE`, `OPERATOR_CONFIRMED_BLOCK`, `ESCALATED_TO_LEGAL`, `PUBLISHED`, `ARCHIVED`) with transition guards.
- **Human Review Queue & SLAs**:
  - Near-expiry flash deals: Priority **95/100**, **15-minute SLA**.
  - Price & stockout blocks: Priority **85–90/100**, **1–2 hour SLA** (requires `SENIOR_COMPLIANCE_OFFICER`).
  - Standard ambiguity: Priority **50/100**, **4-hour SLA** (`JUNIOR_OPERATOR`).
  - Role-based permissions guard against junior operators overriding factual blocks.

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

ClaimCheck includes a comprehensive automated test suite covering unit validation, boundary conditions, tamper detection, contradiction resolution, and state machine guards.

```bash
# Run all automated tests (61 tests across 20 suites)
npm test

# Run specific test suites
npm run test:contracts  # Contract schemas, strict mode & audit digest
npm run test:evidence   # Freshness TTLs, precedence & contradiction resolver
npm run test:policy     # Policy factual engine, state machine & review queue
```

---

## 💻 AMD Runtime & Infrastructure

ClaimCheck is built for the **AMD Developer Hackathon ACT III (Reinvent Commerce Track)**:
- **Serving Architecture**: Open LLMs (e.g., Llama 3.1) served via **vLLM on AMD Instinct / ROCm / AMD Developer Cloud**.
- **Model Context**: Models generate copy and output structured claim spans conforming to `claim.v1.json`.
- **Verifiable Proof**: Real AMD hardware targets, driver versions, and inference latency benchmarks are documented in `.brain/.work/` planning and verification records.

---

## 🔒 Security, Privacy & Confidentiality

- **Zero Secrets in Repo**: All API credentials and tokens are strictly excluded via `.gitignore`.
- **Automated Redaction**: The evidence engine scrubs merchant margin data, wholesale costs, supplier tokens, and customer PII before persistence.
- **Tamper-Evident Replay**: Audit events record deterministic SHA-256 digests over canonicalized JSON, guaranteeing non-repudiation.

---

## 📚 Documentation & Planning Traceability

Comprehensive technical documentation is maintained under `docs/` and `.brain/.work/`:
- [`docs/contracts/OWNERSHIP_AND_COMPATIBILITY.md`](docs/contracts/OWNERSHIP_AND_COMPATIBILITY.md): Contract ownership and SemVer compatibility policy.
- [`docs/evidence/FRESHNESS_AND_PROVENANCE_POLICY.md`](docs/evidence/FRESHNESS_AND_PROVENANCE_POLICY.md): Source precedence and freshness TTL rules.
- [`docs/evidence/RETENTION_AND_REDACTION.md`](docs/evidence/RETENTION_AND_REDACTION.md): Privacy and data redaction specifications.
- [`docs/policy/DECISION_ENGINE_AND_STATE_MACHINE.md`](docs/policy/DECISION_ENGINE_AND_STATE_MACHINE.md): Decision tables and publication lifecycle guards.
- [`docs/policy/HUMAN_REVIEW_WORKFLOW_AND_SLA.md`](docs/policy/HUMAN_REVIEW_WORKFLOW_AND_SLA.md): Review queue SLAs and role authorization matrix.
- Phase Reports:
  - [Worker 01 Phase 01 Report](.brain/.work/.report/worker_01_p01_report.md)
  - [Worker 01 Phase 02 Report](.brain/.work/.report/worker_01_p02_report.md)
  - [Worker 01 Phase 03 Report](.brain/.work/.report/worker_01_p03_report.md)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
