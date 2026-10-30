# P1 — Database layer implementation plan

Source of truth: [`master-plan.md`](master-plan.md). One commit. Do not implement P2–P7 features.

| Field | Value |
|---|---|
| Phase | P1 — Database layer (TypeORM + PostgreSQL schema) |
| Status | Done |
| Commit | `feat: add TypeORM entities and Postgres migrations for packs` |

## Goal

TypeORM entities + initial migration matching [`Architecture.md`](../../Architecture.md) (`packs`, `pack_children`, `pack_contents`); Nest `TypeOrmModule` wired through `@nestjs/config`; migration CLI works against a local Postgres. **No** packs HTTP, health, or Compose.

## Explicit non-goals

- Packs controllers/services/DTOs (P5)
- `/health` (P2/P4)
- `Dockerfile` / `docker-compose.yml` (P3) — use a one-off local Postgres for verify
- Makefile / README rewrite (P6)

## Locked design choices

| Topic | Choice |
|---|---|
| Schema | Exact Architecture ER: `packs`, `pack_children`, `pack_contents` |
| `packs.id` | `varchar` PK (business ids like `pack.school`) |
| Relations | Junction entity `PackChild` + `PackContent` rows (not JSON arrays) |
| Constraints | Unique `(parent_pack_id, child_pack_id)`; unique `(pack_id, content_id)`; FKs to `packs` with `ON DELETE CASCADE` |
| Sync | `synchronize: false` always; schema only via migrations |
| Nest wiring | `TypeOrmModule.forRootAsync` + `ConfigService` (`autoLoadEntities: true`) |
| CLI | Separate ESM `DataSource` file; run with `typeorm-ts-node-esm` (repo is `"type": "module"`) |
| Env keys | `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` (+ reuse `PORT` from P0) |
| Local defaults | `localhost` / `5432` / `toca` / `toca` / `toca_packs` so reviewers can run without inventing names later in Compose |

### Env defaults (documented)

| Variable | Default |
|---|---|
| `DATABASE_HOST` | `localhost` |
| `DATABASE_PORT` | `5432` |
| `DATABASE_USER` | `toca` |
| `DATABASE_PASSWORD` | `toca` |
| `DATABASE_NAME` | `toca_packs` |

## Target layout

```text
src/
  database/
    data-source.ts          # CLI DataSource (migrations)
    database.module.ts      # TypeOrmModule.forRootAsync
  packs/
    entities/
      pack.entity.ts
      pack-child.entity.ts
      pack-content.entity.ts
  migrations/
    <timestamp>-InitialPacksSchema.ts
package.json                # migration scripts only (deps already in P0)
docs/plans/p1-database.md
```

Register `DatabaseModule` from [`src/app.module.ts`](../../src/app.module.ts). Do **not** add packs controllers/services.

## Entity sketch (aligned with Architecture)

- **Pack:** `id`, `packName` → `pack_name`, `active`, `price` (decimal), `createdAt` → `created_at`; relations to children + contents.
- **PackChild:** composite unique parent/child FKs (`parent_pack_id`, `child_pack_id`).
- **PackContent:** `pack_id` FK + `content_id`; unique per pack.

Cycle rejection stays a **P5** service concern (schema only supports the graph).

## Implementation steps (TDD-friendly)

1. **Context7** before coding: NestJS TypeORM `forRootAsync` + TypeORM migrations ESM (`typeorm-ts-node-esm`).
2. **Config:** document env vars; defaults above; optional tiny unit test that config keys resolve (or document-only if no helper extracted).
3. **Entities** under `src/packs/entities/` with column names matching Architecture.
4. **`data-source.ts`:** postgres options from env; `synchronize: false`; `entities` + `migrations` globs; used only by CLI.
5. **`DatabaseModule`:** `TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: ... })` with same options + `autoLoadEntities: true`, `synchronize: false`, sensible `retryAttempts` for local boot.
6. **Wire** `DatabaseModule` into `AppModule`.
7. **Migration:** generate initial migration from entities (`migration:generate`) or hand-write equivalent `up`/`down`; commit the migration file.
8. **Scripts** in `package.json` (pnpm):
   - `migration:generate`
   - `migration:run`
   - `migration:revert`
9. **Tests:** unit test(s) for entity metadata (table names / key columns via TypeORM `DataSource` with entities only, or lightweight column-name assertions). No packs HTTP e2e in P1. Keep coverage thresholds green (exclude `data-source.ts` / migrations from coverage if needed — do not lower thresholds).
10. **Verify locally:**
    - Start Postgres (e.g. one-off `docker run` postgres:16 with the default credentials — **not** project Compose yet).
    - `pnpm run migration:run`
    - `pnpm run build` / `lint` / `test` / `test:cov`
    - App boots with DB up (smoke `pnpm run start`).
11. **Docs:** write/update [`docs/plans/p1-database.md`](p1-database.md); set master-plan P1 detailed-plan link; after implement mark Done checklist `[x]` and status **done** (per AGENTS permanent rule).
12. **Commit:** `feat: add TypeORM entities and Postgres migrations for packs`

## Done checklist (update to `[x]` only after implementation)

- [x] Entities match Architecture tables/columns/constraints
- [x] `synchronize: false`; initial migration present
- [x] `TypeOrmModule` via ConfigService; env keys + defaults documented in phase plan
- [x] Migration scripts work (`migration:run` against local Postgres)
- [x] Lint + Vitest + coverage thresholds pass
- [x] No packs HTTP / health / Compose in this commit
- [x] `docs/plans/p1-database.md` Done checklist + master-plan status updated
- [x] Single commit with message above

## Agent notes

- Fetch Context7 for NestJS TypeORM + TypeORM migrations before writing code; project is ESM — use `typeorm-ts-node-esm`, not commonjs CLI blindly.
- Do not invent column names; follow Architecture.
- Ask if Postgres cannot be started for migration verify — do not fake a migration “applied” without running it.
- Package manager remains **pnpm** (P0).
