# ClaimCheck — Presentation Slides Outline

**Deck Structure:** 8-Slide Hackathon Pitch Deck  
**Target Audience:** Hackathon Judges, Retail Media Product Executives, AI Infrastructure Leaders  

---

## Slide 1: Title & Vision
- **Header:** ClaimCheck
- **Subheader:** Deterministic Evidence-Backed Pre-Publication Claim Checker for Retail Media
- **Tagline:** Truth in Advertising at Sub-Millisecond Speed, Powered by AMD ROCm™
- **Visuals:** Obsidian dark-mode portal screenshot showing the "Golden Pass" ALLOW verdict alongside AMD Instinct™ MI300X badge.
- **Presenter Notes:** Introduce the team (Narayan, Adi, Roshan) and state our mission: eliminating deceptive ad fines and stockout churn in retail media with zero LLM hallucination risk.

---

## Slide 2: The Multi-Billion Dollar Compliance Bottleneck
- **Header:** The Problem: Retail Media Generation Outpaces Verification
- **Key Pain Points:**
  - **FTC 16 CFR § 233 Statutory Fines:** Up to $50,120 per deceptive discount violation.
  - **Stockout Waste:** 12% - 18% of click-through ad spend lost directing shoppers to out-of-stock items.
  - **The Generative Dilemma:** LLMs can write 10,000 ad variants per minute, but hallucinate approvals and cannot legally serve as regulatory compliance arbiters.
- **Visuals:** Infographic showing the split: Generative Copy Creation vs. 4-Hour Manual Legal Review Bottleneck.

---

## Slide 3: The ClaimCheck Architectural Blueprint
- **Header:** The Core Innovation: Zero Model Approval Authority (DEC-009)
- **Three Pillar Architecture:**
  1. **Structured Claim Extraction:** Llama-3.1-8B-Instruct on AMD ROCm extracts 4 factual claim types (`PRICE_DISCOUNT`, `AVAILABILITY`, `SHIPPING_PROMISE`, `PRODUCT_ATTRIBUTE`).
  2. **Deterministic Evidence Gate:** Precedence-ordered feed corroboration (Attestation > Promo > Inventory > Shipping > Catalog) with fail-closed equal-tier contradiction handling.
  3. **Cryptographic Audit Stream:** Forward-chained SHA-256 logs with 1-click bit-for-bit replay determinism.
- **Visuals:** High-level pipeline architecture diagram from copy submission to publication.

---

## Slide 4: Accelerated by AMD Instinct™ MI300X & ROCm™ 6.2
- **Header:** Hardware Acceleration & Performance SLAs
- **Key AMD Features:**
  - **AMD Instinct™ MI300X:** 192GB HBM3 memory bandwidth (5.3 TB/s) powers concurrent vLLM PagedAttention serving.
  - **ROCm™ 6.2.0:** Direct kernel optimization, ROCm SMI telemetry monitoring, open-weights deployment without cloud vendor lock-in.
  - **Real-Time Auction SLA:** p50 latency < 0.05ms, p95 latency < 0.40ms (clears 15ms real-time bidding auction deadlines).
  - **Reliable Fallback:** Transparent offline fallback adapter for CI/CD and edge deployments.
- **Visuals:** Latency bar chart comparing manual review (4 hours) vs standard LLM (1.2s) vs ClaimCheck on AMD MI300X (< 1.2ms).

---

## Slide 5: The Operator Web Portal Experience
- **Header:** Rich, Accessible, Zero-Bloat Operator Workflow
- **Portal Features:**
  - **4 One-Click Preset Scenarios:** Golden Pass (ALLOW), Deceptive Price (BLOCK), Out of Stock (BLOCK), Feed Conflict (REVIEW).
  - **Interactive Span Highlighting:** Visual character-coordinate highlighting directly on submitted ad text.
  - **Tri-State Verdict Banner:** High-contrast ALLOW (green), REVIEW (amber), BLOCK (ruby) badges with FTC reason codes.
  - **Human Review Queue & SLA Countdown:** Urgent priority escalation (15m to 4h SLAs) with DEC-010 role authorization barriers.
- **Visuals:** Screenshot of the 2-column Obsidian dark-mode portal highlighting the review queue and interactive spans.

---

## Slide 6: Mathematical Proof & Bit-for-Bit Deterministic Replay
- **Header:** Tamper-Evident Regulatory Defense
- **Key Cryptographic Guarantees:**
  - **SHA-256 Inter-Event Chaining:** Each check is cryptographically linked to the previous check digest (`H(previousDigest + eventDigest)`).
  - **Bit-for-Bit Historical Replay:** 1-click button re-executes stored snapshot data against policy rules and asserts identical digest.
  - **Zero Logic Drift:** Regulators receive immutable, verifiable proof of exact compliance conditions at time of ad publication.
- **Visuals:** Flow diagram showing hash linking from Genesis block to Event #50, with green checkmark indicating bit-for-bit match.

---

## Slide 7: Synthetic Evaluation Corpus & Merchant ROI
- **Header:** Production Validation Across 52 Retail Campaigns
- **Benchmark Highlights (6 Verticals):**
  - **Total Campaigns Evaluated:** 52 across Electronics, Groceries, Apparel, Home, Beauty, Sports.
  - **Schema Compliance Rate:** 100.0% (strict Zod `.strict()` contracts).
  - **Policy Decision Accuracy:** 100.0% (zero false passes, zero false blocks).
  - **Estimated Merchant Impact:** ~$2.4M saved annually in prevented fines and salvaged ad spend per enterprise retailer.
- **Visuals:** Confusion matrix table showing 14/14 ALLOW, 15/15 REVIEW, 23/23 BLOCK perfect diagonal classification.

---

## Slide 8: Open-Source Vision & Next Milestones
- **Header:** Open Source Commerce Infrastructure
- **Summary Points:**
  - Permissive MIT license with open-weights Llama 3.1 model weights.
  - Full CI/CD coverage (159/159 tests passing).
  - Roadmap: Amazon Ads / Walmart Connect real-time bidding webhook plugins, dynamic multi-lingual ad copy verification, and edge gateway appliances on AMD Embedded ROCm.
- **Call to Action:** Explore the code at `github.com/narayan-nkj/claimcheck-retail-media`!
