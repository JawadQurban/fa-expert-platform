# syntax=docker/dockerfile:1
#
# Expert Hub — standalone frontend production image.
#
# Multi-stage: Node build → static assets served by a NON-ROOT Nginx. The final
# image contains ONLY the Expert Hub production assets + minimal Nginx runtime —
# no Node, no source, no Hackathon code, no secrets.
#
# Build context = REPOSITORY ROOT (needs `frontend/` + `deploy/`):
#   docker build -f deploy/Dockerfile -t expert-hub-frontend:<tag> .
#
# Topology served: Browser → Server Nginx → THIS container's Nginx (:8080) → SPA.

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — build (Expert Hub only)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app/frontend

# Build-time configuration. The base path is baked into hashed asset URLs, so it
# MUST be fixed at build time (default `/expert-hub`; `''` for a root deployment).
ARG EXPERT_HUB_BASE_PATH=/expert-hub
ARG EXPERT_HUB_ENV=production
ENV VITE_EXPERT_HUB_BASE_PATH=${EXPERT_HUB_BASE_PATH} \
    VITE_EXPERT_HUB_ENV=${EXPERT_HUB_ENV}

# 1. Reproducible, clean dependency install from the lockfile (layer-cached).
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2. Copy the frontend source and build the Expert Hub app ONLY.
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime (non-root Nginx, static only)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Runtime configuration defaults — override at `docker run`/compose. These are
# injected into the browser-visible `config.js` at container start (entrypoint).
# ⚠️ Public frontend values only — never secrets/credentials.
ENV EXPERT_HUB_API_BASE_URL="" \
    EXPERT_HUB_ENV="production" \
    EXPERT_HUB_SSO_ENTRY_URL="" \
    EXPERT_HUB_TELEMETRY_URL=""

USER root

# Container Nginx server block (SPA fallback, caching, security headers, /health).
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Runtime-config template + generator (runs before Nginx via /docker-entrypoint.d).
COPY deploy/config.js.template /etc/expert-hub/config.js.template
COPY deploy/docker-entrypoint.sh /docker-entrypoint.d/40-expert-hub-runtime-config.sh

# Only the compiled Expert Hub assets (served under the base path).
COPY --from=build /app/frontend/dist /usr/share/nginx/html/expert-hub

# Let the non-root nginx user regenerate config.js + make the generator runnable.
RUN chmod +x /docker-entrypoint.d/40-expert-hub-runtime-config.sh \
    && chown -R nginx:nginx /usr/share/nginx/html/expert-hub /etc/expert-hub

USER nginx

EXPOSE 8080

# Liveness: the container's own /health endpoint (base-path independent).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/health || exit 1
