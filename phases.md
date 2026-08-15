# TayyariKarlo — Development Phases

Tracked per [instructions.md](instructions.md).  
Statuses: `Pending` | `In Progress` | `Completed`

**Stack (locked):** React + Vite + Tailwind + React Router + TanStack Query · NestJS · Prisma + PostgreSQL · JWT + httpOnly refresh · Zod (`@tayyari/shared`) · pnpm workspaces · AI via NestJS/LLM later (no FastAPI)

**Layout (locked):** `apps/web`, `apps/api`, `packages/shared` · Nest domain modules · web `features/*`

---

## Phase 1 — Project setup

**Branch:** `phase/01-project-setup`  
**Goal:** Monorepo skeleton, tooling, Postgres, CI. No auth product UI yet.  
**Status:** Completed (merged to `main` via PR #1)

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| 1.1 | Root pnpm workspace | Completed | Create workspace root, `pnpm-workspace.yaml`, root scripts, `apps/` + `packages/` folders | Workspace installs; folders exist | — | `pnpm install` succeeds |
| 1.2 | Scaffold `apps/api` | Completed | NestJS baseline, global prefix `api/v1`, health route, stub domain modules | Nest boots; `GET /api/v1/health` OK | 1.1 | API starts; smoke check |
| 1.3 | Scaffold `apps/web` | Completed | Vite React TS Tailwind, React Router shell, stub feature folders | App renders; Tailwind works | 1.1 | `pnpm --filter web build` |
| 1.4 | Create `packages/shared` | Completed | Shared Zod schemas/enums package consumable by api and web | Package builds; importable from both apps | 1.1 | Typecheck api + web |
| 1.5 | Compose Postgres + Prisma | Completed | `docker-compose.yml` Postgres; Prisma init; placeholder schema + migrate | Compose up; migrate applies | 1.2 | `prisma migrate` against Compose |
| 1.6 | ESLint/Prettier + `.env.example` | Completed | Root lint/format; document required env vars | `pnpm lint` runs; env example complete | 1.1–1.4 | `pnpm lint` |
| 1.7 | GitHub Actions CI | Completed | CI: lint, typecheck, test, build | Workflow runs on PR | 1.6 | Same scripts locally |
| 1.8 | README runbook | Completed | Document clone → Compose → migrate → `pnpm dev` | New contributor can run locally from README | 1.5–1.7 | Manual read-through |

---

## Phase 2 — Authentication and users

**Branch:** `phase/02-authentication`  
**Goal:** Register / login / logout / refresh + profile.  
**Status:** In Progress

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| 2.1 | Prisma auth models | Completed | `User`, `Profile`, `RefreshToken` + migration | Migration applied | Phase 1 | migrate deploy |
| 2.2 | Nest security baseline | Completed | Helmet, CORS, ValidationPipe, exception filter, throttler | App boots with middleware | Phase 1 | Boot + smoke |
| 2.3 | Register + login | Completed | bcrypt passwords; access JWT; httpOnly refresh cookie | Auth endpoints work | 2.1–2.2 | API tests |
| 2.4 | Refresh + logout | Pending | Refresh rotation; logout revokes token | Tokens rotate/revoke correctly | 2.3 | API tests |
| 2.5 | JWT guard + `/users/me` | Pending | Protected current-user endpoint | Unauthorized blocked; me returns profile | 2.3 | API tests |
| 2.6 | Web auth feature | Pending | Login/register pages; API integration | User can register and log in via UI | 2.3–2.5 | Manual + Vitest if useful |
| 2.7 | Protected route shell | Pending | Redirect unauthenticated users | Protected routes require auth | 2.6 | Manual |

---

## Phase 3 — Assessments

**Branch:** `phase/03-assessments`  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| 3.1 | Questions API + seed | Pending | MCQ model; create/list/seed by topic/difficulty | Questions available in DB | Phase 2 | API tests |
| 3.2 | Start assessment | Pending | Category/difficulty/count → attempt with questions | Attempt created with N questions | 3.1 | API tests |
| 3.3 | Submit + score | Pending | Score, %, correct/incorrect, topic breakdown | Results match answers | 3.2 | API tests |
| 3.4 | Web assessment flow | Pending | Select → take quiz → results UI | Full UI flow works | 3.2–3.3 | Manual |

---

## Phase 4 — Progress and recommendations

**Branch:** `phase/04-progress`  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| 4.1 | Progress aggregates API | Pending | History, weak topics, trends | Dashboard data from attempts | Phase 3 | API tests |
| 4.2 | Recommendations API | Pending | Ranked topics from history | Recommendations reflect weak areas | 4.1 | API tests |
| 4.3 | Web dashboard | Pending | Skill score, recent attempts, recommendations | Dashboard renders real data | 4.1–4.2 | Manual |

---

## Phase 5 — AI interview

**Branch:** `phase/05-ai-interview`  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| 5.1 | Interview session API | Pending | Role/tech/experience → session | Session persisted | Phase 2 | API tests |
| 5.2 | LLM Q&A + evaluate | Pending | Nest module calls LLM; stores feedback | Mocked LLM path tested | 5.1 | API tests (mocked) |
| 5.3 | Web interview UI | Pending | Setup + conversational UI + feedback | End-to-end interview UX | 5.2 | Manual |

---

## Phase 6 — Coding challenges

**Branch:** `phase/06-coding`  
**Status:** Pending

| ID | Task | Status | Description | Acceptance criteria | Depends | Testing |
|----|------|--------|-------------|---------------------|---------|---------|
| 6.1 | Problems API | Pending | Problem + test-case models/list | Problems listable | Phase 2 | API tests |
| 6.2 | Submit + run tests | Pending | Safe execution strategy (TBD in phase) | Pass/fail results returned | 6.1 | API tests |
| 6.3 | Web editor + results | Pending | Editor, submit, show results | UI shows execution outcome | 6.2 | Manual |

---

## Workflow reminders

1. One phase branch at a time.  
2. One task → test → update this file → commit commands → wait for confirmation.  
3. User owns commits, PRs, and merges.  
4. Next phase only after merge confirmation.
