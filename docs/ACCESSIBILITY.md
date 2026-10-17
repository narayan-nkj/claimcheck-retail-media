# ClaimCheck Accessibility Statement & Conformance

> **Status:** Conformance Target — WCAG 2.1 Level AA  
> **Last Updated:** October 2026  
> **Applicable Products:** ClaimCheck Operator Verification Portal (`src/webapp/public/`)

---

## 1. Commitment to Accessibility

ClaimCheck is committed to ensuring digital accessibility for retail media compliance officers, trust & safety reviewers, and developers of all abilities. We actively design, test, and maintain our operator web interface in conformance with the **World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA**.

---

## 2. Implemented Accessibility Features

### 2.1 Keyboard Navigation & Focus Management
- **Logical Tab Order:** All interactive elements (inputs, select dropdowns, scenario preset buttons, queue action triggers, accordion items) follow a sequential and natural DOM order.
- **Visible Focus Rings:** All focusable elements have a high-contrast `:focus-visible` outline (`2px solid rgba(160, 180, 240, 0.8)` with an offset) to ensure clear keyboard navigation.
- **Skip Navigation:** A dedicated skip-link (`#skipLink`) is provided at the very top of the page, allowing keyboard users to jump directly past the header navigation into the primary content (`#mainContent`).
- **Modal Focus Trapping:** The PhantomDeps contact modal dialog traps focus while open and returns focus to the initiating trigger upon closing via Escape key or close button.

### 2.2 Semantic HTML & Screen Reader Support
- **Heading Structure:** Strictly enforced heading hierarchy with a single `<h1>` for the primary title, followed sequentially by `<h2>` section headers and `<h3>`/`<h4>` component labels. No skipped heading levels.
- **Landmark Regions:** Defined semantic HTML5 landmarks (`<header role="banner">`, `<main id="mainContent">`, `<section>`, `<footer role="contentinfo">`) to enable rapid screen reader navigation.
- **Dynamic Content & ARIA Live Regions:** Critical asynchronous updates (such as real-time claim verification status, human review queue updates, and diagram detail panel changes) are wired to `aria-live="polite"` regions with `role="alert"` or `role="status"`.
- **Form Labels & Error Association:** All input fields and `<select>` controls have matching `<label>` elements with explicit `for` attributes. Form hints and character counters are associated via `aria-describedby`.

### 2.3 Color Contrast & Visual Ergonomics
- **High Contrast Palette:** Text elements strictly maintain contrast ratios of at least **4.5:1** against their background surfaces (and **3:1** for large text or graphical boundaries), tested against dark navy surfaces (`#070a26`, `#080c14`).
- **No Color-Only Signaling:** Status verdicts (`ALLOW`, `BLOCK`, `REVIEW`) use distinct iconography (SVG checkmarks, shields, and warning octagons) and explicit textual reason codes alongside color-coded badges.
- **Reduced Motion:** Interactive CSS transitions and SVG `<animateMotion>` particles automatically shut off when `prefers-reduced-motion: reduce` is detected in user system settings.

---

## 3. Automated Test Verification

ClaimCheck includes dedicated automated regression tests for accessibility in [`tests/webapp/security_a11y.test.js`](../tests/webapp/security_a11y.test.js):
- Skip navigation link presence and valid target id verification.
- Landmark role integrity (`banner`, `main`, `contentinfo`).
- Live announcement region presence with `role="alert"` and `aria-live="polite"`.
- Tablist, tab, and tabpanel ARIA contracts.
- High-contrast color tokens and `:focus-visible` styling validation.

---

## 4. Contact & Feedback

We welcome feedback on the accessibility of ClaimCheck. If you encounter any accessibility barriers or require accommodations while using the platform:
- **Project Repository:** [GitHub Issues](https://github.com/narayan-nkj/claimcheck-retail-media/issues)
- **Team:** PhantomDeps Compliance Engineering
- **Email:** `accessibility@phantomdeps.dev` / `narayan.nkj@gmail.com`
