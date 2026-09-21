# TayyariKarlo — Brand Identity & UI/UX Revamp

Tracked separately from product feature phases in [phases.md](phases.md).  
Statuses: `Pending` | `In Progress` | `Completed`

**Branch:** `phase/02-brand-identity-ui-revamp`  
**Stack (locked):** React + Vite + Tailwind v4 + React Router + TanStack Query · NestJS unchanged · pnpm workspaces  
**Design workflow:** [ui-design.md](ui-design.md) — understand → design → visualize → approve → implement → browser inspect  
**Product phases:** leave [phases.md](phases.md) as-is (feature roadmap). This file owns brand/UI work only.

**Roles:** Brand designer · Senior product designer · Senior frontend engineer  
**North star:** Distinctive career-prep product identity — not a student MVP, generic SaaS dashboard, or recognizable AI template.

---

## Working rules (this phase)

### Approval gates

Stop and wait for explicit approval before:

1. Integrating or finalizing a logo (after Phase 1 concepts).
2. Applying major design-system / token changes (after Phase 2 proposal).
3. Integrating major original visual assets (after Phase 4 concepts).
4. Merging this branch.

Continue sequentially between ordinary implementation tasks without extra approval pauses.

### Task-by-task & Git discipline

1. One task at a time, in the order below.
2. Before starting: objective, scope, dependencies, acceptance criteria.
3. Implement only the current task.
4. Verify (tests / typecheck / browser as relevant).
5. Confirm acceptance criteria.
6. Mark the task Completed in this file.
7. One dedicated commit per completed task (tightly related work only).
8. Then move to the next task.

**Commit style:** `type(scope): description`  
Examples: `design(brand): add approved TayyariKarlo logo` · `feat(ui): redesign dashboard layout` · `assets(ui): add original empty-state visuals`

Never combine unrelated tasks · never commit broken/incomplete work · never stage pre-existing user changes (e.g. untracked `scripts/`) · never merge without owner approval.

### After each task, report

What completed · files changed · verification · commit hash + message · updated status.

---

## Phase 0 — Repository inspection & preparation

**Goal:** Understand current UI in browser, create this plan, wait for approval before creative work.  
**Status:** Completed (owner approved 2026-11-06)

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-0.1 | Create phase branch | Completed | From `origin/main`, branch `phase/02-brand-identity-ui-revamp`; preserve uncommitted work | On branch; `scripts/` still untracked/untouched | — | `git status` clean of discards |
| UI-0.2 | Browser UI audit | Completed | Run app; inspect Home, Auth, Workspace, Assessments, Interviews | Written visual/UX weaknesses below (not code-only) | UI-0.1 | Browser screenshots + navigation |
| UI-0.3 | Author `uiphases.md` | Completed | Full phase/task breakdown with AC, deps, tests, statuses | This file exists; product `phases.md` unchanged | UI-0.2 | Manual review |
| UI-0.4 | Plan approval gate | Completed | Present plan; **stop** until owner approves | Explicit approval before Phase 1 | UI-0.3 | — |

### Browser audit findings (2026-11-06, local `127.0.0.1:5173`)

Surfaces inspected: `/`, `/login`, `/register`, `/app` (empty progress), `/app/assessments`, `/app/interviews`.

| Area | Observation |
|------|-------------|
| Brand | Text-only “TayyariKarlo” wordmark everywhere; no mark/logo component |
| Favicon | Stock purple Vite SVG — clashes with teal UI tokens |
| Landing | Brand name repeated as hero H1; no dominant product visual; graph-paper bg carries most character |
| Auth | Split editorial layout; serif headlines + cream paper; form column readable but template-adjacent |
| App shell | Sticky header, pill active nav, max-width content column — functional, visually thin |
| Workspace | Empty state is sparse; numbered “Focus next” rows feel list-MVP; little hierarchy drama |
| Assessments / Interviews | Repeated eyebrow + serif title + bordered option cards/radios; Signal vs Classic cards OK but generic |
| Typography | Instrument Serif + Sora — distinctive locally but close to common “editorial edtech” pairing |
| Color | Warm paper + forest teal signal; coherent but soft campus/brochure, not sharp product instrument |
| Patterns | Card/border density; graph-bg on nearly every surface; limited motion beyond enter fades |
| Loading | Plain “Checking session…” spinner — no branded loading language |
| Mobile | Not fully viewport-matrix tested yet (deferred to Phase 6); header wrap exists but needs verification |

**Weakness summary:** Coherent MVP polish, weak brand ownership (no logo, favicon mismatch), over-reliance on graph paper + serif editorial tropes, card-heavy option UIs, empty/loading states under-designed.

---

## Phase 1 — Original logo & brand identity

**Goal:** Three original logo directions → owner pick → finalize SVG/favicon → integrate.  
**Status:** Completed (Concept **D Orbit Gap** approved, assets + integration)  
**Gate:** Logo direction approved and integrated.

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-1.1 | Brand brief | Completed | Audience, emotions, differentiation (confidence, preparation, progress, competence) | Written brief in chat + short section here | UI-0.4 | Review |
| UI-1.2 | Generate 3 logo concepts | Completed | Three genuinely different marks/wordmarks; light/dark; navbar + favicon scale | Actual generated concepts presented with design thinking | UI-1.1 | Visual review |
| UI-1.3 | Logo approval gate | Completed | **Stop** for owner feedback / selection / revisions | Explicit approval of direction (**D Orbit Gap**) | UI-1.2 | — |
| UI-1.4 | Finalize logo assets | Completed | SVG (and variants), favicon/app icon | Assets in repo under agreed paths | UI-1.3 | Visual QA at 16/32/64px |
| UI-1.5 | Integrate approved logo | Completed | Home, AppShell, AuthShell, favicon, title meta as needed | Brand mark visible; old Vite favicon gone | UI-1.4 | Browser check |

**Avoid:** graduation caps, books, lightbulbs, generic checkmarks, generic AI glyphs, empty geometric marks.

### Brand brief (UI-1.1)

| | |
|--|--|
| **Product** | TayyariKarlo — practice assessments, progress insight, classic oral + Signal Integrity interview rehearsal |
| **Audience** | Students and early-career engineers preparing for technical screens and onsites |
| **Job** | Turn anxiety into deliberate readiness; make weak spots visible; rehearse under pressure |
| **Personality** | Confident, precise, modern, unsentimental — a practice instrument, not a campus brochure |
| **Emotions** | Calm focus, earned confidence, forward motion, competence |
| **Differentiate** | Evidence and rehearsal over “AI tutor” vibes; Urdu/Hindi “tayyari” (preparation) + “karlo” (do it) as do-the-work energy |
| **Visual mandate** | Sharp tech brand mark; works at favicon; no education clichés |

### Logo directions in exploration

**Round 1 (owner not satisfied — kept for archive):**
1. **A Signal Resolve** — telemetry → locked bar.  
2. **B Threshold Monogram** — interlocking T/K doorway.  
3. **C Calibration Spine** — vertical instrument notches.

**Round 2:**
4. **D Orbit Gap** — **approved** (incomplete ring + diamond pip).  
5. **E Shear Cut** — archive.  
6. **F Reply Bracket** — archive.  
7. **G Stamp TK** — archive.

---

## Phase 2 — Visual design system

**Goal:** Tokens + component conventions from approved brand — propose, approve, then apply foundation.  
**Status:** Completed (v2 approved + foundation applied)  
**Gate:** Present system before major page restyles.  
**Spec:** [design/brand/design-system.md](design/brand/design-system.md) · board [design/brand/design-system-board.jpg](design/brand/design-system-board.jpg)

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-2.1 | Color system proposal | Completed | Primary/secondary, surfaces, text, borders, semantic states | Documented palette + contrast notes; mock or token draft | UI-1.5 | Contrast review |
| UI-2.2 | Typography proposal | Completed | Distinctive readable pairing; scale for display/body/UI | Spec for sizes/weights/line-heights | UI-1.5 | Spec review |
| UI-2.3 | Layout & spacing proposal | Completed | Spacing scale, widths, breakpoints; less nested cards | Spec written | UI-1.5 | Spec review |
| UI-2.4 | Component conventions | Completed | Nav, buttons, fields, lists, dialogs, progress, empty/loading/error | Spec + notes vs current `shared/ui` | UI-2.1–2.3 | Spec review |
| UI-2.5 | Design-system approval gate | Completed | **Stop** for owner approval | Explicit approval (v2) | UI-2.4 | — |
| UI-2.6 | Apply foundation tokens | Completed | Update `apps/web/src/index.css` + primitives (`Button`, `Field`, shells) to approved system | Tokens live; no full page redesign yet unless trivial | UI-2.5 | `pnpm --filter web typecheck` + spot browser |

**Avoid:** purple SaaS defaults, warm-cream + default-serif AI cluster, broadsheet newspaper density, glassmorphism overload, card stacks for their own sake.

---

## Phase 3 — Page-by-page UI/UX redesign

**Goal:** Apply approved system page by page; preserve all functionality.  
**Status:** Pending  
**Note:** Substantial screens follow mockup → approve → implement per [ui-design.md](ui-design.md) when required.

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-3.1 | Home + marketing chrome | Completed | Redesign `/` brand-first hero composition (Steel Stage) | Distinctive, responsive; logo integrated; flows intact | UI-2.6 | Browser desktop/mobile |
| UI-3.2 | Auth shell + login/register | Completed | Keep existing Auth split layout (Orbit Gap lockup + Steel Stage tokens) | Approved as-is; a11y; forms work | UI-3.1 | Browser + auth flow |
| UI-3.3 | App shell navigation | Completed | Redesign AppShell header/nav (flat chrome, ink underline + diamond pip) | Clear hierarchy; responsive nav; Orbit Gap lockup | UI-3.2 | Browser |
| UI-3.4 | Workspace / progress | Completed | Score Stage Progress (A): split hero score stage, hairline Focus next, Practice → | Stronger hierarchy; data still correct | UI-3.3 | Browser + API data |
| UI-3.5 | Assessments flow | Completed | Setup S2 (theme-aligned) + Take T2 + Results R2 Score Stage | Flows and scoring unchanged; hairline instrument UI | UI-3.4 | Browser E2E smoke |
| UI-3.6 | Interviews flow | Pending | Setup + classic session/results + Signal session chrome | Classic + Signal usable; no logic rewrite | UI-3.5 | Browser E2E smoke |
| UI-3.7 | Cross-cutting states | Pending | Loading, empty, success, error polish | Consistent patterns across pages | UI-3.6 | Browser |

---

## Phase 4 — Original visual assets

**Goal:** Strategic original assets only where they add value.  
**Status:** Pending  
**Gate:** Present important assets before integrate.

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-4.1 | Asset opportunity map | Pending | Which sections genuinely need custom visuals | Short list with rationale (skip filler) | UI-3.1+ | Review |
| UI-4.2 | Generate candidate assets | Pending | Art-directed originals matching brand | Generated images presented | UI-4.1 | Visual review |
| UI-4.3 | Asset approval gate | Pending | **Stop** for owner approval | Explicit approval | UI-4.2 | — |
| UI-4.4 | Integrate approved assets | Pending | Optimize, correct aspect ratios, responsive | Live in app; no placeholders | UI-4.3 | Browser + perf sanity |

**Avoid:** stock clichés, generic AI blobs, people-at-laptops filler, decorative noise.

---

## Phase 5 — Implementation polish & integration

**Goal:** Close gaps between approved design and code quality.  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-5.1 | Interaction states | Pending | Hover/focus/disabled/active; reduced-motion | Consistent; keyboard focus visible | Phase 3–4 | Keyboard + a11y spot |
| UI-5.2 | Token cleanup | Pending | Remove one-off colors/fonts fighting the system | Few raw hex/font exceptions | UI-5.1 | Grep + visual |
| UI-5.3 | Regression pass | Pending | Auth, assessments, interviews still work | No functional regressions | UI-5.2 | Manual smoke |

---

## Phase 6 — Browser verification & visual refinement

**Goal:** Browser truth over “it compiles.”  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-6.1 | Desktop visual QA | Pending | All primary routes | Matches approved direction | UI-5.3 | Browser |
| UI-6.2 | Tablet / mobile QA | Pending | Representative breakpoints | No broken layouts; nav usable | UI-6.1 | Browser resize/emulation |
| UI-6.3 | Fix findings | Pending | Spacing, contrast, overflow, hierarchy issues | Findings closed or listed as deferred with reason | UI-6.2 | Re-inspect |

---

## Phase 7 — Documentation & completion

**Goal:** Sync docs; completion summary; wait for merge approval.  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| UI-7.1 | Final `uiphases.md` sync | Pending | All tasks accurate; verification notes | Doc matches reality | UI-6.3 | Review |
| UI-7.2 | Completion report | Pending | Logo, system, pages, assets, QA, commits, remaining issues | Report delivered in chat | UI-7.1 | — |
| UI-7.3 | Merge approval gate | Pending | **Do not merge** without owner | Owner decision | UI-7.2 | — |

---

## Page inventory (redesign coverage)

| Route | Page | Phase 3 task |
|-------|------|----------------|
| `/` | HomePage | UI-3.1 |
| `/login` | LoginPage + AuthShell | UI-3.2 |
| `/register` | RegisterPage + AuthShell | UI-3.2 |
| `/app` | WorkspacePage + AppShell | UI-3.3 / UI-3.4 |
| `/app/assessments` | SetupPage | UI-3.5 |
| `/app/assessments/:id` | TakePage | UI-3.5 |
| `/app/assessments/:id/results` | ResultsPage | UI-3.5 |
| `/app/interviews` | InterviewSetupPage | UI-3.6 |
| `/app/interviews/:id` | InterviewSessionPage | UI-3.6 |
| `/app/interviews/:id/results` | InterviewResultsPage | UI-3.6 |
| `/app/interviews/signal/:id` | SignalSessionPage | UI-3.6 |

---

## Progress log

| Date | Note |
|------|------|
| 2026-11-06 | Phase 0: branch created; browser audit done; this file authored. **Awaiting UI-0.4 approval before logo work.** |
| 2026-11-06 | Phase 0 approved. Brand brief + three logo concepts (A Signal Resolve, B Threshold Monogram, C Calibration Spine) in `design/brand/logo-concepts/`. **Awaiting UI-1.3 logo direction approval.** |
| 2026-11-06 | Owner wanted more unique/modern marks. Added Round 2: D Orbit Gap, E Shear Cut, F Reply Bracket, G Stamp TK. **Still at UI-1.3.** |
| 2026-11-06 | Owner approved **D Orbit Gap**. Final SVGs + favicon in `design/brand/final/` and `apps/web/public/`. Next: UI-1.5 integrate. |
| 2026-11-06 | UI-1.5: `BrandMark` / `BrandLockup` on Home, AppShell, AuthShell; Vite favicon replaced. Phase 1 complete — next Phase 2 design system proposal. |
| 2026-11-06 | Phase 2 proposal authored (`design-system.md` + board). **Awaiting UI-2.5 approval before token apply.** |
| 2026-11-06 | Design system **v2** after critique (steel canvas, verdigris CTAs, IBM Plex). Still at UI-2.5. |
| 2026-11-06 | UI-2.5 approved. UI-2.6 applied tokens/fonts/Button/Field/AppShell. Next: Phase 3 page redesigns. |
| 2026-11-06 | UI-3.1 Home mocks: v1 → v2 full-bleed sparse (recommended). Awaiting mock approval to implement. |
| 2026-11-06 | Steel Stage approved; HomePage implemented to match `hero-v3-steel-stage.jpg`. |
