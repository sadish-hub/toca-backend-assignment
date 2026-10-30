# P3 — Docker Compose implementation plan

Source of truth: [`master-plan.md`](master-plan.md). One commit. Do not implement P4–P7 (no DB readiness in `/health`, no packs API, no Makefile/README rewrite).

| Field | Value |
|---|---|
| Phase | P3 — Docker Compose (one-command stack) |
| Status | Done |
| Commit | `chore: add Docker Compose for api and Postgres` |

## Goal

Reviewers run **`docker compose up --build`** (or `docker compose up`) and get **api + Postgres** with **no local `.env` inventing**. API listens on **8080**. DB is the assignment’s dedicated Postgres (same credentials as P1), not reused third-party containers.

## Explicit non-goals

- Extending `/health` with DB checks (P4) — Compose may probe current app-only `/health`
- Packs endpoints (P5)
- Makefile / full README rewrite (P6)
- Changing TypeORM entities/schema (P1 already done)

## Locked design choices

| Topic | Choice |
|---|---|
| Services | `api` + `db` only |
| DB image | `postgres:16` |
| Credentials | `toca` / `toca` / `toca_packs` (match P1) |
| Compose DB hostname | `db` → set `DATABASE_HOST=db` on `api` |
| Container name | `container_name: toca-postgres` for `db` (same dedicated name as P1) |
| Host ports | Publish **`8080:8080`** for API; **do not publish** DB `5432` on the host (avoids clash with a leftover local `toca-postgres`; DB is reachable only on the Compose network) |
| Persistence | Named volume `toca_pgdata` |
| DB healthcheck | `pg_isready -U toca -d toca_packs` |
| API start order | `depends_on: db: condition: service_healthy` |
| Schema | Entrypoint runs pending migrations (`migration:run` / compiled equivalent) **then** starts Nest |
| Env | All vars inline in [`docker-compose.yml`](../../docker-compose.yml) — no required reviewer `.env` |
| API healthcheck | `GET /health` (app liveness from P2) |
| Package manager in image | **pnpm** (matches repo `packageManager`) |

### Conflict with existing one-off `toca-postgres`

If a standalone `toca-postgres` from P1 is still running, `compose up` will fail on name conflict:

```bash
docker rm -f toca-postgres
docker compose up --build
```

Compose then owns `toca-postgres`. Never point the API at `account-postgres` / `keycloak-postgres`.

## Target layout

```text
Dockerfile
.dockerignore
docker-compose.yml          # replace stub
scripts/docker-entrypoint.sh  # run migrations + start Nest
docs/plans/p3-docker-compose.md
```

Small supporting change allowed: [`src/database/data-source.ts`](../../src/database/data-source.ts) migrations glob must resolve relative to the compiled file so Docker can run `typeorm migration:run -d dist/database/data-source.js`.

## Dockerfile (concrete approach)

Multi-stage:

1. **deps/build:** Node 22 + corepack/pnpm; `pnpm install --frozen-lockfile`; `pnpm run build`; prune to production deps.
2. **runtime:** copy `dist`, production `node_modules`, entrypoint; `EXPOSE 8080`; `ENTRYPOINT` entrypoint.

Pin base image tag: `node:22-bookworm-slim`.

## Compose sketch

```yaml
services:
  db:
    image: postgres:16
    container_name: toca-postgres
    environment:
      POSTGRES_USER: toca
      POSTGRES_PASSWORD: toca
      POSTGRES_DB: toca_packs
    volumes:
      - toca_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U toca -d toca_packs']
      interval: 5s
      timeout: 5s
      retries: 10
  api:
    build: .
    ports:
      - '8080:8080'
    environment:
      PORT: '8080'
      DATABASE_HOST: db
      DATABASE_PORT: '5432'
      DATABASE_USER: toca
      DATABASE_PASSWORD: toca
      DATABASE_NAME: toca_packs
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ['CMD-SHELL', 'node -e "fetch(\"http://127.0.0.1:8080/health\").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"']
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 40s
volumes:
  toca_pgdata:
```

API healthcheck uses Node `fetch` (no extra curl/wget packages). `start_period` covers migrate + Nest boot.

## Implementation steps

1. Context7 for Compose `depends_on` + healthcheck and TypeORM compiled `migration:run`.
2. Add [`.dockerignore`](../../.dockerignore) (`node_modules`, `dist`, `.git`, coverage, etc.).
3. Add [`Dockerfile`](../../Dockerfile) multi-stage + [`scripts/docker-entrypoint.sh`](../../scripts/docker-entrypoint.sh) (`typeorm migration:run -d dist/database/data-source.js` then `node dist/main.js`).
4. Replace stub [`docker-compose.yml`](../../docker-compose.yml) per sketch.
5. Fix DataSource migrations path to resolve next to the compiled file (`../migrations/*.{ts,js}`).
6. **Verify:** `docker rm -f toca-postgres` if needed → `docker compose up --build -d` → `curl localhost:8080/health` → confirm migrations; `pnpm` lint/test still pass.
7. Mark Done checklist + master-plan status.
8. **Commit:** `chore: add Docker Compose for api and Postgres`

## Done checklist (check only after implementation)

- [x] `docker compose up --build` starts `api` + `db` with no reviewer `.env`
- [x] API on **8080**; `GET /health` works from host
- [x] DB is dedicated Compose `toca-postgres` with P1 credentials; not a reused third-party container
- [x] Migrations apply on API start; app connects with `DATABASE_HOST=db`
- [x] Volume persists data; DB healthcheck + API `depends_on` healthy
- [x] Docs/plan Done checklist + master-plan status updated
- [x] Single commit with message above

## Agent notes

- Never reuse `account-postgres` / `keycloak-postgres`.
- Do not publish host `5432` in Compose (avoids clashing with local one-offs); document removing standalone `toca-postgres` before compose.
- Do not implement P4 DB fields in `/health`.
- Package manager in image: **pnpm**.
- If Docker CLI is missing from PATH, use `/Applications/Docker.app/Contents/Resources/bin/docker`.
