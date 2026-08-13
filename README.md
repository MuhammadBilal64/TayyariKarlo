# TayyariKarlo

AI-assisted interview and assessment platform for students and developers.

Monorepo with a NestJS API, React web app, and shared Zod contracts.

## Stack

| Layer | Technology |
|-------|------------|
| Web | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query (later) |
| API | NestJS, Prisma, PostgreSQL |
| Shared | Zod (`@tayyari/shared`) |
| Tooling | pnpm workspaces, Prettier, ESLint / Oxlint, GitHub Actions |

## Repository layout

```
apps/api          NestJS API (prefix: /api/v1)
apps/web          React web app
packages/shared   Shared Zod schemas and enums
```

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9.15+ (`corepack enable` or `npm i -g pnpm`)
- Docker Desktop (for Postgres)

## Local setup

### 1. Clone and install

```bash
git clone <repo-url>
cd TayyariKarlo
pnpm install
```

### 2. Environment files

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env
```

Defaults match the Compose Postgres service. See root [`.env.example`](.env.example) for the full variable list.

### 3. Start Postgres

```bash
docker compose up -d
```

### 4. Migrate the database

```bash
pnpm --filter @tayyari/api exec prisma migrate deploy
# or during development:
pnpm --filter @tayyari/api prisma:migrate
```

### 5. Build shared contracts

```bash
pnpm --filter @tayyari/shared build
```

### 6. Run apps

```bash
pnpm dev
```

- API: http://localhost:3000/api/v1/health  
- Web: http://localhost:5173  

## Common scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + web in watch mode |
| `pnpm build` | Build shared, API, and web |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm typecheck` | TypeScript checks |
| `pnpm test` | Unit tests |

## Development workflow

See [instructions.md](instructions.md) and [phases.md](phases.md).

- One phase branch at a time (`phase/NN-name`)
- One task per commit
- Phase 1 = project setup (this branch)

## Phase status

Phase 1 (project setup) delivers the monorepo scaffold, NestJS + React apps, shared package, Postgres/Prisma, lint/format, CI, and this runbook.

Next: Phase 2 — authentication and users.
