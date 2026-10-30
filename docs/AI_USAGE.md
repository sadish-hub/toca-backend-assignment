# AI usage disclosure

Per [`Requirements.md`](Requirements.md), this submission used AI tools during planning, implementation, tests, and documentation. This file records **tools**, **purpose**, and a **chronological prompt history** (condensed narrative by phase—not a dump of internal tool payloads).

## Tools

| Tool | Role |
|---|---|
| **Cursor** (Composer / coding agents) | Architecture drafts, phased plans, TDD implementation, Docker/Compose, README/Makefile, lint/test fixes |
| **Context7** (MCP docs) | Current NestJS, TypeORM, Vitest, class-validator, Docker-related API usage before writing library-facing code |

## Purpose by area

| Area | How AI was used |
|---|---|
| Requirements exploration | High-level read of the assignment; Postgres vs DynamoDB tradeoffs; TypeORM/Vitest/stack choices |
| Architecture & agent rules | `docs/Architecture.md`, `AGENTS.md`, sequential master plan under `docs/plans/` |
| P0 Scaffold | NestJS + Vitest + ESLint + `@nestjs/config`, port 8080 |
| P1 Database | TypeORM entities, migrations, dedicated `toca-postgres` |
| P2–P4 Health / Docker | App health, Compose stack, DB readiness in `/health` |
| P5 Packs API | DTOs, create/list/content, BFS aggregation, cycle handling, unit + e2e |
| P6 Docs | Makefile, reviewer README, this AI disclosure |
| P7 Verify | Requirements matrix, Compose/curl evidence, checklist artifact, Dockerfile SSL re-check |

## Chronological prompt history

### Planning & discovery (before P0)

1. Summarize the assignment README at a high level; estimate effort with/without AI agents.
2. Compare DynamoDB vs Postgres for nested packs; explain recursive SQL vs app-side `IN(...)` loops and BatchGet-like patterns; discuss caching and pagination (later scoped out of MVP).
3. Confirm TypeORM + recursive SQL options; refine a single stack list (NestJS, TypeORM, `pg`, class-validator, Vitest, Docker).
4. Discuss Context7 MCP for up-to-date library docs; include Context7 notes in agent plans.
5. Design high-level architecture (Postgres + Node REST); lock NestJS + TypeORM; save to `docs/Architecture.md`.
6. Create `AGENTS.md` with TDD, unit+e2e, production-ready code, ask-when-unsure, ESLint, troubleshooting.
7. Propose multi-phase delivery (DB, scaffold/health, Compose, packs+tests, Makefile/README); refine to sequential P0–P6 with file ownership; add **P7** Requirements verification; store as `docs/plans/master-plan.md`.
8. Lock decisions: sequential commits, Vitest + Supertest, ask business rules at packs implementation.
9. Require updating each phase’s Done checklist after implementation.

### P0 — Scaffold

1. Generate detailed P0 plan → store `docs/plans/p0-scaffold.md`.
2. Implement P0 only: NestJS app, Vitest + coverage thresholds, ESLint, config, stack deps; one commit; update Done checklist.

### P1 — Database

1. Generate P1 plan → `docs/plans/p1-database.md`.
2. Implement entities + migrations; verify against local Postgres.
3. Do **not** reuse an existing unrelated Postgres container; create dedicated `toca-postgres` and update the plan accordingly.

### P2 — Application health

1. Generate P2 plan → `docs/plans/p2-health-app.md`.
2. Implement `GET /health` (app liveness only), unit tests, one commit.

### P3 — Docker Compose

1. Generate P3 plan → `docs/plans/p3-docker-compose.md`.
2. Implement `Dockerfile` + `docker-compose.yml` (`api` + `db`), migrations on start, port 8080, no reviewer `.env`.

### P4 — Health + DB readiness

1. Generate P4 plan → `docs/plans/p4-health-db.md`.
2. Extend `/health` to include database readiness; update tests/Compose probe as needed.

### P5 — Packs REST API

1. Generate P5 plan → `docs/plans/p5-packs-api.md`.
2. Clarify business rules before coding:
   - `childPackIds` optional (no error when omitted/empty).
   - Duplicate pack `id` → conflict (**409**).
   - Inactive packs: include in content resolution unless Requirements say otherwise (they do not → include).
3. Discuss content resolution: recursive SQL vs in-app traversal → **lock in-app BFS** with visited set.
4. Confirm DTOs for create validation.
5. Implement with TDD (unit + e2e), cycle/self-child rejection, create children before parents.
6. Follow-up questions: iterative BFS vs recursive functions for `GET /packs/:id/content` (chose iterative BFS).

### P6 — Makefile + README

1. Generate P6 plan → `docs/plans/p6-makefile-readme.md`.
2. Add Makefile wrappers (pnpm + Compose), replace Nest starter README, document AI usage (this file), commit docs-only phase.

### P7 — Requirements verify

1. Generate P7 plan → `docs/plans/p7-verify-requirements.md`.
2. Run lint/test/e2e/coverage/build; Compose up; curl health + packs create/list/content.
3. Write `docs/REQUIREMENTS_CHECKLIST.md`; try removing Dockerfile `strict-ssl false` (kept after TLS failure); tick official checklist; one commit.

## Notes

- Agents were instructed to follow `AGENTS.md` and phase plans; ambiguous product rules were clarified with the human before coding.
- Prompt text above is reconstructed chronologically from the project chat history for reviewers; wording is paraphrased where prompts were long or repeated, without omitting substantive asks.
