# AI usage disclosure

Per [`REQUIREMENTS.md`](REQUIREMENTS.md), this submission used AI tools during planning, implementation, tests, and documentation. This file records **tools**, **purpose**, and points to the **complete submission prompt history**.

## Tools

| Tool | Role |
|---|---|
| **Cursor** (Composer / coding agents) | Architecture drafts, phased plans, TDD implementation, Docker/Compose, README/Makefile, lint/test fixes |
| **Context7** (MCP docs) | Current NestJS, TypeORM, Vitest, class-validator, Docker-related API usage before writing library-facing code |

## Purpose by area

| Area | How AI was used |
|---|---|
| Requirements exploration | High-level read of the assignment; Postgres vs DynamoDB tradeoffs; TypeORM/Vitest/stack choices |
| Architecture & agent rules | `docs/ARCHITECTURE.md`, `AGENTS.md`, sequential master plan under `docs/plans/` |
| P0 Scaffold | NestJS + Vitest + ESLint + `@nestjs/config`, port 8080 |
| P1 Database | TypeORM entities, migrations, dedicated `toca-postgres` |
| P2–P4 Health / Docker | App health, Compose stack, DB readiness in `/health` |
| P5 Packs API | DTOs, create/list/content, BFS aggregation, cycle handling, unit + e2e |
| P6 Docs | Makefile, reviewer README, this AI disclosure |
| P7 Verify | Requirements matrix, Compose/curl evidence, checklist artifact, Dockerfile SSL re-check |

## Complete prompt history

The author-selected, verbatim prompt history for this submission is in:

**[`docs/AI_PROMPT_HISTORY.md`](AI_PROMPT_HISTORY.md)**

That file lists the verbatim user prompts included for REQUIREMENTS.md disclosure. “Build” entries are Plan-mode accepts.

## Notes

- Agents were instructed to follow `AGENTS.md` and phase plans; ambiguous product rules were clarified with the human before coding.
