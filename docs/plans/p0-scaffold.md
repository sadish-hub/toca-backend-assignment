# P0 — Scaffold implementation plan

Source of truth: [`master-plan.md`](master-plan.md). This phase ends with **one commit**. Do not implement P1–P7 work.

| Field | Value |
|---|---|
| Phase | P0 — Project scaffold and tooling |
| Status | Done |
| Commit | `chore: scaffold NestJS app with Vitest, ESLint, and config` |

## Goal

NestJS TypeScript app boots locally on **8080**; ESLint + Vitest (+ coverage thresholds) work; `@nestjs/config` is global; stack packages are in `package.json` for later phases; [`AGENTS.md`](../../AGENTS.md) says Vitest.

## Explicit non-goals (P0)

- No TypeORM module/entities/migrations (P1)
- No `/health` (P2/P4)
- No Dockerfile / Compose changes beyond leaving existing stub alone (P3)
- No packs API (P5)
- No Makefile / README rewrite (P6)

## Approach (Context7-backed)

- Scaffold with Nest CLI (`nest new`): docs note CLI can choose **ESM + Vitest** vs CommonJS + Jest — **choose Vitest**.
- Existing repo already has docs/README/etc.: generate **into the repo root** (`nest new .` with skip-git / non-interactive flags as supported), then reconcile without deleting `docs/` (including `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`), `AGENTS.md`.
- Bootstrap per Nest docs: `NestFactory.create(AppModule)`, `ConfigModule.forRoot({ isGlobal: true })`, global `ValidationPipe`, listen on `PORT` default **8080** (assignment), not 3000.
- Vitest coverage via `coverage.thresholds` (lines/statements/functions **80**, branches **70**) per AGENTS.md / Vitest coverage docs.
- Install later-phase deps in **P0** so only this phase owns `package.json`: `@nestjs/config`, `class-validator`, `class-transformer`, `@nestjs/typeorm`, `typeorm`, `pg`, plus Supertest as a test dep (used from P2/P5).

## Target layout after P0

```text
src/
  main.ts
  app.module.ts
  app.controller.ts      # default Nest smoke route OK
  app.service.ts
  app.controller.spec.ts # Vitest
nest-cli.json
package.json
tsconfig*.json
eslint.config.* (or .eslintrc per CLI)
vitest.config.ts
docs/plans/master-plan.md
docs/plans/p0-scaffold.md
AGENTS.md                # Jest → Vitest
```

## Implementation steps

1. **Scaffold** Nest app in repo root (Vitest); keep existing project docs.
2. **Dependencies:** add config/validation/TypeORM/pg/supertest as above; ensure lockfile committed.
3. **`AppModule`:** `ConfigModule.forRoot({ isGlobal: true })` only (no TypeORM import yet).
4. **`main.ts`:** global `ValidationPipe` (`whitelist` + `transform` for production-ready defaults); listen `config.get('PORT') ?? 8080`.
5. **Vitest:** `vitest.config.ts` with coverage provider + thresholds; scripts: `test`, `test:cov`, `lint`, `start`, `start:dev`, `build`.
6. **ESLint:** Nest/TS defaults; `npm run lint` clean.
7. **Smoke test:** keep/adapt default controller unit test under Vitest so `npm test` passes (coverage may need exclude of `main.ts` or a tiny test so thresholds don’t fail on empty app — prefer excluding `main.ts` / bootstrap from coverage rather than lowering thresholds).
8. **Docs:** update [`AGENTS.md`](../../AGENTS.md) Tests + coverage wording from Jest → Vitest; update [`master-plan.md`](master-plan.md) status row after implementation commit.
9. **Verify:** `npm run build`, `npm run lint`, `npm test`, `npm run test:cov`, `npm run start` listens on 8080.
10. **Commit (only when human asks to implement + commit):** `chore: scaffold NestJS app with Vitest, ESLint, and config`

## Done checklist

- [x] App starts on 8080
- [x] Lint + Vitest + coverage thresholds configured and passing
- [x] `@nestjs/config` global
- [x] Stack deps present; TypeORM **not** wired
- [x] `AGENTS.md` says Vitest
- [x] No P1–P7 feature files beyond dep install
- [x] Single commit message as above (when committing)

## Agent notes for implementer

- Re-fetch Context7 for NestJS / Vitest / class-validator before coding if anything is unclear.
- Ask before deleting or overwriting `docs/`, `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`.
- Do not invent Nest CLI flags from memory — check `nest new --help` at implement time.
- Do not invent outdated APIs from memory.
