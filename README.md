# TayyariKarlo

AI-assisted interview and assessment platform for students and developers.

Monorepo with a NestJS API, React web app, and shared Zod contracts.

## Stack

| Layer   | Technology                                                                  |
| ------- | --------------------------------------------------------------------------- |
| Web     | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query (later) |
| API     | NestJS, Prisma, PostgreSQL                                                  |
| Shared  | Zod (`@tayyari/shared`)                                                     |
| Tooling | pnpm workspaces, Prettier, ESLint / Oxlint, GitHub Actions                  |

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

## Deploy (free)

See **[DEPLOY.md](DEPLOY.md)** — Vercel (web) + Render (API) + Neon (Postgres).

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

### 4. Generate Prisma Client and migrate

```bash
pnpm --filter @tayyari/api prisma:generate
pnpm --filter @tayyari/api exec prisma migrate deploy
# or during development (create + apply migrations):
pnpm --filter @tayyari/api prisma:migrate
```

### 5. Build shared contracts

```bash
pnpm --filter @tayyari/shared build
```

Required before `pnpm typecheck` or running the apps if `packages/shared/dist` is missing.

### 6. Run apps

```bash
pnpm dev
```

- API: http://localhost:3000/api/v1/health
- Web: http://localhost:5173

## Common scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Start API + web in watch mode |
| `pnpm build`        | Build shared, API, and web    |
| `pnpm lint`         | Lint all packages             |
| `pnpm format`       | Format with Prettier          |
| `pnpm format:check` | Check formatting              |
| `pnpm typecheck`    | TypeScript checks             |
| `pnpm test`         | Unit tests                    |

## Development workflow

See [instructions.md](instructions.md) and [phases.md](phases.md).

- One phase branch at a time (`phase/NN-name`)
- One task per commit
- Phase 1 = project setup (this branch)

## Phase status

Phases **1–4** are implemented on `main`: auth, MCQ assessments, progress aggregates, recommendations, and the signed-in dashboard.

Phase **5** interviews are on `main`. Hosted Render stays typed practice (`LLM_PROVIDER=mock`) and the session says that voice needs the local model.

A spoken round runs only when the API is on your machine:

1. Install [Ollama](https://ollama.com) and `ollama pull qwen2.5:7b-instruct`. Use `qwen2.5:14b` if you have about 16 GB free.
2. Install whisper.cpp `small` and Piper `en_US-lessac-medium`.
3. In `apps/api/.env`, set `LLM_PROVIDER=ollama` and the `WHISPER_*` / `PIPER_*` paths. Windows examples are in `apps/api/.env.example`.

The browser records 16 kHz WAV. You can edit the transcript before it is scored. Scores stay hidden until the round ends. Missing speech binaries do not switch the judge to the scripted scorer; type the answer instead.

Phase **6** (coding challenges) is still pending.

### Seed assessment questions

After migrate, load the question bank (12 MCQs per topic × difficulty):

```bash
pnpm --filter @tayyari/api prisma:seed
```

Assessments pick a **random subset** from that pool for each start.
