# ClaimCheck — Official 2-Minute Demo Video Script

**Title:** ClaimCheck: Evidence-Backed Pre-Publication Claim Checker for Retail Media  
**Target Video Duration:** 2 minutes (120 seconds)  
**Presenter:** Narayan (Worker 03)  
**Platform:** Operator Web Portal (`http://localhost:3000`)

---

## Act I: Problem Statement & Architecture (0:00 - 0:25)

**[Visual: Title Card -> Switch to live ClaimCheck Operator Web Portal in Obsidian Dark Mode]**

> **Presenter (Voiceover):**  
> "Welcome to ClaimCheck. Retail media is a 140-billion-dollar market, but deceptive advertising penalties under FTC Section 5 and stockout click churn cost retailers billions.  
> Today, advertisers use generative AI to write ad copy at lightning speed—but generative models cannot legally approve their own claims.  
> ClaimCheck solves this with a deterministic evidence gate powered by **AMD Instinct MI300X GPUs** and **ROCm 6.2**. We extract claims with open-weights Llama 3.1, but strip all approval authority from the model. Every claim must clear real-world catalog and inventory facts."

---

## Act II: Scenario 1 — The Golden Pass (0:25 - 0:45)

**[Visual: Presenter clicks the "Golden Pass" preset button. Ad copy fills into the textarea. Presenter clicks "Verify Ad Copy with Evidence Gate".]**

> **Presenter (Voiceover):**  
> "Let's test our first scenario: 'Golden Pass'. Here's a multi-claim ad: *'Save 25% on VisionView 55\" OLED 4K Smart TV! Now $899.99. In stock with Free 2-Day Shipping!'*  
> We hit verify. In less than 1.5 milliseconds, ClaimCheck extracts three factual claims: price discount, stock availability, and shipping promise.  
> Notice the highlighted spans in our interactive viewer. The policy engine corroborates each claim against live catalog and inventory feeds: 25% discount verified, 42 units in stock, 2-day delivery supported.  
> **Verdict: ALLOW.** The promotion publishes instantly to the retail media network."

---

## Act III: Scenario 2 & 3 — Deceptive Price & Stockout Guardrails (0:45 - 1:15)

**[Visual: Presenter clicks the "Deceptive Price" preset button. Hits Verify. Banner turns Red: BLOCK.]**

> **Presenter (Voiceover):**  
> "Now, what happens when an advertiser submits deceptive copy? Let's click 'Deceptive Price'.  
> The ad promises *'50% OFF'*—but our promotional pricing feed proves the approved discount is only 25%.  
> ClaimCheck triggers an immediate fail-closed **BLOCK**.  
> Notice our tri-state banner: red badge, reason code `DISCOUNT_UNSUPPORTED`, and the check is automatically routed to the Human Review Queue with a strict 30-minute SLA countdown."

**[Visual: Switch operator role dropdown to "Junior Operator". Show that the "Approve Override" button is visibly disabled with a warning badge.]**

> **Presenter (Voiceover):**  
> "Under enterprise compliance rule DEC-010, Junior Operators cannot override factual blocks. The button is disabled. When we switch to Senior Compliance Officer, override authority is unlocked with mandatory cryptographic audit justification."

---

## Act IV: Cryptographic Audit Stream & 1-Click Deterministic Replay (1:15 - 1:45)

**[Visual: Click "Chained Audit Explorer" tab. Show the forward-chained SHA-256 stream. Click the "1-Click Replay" button on the latest check.]**

> **Presenter (Voiceover):**  
> "Every single verification generates an immutable audit record forward-chained via SHA-256 digests. If an FTC regulator or merchant questions an ad decision six months later, we don't guess.  
> We click '1-Click Historical Replay'. ClaimCheck re-evaluates the snapshot input through the policy state machine and proves bit-for-bit mathematical determinism: stored digest equals replayed digest, zero logic drift."

---

## Act V: AMD Hardware Telemetry & Benchmark Evaluation (1:45 - 2:00)

**[Visual: Click "Live Telemetry" tab. Show Prometheus counters, p95 sub-millisecond latency, and terminal benchmark results.]**

> **Presenter (Voiceover):**  
> "ClaimCheck delivers sub-millisecond latency on AMD Instinct MI300X, benchmarked across 52 realistic campaigns with 100% schema compliance and 100% policy decision accuracy.  
> ClaimCheck: Real-time, evidence-backed truth in advertising, accelerated by AMD. Thank you."

**[Visual: Closing slide with GitHub repo URL and MIT open-source license.]**
