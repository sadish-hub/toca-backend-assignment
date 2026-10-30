# P7 — Verify against Requirements.md

Source of truth: [`docs/Requirements.md`](../Requirements.md). One commit. This phase may cross-cut **only** to close requirement gaps.

| Field | Value |
|---|---|
| Phase | P7 — Requirements verify |
| Status | Done |
| Commit | `chore: verify Requirements.md coverage and close gaps` |

## Goal

Prove every Requirements area is covered, record a checked verification artifact, and fix any gaps with the smallest possible changes before submission.

## Explicit non-goals

- New features (auth, Swagger, caching, extra endpoints beyond packs + health)
- Large refactors unrelated to a failed checklist item
- Rewriting Architecture unless a factual drift blocks verification

## Locked deliverables

| Artifact | Purpose |
|---|---|
| [`docs/REQUIREMENTS_CHECKLIST.md`](../REQUIREMENTS_CHECKLIST.md) | Pass/fail matrix + evidence commands/results; official five checklist boxes marked done |
| [`docs/plans/p7-verify-requirements.md`](p7-verify-requirements.md) | Phase plan + Done checklist |
| Gap fixes | Only what fails the matrix |

## Verification matrix (execute all)

| # | Requirement | How to verify | Pass criteria |
|---|---|---|---|
| 1 | TypeScript API | `pnpm run build` | Compiles |
| 2 | `POST /packs` | e2e and/or curl against Compose | Pack persisted; validation/409 behave |
| 3 | `GET /packs` | e2e/curl | Includes `id`, `packName`, `childPackIds`, `active` (+ price/content OK) |
| 4 | `GET /packs/:id/content` | e2e/curl | Flat unique nested content |
| 5 | Database | TypeORM + Postgres via Compose/`toca-postgres` | Data survives in DB |
| 6 | Tests | `pnpm test`, `pnpm test:e2e`, `pnpm test:cov` | All green; thresholds held |
| 7 | Code style | `pnpm lint` | Clean |
| 8 | One-command Compose | `docker compose up --build` (or `make up`); no reviewer `.env` | API `:8080`; local-only services |
| 9 | README docs | Read [`README.md`](../../README.md) | Setup + usage + getting-started present |
| 10 | AI disclosure | [`docs/AI_USAGE.md`](../AI_USAGE.md) + README link | Tools, purpose, prompt history present |
| 11 | Official checklist | Same five boxes as Requirements | All evidenced true in REQUIREMENTS_CHECKLIST |

## Known risk to check / likely gap fix

- **Dockerfile `strict-ssl false`** (build workaround): Prefer **remove** if `docker compose build` works without it on this machine; if TLS interception still breaks the build, keep it but document clearly in README/checklist as environment-specific. Do not leave unexplained.

## Implementation steps

1. Write this plan; link in master-plan (status pending until done).
2. Run quality gates: lint, test, test:e2e, test:cov, build.
3. Bring stack up (`make up` / compose); `make health`; curl POST/GET packs + content (create child then parent).
4. Fill [`docs/REQUIREMENTS_CHECKLIST.md`](../REQUIREMENTS_CHECKLIST.md) with pass/fail + commands.
5. Fix any failures (P7 cross-cut allowed); re-run affected gates.
6. Address Dockerfile SSL policy as above.
7. Mark P7 Done checklist + master-plan P7 **done**; tick assignment checklist section in README to match.
8. **Commit:** `chore: verify Requirements.md coverage and close gaps`

## Done checklist (check only after verification)

- [x] All matrix rows passed (or fixed then passed)
- [x] `docs/REQUIREMENTS_CHECKLIST.md` written with evidence
- [x] Dockerfile SSL policy resolved or documented
- [x] Official five Requirements checklist items evidenced true
- [x] `docs/plans/p7-verify-requirements.md` Done + master-plan status updated
- [x] Single commit with message above

## Agent notes

- Source of truth is [`docs/Requirements.md`](../Requirements.md), not memory.
- Use full Docker binary path if shell `docker` wrapper is broken.
- Never reuse unrelated Postgres containers; Compose `toca-postgres` / dedicated name only.
- Update Done checklist after the phase lands.
- Ask the human if a “gap” would change product behavior beyond Requirements (do not invent features).
