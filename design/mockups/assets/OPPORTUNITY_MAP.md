# UI-4.1 — Asset opportunity map

Score Stage / Steel Stage already carry the product: Orbit Gap mark, typography, hairline instrument UI, score glow. Phase 4 only adds originals where they change recognition or share quality — not decoration inside app flows.

## Recommend (generate)

| # | Asset | Where | Why |
|---|--------|--------|-----|
| **A** | Open Graph / social preview | Link shares (`og:image`) for `/` and app | Today shares look generic. One 1200×630 Steel Stage lockup makes TayyariKarlo recognizable off-site. |
| **B** | Apple touch / raster app icons | `apps/web/public` | Today only `favicon.svg` (+ brand SVG). No `apple-touch-icon` / PNG set — real gap for iOS home-screen. |

## Maybe (only if you want)

| # | Asset | Where | Why / risk |
|---|--------|--------|------------|
| **C** | Home stage atmosphere | `/` behind orbit | Richer gradient/field under `HeroOrbitMark`. Risk: noise; current CSS glow may be enough. |
| **D** | Empty-state mark | Progress / PageState empty | Tiny Orbit Gap stub instead of plain bar. Risk: over-branding empty screens. |

## Skip (do not generate)

| Surface | Reason |
|---------|--------|
| Auth login/register photos | Approved Orbit Gap split; no hero photo needed |
| Progress / Assessments / Interviews illustrations | Instrument UI; illustrations fight hairline Score Stage |
| People / laptop / “study” stock | Explicitly banned in Phase 4 |
| Per-topic icons (DSA, OS, …) | Adds icon soup; topic labels already clear |
| Signal scenario art | Evidence desk is data-first; art becomes decorative noise |

## Proposed next step

Generate **A** (OG image, 2–3 candidates). Run **B** as a checklist (no new art unless a size is missing). Hold **C/D** unless you ask for them.

**Gate:** Say which of A–D to produce before any integrate.
