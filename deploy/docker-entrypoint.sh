#!/bin/sh
# Expert Hub — runtime config generator.
#
# Installed as /docker-entrypoint.d/40-expert-hub-runtime-config.sh, so the stock
# Nginx entrypoint runs it BEFORE starting Nginx. It renders config.js.template
# with the container's environment variables and writes the browser-visible
# config.js the app reads at bootstrap. Same image → any environment.
#
# ⚠️ Only public frontend values are injected here — never secrets.
set -eu

TEMPLATE="/etc/expert-hub/config.js.template"
TARGET="/usr/share/nginx/html/expert-hub/config.js"

# Safe defaults so an unset variable never becomes a literal "$VAR" in output.
export EXPERT_HUB_API_BASE_URL="${EXPERT_HUB_API_BASE_URL:-}"
export EXPERT_HUB_DATA_MODE="${EXPERT_HUB_DATA_MODE:-api}"
export EXPERT_HUB_ENV="${EXPERT_HUB_ENV:-production}"
export EXPERT_HUB_SSO_ENTRY_URL="${EXPERT_HUB_SSO_ENTRY_URL:-}"
export EXPERT_HUB_TELEMETRY_URL="${EXPERT_HUB_TELEMETRY_URL:-}"

# OpenID Connect (INT-01). All public values — see the template's warning:
# there is deliberately no client-secret variable; a browser cannot keep one.
export EXPERT_HUB_OIDC_ISSUER="${EXPERT_HUB_OIDC_ISSUER:-}"
export EXPERT_HUB_OIDC_DISCOVERY_URL="${EXPERT_HUB_OIDC_DISCOVERY_URL:-}"
export EXPERT_HUB_OIDC_CLIENT_ID="${EXPERT_HUB_OIDC_CLIENT_ID:-}"
export EXPERT_HUB_OIDC_SCOPES="${EXPERT_HUB_OIDC_SCOPES:-openid profile email}"
export EXPERT_HUB_OIDC_REDIRECT_URI="${EXPERT_HUB_OIDC_REDIRECT_URI:-}"
export EXPERT_HUB_OIDC_POST_LOGOUT_REDIRECT_URI="${EXPERT_HUB_OIDC_POST_LOGOUT_REDIRECT_URI:-}"
export EXPERT_HUB_OIDC_ROLE_CLAIM="${EXPERT_HUB_OIDC_ROLE_CLAIM:-}"
export EXPERT_HUB_OIDC_INTERNAL_ROLE_VALUES="${EXPERT_HUB_OIDC_INTERNAL_ROLE_VALUES:-}"
export EXPERT_HUB_OIDC_TRAINER_ROLE_VALUES="${EXPERT_HUB_OIDC_TRAINER_ROLE_VALUES:-}"
export EXPERT_HUB_OIDC_NAME_CLAIM="${EXPERT_HUB_OIDC_NAME_CLAIM:-name}"

# A secret must never reach the browser bundle. If one is set on this container,
# stop rather than let a deployment believe it was used for anything here.
if [ -n "${EXPERT_HUB_OIDC_CLIENT_SECRET:-}" ]; then
    echo "[expert-hub] ERROR: EXPERT_HUB_OIDC_CLIENT_SECRET is set on the frontend container." >&2
    echo "[expert-hub]        A browser client cannot hold a secret. A confidential" >&2
    echo "[expert-hub]        client's token exchange belongs in the Expert Hub API." >&2
    exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
    echo "[expert-hub] ERROR: config template not found at $TEMPLATE" >&2
    exit 1
fi

# Only substitute our own variables (never touch other $… in the file).
envsubst '${EXPERT_HUB_API_BASE_URL} ${EXPERT_HUB_DATA_MODE} ${EXPERT_HUB_ENV} ${EXPERT_HUB_SSO_ENTRY_URL} ${EXPERT_HUB_TELEMETRY_URL} ${EXPERT_HUB_OIDC_ISSUER} ${EXPERT_HUB_OIDC_DISCOVERY_URL} ${EXPERT_HUB_OIDC_CLIENT_ID} ${EXPERT_HUB_OIDC_SCOPES} ${EXPERT_HUB_OIDC_REDIRECT_URI} ${EXPERT_HUB_OIDC_POST_LOGOUT_REDIRECT_URI} ${EXPERT_HUB_OIDC_ROLE_CLAIM} ${EXPERT_HUB_OIDC_INTERNAL_ROLE_VALUES} ${EXPERT_HUB_OIDC_TRAINER_ROLE_VALUES} ${EXPERT_HUB_OIDC_NAME_CLAIM}' \
    < "$TEMPLATE" > "$TARGET"

echo "[expert-hub] wrote $TARGET (env=${EXPERT_HUB_ENV}, api=${EXPERT_HUB_API_BASE_URL:-<mock>}, oidc=${EXPERT_HUB_OIDC_CLIENT_ID:-<not configured>})"
