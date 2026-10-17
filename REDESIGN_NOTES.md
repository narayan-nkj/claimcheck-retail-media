# ClaimCheck Architecture Diagram Redesign Notes

## 1. Overview
This document records the audit of the current ClaimCheck architecture diagram component (Phase 0 Step 0) prior to rebuilding it to match Lucien's "Solution" diagram geometry, proportions, line work, glow, and motion.

## 2. Files Involved
- `src/webapp/public/index.html` (Markup for `#architectureSection` / `#howItWorksSection`, `#solutionDiagram`, diagram nodes, SVG bridge layer, and `#diagramDetailPanel`)
- `src/webapp/public/styles.css` (Styles for diagram stage, nodes, SVG paths, glowing particles, and detail strip)
- `src/webapp/public/app.js` (`setupSolutionDiagram()` function managing node selection, detail strip population, path highlighting, and stage activation)
- `public/index.html`, `public/styles.css`, `public/app.js` (Production assets mirrored via `npm run build`)

## 3. DOM Elements, IDs, Classes, and Data Attributes
### Diagram Stage
- `#architectureSection` / `#howItWorksSection`: Section wrapper containing the chip, rule, headline, subtitle, and diagram stage.
- `#solutionDiagram` / `.dg`: The interactive diagram canvas.

### Input Nodes (Left Pills)
- `data-node="copy"` / `#nodeInputCopy`: Ad Copy Statements
- `data-node="catalog-pricing"` (merged from `sku` and `pricing`): Catalog & Pricing (Master Catalog & Dynamic Feeds)
- `data-node="inventory"` / `#nodeInputInventory`: Warehouse Real-Time Inventory
- `data-node="carrier"` / `#nodeInputCarrier`: Carrier Transit SLAs & Delivery Models

### Center Hub (3 Containers / 5 Stages)
- Left Container (`#stageSanitize`, label: "Sanitize"):
  - Tile 1: `data-node="stage-sanitize"` (01 Ingestion & Security Sanitization, tag: "Sanitized")
- Middle Container (`#stageEvidenceGate`, label: "Evidence Gate"):
  - Tile A: `data-node="stage-extraction"` (02 Structured Claim Extraction, tag: "AMD ROCm™ 6.2")
  - Tile B: `data-node="stage-corroboration"` (03 Multi-Source Ground Truth Corroboration, tag: "Ground Truth")
  - Tile C: `data-node="stage-policy"` (04 Deterministic Policy Gate, tag: "< 1.2ms Gate")
- Right Container (`#stageSeal`, label: "Seal"):
  - Tile 1: `data-node="stage-seal"` (05 Cryptographic Tri-State Verdict, tag: "SHA-256 Sealed")

### Output Nodes (Right Pills)
- `data-node="out-allow"` / `#nodeOutAllow`: Verified Claims (ALLOW Clearance)
- `data-node="out-block"` / `#nodeOutBlock`: Blocked Claims (BLOCK Factual Rejection)
- `data-node="out-review"` / `#nodeOutReview`: Human Review Queue (REVIEW Priority Escalation)
- `data-node="out-audit"` / `#nodeOutAudit`: Chained Merkle Ledger (AUDIT Tamper-Evident Trail)

### SVG Layer & Paths
- Left Curves (Pills -> Hub Left Edge at `283.5, 157`):
  - `#pathIn1`: `M 130.5,17 C ... 283.5,157`
  - `#pathIn2`: `M 130.5,65.5 C ... 283.5,157`
  - `#pathIn3`: `M 130.5,248 C ... 283.5,157`
  - `#pathIn4`: `M 130.5,295.5 C ... 283.5,157`
- Right Curves (Hub Right Edge at `656.5, 157` -> Pills):
  - `#pathOut1`: `M 656.5,157 C ... 809.5,17`
  - `#pathOut2`: `M 656.5,157 C ... 809.5,65.5`
  - `#pathOut3`: `M 656.5,157 C ... 809.5,248`
  - `#pathOut4`: `M 656.5,157 C ... 809.5,295.5`

### Detail Strip (Replaces Old Component Detail Card)
- `#diagramDetailPanel`: Centered container directly below the stage (`aria-live="polite"`).
- `#diagramDetailTitle`: Node title display.
- `#diagramDetailTag`: Node classification or tag pill.
- `#diagramDetailDesc`: One-sentence explanation.
- `#diagramDetailAction`: Secondary pill button linking to `#studioSection` or `#opsSection`.

## 4. Selection Mechanism
- Interaction triggers: `mouseenter`, `focus`, and `click` on any pill or tile button.
- Behavior:
  - Adds `.is-selected` and `aria-expanded="true"` to active node, removing from others.
  - Highlights associated SVG paths (`.path-highlighted` with full opacity and `stroke-width: 1.5`).
  - Updates `#diagramDetailPanel` text, tag, description, and action button instantly.
  - Default selection on load: `copy` (Ad Copy).

## 5. Particle Motion
- Implemented via native SVG `<circle>` particles using `<animateMotion>` along the 4 right-hand curve paths (`#pathOut1` through `#pathOut4`).
- White circles (`r="2.5"` in design units) with subtle glow filter (`drop-shadow(0 0 4px rgba(255,255,255,0.7))`).
- 3.4s duration, staggered by 0.85s.
- Controlled via CSS to immediately hide under `@media (prefers-reduced-motion: reduce)`.
