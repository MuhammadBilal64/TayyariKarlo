# TayyariKarlo — Design System Proposal (Phase 2)

**Status:** **Approved** (UI-2.5) — v2 applied in foundation (UI-2.6)  
**Brand anchor:** Orbit Gap mark (black incomplete orbit + diamond pip)

---

## Critique of v1 (what was weak)

| Issue | Why it fails | Fix in v2 |
|-------|----------------|-----------|
| **Zinc default trap** | `#F4F4F5` / `#E4E4E7` is stock Tailwind/shadcn — escaped cream only to look like every SaaS kit | Cool **blue-gray** canvas (`#F1F3F7`) and lines (`#D9DEE7`) with a slight steel cast |
| **Ink as every primary CTA** | Pure black buttons read as fashion/portfolio, not “calm readiness.” Logo can be black without every action being black | **Ink = text + mark.** **Primary CTA = `signal`** (action energy). Ghost/secondary = outline ink |
| **Generic teal `#0F766E`** | Tailwind teal-700 clone | Custom **verdigris** `#1B5F56` / soft `#E3F0ED` — deeper, less candy |
| **Syne + DM Sans** | Syne is quirky “2023 startup” display; DM Sans is interchangeable with Inter | **IBM Plex Sans** single family — engineered “instrument” voice, excellent UI metrics, distinctive without gimmick |
| **Radius 8 everywhere** | Still soft-card SaaS | Controls **6px**; structural chrome **0–4px**; prefer hairlines over rounded panels |
| **Focus blue `#2563EB`** | Stock indigo-blue, fights the brand | Focus = **ink ring** at 2px (or signal at 40% for links) — one system, not three accent hues |
| **No product density story** | Same airy marketing spacing would hurt interview sessions | Two densities: **marketing** (airy) vs **session** (compact, 12–16px rhythm) |
| **Nav underline only** | Correct but thin identity | Active = weight 600 + 2px ink bar; optional tiny Orbit pip for current section later |
| **Board looked template-clean** | Documentation aesthetic ≠ product soul | v2 board emphasizes signal CTA + Plex + steel canvas |

**Kept from v1:** Drop warm cream + Instrument Serif + graph-paper default + mint pills; Orbit Gap as brand anchor; dividers over card stacks; reduced motion rules.

---

## Direction (v2)

TayyariKarlo should feel like a **precision practice instrument**: cool steel-gray field, black Orbit Gap mark, **one** deep verdigris for “go / progress,” IBM Plex for engineered clarity. Not a campus brochure, not a zinc dashboard kit, not a black-button fashion site.

---

## 1. Color system (UI-2.1) — v2

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#0B0F14` | Text, logo, icons (blue-black, not pure fashion black) |
| `ink-soft` | `#3C4553` | Secondary text |
| `mute` | `#6B7380` | Hints / meta |
| `canvas` | `#F1F3F7` | Page background (steel-cool; replaces `paper`) |
| `surface` | `#FFFFFF` | Forms / elevated sheets |
| `line` | `#D9DEE7` | Dividers / borders |
| `signal` | `#1B5F56` | **Primary CTAs**, links, progress fill |
| `signal-hover` | `#154A43` | Hover |
| `signal-soft` | `#E3F0ED` | Selected / soft accent wash |
| `danger` | `#B42318` | Errors |
| `danger-soft` | `#FDECEA` | Error wash |
| `ok` | `#1F6B45` | Success |
| `ok-soft` | `#E5F6EC` | Success wash |
| `warn` | `#9A6700` | Warning |
| `warn-soft` | `#FFF4D6` | Warning wash |
| `focus` | `#0B0F14` | Focus ring (2px ink; high contrast, brand-aligned) |

**CTA rules**
- **Primary** = `signal` fill + white label  
- **Secondary / ghost** = transparent/`surface` + `line` border + `ink` text  
- **Destructive** = `danger`  
- Do **not** use ink fills for default primary buttons

**Contrast:** ink on canvas/surface and white on signal meet WCAG AA for UI text.

---

## 2. Typography (UI-2.2) — v2

| Role | Family | Notes |
|------|--------|-------|
| All UI + headings | **IBM Plex Sans** (400 / 500 / 600 / 700) | One engineered family; display = 600–700, tighter tracking (−0.02em) |
| Mono (code / Signal traces later) | **IBM Plex Mono** | Optional; ready for interview/tech surfaces |

### Scale

| Step | Size | Line | Use |
|------|------|------|-----|
| display | clamp(2.1rem, 4.5vw, 3.25rem) | 1.08 / tracking −0.03em | Marketing heroes only |
| h1 | 1.75rem | 1.2 | Screen titles |
| h2 | 1.125rem | 1.3 | Section titles |
| body | 1rem | 1.55 | Copy |
| ui | 0.9375rem | 1.4 | Controls |
| caption | 0.75rem | 1.35 | Meta; tracking +0.06em if uppercase |

Wordmark: Plex Sans 600 — same as UI (mark carries uniqueness).

---

## 3. Layout & spacing (UI-2.3) — v2

| Token | Value |
|-------|-------|
| Space scale | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 |
| Control radius | **6px** |
| Panel radius | **0–4px** (prefer square structural edges) |
| App content max | `40rem` (slightly tighter focus) |
| Marketing max | `68rem` |
| Breakpoints | sm 640 · md 768 · lg 1024 · xl 1280 |

**Densities**
- **Marketing / auth:** generous vertical rhythm (32–48)
- **App lists / progress:** 12–16 row gaps, hairline separators
- **Live session (interview / Signal):** compact; sticky chrome; minimize decorative empty space

**Background**
- Default: flat `canvas`
- Marketing optional: very faint steel micro-dots (not graph paper)
- App shell: flat; identity from Orbit Gap lockup

---

## 4. Component conventions (UI-2.4) — v2

| Component | Convention |
|-----------|------------|
| **Nav** | Text; inactive `ink-soft`; active `ink` 600 + 2px ink underline |
| **Button primary** | `signal` bg, white text, radius 6, minimal shadow |
| **Button ghost** | `line` border, `ink` text; hover `signal-soft` border tint |
| **Field** | `surface`, `line` border, focus ring ink 2px |
| **Lists** | Hairline rows; hover `canvas`; no nested cards |
| **Tabs** | Underline tabs; avoid pill chip clusters |
| **Progress** | `signal` on `line` track |
| **Loading** | Small Orbit Gap + one status line (“Checking session…”) |
| **Empty** | Muted mark + one sentence + **one** signal CTA |
| **Error** | `danger-soft` strip + recovery action |

**Motion:** 160ms / 240ms; opacity + translate only; honor `prefers-reduced-motion`.

---

## 5. Token mapping (for UI-2.6)

| Current | v2 |
|---------|-----|
| `paper` | `canvas` `#F1F3F7` (alias during migrate) |
| `paper-lift` | `surface` |
| `font-display` / `font-sans` | both → IBM Plex Sans (display weight via utility) |
| Primary button | `signal` (not ink) |
| `signal` | `#1B5F56` custom verdigris |
| `focus` | ink ring |
| Instrument Serif / Sora | removed from brand |

---

## 6. Out of scope until Phase 3

Page-level redesigns (Home hero, workspace IA, assessment/interview chrome). UI-2.6 only: tokens + Button/Field/shell foundation.

---

## Approval checklist (v2)

- [ ] Steel canvas + verdigris signal (not zinc + Tailwind teal)
- [ ] IBM Plex Sans (not Syne / DM Sans)
- [ ] Signal primary CTAs; ink for type/logo only
- [ ] Tighter radii + density split (marketing vs session)
- [ ] No default graph paper

Approve v2, or call out specific reversions (e.g. prefer black primary buttons).
