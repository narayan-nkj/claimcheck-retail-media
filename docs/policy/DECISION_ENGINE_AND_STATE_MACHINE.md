# ClaimCheck Decision Engine & Verdict State Machine

## 1. Core Principle: Separation of Generation and Verification

Under the ClaimCheck architecture:
- **Open LLMs on AMD hardware** generate or parse creative ad copy.
- **The LLM NEVER issues a publication approval.**
- The Policy Engine is a **100% deterministic, rule-based, fail-closed system** that compares copy claims against timestamped, authoritative merchant facts.

---

## 2. Claim Class Evaluation Decision Matrix

| Claim Class | Condition | Decision | Reason Code | Next Action |
|---|---|---|---|---|
| `PRICE_DISCOUNT` | Stated Price < Actual Catalog/Promo Price | **BLOCK** | `PRICE_MISMATCH` | Prohibit publication; false discount claim |
| `PRICE_DISCOUNT` | Stated Price > Actual Catalog Price | **REVIEW** | `PRICE_MISMATCH` | Human review; copy overpricing discrepancy |
| `PRICE_DISCOUNT` | Stated Discount % > Approved Discount % | **BLOCK** | `DISCOUNT_UNSUPPORTED` | Prohibit publication |
| `PRICE_DISCOUNT` | Price & Discount match verified evidence | **ALLOW** | `MATCHES_APPROVED_FACTS` | Eligible for publication |
| `AVAILABILITY` | Stated "In Stock", but stock count is 0 | **BLOCK** | `PRODUCT_OUT_OF_STOCK` | Prohibit publication |
| `AVAILABILITY` | Stated "In Stock", but `LOW_STOCK` or `BACKORDER` | **REVIEW** | `AMBIGUOUS_CLAIM` | Operator review for qualifying copy |
| `AVAILABILITY` | Stated "In Stock" and count > 0 | **ALLOW** | `MATCHES_APPROVED_FACTS` | Eligible for publication |
| `SHIPPING_PROMISE` | Promised days < Carrier fastest tier | **BLOCK** | `SHIPPING_TIMELINE_UNSUPPORTED` | Prohibit publication |
| `SHIPPING_PROMISE` | Claims free shipping, but spend < minimum | **BLOCK** | `SHIPPING_TIMELINE_UNSUPPORTED` | Prohibit publication |
| `SHIPPING_PROMISE` | Delivery promise meets active carrier SLA | **ALLOW** | `MATCHES_APPROVED_FACTS` | Eligible for publication |
| `PRODUCT_ATTRIBUTE`| Claim contradicts approved specs (e.g. 100W vs 300W) | **BLOCK** | `ATTRIBUTE_CONTRADICTED` | Prohibit publication |
| `PRODUCT_ATTRIBUTE`| Claimed attribute unlisted in master catalog | **REVIEW** | `MISSING_EVIDENCE` | Route to operator verification |
| `PRODUCT_ATTRIBUTE`| Claimed attribute matches catalog | **ALLOW** | `MATCHES_APPROVED_FACTS` | Eligible for publication |
| `OUT_OF_SCOPE` | Subjective, award, or unverifiable claim | **REVIEW** | `OUT_OF_SCOPE_CLAIM` | Route to Legal Counsel queue |

---

## 3. Publication Lifecycle State Machine

```
[ UNPROCESSED ]
       │
       ▼
[ EVALUATING ]
 ┌─────┼────────────────────────┐
 │     │                        │
 ▼     ▼                        ▼
[ DETERMINISTIC_PASS ]   [ REJECTED_BLOCK ]   [ PENDING_HUMAN_REVIEW ]
 │                              │                        │
 │                              │ (Senior Override Only) │ (Operator Decision)
 │                              └─────────┬──────────────┘
 │                                        │
 │                                        ▼
 │                         [ OPERATOR_APPROVED_OVERRIDE ]
 │                                        │
 └─────────────────┬──────────────────────┘
                   ▼
             [ PUBLISHED ]
                   │
                   ▼
             [ ARCHIVED ]
```

### Transition Guards
1. An ad can **ONLY** transition to `PUBLISHED` from `DETERMINISTIC_PASS` or `OPERATOR_APPROVED_OVERRIDE`.
2. A direct transition from `REJECTED_BLOCK` to `PUBLISHED` is strictly blocked by state machine guards.
3. Every state transition generates an immutable `StateTransitionEvent` recorded in the audit log.
