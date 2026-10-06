# syntax=docker/dockerfile:1
#
# Expert Hub — standalone ASP.NET Core API production image.
#
# Multi-stage: .NET SDK publish → aspnet runtime. The final image contains ONLY
# the published API — no SDK, no source, no secrets. Secrets (the connection
# string, the OIDC client secret) arrive as environment variables at run time,
# never at build time (`P-159`/`P-163`; a test fails the build if a value ever
# appears in appsettings).
#
# Build context = REPOSITORY ROOT (needs `backend/`):
#   docker build -f deploy/api.Dockerfile -t expert-hub-api:<tag> .
#
# Topology served: Browser → Server Nginx (/api/) → THIS container (:8080).
# The app honours X-Forwarded-Proto/Host, so the OIDC redirect URI it builds
# is the public https URL, not the internal one.
#
# ⚠️ Runtime debt, tracked as BE-21: the backend targets net9.0 (out of
# support since May 2026). Moving to the LTS is one line in
# `backend/Directory.Build.props` plus the two tags below.

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — publish (Expert Hub API only)
# ─────────────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Restore from the project graph first (layer-cached until a csproj changes).
COPY backend/Directory.Build.props backend/
COPY backend/src/ExpertHub.Core/ExpertHub.Core.csproj backend/src/ExpertHub.Core/
COPY backend/src/ExpertHub.Infrastructure/ExpertHub.Infrastructure.csproj backend/src/ExpertHub.Infrastructure/
COPY backend/src/ExpertHub.Api/ExpertHub.Api.csproj backend/src/ExpertHub.Api/
RUN dotnet restore backend/src/ExpertHub.Api/ExpertHub.Api.csproj

# 2. Copy the backend source and publish Release (warnings are errors there,
#    so an image that builds is an image with a clean compile).
COPY backend/ backend/
RUN dotnet publish backend/src/ExpertHub.Api/ExpertHub.Api.csproj \
    -c Release -o /app/publish --no-restore

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime (non-root)
# ─────────────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# curl for the compose healthcheck only (the aspnet image ships without it).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# The data-protection keys live on a named volume (compose). Pre-create the
# directory OWNED BY THE APP USER while still root: a named volume inherits
# the image directory's ownership on first use — without this it mounts
# root-owned, the non-root app cannot write its encryption key, and every
# SSO challenge dies at WriteNonceCookie with 'Permission denied'.
RUN mkdir -p /home/app/.aspnet/DataProtection-Keys     && chown -R $APP_UID /home/app/.aspnet

# Uploaded documents, on the same principle and for the same reason: the
# volume inherits that directory's ownership, and without it the non-root app
# cannot write a single attachment.
RUN mkdir -p /var/expert-hub/documents     && chown -R $APP_UID /var/expert-hub

# The aspnet image ships an unprivileged user; run as it.
USER $APP_UID

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "ExpertHub.Api.dll"]
