# Expert Hub — Deployment Guide

How to build, run, and deploy the **Expert Hub frontend** as an independently
deployable Docker application, served behind the server's existing Nginx.

> Scope: **frontend only**. The ASP.NET Core backend is **not** part of this
> setup — the frontend is prepared to reach it later via runtime configuration
> (§ [Future backend](#future-backend-routing)). This deployment touches **Expert
> Hub only** and does not modify or redeploy the Hackathon or any other product.

---

## Architecture

```
                         ┌─────────────────────────── the server host ──────────────────────────┐
                         │                                                                        │
Browser ──HTTPS──▶ Server Nginx (443, TLS)                                                        │
                         │   location /expert-hub/  ──proxy──▶  127.0.0.1:8085 ┐                   │
                         │   location /            → other products (UNCHANGED)│                   │
                         │                                                     ▼                   │
                         │                             Expert Hub Docker container                 │
                         │                               Container Nginx (:8080, non-root)         │
                         │                                 ├─ /health → 200                        │
                         │                                 ├─ /expert-hub/assets/* (immutable)     │
                         │                                 ├─ /expert-hub/config.js (no-store)     │
                         │                                 └─ /expert-hub/* → SPA index.html        │
                         │                                        static Expert Hub React build    │
                         └────────────────────────────────────────────────────────────────────────┘
```

- **Base path** `/expert-hub/` is preserved end-to-end (external Nginx → container Nginx → asset URLs).
- The container binds to **`127.0.0.1:8085`** only; the external Nginx is the sole public entry.
- The image is built **once** and moved between Development / UAT / Production unchanged — the environment-specific values (API URL, etc.) are injected at **container start** (§ [Runtime configuration](#runtime-configuration)).

---

## Prerequisites

- Docker 24+ (BuildKit) on the build/deploy host.
- The server's existing Nginx (reverse proxy, TLS termination).
- Node is **not** needed on the server — only to build locally without Docker.

---

## Files

| Path | Purpose |
|---|---|
| `deploy/Dockerfile` | Multi-stage build (Node build → non-root Nginx runtime). |
| `deploy/nginx.conf` | Container Nginx server block (SPA fallback, caching, security, `/health`). |
| `deploy/docker-entrypoint.sh` | Regenerates `config.js` from env at container start. |
| `deploy/config.js.template` | Runtime-config template (`envsubst`). |
| `deploy/docker-compose.yml` | Expert Hub-only compose (localhost-bound, healthcheck). |
| `deploy/server-nginx.example.conf` | External reverse-proxy example (copy into the host config). |
| `deploy/.env.expert-hub.example` | Env example (copy to `.env.expert-hub`). |
| `deploy/scripts/` | `build` / `deploy` / `rollback` / `verify` scripts. |
| `frontend/vite.config.ts` | Expert Hub-only Vite build → `dist/`. |
| `frontend/index.html` | Standalone document shell. |
| `frontend/src/main.tsx` | Standalone bootstrap (Expert Hub router only). |
| `.dockerignore` (repo root) | Keeps `node_modules`/secrets out of the build context. |

---

## Local build (no Docker)

```bash
cd frontend
npm ci
npm run build          # → frontend/dist/ (Expert Hub ONLY)
npm run preview        # serve the built app locally under /expert-hub/
```

`build` typechecks, runs the dedicated Vite build (base = `VITE_EXPERT_HUB_BASE_PATH`, default `/expert-hub`), and renames the entry to `index.html`.

---

## Local Docker build & run

From the **repository root** (build context = repo root):

```bash
# Build
docker build -f deploy/Dockerfile \
  --build-arg EXPERT_HUB_BASE_PATH=/expert-hub \
  -t expert-hub-frontend:local .

# Run (localhost:8085 → container :8080)
docker run --rm -p 127.0.0.1:8085:8080 \
  -e EXPERT_HUB_ENV=development \
  --name expert-hub-frontend expert-hub-frontend:local
```

Convenience scripts (from `frontend/`): `npm run docker:build`, `npm run docker:run:expert-hub`.

Then verify:

```bash
curl -i http://127.0.0.1:8085/health              # 200 ok
curl -i http://127.0.0.1:8085/expert-hub/         # 200 SPA
deploy/scripts/verify-expert-hub.sh 8085
```

---

## Docker Compose

```bash
cd deploy
cp .env.expert-hub.example .env      # edit as needed (git-ignored)
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f expert-hub-frontend
docker compose down                  # stops ONLY this service
```

The compose project is named `expert-hub` and defines only the `expert-hub-frontend` service — it never affects other stacks.

---

## Runtime configuration

The image is environment-agnostic. Configuration is split:

| Value | When | How |
|---|---|---|
| `EXPERT_HUB_BASE_PATH` | **build-time** (baked into asset URLs) | Docker build arg → Vite `base` + router prefix. |
| `EXPERT_HUB_API_BASE_URL` | **runtime** | Container env → `config.js` → `window.__EXPERT_HUB_RUNTIME_CONFIG__`. |
| `EXPERT_HUB_ENV` | runtime | Container env → `config.js`. |
| `EXPERT_HUB_SSO_ENTRY_URL` | runtime | Container env → `config.js`. |
| `EXPERT_HUB_TELEMETRY_URL` | runtime | Container env → `config.js`. |

At container start, `docker-entrypoint.sh` runs `envsubst` over `config.js.template` and writes `/usr/share/nginx/html/expert-hub/config.js`. The app reads it via the typed reader `src/app/config/runtimeConfig.ts` (priority: runtime `config.js` → build-time Vite env → safe default). **Empty `EXPERT_HUB_API_BASE_URL` ⇒ the in-memory mock providers** (no backend needed).

> **Security:** `config.js` is browser-visible. It must contain **only** the
> Expert Hub API base URL + public auth entry details — **never** secrets,
> tokens, or FAST / MTM / ERP / SQL Server credentials. Those live behind the
> future Expert Hub API. Unsubstituted placeholders are ignored by the reader
> (falls back to the mock) so a misconfigured container fails safe.

Example per environment (same image):

```bash
# UAT
docker run -d -p 127.0.0.1:8085:8080 \
  -e EXPERT_HUB_ENV=uat \
  -e EXPERT_HUB_API_BASE_URL=https://uat.example.sa/expert-hub/api \
  --name expert-hub-frontend expert-hub-frontend:1.0.0
```

---

## External server Nginx

Copy the blocks from `deploy/server-nginx.example.conf` into the
**existing** server `server{}`. It routes only `/expert-hub/` to the container and
preserves the prefix, forwarded headers, real client IP, host, protocol, and
WebSocket upgrade. **Do not change the default `/` route or other products.**

> ⚠️ **`client_max_body_size` on the `/api/` location is required** (added
> 2026-09-03). nginx defaults to **1 MB**, and an upload of a 1 MB document is
> a multipart body slightly larger than the file — so the default rejects the
> exact size the attachment rules allow, with a **413 the API never receives**
> and the browser reports as a generic upload failure. This file is an
> *example*: editing it changes nothing on a server whose config was copied
> from it earlier. Check the live config for the line, and add it if missing:
>
> ```bash
> grep -n client_max_body_size /etc/nginx/sites-enabled/*   # is it there?
> sudo nginx -t && sudo systemctl reload nginx              # after adding it
> ```

> ⚠️ **`large_client_header_buffers` is required too** (added 2026-09-06).
> nginx's request-header buffers default to 4 × 8k, and a session cookie can
> exceed that — the answer is a flat `400 Request Header Or Cookie Too Large`
> from nginx, before the API sees anything. The platform now keeps the session
> ticket server-side so its own cookie is one GUID (`P-214`), but this stays as
> the floor because every other cookie on the host counts toward the same
> limit. Put it in the `server{}` block:
>
> ```nginx
> large_client_header_buffers 8 32k;
> ```

```bash
sudo nginx -t                # validate
sudo systemctl reload nginx  # reload (never a destructive restart)
```

Reload the external Nginx **only when its Expert Hub configuration changed** — a
routine image redeploy does not require it.

---

## Server deployment (CI/CD flow)

All scripts target the Expert Hub service by explicit name and never touch other
containers/images/networks. They use `set -euo pipefail`, versioned tags, a
health-gated swap, and record the previous image for rollback.

```bash
# 1. Pull approved source, then from the repo root:
cd deploy

# 2. Build a versioned image
./scripts/build-expert-hub.sh 1.0.0          # → expert-hub-frontend:1.0.0 (+ :latest)

# 3. (optional) run Expert Hub validation before shipping
( cd ../../frontend && npm run validate )

# 4. Deploy: smoke-test the new image, then replace ONLY the Expert Hub container
./scripts/deploy-expert-hub.sh 1.0.0

# 5–7. verify (deploy runs this automatically; or manually)
./scripts/verify-expert-hub.sh

# 8. Other containers + server routes are untouched.
# 9. Reload external Nginx ONLY if its Expert Hub config changed (see above).
```

`deploy-expert-hub.sh` starts the new image in a throwaway container on an
ephemeral port, waits for `/health`, and only then replaces the live container —
keeping the old image available for rollback.

---

## Verification

`verify-expert-hub.sh` checks, against the container's localhost port:

| Check | Expected |
|---|---|
| `/health` | `200 ok` |
| `/expert-hub` | `301 → /expert-hub/` |
| `/expert-hub/` | `200` (SPA) |
| `/expert-hub/applications` (refresh) | `200` (SPA fallback) |
| `/expert-hub/applications/new` (refresh) | `200` (SPA fallback) |
| `/expert-hub/config.js` | `200`, contains `__EXPERT_HUB_RUNTIME_CONFIG__` |
| `/expert-hub/assets/<missing>.js` | `404` (not the SPA doc) |
| `/expert-hub/nope.js` | `404` |

**Route-refresh test:** open `/expert-hub/applications/<id>` and hard-refresh —
the container's SPA fallback serves `index.html` and the router restores the view.

**MIME + caching:** `assets/*` return correct content types with
`Cache-Control: public, max-age=31536000, immutable`; `index.html` is `no-cache`;
`config.js` is `no-store`.

---

## Health, logs, cache

- **Health:** `GET /health → 200`. Docker `HEALTHCHECK` + compose healthcheck use it.
- **Logs:** `docker logs -f expert-hub-frontend` (or `docker compose logs -f`).
- **Cache invalidation:** asset filenames are content-hashed, so a new build
  produces new URLs automatically. `index.html` (`no-cache`) and `config.js`
  (`no-store`) are always revalidated, so a redeploy is picked up immediately —
  no manual cache purge needed.

---

## Rollback

```bash
cd deploy
./scripts/rollback-expert-hub.sh                 # → previous recorded image
# or explicitly:
./scripts/rollback-expert-hub.sh expert-hub-frontend:0.9.0
```

`deploy-expert-hub.sh` records the previously-running image in
`scripts/.previous-image` and auto-rolls-back if the new live container fails its
post-swap health check.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Blank page, assets 404 | Base-path mismatch. Ensure the build's `EXPERT_HUB_BASE_PATH` matches where the external Nginx serves it, and that `proxy_pass` preserves the `/expert-hub/` prefix (no trailing slash). |
| Refreshing a nested route 404s at the server | External Nginx not forwarding `/expert-hub/*` to the container, or stripping the prefix. Use the example `location /expert-hub/`. |
| API calls fail after connecting a backend | `EXPERT_HUB_API_BASE_URL` unset/typo. Check `curl .../expert-hub/config.js`. |
| `config.js` shows `${…}` literally | Entrypoint didn't run/substitute; the reader ignores placeholders and falls back to mock. Check container logs. |
| Container unhealthy | `docker logs expert-hub-frontend`; confirm `:8080` and `/health`. |
| Port already in use | Change `EXPERT_HUB_HOST_PORT` (compose/env) to a free localhost port. |

---

## Future backend routing

When the Expert Hub ASP.NET Core API ships, add a second location to the
**external** Nginx and point the frontend at it via runtime config — no image
rebuild for the URL:

```
External Nginx
├── /expert-hub/      → React frontend container  (this deployment)
└── /expert-hub/api/  → ASP.NET Core API container (future, separate task)
```

```bash
docker run -d ... -e EXPERT_HUB_API_BASE_URL=/expert-hub/api ...
```

The future API stack (ASP.NET Core Web API, Expert Hub SQL Server, EF Core Code
First migrations, FAST/MTM/ERP integrations, Academy SSO) is deployed separately.
**Do not** create fake backend endpoints in Nginx, and **do not** add SQL Server
to this frontend compose.

### Database principle (future backend)

- The SQL Server schema is created/updated **only** through EF Core migrations, version-controlled.
- Production schema is **not** hand-created via SSMS; SSMS is for administration/approved troubleshooting only.
- Database migration is a **separate, controlled** deployment step.
- **The frontend container never connects to SQL Server.**

---

## Extraction boundary report

Expert Hub is independently extractable. Every current dependency, classified:

| Dependency | What | Classification |
|---|---|---|
| Design System (`@ds/*`) | `frontend/src/design-system` — components, tokens, providers | **copy or publish as a package** (`@fads/design-system`) and install. |
| Product-neutral shared (`@/shared`) | e.g. the shared `AcademyFooter` composition (P-15) | **copy** the neutral pieces Expert Hub uses. |
| Low-level utils (`@utils`, `@hooks`) | `cn`, `useMediaQuery`, … | **copy** (small, neutral). |
| i18n (`@i18n`) | `LocaleProvider` + i18next setup | **copy** (neutral). |
| Shared assets (`@/assets`) | background pattern, images used by Expert Hub | **copy** the referenced assets. |
| Shared types (`@/types`) | `Result`, `Locale` | **copy** (neutral). |
| Build tooling | Vite, tsconfig, ESLint, the `vite.config.ts` | **copy** (already Expert Hub-owned config). |
| Hackathon app (`@app`, `@/pages`, `@/features`, `@/content`, `@/components`, `@/layouts`) | Hackathon-specific | **none** — Expert Hub imports **zero** of these (enforced by `boundary.test.ts` + ESLint `no-restricted-imports`). |

**Extraction steps** (later, separate task):

1. Copy `frontend/src/` (the whole product, incl. `main.tsx`).
2. Install/copy the Design System (`@ds`) — package or source.
3. Copy the neutral shared utilities/assets/types/i18n it imports.
4. Copy `vite.config.ts`, `index.html`, `deploy/`, `scripts/finalize-expert-hub-dist.mjs`, `tsconfig*`, ESLint/Prettier config.
5. Set env (`VITE_EXPERT_HUB_BASE_PATH`, runtime `config.js`).
6. Set the route base (`/expert-hub` or `''`).
7. Connect the ASP.NET Core API (`EXPERT_HUB_API_BASE_URL`).
8. `docker build -f deploy/Dockerfile .`.

The import-boundary check (`boundary.test.ts`) runs in CI to prevent future coupling.

---

## Security notes

- Multi-stage build — **no Node, no source, no dev deps** in the final image; only static assets + minimal Nginx.
- Runtime image runs as a **non-root** user (`nginxinc/nginx-unprivileged`), listens on `:8080`, `no-new-privileges`.
- **No secrets in the image or `config.js`** — browser-visible values only. `.dockerignore` keeps `.env*` and `node_modules` out of the build context.
- **No source maps** in the production build (`sourcemap: false`).
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) set by the container Nginx; HSTS/CSP belong on the TLS-terminating external Nginx.
- The frontend container **never** proxies FAST / MTM / ERP / SQL Server.

---

## Known limitations

- The **backend is not implemented** here; with an empty `EXPERT_HUB_API_BASE_URL` the app runs on in-memory mock providers.
- Auth is the **dev-SSO placeholder** until the real Academy SSO (INT-01, `G16`/`G28`) lands.
- The spec's same-URL, role-resolved staff render (`/expert-hub`, `/expert-hub/applications` for staff) is currently implemented under `/expert-hub/internal/*` — a later routing reconciliation.
- The `/` (domain-root) standalone base is wired (`VITE_EXPERT_HUB_BASE_PATH=''`) but the exercised/tested target is `/expert-hub/`.
- Brotli is not compiled into the stock Nginx image; gzip is enabled.
