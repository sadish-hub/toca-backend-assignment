# P2 — Application health endpoint implementation plan

Source of truth: [`master-plan.md`](master-plan.md). One commit. Do not implement P3–P7 (no DB readiness, Compose, or packs).

| Field | Value |
|---|---|
| Phase | P2 — Health endpoint (application only) |
| Status | Done |
| Commit | `feat: add application health endpoint` |

## Goal

`GET /health` returns **200** with a clear **application liveness** payload. No database ping in this phase (that is **P4**).

## Explicit non-goals

- DB readiness / TypeORM health indicator (P4)
- Docker Compose / Dockerfile (P3)
- Packs API (P5)
- Adding `@nestjs/terminus` unless needed — **not used in P2** (keep a small custom module; P4 can extend the same payload shape or adopt Terminus later)

## Locked design choices

| Topic | Choice |
|---|---|
| Path | `GET /health` |
| Scope | App/process liveness only |
| Shape | `{ "status": "ok", "info": { "app": { "status": "up" } } }` — extensible for P4 (`info.database`, overall `status`) |
| HTTP | Always **200** while the process can serve requests (liveness) |
| Layout | `src/health/` module + controller + service |
| Tests | Vitest unit tests for service + controller; one HTTP smoke via Nest testing + Supertest (or lightweight e2e) for `GET /health` |
| Wiring | Import `HealthModule` in [`src/app.module.ts`](../../src/app.module.ts) only |

## Target layout

```text
src/health/
  health.module.ts
  health.controller.ts
  health.service.ts
  health.service.spec.ts
  health.controller.spec.ts
docs/plans/p2-health-app.md
```

Optional: `test/health.e2e-spec.ts` if easier with existing [`vitest.config.e2e.ts`](../../vitest.config.e2e.ts); otherwise controller/service unit tests + one Nest+Supertest integration test under `src/health/` is enough for AGENTS unit+e2e expectation on this change.

## Implementation steps (TDD)

1. **Context7** for NestJS controller/module + `TestingModule` / Supertest patterns before coding.
2. **Failing tests first:** service returns app-up payload; `GET /health` returns 200 + body.
3. **Implement** `HealthService.getLiveness()`, `HealthController`, `HealthModule`.
4. **Register** `HealthModule` in `AppModule` (do not remove `DatabaseModule` / app smoke routes).
5. **Verify:** `pnpm run lint`, `test`, `test:cov`, `build`; manual or scripted `curl` against running app on a **free** port (avoid 8080/8081 if busy — use e.g. `PORT=18080`).
6. **Docs:** write [`docs/plans/p2-health-app.md`](p2-health-app.md); link in master-plan; after implement mark Done checklist `[x]` and status **done**.
7. **Commit:** `feat: add application health endpoint`

## Done checklist (check only after implementation)

- [x] `GET /health` returns 200 with app-up payload (no DB fields yet)
- [x] `HealthModule` under `src/health/` registered in `AppModule`
- [x] Unit (+ HTTP) tests green; coverage thresholds still met
- [x] No Compose / DB readiness / packs changes in this commit
- [x] `docs/plans/p2-health-app.md` Done checklist + master-plan status updated
- [x] Single commit with message above

## Agent notes

- Do not invent Terminus APIs for P2; custom liveness is enough.
- Do not add DB checks “for convenience” — that breaks phase ownership.
- Follow AGENTS: update Done checklist after the phase lands.
- Package manager: **pnpm**.
