# P6 — Makefile + README

Source of truth: [`master-plan.md`](master-plan.md) + [`Requirements.md`](../../Requirements.md) Documentation/AI sections. One commit. Do not run the full P7 requirements audit (that is the next phase).

| Field | Value |
|---|---|
| Phase | P6 — Makefile + README |
| Status | Done |
| Commit | `docs: add Makefile and README for setup and usage` |

## Goal

Reviewers can discover how to **install/run/test** and **query the API** from the README, and use a **Makefile** for common commands. Document **AI tool usage** per Requirements (tools, purpose, prompt history).

## Explicit non-goals

- P7 gap-fix / checklist audit commit
- Changing pack/health business logic unless a one-line doc-only note is needed
- Fixing Dockerfile `strict-ssl` (mention as reviewer note if still present; optional tiny fix only if you already touch Docker — prefer document-only in P6)

## Locked design choices

| Topic | Choice |
|---|---|
| Package manager in docs | **pnpm** (repo `packageManager`) |
| Primary run path | `docker compose up --build` (correct Compose V2 syntax; note Requirements typo `-up`) |
| Makefile | Thin wrappers around `pnpm` + `docker compose` |
| README | **Replace** Nest starter boilerplate with Toca Game Packs API docs; keep a short link to [`Requirements.md`](../../Requirements.md) as the assignment brief |
| AI disclosure | Section in README + fuller history in [`docs/AI_USAGE.md`](../AI_USAGE.md) (tools, purpose per phase, chronological prompt summary from this project’s phases — complete enough for reviewers; not a raw dump of every tool JSON) |
| Architecture | Sync [`Architecture.md`](../../Architecture.md) only if something drifted (e.g. packs BFS note already accurate) |

## Makefile targets (locked)

| Target | Action |
|---|---|
| `make install` | `pnpm install` |
| `make build` | `pnpm run build` |
| `make lint` | `pnpm run lint` |
| `make test` | `pnpm test` |
| `make test-cov` | `pnpm run test:cov` |
| `make test-e2e` | `pnpm run test:e2e` |
| `make migrate` | `pnpm run migration:run` (local DB; document `toca-postgres` / Compose) |
| `make up` | `docker compose up --build -d` |
| `make down` | `docker compose down` |
| `make logs` | `docker compose logs -f api` |
| `make health` | `curl -sS http://localhost:8080/health` |

Use `.PHONY` and a default `help` target listing these.

## README structure (locked)

1. **Title** — Game Packs API (Toca Boca assignment)
2. **Stack** — NestJS, TypeORM, Postgres, Vitest, Docker Compose, pnpm
3. **Quick start** — `make up` (or `docker compose up --build`) → API `:8080`; no `.env` required
4. **Local dev** (optional) — `make install`, `make migrate` against dedicated `toca-postgres`, `pnpm start:dev`
5. **Makefile** — table of targets
6. **API usage** — curl examples for `POST /packs`, `GET /packs`, `GET /packs/:id/content`, `GET /health`; note create children before parents; 409/400/404 behaviors briefly
7. **Tests** — `make test`, `make test-e2e`, `make test-cov`
8. **Project layout** — pointer to `src/packs`, `src/health`, `docs/plans`
9. **Extra for reviewers** — port 8080 conflicts; stop standalone `toca-postgres` before Compose if name clash; DB not published on host in Compose
10. **AI usage** — summary + link to `docs/AI_USAGE.md`
11. **Assignment checklist** — mirror Requirements five boxes as guidance (unchecked or note “verify in P7”)

## `docs/AI_USAGE.md` content

- Tools: Cursor (Composer / agents), Context7 for library docs
- Purpose: architecture/planning, scaffolding, TypeORM/Docker/health/packs implementation, tests
- Prompt history: ordered by phase P0–P5 (and planning prompts), condensed but complete narrative of what was asked — satisfy Requirements “complete history” without pasting internal tool payloads

## Implementation steps

1. Add [`Makefile`](../../Makefile) with targets above.
2. Rewrite [`README.md`](../../README.md) per structure (remove Nest marketing boilerplate).
3. Add [`docs/AI_USAGE.md`](../AI_USAGE.md).
4. Write this plan; link + mark Done after land; master-plan P6 **done**.
5. Spot-check: `make help`, compose commands documented accurately vs [`docker-compose.yml`](../../docker-compose.yml).
6. **Commit:** `docs: add Makefile and README for setup and usage`

## Done checklist (check only after implementation)

- [x] Makefile covers install, build, lint, test, test-cov, test-e2e, migrate, up, down, logs, health, help
- [x] README has setup, usage (curl), reviewer extras
- [x] AI tools + purpose + prompt history documented (`README` + `docs/AI_USAGE.md`)
- [x] Docs use pnpm + correct `docker compose up`
- [x] `docs/plans/p6-makefile-readme.md` Done checklist + master-plan status updated
- [x] Single commit with message above

## Agent notes

- Own Makefile + README + AI doc + phase plan; avoid drive-by code refactors.
- Do not invent endpoints in curl examples beyond packs + health.
- pnpm; update Done checklist after the phase.
