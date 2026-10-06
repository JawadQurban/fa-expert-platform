#!/usr/bin/env bash
# Roll the Expert Hub frontend container back to the previously-deployed image
# (recorded by deploy-expert-hub.sh). Targets the Expert Hub service only.
#
# Usage: rollback-expert-hub.sh [image-ref]
#   image-ref defaults to the recorded previous image (.previous-image).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$DEPLOY_DIR/.env.expert-hub" ]; then
  set -a; . "$DEPLOY_DIR/.env.expert-hub"; set +a
fi

CONTAINER="${EXPERT_HUB_CONTAINER:-expert-hub-frontend}"
HOST_PORT="${EXPERT_HUB_HOST_PORT:-8085}"

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  if [ ! -f "$SCRIPT_DIR/.previous-image" ]; then
    echo "[rollback-expert-hub] ERROR: no recorded previous image and none given." >&2
    exit 2
  fi
  TARGET="$(cat "$SCRIPT_DIR/.previous-image")"
fi

if ! docker image inspect "$TARGET" >/dev/null 2>&1; then
  echo "[rollback-expert-hub] ERROR: image ${TARGET} not found locally." >&2
  exit 2
fi

echo "[rollback-expert-hub] rolling back ${CONTAINER} → ${TARGET}"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  --restart unless-stopped \
  --security-opt no-new-privileges:true \
  --tmpfs /tmp \
  -e "EXPERT_HUB_API_BASE_URL=${EXPERT_HUB_API_BASE_URL:-}" \
  -e "EXPERT_HUB_ENV=${EXPERT_HUB_ENV:-production}" \
  -e "EXPERT_HUB_SSO_ENTRY_URL=${EXPERT_HUB_SSO_ENTRY_URL:-}" \
  -e "EXPERT_HUB_TELEMETRY_URL=${EXPERT_HUB_TELEMETRY_URL:-}" \
  -p "127.0.0.1:${HOST_PORT}:8080" \
  "$TARGET" >/dev/null

for _ in $(seq 1 30); do
  if wget -q --spider "http://127.0.0.1:${HOST_PORT}/health" 2>/dev/null; then
    echo "[rollback-expert-hub] rolled back to ${TARGET} (healthy)."
    exit 0
  fi
  sleep 1
done
echo "[rollback-expert-hub] ERROR: container did not become healthy after rollback." >&2
exit 1
