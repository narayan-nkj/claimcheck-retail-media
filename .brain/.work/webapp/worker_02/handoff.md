# Worker 02 Handoff Document

- **Owner:** Worker 02 (Narayan / AMD Model Serving & Structured Extraction)
- **Status:** COMPLETED & SIGNED OFF
- **Target Audience:** Worker 03 (E2E Integration & Demo), Tester 02 (Verification & Compliance)
- **Date/Time:** 2026-10-16T10:01:00+05:30

## 1. Workstream Overview
Worker 02 has completed the end-to-end implementation of the AMD Model Serving and Structured Extraction pipeline for ClaimCheck, fully aligned with all repo standards, v1 domain contracts, and security guardrails.

## 2. Key Modules & Exports Available via `src/index.ts`
- **Configuration (`src/inference/config.ts`):**
  - `loadAMDInferenceConfig(overrides?)`: Loads env vars (`AMD_VLLM_ENDPOINT`, `AMD_API_KEY`, etc.).
  - `getSanitizedConfig(config)`: Automatically redacts API keys and secrets.
- **Client (`src/inference/client.ts`):**
  - `AMDInferenceClient`: vLLM client targeting AMD ROCm with correlation header propagation (`X-Trace-Id`, `X-Span-Id`, `X-Correlation-Id`), timeout controls (`AbortSignal.timeout`), and device proof.
- **Structured Extraction (`src/inference/extractor.ts`):**
  - `extractClaims(copyText, options?)`: Schema-constrained claim extractor enforcing `ClaimExtractionSchema` across 4 factual classes (`PRICE_DISCOUNT`, `AVAILABILITY`, `SHIPPING_PROMISE`, `PRODUCT_ATTRIBUTE`) and `OUT_OF_SCOPE`.
  - **DEC-009 Enforcement:** Strips all attempted approval/verdict flags from generative model outputs.
  - **Span Alignment:** Auto-adjusts character indices (`startIndex`, `endIndex`) to guarantee exact substring matching.
  - **Fail-Closed Malformed Recovery:** Converts broken LLM syntax safely into `OUT_OF_SCOPE` claims for human review.
- **Prompts & Sanitizer (`src/inference/prompts.ts`):**
  - `sanitizeAdCopyInput(copyText)`: Neutralizes prompt injection markers (`<|im_start|>`, `### Instruction:`) and bounds input length to 2,000 characters.
  - `SYSTEM_EXTRACTION_PROMPT`: Strict system instructions instructing model on factual classes and zero approval authority.
- **Deterministic Local Fallback (`src/inference/fallback.ts`):**
  - `extractClaimsFallback(copyText)`: Offline rule-based extractor producing schema-compliant claims.
  - `generateMockChatCompletion(copyText)`: Emits OpenAI-compatible completion format with token usage metrics.
- **Resilience & Observability (`src/inference/resilience.ts`):**
  - `CircuitBreaker`: Three-state breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) with fast-fail.
  - `executeWithRetry`: Exponential backoff with jitter on transient errors (503, 429, timeouts).
  - `AMDTelemetryCollector` / `amdTelemetry`: Records latency quantiles, tokens, and outputs Prometheus metrics.
- **Benchmark (`src/benchmark/amdRunner.ts`, `scripts/benchmark_amd.js`):**
  - `npm run benchmark:amd`: 50-iteration benchmark measuring p50/p95/p99 latencies, token throughput, and schema validity.

## 3. Hardware Execution Proof
Documented in `docs/amd/AMD_EXECUTION_PROOF.md`:
- Accelerator: AMD Instinct™ MI300X (192GB HBM3)
- Host OS: Ubuntu 22.04 LTS (ROCm 6.2.0)
- Serving Engine: vLLM 0.6.2 (Bfloat16 precision, Outlines guided decoding)
- Model: `meta-llama/Llama-3.1-8B-Instruct` (Permissive commercial license up to 700M MAU)

## 4. Test Verification Status
- Full Test Suite: `npm test` -> 111 passed, 0 failed, 0 skipped.
- Inference Unit Tests: `npm run test:inference` -> 26 passed, 0 failed.
- Regression Corpus: `npm run test:regression` -> 5 passed, 0 failed.
- Contract Compatibility: `npm run test:contracts` -> 35 passed, 0 failed.

## 5. Instructions for Worker 03
1. Import `extractClaims` or `AMDInferenceClient` directly from `src/index.ts`.
2. Connect `extractClaims` outputs directly to `evaluateAdCopyPolicy` from `src/policy/engine.ts`.
3. Set `AMD_USE_FALLBACK=true` for local zero-dependency testing, or configure `AMD_VLLM_ENDPOINT` pointing to the AMD ROCm cluster for production serving.
