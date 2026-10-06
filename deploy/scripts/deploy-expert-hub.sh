#!/usr/bin/env bash
# Deploy/replace ONLY the Expert Hub frontend container. Health-gated: the new
# image is verified in a throwaway container before the live one is replaced, and
# the previously-running image is recorded for rollback. Targets the Expert Hub
# service by explicit name — never touches other containers/images/networks.
#
# Usage: deploy-expert-hub.sh <image-tag>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$DEPLOY_DIR/.env.expert-hub" ]; then
  set -a; . "$DEPLOY_DIR/.env.expert-hub"; set +a
fi

IMAGE="${EXPERT_HUB_IMAGE:-expert-hub-frontend}"
CONTAINER="${EXPERT_HUB_CONTAINER:-expert-hub-frontend}"
HOST_PORT="${EXPERT_HUB_HOST_PORT:-8085}"
TAG="${1:-${EXPERT_HUB_IMAGE_TAG:-}}"

if [ -z "$TAG" ]; then
  echo "[deploy-expert-hub] ERROR: image tag required. Usage: deploy-expert-hub.sh <image-tag>" >&2
  exit 2
fi
if ! docker image inspect "${IMAGE}:${TAG}" >/dev/null 2>&1; then
  echo "[deploy-expert-hub] ERROR: image ${IMAGE}:${TAG} not found. Build it first." >&2
  exit 2
fi

run_container() {  # $1 = container name, $2 = host port
  docker run -d --name "$1" \
    --restart unless-stopped \
    --security-opt no-new-privileges:true \
    --tmpfs /tmp \
    -e "EXPERT_HUB_API_BASE_URL=${EXPERT_HUB_API_BASE_URL:-}" \
    -e "EXPERT_HUB_ENV=${EXPERT_HUB_ENV:-production}" \
    -e "EXPERT_HUB_SSO_ENTRY_URL=${EXPERT_HUB_SSO_ENTRY_URL:-}" \
    -e "EXPERT_HUB_TELEMETRY_URL=${EXPERT_HUB_TELEMETRY_URL:-}" \
    -p "127.0.0.1:${2}:8080" \
    "${IMAGE}:${TAG}" >/dev/null
}

wait_healthy() {  # $1 = host port
  for _ in $(seq 1 30); do
    if wget -q --spider "http://127.0.0.1:${1}/health" 2>/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}

# 1. Smoke-test the new image in a throwaway container on an ephemeral port.
STAGING="${CONTAINER}-staging"
docker rm -f "$STAGING" >/dev/null 2>&1 || true
echo "[deploy-expert-hub] smoke-testing ${IMAGE}:${TAG}"
run_container "$STAGING" 0
STAGE_PORT="$(docker port "$STAGING" 8080/tcp | head -n1 | sed 's/.*://')"
if ! wait_healthy "$STAGE_PORT"; then
  echo "[deploy-expert-hub] ERROR: new image failed health check — NOT deploying." >&2
  docker logs --tail 40 "$STAGING" || true
  docker rm -f "$STAGING" >/dev/null 2>&1 || true
  exit 1
fi
docker rm -f "$STAGING" >/dev/null 2>&1 || true
echo "[deploy-expert-hub] new image healthy."

# 2. Record the currently-running image for rollback.
PREV_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$CONTAINER" 2>/dev/null || true)"
if [ -n "$PREV_IMAGE" ]; then
  printf '%s\n' "$PREV_IMAGE" > "$SCRIPT_DIR/.previous-image"
  echo "[deploy-expert-hub] previous image recorded: ${PREV_IMAGE}"
fi

# 3. Replace the live container (brief swap; old kept in image cache for rollback).
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
run_container "$CONTAINER" "$HOST_PORT"

# 4. Verify the live container; auto-rollback on failure.
if ! wait_healthy "$HOST_PORT"; then
  echo "[deploy-expert-hub] ERROR: live container unhealthy after swap — rolling back." >&2
  if [ -n "$PREV_IMAGE" ]; then
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    IMAGE="${PREV_IMAGE%:*}" TAG="${PREV_IMAGE##*:}" run_container "$CONTAINER" "$HOST_PORT" || true
  fi
  exit 1
fi

echo "[deploy-expert-hub] DEPLOYED ${IMAGE}:${TAG} → ${CONTAINER} (127.0.0.1:${HOST_PORT})"
"$SCRIPT_DIR/verify-expert-hub.sh" || {
  echo "[deploy-expert-hub] verification failed — see rollback-expert-hub.sh" >&2
  exit 1
}
echo "[deploy-expert-hub] version ${IMAGE}:${TAG} live. Reload external Nginx ONLY if its Expert Hub config changed."
