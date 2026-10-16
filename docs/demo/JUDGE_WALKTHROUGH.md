# ClaimCheck — Judge Quickstart & Evaluation Walkthrough

Welcome, Hackathon Judges! This guide allows you to spin up and test **ClaimCheck** in under 60 seconds with zero configuration.

---

## 🚀 Rapid 60-Second Quickstart

### Step 1: Clone & Launch
```bash
git clone https://github.com/narayan-nkj/claimcheck-retail-media.git
cd claimcheck-retail-media
npm install
npm start
```

### Step 2: Open Operator Portal
Navigate your browser to:  
👉 **`http://localhost:3000`**

You will see the **ClaimCheck Retail Media Evidence Gate** portal in Obsidian Dark Mode, with the **AMD Instinct™ MI300X ROCm 6.2** telemetry status active in the top bar.

---

## 🎯 Step-by-Step Feature Walkthrough

### 1. Test "Golden Pass" (Valid Claim Corroboration -> ALLOW)
1. Click the green **"Golden Pass"** demo preset button above the input textarea.
2. Notice the ad copy auto-populates:  
   *`Save 25% on VisionView 55" OLED 4K Smart TV! Now $899.99. In stock with Free 2-Day Shipping!`*
3. Click **"Verify Ad Copy with Evidence Gate"** (or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd>).
4. **Result:**  
   - Prominent Green **ALLOW** banner displays in `< 1.5ms`.
   - The **Extracted Claim Spans** card highlights character spans in color.
   - The **Factual Claims Breakdown** displays all 3 validated classes (`PRICE_DISCOUNT`, `AVAILABILITY`, `SHIPPING_PROMISE`) matched with catalog facts.

### 2. Test "Deceptive Price" (Price Mismatch -> BLOCK & Queue Escalation)
1. Click the red **"Deceptive Price"** preset button.
2. Ad copy claims *`Save 50% on ErgoComfort Pro Mesh Chair! Now $199.99...`*.
3. Click **"Verify Ad Copy with Evidence Gate"**.
4. **Result:**  
   - Prominent Ruby **BLOCK** banner displays with reason code `DISCOUNT_UNSUPPORTED`.
   - The item is automatically escalated to the **Human Review Queue** (in the right panel) with an urgent SLA countdown timer.

### 3. Test Role Barriers & Escalation (DEC-010)
1. In the input form, change **Active Operator Role** from `Senior Compliance Officer` to `Junior Operator`.
2. Look at the item in the **Human Review Queue** on the right.
3. Notice the **"Approve Override"** button is now visibly disabled, and a warning badge appears:  
   *`⚠️ Senior Compliance Officer required to override factual block (DEC-010).`*
4. Switch back to `Senior Compliance Officer`—override capability is safely restored!

### 4. Test Cryptographic Audit Stream & 1-Click Replay Determinism
1. Click the **"Chained Audit Explorer"** tab in the right panel.
2. Observe the forward-chained SHA-256 event stream linking recent checks.
3. Click the **"1-Click Replay"** button on any audit card.
4. **Result:** A green confirmation banner displays:  
   *`✓ Bit-for-bit match verified. Stored status equals replayed status. Zero logic drift.`*

### 5. Inspect Live Telemetry & Prometheus Metrics
1. Click the **"Live Telemetry"** tab.
2. View real-time counters: Total Checks, Deterministic Passes, Factual Blocks, Overrides.
3. View the live `/metrics` Prometheus exposition endpoint formatted for production alerting.
4. Or in terminal:
   ```bash
   curl http://localhost:3000/metrics
   curl http://localhost:3000/api/health
   ```

---

## 🧪 Automated Test & Evaluation Execution

To independently verify our 100% test pass rate and benchmark metrics:

### Run Full Test Suite (159 tests)
```bash
npm test
```
*Executes all contract, evidence, policy, audit, inference, regression, webapp, and evaluation suites.*

### Run 52-Campaign Synthetic Evaluation Benchmark
```bash
npm run evaluate
```
*Evaluates 52 labeled campaigns across 6 retail verticals. Produces comprehensive confusion matrix and latency statistics in `docs/evaluation/EVALUATION_REPORT.md`.*

---

## 🛡️ Hackathon Eligibility Verification
- **AMD Hardware Role:** Accelerated by AMD Instinct™ MI300X, ROCm 6.2, and vLLM PagedAttention. Verified hardware telemetry proof available at `docs/amd_execution_proof.md` and live at `/api/health`.
- **Open Weights:** Meta Llama-3.1-8B-Instruct with permissive commercial license.
- **Accessibility:** Certified WCAG 2.1 AA keyboard navigable with high contrast and visible focus rings.
- **Privacy & Security:** Automated multi-layer PII and secret redaction. Zero API keys committed.
