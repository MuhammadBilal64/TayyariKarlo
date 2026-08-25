# TayyariKarlo — Design System Proposal (Phase 2)

**Status:** Awaiting owner approval (UI-2.5)  
**Brand anchor:** Orbit Gap mark (black incomplete orbit + diamond pip)  
**Do not apply to production tokens until approved.**

---

## Direction

Move from warm cream + Instrument Serif “editorial campus” to a **cool, precise instrument UI** that matches Orbit Gap: black mark, geometric type, quiet surfaces, teal used for *progress/action accent* — not as the whole personality.

**Leave behind:** warm paper `#e8e6e0`, Instrument Serif as brand voice, graph-paper as default wallpaper, soft mint pill nav, 10px bubbly controls everywhere.

---

## 1. Color system (UI-2.1)

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#0A0A0A` | Primary text + primary CTA + logo |
| `ink-soft` | `#3F3F46` | Secondary text |
| `mute` | `#71717A` | Tertiary / hints |
| `canvas` | `#F4F4F5` | Page background (cool zinc, replaces `paper`) |
| `surface` | `#FFFFFF` | Elevated panels / forms (replaces `paper-lift`) |
| `line` | `#E4E4E7` | Borders / dividers |
| `signal` | `#0F766E` | Links, progress, selected accents (cooler teal) |
| `signal-hover` | `#0D5F59` | Hover for signal |
| `signal-soft` | `#CCFBF1` | Soft selected backgrounds |
| `danger` | `#B42318` | Errors (unchanged intent) |
| `danger-soft` | `#FDECEA` | Error wash |
| `focus` | `#2563EB` | Focus ring (distinct from brand teal) |
| `ok` | `#15803D` | Success (new explicit token) |
| `ok-soft` | `#DCFCE7` | Success wash |
| `warn` | `#B45309` | Warning (new) |
| `warn-soft` | `#FEF3C7` | Warning wash |

**Contrast:** `ink` on `canvas` / `surface` and white on `ink` CTAs meet WCAG AA for body+UI.

**Primary button** = `ink` fill + white label (logo-aligned).  
**Secondary** = `surface` + `line` border + `ink` text.  
**Accent / text links** = `signal`.

---

## 2. Typography (UI-2.2)

| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **Syne** (600–700) | Geometric, modern; pairs with Orbit Gap |
| UI / body | **DM Sans** (400–600) | Readable, neutral, not Inter/Sora default stack |

### Scale

| Step | Size | Line | Use |
|------|------|------|-----|
| display | clamp(2.25rem, 5vw, 3.5rem) | 1.05 | Page heroes |
| h1 | 1.875rem | 1.15 | Screen titles |
| h2 | 1.25rem | 1.25 | Section titles |
| body | 1rem | 1.55 | Copy |
| ui | 0.9375rem | 1.4 | Controls |
| caption | 0.75rem | 1.35 | Eyebrows / meta (tracking +0.08em uppercase optional) |

Wordmark beside logo may stay Syne medium; do **not** use serif for brand chrome.

---

## 3. Layout & spacing (UI-2.3)

| Token | Value |
|-------|-------|
| Space scale | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 |
| Control radius | **8px** (was 10) |
| App content max | `42rem` (keep focused) |
| Marketing content max | `72rem` |
| Breakpoints | sm 640 · md 768 · lg 1024 · xl 1280 |

**Layout rules**
- Prefer **dividers + whitespace** over nested bordered cards.
- One primary column in app shell; avoid dashboard widget grids.
- `graph-bg`: retire as default; optional micro-dot or none — brand mark carries identity.

---

## 4. Component conventions (UI-2.4)

| Component | Convention |
|-----------|------------|
| **Nav** | Text links; active = `ink` weight + bottom 2px `ink` bar (no mint pill) |
| **Button primary** | `ink` bg, white text, radius 8, subtle shadow optional |
| **Button ghost** | Border `line`, hover `surface` lift |
| **Field** | White/`surface`, `line` border, focus ring `focus` |
| **Lists** | Row separators; hover soft `canvas` wash — not card stacks |
| **Tabs/filters** | Underline or segment control, not chip clouds |
| **Dialogs** | Surface modal, ink title, muted body |
| **Progress** | `signal` fill on `line` track |
| **Loading** | Orbit Gap mark + short status text (branded) |
| **Empty** | Mark (muted) + one sentence + one CTA |
| **Error** | `danger-soft` strip + clear recovery action |

**Motion:** Keep `--dur-fast` 160ms / `--dur` 240ms; respect `prefers-reduced-motion`. Prefer opacity/transform only — no decorative bounce.

---

## 5. Token rename mapping (for UI-2.6 apply)

| Current | Proposed |
|---------|----------|
| `paper` | `canvas` (aliases during migrate OK) |
| `paper-lift` | `surface` |
| `font-display` | Syne (not Instrument Serif) |
| `font-sans` | DM Sans (not Sora) |
| Primary button color | `ink` (not `signal`) |
| `signal` | Accent / progress / links only |

---

## 6. Out of scope until Phase 3

Full page redesigns (Home hero composition, workspace IA, assessment chrome). Phase 2.6 only lands tokens + Button/Field/shell foundation after approval.

---

## Approval checklist

- [ ] Color system (incl. ink primary CTAs)
- [ ] Typography (Syne + DM Sans)
- [ ] Spacing / radius / no default graph paper
- [ ] Component conventions above

Reply with approval, or list changes (e.g. keep teal primary buttons, different font pair).
