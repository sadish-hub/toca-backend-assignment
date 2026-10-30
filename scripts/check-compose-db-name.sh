#!/usr/bin/env bash
# Fail fast when a leftover one-off `toca-postgres` would block Compose `db`
# and leave the API with ENOTFOUND db (hostname `db` never joins the network).
set -euo pipefail

NAME="${COMPOSE_DB_CONTAINER:-toca-postgres}"

if ! docker inspect "$NAME" >/dev/null 2>&1; then
  exit 0
fi

# Already owned by this Compose project — safe to proceed.
project="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$NAME" 2>/dev/null || true)"
service="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.service"}}' "$NAME" 2>/dev/null || true)"
role="$(docker inspect -f '{{index .Config.Labels "com.toca.role"}}' "$NAME" 2>/dev/null || true)"

if [[ -n "$project" && "$service" == "db" ]] || [[ "$role" == "compose-db" ]]; then
  exit 0
fi

cat >&2 <<EOF
Error: container "${NAME}" already exists outside this Compose stack.

That usually means a one-off local Postgres from README "Local development"
is still running. Compose cannot create its \`db\` service with the same
name, so the API never gets hostname \`db\` on the Compose network
(looks like: getaddrinfo ENOTFOUND db / API unhealthy).

Fix (pick one), then retry \`make up\` / \`docker compose up --build -d --wait\`:

  docker rm -f ${NAME}
  # or, if this project's Compose stack is half-up:
  make down

EOF
exit 1
