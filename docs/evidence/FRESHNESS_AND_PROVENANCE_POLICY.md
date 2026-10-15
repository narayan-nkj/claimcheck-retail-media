# Evidence Freshness, Precedence & Provenance Policy

## 1. Overview
In retail media advertising, claiming unverified or outdated offers, prices, or inventory violates FTC advertising substantiation standards and platform compliance policies. ClaimCheck enforces deterministic, timestamped, source-linked evidence handling to guarantee that no stale or contradictory claims pass without human operator review.

---

## 2. Source Precedence Hierarchy

When multiple data feeds provide conflicting facts for an advertising claim, ClaimCheck applies a strict precedence ranking:

| Rank | Source Type | Description | Authority Rationale |
|:---:|---|---|---|
| **100** | `OPERATOR_ATTESTATION` | Verified Human Override | Explicit compliance officer override with required rationale |
| **80** | `PROMOTION_ENGINE` | Active Promotional Deal | Time-bounded promotions supersede standard catalog pricing |
| **60** | `INVENTORY_FEED` | Real-time Warehouse Stock | Live inventory count supersedes static catalog inventory status |
| **40** | `SHIPPING_SERVICE` | Live Carrier Transit API | Real-time carrier cutoff and transit days promise |
| **20** | `CATALOG_DATABASE` | Master Product Catalog | Baseline item specifications and standard retail price |

---

## 3. Freshness Windows (TTL)

Each evidence source is assigned a maximum permissible freshness TTL:

- **`INVENTORY_FEED`**: **15 minutes** (900 seconds). High volatility; stockouts happen rapidly during sales events.
- **`PROMOTION_ENGINE`**: **1 hour** (3,600 seconds) or dynamic deal expiry (`effectiveTo`), whichever is sooner.
- **`SHIPPING_SERVICE`**: **12 hours** (43,200 seconds) or daily carrier cutoff time (e.g. 14:00 UTC).
- **`CATALOG_DATABASE`**: **24 hours** (86,400 seconds). Master data updates on daily batch cycles.
- **`OPERATOR_ATTESTATION`**: **7 days** (604,800 seconds). Max validity before requiring re-verification.

### Near-Expiry Warning Window
If evidence is within **5 minutes** (or 20% of remaining TTL) of expiring, ClaimCheck flags the status as `EXPIRING_SOON` (`POLICY_EXPIRY_THRESHOLD`) and routes to human operator review to prevent publishing ads that immediately become invalid.

---

## 4. Contradiction Resolution (Fail-Closed)

- **Equal Tier Contradiction**: If two feeds at the highest active precedence tier report conflicting values (e.g., Warehouse East reports `IN_STOCK`, Warehouse Central reports `OUT_OF_STOCK`), ClaimCheck **never guesses**. The engine produces a `REVIEW` verdict with `AMBIGUOUS_CLAIM` (contradiction detected).
- **Stale Dominant Tier**: If a promotion has expired, ClaimCheck does **not** silently revert to the catalog price without checking if the ad copy claimed the promotional discount. If the copy claimed the promo, it produces a `BLOCK` or `REVIEW` verdict.
- **Missing Corroboration**: If zero valid evidence records exist for a claimed fact, the verdict is `REVIEW` (`MISSING_EVIDENCE`).

---

## 5. Provenance Chain-of-Custody

Every evidence item records an unbroken chain of cryptographic custody:
1. `rawPayloadDigest`: SHA-256 hash of raw upstream API payload.
2. `ingestionBatchId`: Unique execution identifier linking to feed ingestion logs.
3. `chainOfCustody`: Sequential audit trail tracking ingestion, normalization, evaluation, and any human adjustments.
