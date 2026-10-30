#!/usr/bin/env bash
# Boots a dedicated Postgres for e2e (does not touch Compose), migrates, tests, then removes it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CONTAINER="${E2E_POSTGRES_CONTAINER:-toca-postgres-e2e}"
PORT="${E2E_POSTGRES_PORT:-55432}"
IMAGE="${E2E_POSTGRES_IMAGE:-postgres:16}"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup

docker run -d --name "$CONTAINER" \
  -e POSTGRES_USER=toca \
  -e POSTGRES_PASSWORD=toca \
  -e POSTGRES_DB=toca_packs \
  -p "${PORT}:5432" \
  "$IMAGE" >/dev/null

echo "Waiting for ${CONTAINER} on localhost:${PORT}..."
ready=0
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" pg_isready -U toca -d toca_packs >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "Postgres e2e container did not become ready in time" >&2
  exit 1
fi

export DATABASE_HOST=localhost
export DATABASE_PORT="$PORT"
export DATABASE_USER=toca
export DATABASE_PASSWORD=toca
export DATABASE_NAME=toca_packs

pnpm run migration:run
pnpm exec vitest run --config ./vitest.config.e2e.ts
