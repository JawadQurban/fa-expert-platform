#!/usr/bin/env bash
# Verify a running Expert Hub frontend container (against its localhost port).
# Checks: /health, the SPA at the base path, a nested route (SPA fallback), the
# runtime config.js, and that a nonexistent asset returns 404 (not the SPA doc).
#
# Usage: verify-expert-hub.sh [host-port] [base-path]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$DEPLOY_DIR/.env.expert-hub" ]; then
  set -a; . "$DEPLOY_DIR/.env.expert-hub"; set +a
fi

PORT="${1:-${EXPERT_HUB_HOST_PORT:-8085}}"
BASE="${2:-${EXPERT_HUB_BASE_PATH:-/expert-hub}}"
HOST="http://127.0.0.1:${PORT}"
fail=0

code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

check() {  # $1 = description, $2 = url, $3 = expected code
  local got; got="$(code "$2")"
  if [ "$got" = "$3" ]; then
    echo "  ok   [$3] $1"
  else
    echo "  FAIL [want $3, got $got] $1  ($2)"; fail=1
  fi
}

echo "[verify-expert-hub] target ${HOST} (base ${BASE})"
check "health endpoint"          "${HOST}/health"                          200
check "bare prefix redirects"    "${HOST}${BASE}"                          301
check "SPA app root"             "${HOST}${BASE}/"                         200
check "nested route (refresh)"   "${HOST}${BASE}/applications"             200
check "deep nested route"        "${HOST}${BASE}/applications/new"         200
check "runtime config.js"        "${HOST}${BASE}/config.js"               200
check "missing asset ⇒ 404"      "${HOST}${BASE}/assets/does-not-exist.js" 404
check "missing file ⇒ 404"       "${HOST}${BASE}/nope.js"                  404

# config.js must be a non-cacheable script exposing the runtime global.
if curl -s "${HOST}${BASE}/config.js" | grep -q '__EXPERT_HUB_RUNTIME_CONFIG__'; then
  echo "  ok   config.js exposes __EXPERT_HUB_RUNTIME_CONFIG__"
else
  echo "  FAIL config.js missing __EXPERT_HUB_RUNTIME_CONFIG__"; fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "[verify-expert-hub] ALL CHECKS PASSED"
else
  echo "[verify-expert-hub] FAILURES DETECTED" >&2
fi
exit "$fail"
