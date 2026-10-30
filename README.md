# Game Packs API (Toca Boca assignment)

Simplified TypeScript REST API for game packs stored in PostgreSQL. Assignment brief: [`docs/Requirements.md`](docs/Requirements.md). Design notes: [`docs/Architecture.md`](docs/Architecture.md).

## Stack

| Piece | Choice |
|---|---|
| Runtime / framework | Node.js, NestJS |
| ORM / DB | TypeORM, PostgreSQL 16 |
| Validation | `class-validator` / `class-transformer` |
| Tests | Vitest + Supertest |
| Package manager | **pnpm** |
| Run locally | Docker Compose (`api` + `db`) on port **8080** |

## Getting started (step-by-step)

Copy-paste friendly path for newcomers. No local `.env` is required — env vars live in `docker-compose.yml`.

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose V2)
- Optional for local (non-Compose) dev: Node.js 20+ and [pnpm](https://pnpm.io/)

### 2. Clone

```bash
git clone <repo-url>
cd toca-backend-assignment-main
```

### 3. Start the stack

```bash
make up
# or: docker compose up --build -d --wait
```

`make up` checks for a leftover one-off `toca-postgres` container, then builds, starts `api` + `db`, and blocks until the API healthcheck passes. (`docs/Requirements.md` writes `docker compose -up`; the correct Compose V2 command is `docker compose up`.)

API: [http://localhost:8080](http://localhost:8080) · Health: [http://localhost:8080/health](http://localhost:8080/health)

Optional check: `make health`

Compose runs migrations on API start, then boots Nest. Postgres is **not** published on the host (hostname `db` on the Compose network only). Containers: `toca-postgres` (db), `toca-api` (api).

### 4. Try the API (example curls)

Create **child packs before parents** that reference them.

```bash
# Child first
curl -sS -X POST http://localhost:8080/packs \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "pack.classroom",
    "packName": "The Classroom Pack",
    "active": true,
    "price": 5,
    "content": ["furniture.desk"],
    "childPackIds": []
  }'

# Parent referencing the child
curl -sS -X POST http://localhost:8080/packs \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "pack.school",
    "packName": "The School Pack",
    "active": true,
    "price": 10,
    "content": ["furniture.whiteboard"],
    "childPackIds": ["pack.classroom"]
  }'

# List packs
curl -sS http://localhost:8080/packs

# Nested content (flat, unique)
curl -sS http://localhost:8080/packs/pack.school/content

# Health
curl -sS http://localhost:8080/health
```

### 5. Run tests

```bash
make test       # unit
make test-e2e   # e2e (starts throwaway Postgres, migrates, tests, removes it)
# same bootstrap via pnpm: pnpm run test:e2e  →  scripts/run-e2e.sh
# optional: make test-cov && make lint
```

`make test-e2e` / `pnpm run test:e2e` do **not** use or change the Compose stack. They run `scripts/run-e2e.sh` (throwaway `toca-postgres-e2e` on host port `55432`, migrations, Vitest, then delete that container). Compose can stay up on `:8080` at the same time.

### 6. Stop (full cleanup)

```bash
make down
# or: docker compose down -v --rmi local --remove-orphans
```

Removes containers, networks, the Postgres volume (all pack data), and Compose-built images. Next `make up` starts from an empty DB.

### Troubleshooting

| Issue | Fix |
|---|---|
| Port **8080** in use | Stop the other process, or change the host mapping in Compose |
| `toca-postgres` name conflict / `ENOTFOUND db` | A one-off local Postgres reused the Compose DB name. `make up` detects this and exits with instructions. Fix: `docker rm -f toca-postgres` (or `make down`), then `make up` / `docker compose up --build -d --wait` |
| API won’t become healthy | Check `make logs` / `docker compose logs -f api`; wait for DB health before the API finishes migrations |
| Docker path / Desktop not running | Start Docker Desktop, confirm `docker compose version` works, then retry `make up` |
| Pack “already exists” after restart | DB volume persisted; run `make down` then `make up` for a clean DB |
| `pnpm install` / image build TLS errors (`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`) | Build with insecure npm SSL **only** if needed: `ALLOW_INSECURE_NPM_SSL=true docker compose build` (or `make up` with that env var set) |

## Local development (optional)

Requires pnpm and a dedicated Postgres container named `toca-postgres` (do not reuse unrelated Postgres containers).

```bash
# Example one-off DB (host port 5432; use 55432 if busy and set DATABASE_PORT)
docker run -d --name toca-postgres \
  -e POSTGRES_USER=toca \
  -e POSTGRES_PASSWORD=toca \
  -e POSTGRES_DB=toca_packs \
  -p 5432:5432 \
  postgres:16

pnpm install          # or: make install
pnpm run migration:run  # or: make migrate
pnpm run start:dev
```

Default local DB env (overridable): `DATABASE_HOST=localhost`, `DATABASE_PORT=5432`, `DATABASE_USER=toca`, `DATABASE_PASSWORD=toca`, `DATABASE_NAME=toca_packs`, `PORT=8080`.

## Makefile

| Target | What it runs |
|---|---|
| `make help` | List targets |
| `make install` | `pnpm install` |
| `make build` | `pnpm run build` |
| `make lint` | `pnpm run lint` |
| `make test` | `pnpm test` |
| `make test-cov` | `pnpm run test:cov` |
| `make test-e2e` | `scripts/run-e2e.sh` (same as `pnpm run test:e2e`) |
| `make migrate` | `pnpm run migration:run` |
| `make up` | Conflict-check `toca-postgres`, then `docker compose up --build -d --wait` |
| `make down` | `docker compose down -v --rmi local --remove-orphans` (wipes DB volume + images) |
| `make logs` | `docker compose logs -f api` |
| `make health` | `curl -sS http://localhost:8080/health` |

## API notes

- Duplicate pack `id` → **409**
- Invalid / cyclic `childPackIds` → **400**
- Missing pack on content lookup → **404**
- `content` and `childPackIds` are optional (omit or use `[]`)
- Inactive packs are still included in nested content resolution

## Project layout

```text
src/
  packs/          # POST/GET packs, nested content (BFS + cycle checks)
  health/         # GET /health (app + DB readiness)
  database/       # TypeORM config + data source
  migrations/
test/             # e2e specs
docs/
  Requirements.md # assignment brief
  Architecture.md # system design
  AI_USAGE.md     # AI tools + prompt history
  plans/          # phased implementation plans
docker-compose.yml
Dockerfile
Makefile
```

## Notes for reviewers

- Port **8080** must be free on the host.
- One-command run is `docker compose up` / `docker compose up --build` (or `make up`). No reviewer-supplied env files. Prefer `make up` so the orphan `toca-postgres` check runs first.
- Compose DB is internal-only (no host `5432` publish), which avoids clashing with other local Postgres instances on port 5432 — but the fixed name `toca-postgres` still conflicts with a leftover one-off container (see troubleshooting).
- Image builds verify TLS by default. On TLS-intercepting networks only: `ALLOW_INSECURE_NPM_SSL=true docker compose build` (build-arg / Compose env; see Dockerfile).
- Agent rules for this repo: [`AGENTS.md`](AGENTS.md).

## AI usage

Development used **Cursor** (Composer / coding agents) and **Context7** (current library docs for NestJS, TypeORM, Vitest, Docker). See [`docs/AI_USAGE.md`](docs/AI_USAGE.md) for tools, purpose by phase, and chronological prompt history.

## Assignment checklist

Mirror of the boxes in [`docs/Requirements.md`](docs/Requirements.md). Verified in **P7** — see [`docs/REQUIREMENTS_CHECKLIST.md`](docs/REQUIREMENTS_CHECKLIST.md).

- [x] Is written in TypeScript.
- [x] Includes all expected endpoints.
- [x] Has sufficient tests that are passing.
- [x] Has sufficient documentation.
- [x] Can be started with a single `docker compose up` command.
