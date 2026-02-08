# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Every contributor's work is tracked on-chain and rewarded proportionally -- if the software succeeds economically, participants earn their fair share based on verified contributions.
**Current focus:** Phase 1 - Foundation & Authentication

## Current Position

Phase: 1 of 6 (Foundation & Authentication)
Plan: 2 of 4 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 01-02-PLAN.md (Next.js web app + SIWS auth)

Progress: [██░░░░░░░░] 13% (2/16 estimated total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 27 min
- Total execution time: 0.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 54 min | 27 min |

**Recent Trend:**
- Last 5 plans: 41m, 13m
- Trend: accelerating

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 6-phase structure derived from requirements -- Phases 1-4 (v1), Phases 5-6 (v2)
- [Roadmap]: Phases 1-2 are token-optional to build trust before introducing $GSD utility in Phase 3
- [Roadmap]: Revenue sharing (Phase 4) deferred until governance (Phase 3) and contribution tracking (Phase 2) are proven
- [01-01]: Root package.json without type:module to support CJS test tooling; sub-packages individually declare type:module
- [01-01]: Solana CLI v3.0.15 required for Anchor 0.32.1 dependency compatibility
- [01-01]: Program ID: Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw
- [01-02]: Auth.js v5 pinned to 5.0.0-beta.30 (no stable v5 release on npm)
- [01-02]: React Compiler enabled with babel-plugin-react-compiler
- [01-02]: SIWS Uint8Array serialized as base64 for Auth.js credentials transport
- [01-02]: Database errors during auth upsert don't block authentication (graceful degradation)
- [01-02]: pnpm.onlyBuiltDependencies added to root for Prisma/sharp/unrs-resolver build scripts

### Pending Todos

- User must set up PostgreSQL (DATABASE_URL) and AUTH_SECRET before full auth flow works -- see apps/web/USER-SETUP.md

### Blockers/Concerns

- [Research]: Legal counsel needed before Phase 4 (revenue sharing securities classification risk)
- [Research]: SolSplits long-term stability uncertain -- evaluate custom split program as alternative in Phase 4
- [Research]: Phase 2 needs Merkle tree sizing research during planning
- [01-01]: anchor-bankrun@0.5.0 peer dependency warning with @coral-xyz/anchor@0.32.1 (works, but may need update)
- [01-02]: Auth.js v5 is beta (5.0.0-beta.30) -- monitor for stable release

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed Plan 01-02 (Next.js web app + SIWS auth), ready for Plan 01-03
Resume file: .planning/phases/01-foundation-authentication/01-02-SUMMARY.md
