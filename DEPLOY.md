# Deploy TayyariKarlo (free tier)

**Stack:** Vercel (web) + Render (API) + Neon (Postgres)

You will create three free accounts. Order matters: **Neon → Render → Vercel**.

---

## 0. Push this branch to GitHub

```powershell
git push -u origin HEAD
```

Merge to `main` (or deploy from this branch). Vercel/Render will pull from GitHub.

---

## 1. Neon (database) — free

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up (GitHub login is fine).
2. Create a project (e.g. `tayyari`).
3. Open **Connection details** → copy the **pooled** connection string if shown, otherwise the standard `DATABASE_URL`.
4. It looks like:
   `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`
5. Keep this secret. You will paste it into Render.

---

## 2. Render (API) — free

1. Go to [https://render.com](https://render.com) → sign up with GitHub.
2. **New** → **Blueprint** (uses `render.yaml`) **or** **Web Service** manually:

### Option A — Blueprint

1. Connect the `TayyariKarlo` repo.
2. Render reads `render.yaml`.
3. Fill in env vars that are `sync: false` (see below).

### Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Root directory | *(leave empty / repo root)* |
| Runtime | Node |
| Build command | `npm install -g pnpm@9.15.4 && pnpm install --frozen-lockfile && pnpm --filter @tayyari/shared build && pnpm --filter @tayyari/api exec prisma generate && pnpm --filter @tayyari/api build` |
| Start command | `pnpm --filter @tayyari/api exec prisma migrate deploy && pnpm --filter @tayyari/api exec prisma db seed && pnpm --filter @tayyari/api start:prod` |
| Env `NODE_VERSION` | `22.14.0` (optional but recommended; avoid Node 26) |
| Instance | **Free** |
| Health check path | `/api/v1/health` |

### Env vars on Render

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `PORT` | *(leave to Render — do not override)* |
| `DATABASE_URL` | *(Neon connection string)* |
| `JWT_ACCESS_SECRET` | long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | different long random string |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `COOKIE_SAME_SITE` | `none` |
| `CORS_ORIGIN` | your Vercel URL (set after step 3, then redeploy) |
| `ALLOW_QUESTION_SEED` | `false` |

Generate secrets locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run twice for access + refresh secrets.

4. Deploy. Wait until the service is **Live**.
5. Copy the API URL, e.g. `https://tayyari-api.onrender.com`
6. Check health: open `https://YOUR-API.onrender.com/api/v1/health`

**Note:** Free Render services **sleep** after idle; the first request can take ~30–60s.

---

## 3. Vercel (web) — free

1. Go to [https://vercel.com](https://vercel.com) → sign up with GitHub.
2. **Add New Project** → import `TayyariKarlo`.
3. Settings:

| Setting | Value |
|---------|--------|
| Framework Preset | Vite |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @tayyari/web build` |
| Output Directory | `dist` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

4. Environment variable:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com/api/v1` |

5. Deploy. Copy the web URL, e.g. `https://tayyari-karlo.vercel.app`

---

## 4. Connect CORS (important)

Back on **Render** → API service → Environment:

```
CORS_ORIGIN=https://tayyari-karlo.vercel.app
```

(Use your real Vercel URL. You can add both `https://….vercel.app` and a custom domain later, comma-separated.)

**Manual Deploy** the API again so CORS picks up the change.

---

## 5. Smoke test

1. Open the Vercel URL (wait if API is waking up).
2. Register a new account.
3. Start an assessment (any topic) → submit → see results.
4. Open `/app` dashboard → skill score / recommendations.

If login works but refresh fails after reload, confirm `COOKIE_SAME_SITE=none` and HTTPS on both sides.

---

## Local reminder after deploy

Do not put production secrets in git. Keep using `apps/api/.env` / `apps/web/.env` for local only.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API 502 / slow first load | Render free cold start — wait and retry |
| CORS errors in browser | `CORS_ORIGIN` must exactly match the Vercel origin (https, no trailing slash) |
| DB connection failed | Neon URL needs `?sslmode=require`; use the connection string Neon shows |
| Empty questions | Start command must run `prisma db seed` once; check Render logs |
| Build fails on pnpm / `corepack` EROFS | Do **not** use `corepack enable`. Use `npm install -g pnpm@9.15.4 && …` |
| Weird Node 26 | Set env `NODE_VERSION=22.14.0` or engines `22.x` |
