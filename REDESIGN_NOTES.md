# ClaimCheck Architecture Diagram Redesign Notes (v2 Specification)

## 1. Overview
This document records the exact measurements, DOM bindings, and animation engine architecture for the ClaimCheck architecture diagram redesign based on the 60 fps screen recording (3420 x 2224 px reference, 1710 css px viewport, 1u = 1.437 css px).

## 2. Measured Geometry (Stage: 940u x 313u)
### Canvas
- `.dg`: `container-type: inline-size; width: min(79vw, 1360px); margin-inline: auto; aspect-ratio: 940 / 313; position: relative;`
- `.dg__stage`: `position: absolute; inset: 0; --u: calc(100cqw / 940);`

### Pills (8 Total, 126.5u x 34.4u, Fully Rounded)
- **Left Pills (`x = 0`):**
  - Index 0 (`adcopy`): `top = 0u`, center `y = 17.2u`, anchor `(126.5, 17.2)`
  - Index 1 (`catalog`): `top = 48.7u`, center `y = 65.9u`, anchor `(126.5, 65.9)`
  - Index 2 (`inventory`): `top = 230.5u`, center `y = 247.7u`, anchor `(126.5, 247.7)`
  - Index 3 (`carrier`): `top = 279.3u`, center `y = 296.5u`, anchor `(126.5, 296.5)`
- **Right Pills (`x = 813.5u`):**
  - Index 0 (`allow`): `top = 0u`, center `y = 17.2u`, anchor `(813.5, 17.2)`
  - Index 1 (`block`): `top = 48.0u`, center `y = 65.9u`, anchor `(813.5, 65.9)`
  - Index 2 (`review`): `top = 231.0u`, center `y = 247.7u`, anchor `(813.5, 247.7)`
  - Index 3 (`ledger`): `top = 279.3u`, center `y = 296.5u`, anchor `(813.5, 296.5)`

### Center Cluster (Midline `y = 156.5u`, Container `top = 123.2u`, Height `69.6u`)
- Left Container (`#stageSanitize`, label: "Sanitize"): `x = 283.9u`, width `69.6u`. One 47.3u tile at 11u inset.
- Short Link 1: `x = 353.5u`, width `28.5u`, 1px line at `y = 156.5u`.
- Middle Container (`#stageEvidenceGate`, label: "Evidence Gate"): `x = 382.0u`, width `175.5u`. Three 47.3u tiles with 5.9u gaps.
- Short Link 2: `x = 557.5u`, width `29.5u`, 1px line at `y = 156.5u`.
- Right Container (`#stageSeal`, label: "Seal"): `x = 587.0u`, width `69.6u`. One 47.3u tile at 11u inset.
- Hub bounds: `x = 283.9u` to `656.5u` (center `x = 470u`).
- Container radius: `10.4u`. Tile radius: `6.0u`.
- Container border: `max(1px, 1.05 * var(--u))`. Tile border: `1px`.
- Tile icon size: `28u` white.
- Mono container labels: centered under each container at center `y = 210u`.

### Curves
- **Left S-curves (Pills -> Hub Left Edge `(283.9, 156.5)`):**
  `const left = (x0, y0, x1, y1) => { const c = x0 + (x1 - x0) * 0.60; return `M${x0},${y0} C${c},${y0} ${c},${y1} ${x1},${y1}`; };`
- **Right S-curves (Hub Right Edge `(656.5, 156.5)` -> Pills):**
  `const right = (x0, y0, x1, y1) => { const c = x0 + (x1 - x0) * 0.40; return `M${x0},${y0} C${c},${y0} ${c},${y1} ${x1},${y1}`; };`

## 3. Sampled Color Palette
- `--bg-0`: `#050c24` (page navy)
- `--pill-fill`: `#0b122c`
- `--pill-border`: `#36446f` (1px)
- `--pill-icon`: `#4586f5`
- `--box-border`: `#4b7ce0` (bright cobalt)
- `--box-fill`: `rgba(20, 32, 90, 0.20)` (translucent)
- `--tile-fill`: `#121a3a`
- `--tile-border`: `#3c68c8`
- `--link`: `#4b7ce0`
- `--curve-dim`: `rgba(110, 135, 215, 0.38)` (resting curve color)
- `--trace`: `#ffffff`
- `--text`: `#ffffff`
- `--text-para`: `#e6eaf8`
- `--chip-text`: `#6f8dec`
- `--chip-border`: `rgba(95, 140, 245, 0.45)`

## 4. Glow Specification
- Placed strictly behind center cluster: `left: calc(470 * var(--u)); top: calc(160 * var(--u)); width: calc(640 * var(--u)); height: calc(270 * var(--u));`
- Background: `radial-gradient(ellipse closest-side, rgba(80,120,235,.62) 0%, rgba(62,95,205,.34) 35%, rgba(40,62,150,.12) 68%, rgba(5,12,36,0) 100%)`
- `filter: blur(14px); opacity: 0.8;`
- Fully fades before element bounding box to avoid visible rectangular edges.

## 5. Motion Engine (requestAnimationFrame Loop)
- Dual SVG path architecture per curve:
  1. `<path class="dg__curve" d="..." />`: resting dim slate-blue line.
  2. `<path class="dg__trace" d="..." pathLength="1" />`: overlaid white 1.5px trace (`stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0`).
  3. `<circle class="dg__dot" r="2.4" />`: white head dot with drop-shadow.
- Per-trace timing:
  - Draw: 1.4s, `cubic-bezier(.45, .05, .35, 1)` easing
  - Hold: 0.3s fully white
  - Fade: 0.35s back to dim curve
- Master 12.0s loop (`TIMELINE`):
  - `at: 0.0s`: Wave 'in' (left pills -> hub: `[[3, 0.00], [0, 0.25], [1, 0.50], [2, 0.75]]`)
  - `at: 3.0s`: Glow pulse (rise 0.2s to `scale(1.08)` / `opacity: 1.0`, hold 1.4s, fall 0.25s)
  - `at: 5.2s`: Wave 'out' (hub -> right pills: `[[1, 0.00], [2, 0.10], [0, 0.80], [3, 1.10]]`)
  - `at: 8.5s - 12.0s`: Idle period before loop repeats
- Node selection triggers an immediate single-shot trace on that node's curve.
- Pauses when tab is hidden or diagram is scrolled off-viewport (`IntersectionObserver`).
- Disabled when `prefers-reduced-motion: reduce`.

## 6. Typography Scale (Reference 1710 css px Viewport)
- Chip text: 14px (`0.82vw`, min 12px), mono
- Heading (h2): 48px (`2.8vw`, min 32px), weight 300, line-height 1.0 (48px), max-width 40vw
- Paragraph: 18px (`1.05vw`, min 16px), line-height 1.39 (25px), max-width 37.5vw
- Pill labels: 20px (`1.17vw` / `14.4u`, min 14px), weight 400, sans
- Container mono labels: 15px (`0.88vw` / `10.4u`, min 12px), weight 400, mono

## 7. Responsive Breakpoint: 1100px
- `>= 1100px`: Horizontal 940u x 313u stage
- `< 1100px`: Vertical reorganization (2x2 grid inputs, vertical connector with traveling dot, scaled horizontal center cluster, vertical connector with traveling dot, 2x2 grid outputs, detail strip).
