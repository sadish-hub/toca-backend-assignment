# Requirements verification checklist (P7)

Source of truth: [`Requirements.md`](Requirements.md). Verified against the running project on **2026-10-30**.

Commands use `pnpm` and Docker Compose V2. Docker CLI path used when the shell wrapper was unreliable: `/Applications/Docker.app/Contents/Resources/bin/docker`.

## Full matrix

| # | Requirement | Result | Evidence |
|---|---|---|---|
| 1 | TypeScript API | **PASS** | `pnpm run build` → Nest/`tsc` build succeeded (exit 0). |
| 2 | `POST /packs` | **PASS** | e2e green; Compose curl created `pack.classroom` then `pack.school`. Duplicate id → **HTTP 409**. |
| 3 | `GET /packs` | **PASS** | Curl returned packs with `id`, `packName`, `active`, `price`, `content`, `childPackIds`. |
| 4 | `GET /packs/:id/content` | **PASS** | `GET /packs/pack.school/content` → `["furniture.whiteboard","furniture.desk"]` (flat unique nested). Missing id → **HTTP 404**. |
| 5 | Database persistence | **PASS** | TypeORM + Postgres 16 via Compose service `db` (`container_name: toca-postgres`). Packs created via API and listed back; health shows `database: up`. |
| 6 | Tests | **PASS** | `pnpm test` — 33 unit passed; `pnpm test:e2e` — 9 e2e passed; `pnpm test:cov` — stmts 90.78% / branches 82.27% / funcs 80.64% / lines 90.64% (thresholds met). |
| 7 | Code style / lint | **PASS** | `pnpm run lint` exit 0. Nest module layout is readable (controllers → services → entities). |
| 8 | One-command Compose | **PASS** | `docker compose up --build -d` (or `make up`) starts `api` + `db`; no reviewer `.env`. Both healthy; API on `:8080`. Local-only (no remote services). |
| 9 | README documentation | **PASS** | [`README.md`](../README.md): prerequisites, `make up` / Compose, health wait, curl usage, tests, troubleshooting, Makefile table. |
| 10 | AI usage disclosure | **PASS** | [`AI_USAGE.md`](AI_USAGE.md) + README “AI usage” section: tools, purpose, chronological prompt history. |
| 11 | Official five checklist boxes | **PASS** | See below — all evidenced true. |

## Official Requirements checklist

Mirror of the five boxes in [`Requirements.md`](Requirements.md#checklist):

- [x] Is written in TypeScript. — `pnpm run build` green; Nest/TS sources under `src/`.
- [x] Includes all expected endpoints. — `POST /packs`, `GET /packs`, `GET /packs/:id/content` (+ `GET /health`). Verified via e2e + Compose curl.
- [x] Has sufficient tests that are passing. — Unit + e2e + coverage thresholds; all green on verify run.
- [x] Has sufficient documentation. — README setup/usage + Architecture + AI disclosure.
- [x] Can be started with a single `docker compose up` command. — `docker compose up --build` / `make up`; env embedded in Compose.

## Quality gates (this run)

| Command | Exit | Notes |
|---|---|---|
| `pnpm run lint` | 0 | Clean |
| `pnpm test` | 0 | 8 files / 33 tests |
| `pnpm run test:e2e` | 0 | 2 files / 9 tests |
| `pnpm run test:cov` | 0 | Above AGENTS floors (≥80% lines/stmts/funcs, ≥70% branches) |
| `pnpm run build` | 0 | Nest build OK |
| Compose up + health | OK | `{"status":"ok","info":{"app":{"status":"up"},"database":{"status":"up"}}}` |

## Compose curl transcript (summary)

```text
POST /packs (child)  → 200 pack.classroom
POST /packs (parent) → 200 pack.school with childPackIds: ["pack.classroom"]
GET  /packs          → both packs with required fields
GET  /packs/pack.school/content → ["furniture.whiteboard","furniture.desk"]
POST duplicate id    → 409
GET  missing content → 404
```

## Gaps found and resolution

| Gap | Action |
|---|---|
| Dockerfile `strict-ssl false` | **Tried remove**; `docker compose build --no-cache` failed with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` when installing pnpm from registry.npmjs.org. **Kept** `strict-ssl false` with an inline Dockerfile comment; README already documents this as environment-specific. |
| Stale/orphan stack | Before verify, API was **unhealthy** (`ENOTFOUND db`) because a standalone `toca-postgres` was running without the Compose network. Resolved by `docker compose down`, `docker rm -f toca-postgres`, then `docker compose up --build -d` so Compose owns `toca-postgres` + `api`. Operational only — no product-behavior change. |

No Requirements-driven product gaps required code changes beyond documenting / retaining the SSL workaround.
