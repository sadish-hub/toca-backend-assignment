# Game Packs API (Toca Boca assignment)

Simplified TypeScript REST API for game packs stored in PostgreSQL. Assignment brief: [`Requirements.md`](Requirements.md). Design notes: [`Architecture.md`](Architecture.md).

## Stack

| Piece | Choice |
|---|---|
| Runtime / framework | Node.js, NestJS |
| ORM / DB | TypeORM, PostgreSQL 16 |
| Validation | `class-validator` / `class-transformer` |
| Tests | Vitest + Supertest |
| Package manager | **pnpm** |
| Run locally | Docker Compose (`api` + `db`) on port **8080** |

## Quick start (reviewers)

No local `.env` is required. Env vars are set in `docker-compose.yml`.

```bash
docker compose up --build
# or: make up
```

(`Requirements.md` writes `docker compose -up`; the correct Compose V2 command is `docker compose up`.)

When the stack is healthy:

- API: [http://localhost:8080](http://localhost:8080)
- Health: [http://localhost:8080/health](http://localhost:8080/health)

Compose runs migrations on API start, then boots Nest. Postgres is **not** published on the host (reachable only on the Compose network as hostname `db`).

Stop with:

```bash
docker compose down
# or: make down
```

## Local development (optional)

Requires [pnpm](https://pnpm.io/) and a dedicated Postgres container named `toca-postgres` (do not reuse unrelated Postgres containers).

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

**Name clash:** Compose also uses `container_name: toca-postgres`. If a standalone container is still running, stop/remove it before `docker compose up` (`docker rm -f toca-postgres`).

## Makefile

| Target | What it runs |
|---|---|
| `make help` | List targets |
| `make install` | `pnpm install` |
| `make build` | `pnpm run build` |
| `make lint` | `pnpm run lint` |
| `make test` | `pnpm test` |
| `make test-cov` | `pnpm run test:cov` |
| `make test-e2e` | `pnpm run test:e2e` |
| `make migrate` | `pnpm run migration:run` |
| `make up` | `docker compose up --build -d` |
| `make down` | `docker compose down` |
| `make logs` | `docker compose logs -f api` |
| `make health` | `curl -sS http://localhost:8080/health` |

## API usage

Create **child packs before parents** that reference them. Duplicate pack `id` → **409**. Invalid / cyclic `childPackIds` → **400**. Missing pack on content lookup → **404**. Inactive packs are still included in nested content resolution.

### Health

```bash
curl -sS http://localhost:8080/health
```

Healthy response includes app + database readiness (`status: "ok"`).

### Create packs

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
```

`content` and `childPackIds` are optional (omit or use `[]`).

### List packs

```bash
curl -sS http://localhost:8080/packs
```

### Nested pack content (flat, unique)

```bash
curl -sS http://localhost:8080/packs/pack.school/content
# e.g. ["furniture.whiteboard","furniture.desk"]
```

## Tests

```bash
make test       # unit
make test-e2e   # e2e (needs DB; Compose or local toca-postgres)
make test-cov   # coverage thresholds enforced
make lint
```

## Project layout

```text
src/
  packs/          # POST/GET packs, nested content (BFS + cycle checks)
  health/         # GET /health (app + DB readiness)
  database/       # TypeORM config + data source
  migrations/
test/             # e2e specs
docs/plans/       # phased implementation plans
docs/AI_USAGE.md  # AI tools + prompt history
docker-compose.yml
Dockerfile
Makefile
```

## Notes for reviewers

- Port **8080** must be free on the host.
- One-command run is `docker compose up` / `docker compose up --build` (or `make up`). No reviewer-supplied env files.
- Compose DB is internal-only (no host `5432` publish), which avoids clashing with other local Postgres instances.
- The Dockerfile sets `strict-ssl false` during image install so builds succeed in environments that intercept TLS to the npm registry. Prefer enabling TLS verification in trusted networks when possible.
- Agent rules for this repo: [`AGENTS.md`](AGENTS.md).

## AI usage

Development used **Cursor** (Composer / coding agents) and **Context7** (current library docs for NestJS, TypeORM, Vitest, Docker). See [`docs/AI_USAGE.md`](docs/AI_USAGE.md) for tools, purpose by phase, and chronological prompt history.

## Assignment checklist

Mirror of the boxes in [`Requirements.md`](Requirements.md). Final verification is **P7**.

- [ ] Is written in TypeScript.
- [ ] Includes all expected endpoints.
- [ ] Has sufficient tests that are passing.
- [ ] Has sufficient documentation.
- [ ] Can be started with a single `docker compose up` command.
