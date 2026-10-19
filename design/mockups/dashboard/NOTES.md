# Dashboard visual direction — Ink & Graph (continued)

## Direction
Same quiet study-studio system: graph-paper ground, deep ink type, forest-teal signal. The signed-in home is a **progress desk**, not a SaaS KPI dashboard — one vertical reading path.

## Why this fits
- Continuity with auth, workspace shell, and assessment results.
- Skill score uses the same hero-number language as results (`70%`).
- Recommendations are the primary next action; recent attempts are supporting history.
- No card grids, pill clusters, or decorative charts.

## Screens
- `dashboard.html` — populated: skill score, trend marks, focus-next list, recent attempts
- `dashboard-empty.html` — zero attempts: calm empty state + Start assessment CTA

## Hierarchy
1. Eyebrow + short greeting
2. Skill score (hero) + attempt meta + light trend marks
3. Focus next (ranked recommendations with Practice)
4. Recent attempts (simple rows)
5. Secondary link to Assessments setup

## Tokens
Reuse `../auth/tokens.css`.
