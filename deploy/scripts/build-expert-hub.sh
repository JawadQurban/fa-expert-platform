#!/usr/bin/env bash
# Build the Expert Hub frontend Docker image (this product ONLY).
# Usage: build-expert-hub.sh [image-tag]   (default tag: timestamp)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"

# Optional non-secret build config (base path / env label).
if [ -f "$DEPLOY_DIR/.env.expert-hub" ]; then
  set -a; . "$DEPLOY_DIR/.env.expert-hub"; set +a
fi

IMAGE="${EXPERT_HUB_IMAGE:-expert-hub-frontend}"
TAG="${1:-$(date +%Y%m%d-%H%M%S)}"
BASE_PATH="${EXPERT_HUB_BASE_PATH:-/expert-hub}"
ENV_NAME="${EXPERT_HUB_ENV:-production}"

echo "[build-expert-hub] building ${IMAGE}:${TAG} (base=${BASE_PATH}, env=${ENV_NAME})"

docker build \
  -f "$REPO_ROOT/deploy/Dockerfile" \
  --build-arg "EXPERT_HUB_BASE_PATH=${BASE_PATH}" \
  --build-arg "EXPERT_HUB_ENV=${ENV_NAME}" \
  -t "${IMAGE}:${TAG}" \
  -t "${IMAGE}:latest" \
  "$REPO_ROOT"

printf '%s\n' "$TAG" > "$SCRIPT_DIR/.last-built-tag"
echo "[build-expert-hub] built ${IMAGE}:${TAG}  (also tagged :latest)"
echo "[build-expert-hub] deploy with:  ./deploy-expert-hub.sh ${TAG}"
