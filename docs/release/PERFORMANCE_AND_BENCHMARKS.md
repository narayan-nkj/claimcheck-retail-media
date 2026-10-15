# ClaimCheck Performance & Benchmark Specifications

## 1. Production SLA Targets

ClaimCheck is designed to evaluate retail media ads before ad auction bids or publication schedules expire.

| Component | Target SLA (p95) | Measured (p95) | Measured Avg | Measured Throughput | Status |
|---|---|---|---|---|---|
| **Policy Engine (Multi-Claim)** | < 5,000 µs (5.0 ms) | **29.4 µs** (0.029 ms) | **18.4 µs** | **53,231 ops/sec** | **PASS** (170x faster than SLA) |
| **Audit Stream Chaining** | < 1,000 µs (1.0 ms) | **175.1 µs** (0.175 ms) | **89.7 µs** | **11,089 ops/sec** | **PASS** |
| **Historical Check Replay** | < 2,000 µs (2.0 ms) | **435.1 µs** (0.435 ms) | **223.5 µs** | **4,464 ops/sec** | **PASS** |

---

## 2. Benchmark Methodology

The benchmark suite (`scripts/benchmark.js` / `src/benchmark/runner.ts`) performs 1,000 iterations over a standardized multi-claim e-commerce payload:
1. **Three Concurrent Factual Claims**:
   - `PRICE_DISCOUNT` with stated price ($149.99) and 25% discount.
   - `AVAILABILITY` with stock status check against 250 units in active inventory.
   - `SHIPPING_PROMISE` with 2-day delivery window verification against carrier tiers.
2. **Authoritative Evidence Resolution**:
   - Operator price attestation, inventory feed snapshot, and carrier rate policy.
3. **Execution Environment**:
   - Node.js v24 native execution on AMD platform.
   - Nanosecond timing via `node:perf_hooks` performance API.
   - Memory heap profiling via `process.memoryUsage()`.

---

## 3. Microsecond Latency Breakdown

```
[ Incoming Ad Request ]
        │
        ├── Claims Extraction (vLLM / AMD ROCm) ~ 80-120 ms
        │
        ▼
[ ClaimCheck Deterministic Policy Gate ] ── Total: ~ 0.029 ms (p95)
        ├── Evidence Freshness & Precedence Resolution:  ~ 0.008 ms
        ├── Multi-Claim Rule Evaluation (Price/Stock/Ship): ~ 0.012 ms
        └── Composite Verdict Synthesis & State Guard:   ~ 0.009 ms
        │
        ▼
[ Cryptographic Chained Audit Stream ] ── Total: ~ 0.175 ms (p95)
        ├── Canonical JSON Serialization & Sorting:     ~ 0.080 ms
        ├── SHA-256 Replay Digest Computation:         ~ 0.050 ms
        └── Inter-Block Forward Link Chaining:          ~ 0.045 ms
```

---

## 4. Scalability & Memory Profile

- **Memory Efficiency**: In-memory heap growth is minimal (< 1 MB per 1,000 evaluated ads), as canonical serialization avoids retaining circular references.
- **Horizontal Scalability**: Because the policy engine is stateless and purely deterministic, policy verification scales linearly across any number of CPU cores or container instances without cross-node synchronization.
- **Continuous Execution**: Developers can run the benchmark anytime using:
  ```bash
  npm run benchmark
  ```
