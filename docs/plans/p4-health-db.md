# P4 — Health endpoint with DB readiness

Source of truth: [`master-plan.md`](master-plan.md). One commit. Do not implement packs API (P5), Makefile/README (P6), or Requirements audit (P7).

| Field | Value |
|---|---|
| Phase | P4 — Health endpoint includes DB readiness |
| Status | Done |
| Commit | `feat: include database readiness in health check` |

## Goal

`GET /health` reports **application and database** readiness. Healthy stack → both up; DB unavailable → readiness **fails** (HTTP **503**) so Compose’s existing API healthcheck (already probing `/health`) correctly marks the API unhealthy.

## Explicit non-goals

- Packs REST API (P5)
- New Compose services / Dockerfile redesign (P3 done; only touch compose if healthcheck must change — prefer leaving [`docker-compose.yml`](../../docker-compose.yml) as-is since it already hits `/health`)
- Adding `@nestjs/terminus` — keep the custom module from P2 and extend it

## Locked design choices

| Topic | Choice |
|---|---|
| Path | Still `GET /health` (single endpoint) |
| DB check | Inject TypeORM `DataSource`; run `SELECT 1` (or equivalent) |
| Success body | `{ "status": "ok", "info": { "app": { "status": "up" }, "database": { "status": "up" } } }` → **200** |
| Failure body | `{ "status": "error", "info": { "app": { "status": "up" }, "database": { "status": "down" } }, "error": { "database": { "status": "down", "message": "..." } } }` → **503** via Nest `ServiceUnavailableException` with the payload as response body |
| Ownership | `src/health/**` only (+ tests); register nothing new in AppModule beyond what HealthModule already needs (`DataSource` is global from TypeORM) |
| Compose | Keep API healthcheck on `/health`; `r.ok` already fails on 503 — no compose change required unless verify proves otherwise |
| Tests | Update/extend unit tests (mock `DataSource.query`); HTTP/Supertest cases for 200 + 503 |

## Current baseline (P2)

[`src/health/health.service.ts`](../../src/health/health.service.ts) returns app-only liveness. [`src/health/health.controller.ts`](../../src/health/health.controller.ts) always returns that object as 200. Extend both.

## Target touch set

```text
src/health/health.service.ts
src/health/health.controller.ts
src/health/health.module.ts          # only if providers need adjusting
src/health/*.spec.ts                 # update + DB up/down cases
docs/plans/p4-health-db.md
docs/plans/master-plan.md            # link + status after done
```

Do **not** change packs entities or migration scripts.

## Implementation steps (TDD)

1. Context7 / Nest TypeORM: inject `DataSource` in a service; confirm exception response shape for `ServiceUnavailableException`.
2. **Failing tests first:**
   - DB up → 200 + `info.database.status === 'up'`
   - `DataSource.query` rejects / throws → 503 + `status === 'error'` + database down
3. Implement `HealthService.check()` (rename or replace `getLiveness`): always mark `app` up; ping DB; set overall `status`.
4. Controller: return 200 payload when ok; on error status throw `ServiceUnavailableException` with the health object (so clients and Compose see 503).
5. Verify: `pnpm lint/test/test:cov/build`; with Compose stack up, `curl /health` shows database up; optionally stop `db` / break connection and confirm 503 (document if hard to simulate without killing compose db).
6. Write [`docs/plans/p4-health-db.md`](p4-health-db.md); after implement mark Done checklist + master-plan P4 **done**.
7. **Commit:** `feat: include database readiness in health check`

## Done checklist (check only after implementation)

- [x] `GET /health` includes app + database when DB is up (200)
- [x] DB failure yields **503** and database marked down
- [x] Unit + HTTP tests cover both paths; coverage thresholds intact
- [x] Compose API healthcheck still valid against `/health` (503 = unhealthy)
- [x] No packs / unrelated Compose redesign in this commit
- [x] `docs/plans/p4-health-db.md` Done checklist + master-plan status updated
- [x] Single commit with message above

## Agent notes

- Own only `src/health/**` (and plan docs). Ask before changing Dockerfile/compose beyond a one-line healthcheck fix.
- Do not use Terminus unless blocked — prefer extending the P2 custom service.
- pnpm; update Done checklist after landing.
- Never point health checks at third-party Postgres containers.
