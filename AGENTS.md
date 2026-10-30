# AGENTS.md — Guidance for AI Coding Agents

This file tells agents how to work in this repository. Read it before implementing, refactoring, or debugging. Architecture details live in [`docs/Architecture.md`](docs/Architecture.md); assignment requirements live in [`docs/Requirements.md`](docs/Requirements.md) and setup/usage in [`README.md`](README.md).

---

## Project snapshot

| Item | Choice |
|---|---|
| Purpose | Simplified **Game Packs** REST API (Toca Boca assignment) |
| Language | TypeScript |
| Framework | NestJS |
| ORM / DB | TypeORM + PostgreSQL |
| Tests | Vitest (unit + e2e) |
| Lint | ESLint |
| Runtime | Docker Compose (`api` + `db`), service on port **8080** |

### Required endpoints

- `POST /packs` — save a pack
- `GET /packs` — list all packs
- `GET /packs/:id/content` — flat, unique content including nested child packs

Do not invent endpoints, auth, caching, or remote services unless the human explicitly asks. Prefer assignment-scoped, production-quality code over speculative features.

---

## Non-negotiable rules

1. **Follow TDD.** Write or update a failing test first, then implement the minimum code to pass, then refactor. Do not ship untested behavior.
2. **Always write both unit tests and integration/e2e tests.**
   - Unit: services, pure logic (especially nested content resolution and cycle handling), DTO validation helpers.
   - E2E/integration: real HTTP against NestJS + database (or test DB) for the three endpoints.
3. **Production-ready code only.** Clear errors, input validation, typed boundaries, no leftover debug junk, no secrets in source, sensible defaults for Docker.
4. **When in doubt, ask.** Do not guess requirements, invent schema fields, or hallucinate library APIs. Ask clarifying question(s) before coding ambiguous behavior.
5. **Follow NestJS / TypeScript best practices** (see [Coding patterns](#coding-patterns-and-guidelines)).
6. **Code must be linted with ESLint.** Keep the project lint-clean; fix lint errors you introduce before considering work done.
7. **Align with [`docs/Architecture.md`](docs/Architecture.md).** If you need to diverge, ask first and update `docs/Architecture.md` when the human agrees.
8. **Health endpoint required.** Expose `GET /health` (liveness at minimum; readiness may include DB ping). Wire Compose/API healthchecks to it where useful.
9. **Vitest coverage thresholds are mandatory.** Configure and enforce meaningful coverage floors (lines/branches/functions/statements). Do not lower thresholds to make a failing change “pass” without asking.
10. **Definition of Done is mandatory.** A task is not complete until every item in [Definition of Done](#definition-of-done-for-agents) is satisfied.
11. **Update phase Done checklists.** After implementing a phase, always update that phase’s Done checklist in its `docs/plans/p*.md` (check every completed item) and the status table in `docs/plans/master-plan.md`.

---

## TDD workflow

```text
1. Clarify acceptance criteria (ask if unclear)
2. Write failing unit and/or e2e test(s)
3. Implement the smallest change that passes
4. Refactor while keeping tests green
5. Run lint + relevant tests
6. Update docs only when behavior/setup changes
```

Prefer testing observable behavior over implementation details. Mock at boundaries (e.g. repository) in unit tests; prefer real DB for e2e.

---

## Coding patterns and guidelines

- **Module boundaries:** Controllers → Services → TypeORM repositories/entities. Keep HTTP concerns out of services; keep SQL/ORM details out of controllers.
- **DTOs + validation:** Use `class-validator` / `class-transformer` on request DTOs. Reject invalid payloads with `400`.
- **Errors:** `404` for missing pack on content lookup; `400` for bad input / cycle introduction. Consistent error response shape.
- **Entities:** Match the data model in `docs/Architecture.md` (`packs`, `pack_children`, `pack_contents`). String business IDs (e.g. `pack.school`).
- **Content resolution:** Traverse child packs (BFS/DFS), accumulate unique content, protect against cycles. Cover nested + cycle cases in tests.
- **TypeScript:** Prefer explicit types at public APIs; avoid `any`. Use NestJS DI properly; no service locators.
- **Config:** Environment via Compose/config module — no hard-coded secrets. Reviewer must run with `docker compose up` only.
- **Migrations:** Prefer TypeORM migrations over relying on `synchronize` in anything presented as production-like.
- **Naming:** Clear, boring NestJS conventions (`packs.controller.ts`, `packs.service.ts`, `create-pack.dto.ts`).
- **Scope control:** No drive-by refactors. Don’t expand scope beyond the task. Don’t add markdown docs the human didn’t ask for (except when updating existing docs for accuracy).

---

## Testing expectations

| Layer | What to cover |
|---|---|
| Unit | Pack content aggregation, cycle detection, service edge cases |
| E2E | Create → list → nested content; 404/400 paths; Docker-compatible setup |
| Health | `GET /health` returns success when the app (and DB, if readiness includes it) is up |

Tests should be deterministic and able to run in CI-like conditions. Clean up DB state between e2e cases (transactions or truncate).

### Coverage thresholds

- Enforce Vitest `coverage.thresholds` for the project (recommended starting floors once the suite exists: **≥80%** lines/statements/functions, **≥70%** branches — adjust only with human approval).
- Run coverage in the normal quality gate; failing under threshold means the task is not done.
- Prefer testing real behavior over gaming coverage with trivial assertions.

---

## Lint and quality gates

Before finishing a task:

1. ESLint passes on changed files / project.
2. Unit and e2e tests related to the change pass.
3. Coverage meets configured thresholds.
4. TypeScript compiles (`tsc` / Nest build).
5. No unused exports, dead code, or commented-out blocks left behind.
6. `GET /health` still works if infrastructure or bootstrap changed.

---

## Troubleshooting guide

### Docker / Compose

| Symptom | Things to check |
|---|---|
| API won’t start | DB healthy? Correct `DATABASE_HOST` (service name `db` in Compose, not `localhost` from inside the container)? |
| Port in use | Is something else bound to `8080` or Postgres `5432`? |
| Reviewer can’t run with one command | Env vars must be in Compose — don’t require a local `.env` the reviewer must invent. |

### Database / TypeORM

| Symptom | Things to check |
|---|---|
| Connection refused | Wait-for-DB / healthcheck; wrong port or credentials. |
| Schema mismatch | Migrations applied? Entity column names vs DB? |
| Flaky e2e | Shared DB state; missing cleanup; parallel tests colliding. |

### NestJS / API

| Symptom | Things to check |
|---|---|
| Validation not running | `ValidationPipe` registered globally? DTO decorators present? |
| Empty `content` for nested packs | Child relations loaded? Traversal visiting children? Duplicate filtering wrong? |
| Infinite loop / timeout on content | Cycle in `pack_children`; visited-set missing. |
| 500 instead of 404/400 | Exception filters / Nest HTTP exceptions not used. |
| Health check failing in Compose | `/health` path wrong; app not listening; readiness queries DB before migrations. |

### Tests

| Symptom | Things to check |
|---|---|
| Unit pass, e2e fail | Real DB wiring, module imports, test app bootstrap. |
| E2e hang | Open handles (DB connections not closed); missing `afterAll` teardown. |

When stuck after a few honest attempts, **stop and ask the human** with what you observed — do not invent fixes.

---

## Documentation and AI usage (assignment)

- Keep README setup/usage accurate when run instructions change.
- Keep `docs/Architecture.md` aligned with real structure.
- If AI tools are used for the submission, document tool, purpose, and prompt history as required by the assignment README.

---

## What agents should ask about (examples)

Ask before assuming:

- Create-order rules when child pack IDs don’t exist yet
- Whether `active: false` packs are excluded from content resolution
- Idempotency of `POST /packs` (reject duplicate id vs upsert)
- Migration strategy vs `synchronize` for the submitted Compose setup
- Any behavior not specified in README / docs/Architecture

---

## Suggested extras (optional team norms)

Still optional — ask the human before treating these as hard rules:

1. **Prettier** alongside ESLint for consistent formatting.
2. **Conventional commit messages** if the repo will have a real git history for review.
3. **OpenAPI / Swagger** for endpoint documentation (nice interview talking point; not required by the assignment).
4. **Structured logging** (Nest logger) with request correlation — keep it simple.
5. **`.env.example`** only if Compose alone isn’t enough; prefer zero reviewer config.
6. **Security basics:** no PII, parameterized queries via TypeORM, don’t log request bodies with secrets.

---

## Definition of Done (for agents)

A task is done only when **all** of the following are true:

- [ ] Behavior matches README + docs/Architecture (or agreed deviation documented)
- [ ] TDD evidence: tests added/updated first where practical
- [ ] Unit **and** e2e coverage for the change
- [ ] Vitest coverage thresholds met
- [ ] ESLint clean; TypeScript build clean
- [ ] `GET /health` present and green for the running stack
- [ ] Production-ready (validation, errors, no secrets, Docker-friendly)
- [ ] Ambiguities resolved by asking — not by guessing
- [ ] Architecture/README updated if setup or public behavior changed
- [ ] Phase plan Done checklist updated (`docs/plans/p*.md` items checked) and master-plan status table reflects the phase
