# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Every contributor's work is tracked on-chain and rewarded proportionally -- if the software succeeds economically, participants earn their fair share based on verified contributions.
**Current focus:** Phase 2 Contribution Tracking -- off-chain indexer complete, API endpoints next

## Current Position

Phase: 2 of 6 (Contribution Tracking)
Plan: 4 of 5 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 02-04-PLAN.md (off-chain indexer and Helius webhook)

Progress: [████████░░] 50% (8/16 estimated total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 11 min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | 71 min | 18 min |
| 02 | 4 | 22 min | 5.5 min |

**Recent Trend:**
- Last 5 plans: 9m, 6m, 6m, 3m, 4m
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
- [01-03]: On-chain PDA registration happens client-side (wallet signs); API handles off-chain data only
- [01-03]: sonner for toast notifications (lighter than shadcn toast, works with Server Components)
- [01-03]: Gradient avatar generated from wallet address bytes (no avatar upload in Phase 1)
- [01-03]: Server Component profile pages with direct Prisma queries (no API round-trip for SSR)
- [01-04]: shadcn-style Card/Badge/Button created as local components (no shadcn CLI configured)
- [01-04]: Transparency config uses placeholder multisig addresses (updated after setup-multisig.ts run)
- [01-04]: Changelog API returns empty array with 200 when database unavailable (graceful degradation)
- [01-04]: Anti-Rug Standard section uses factual language without defensive posture
- [02-01]: sha2 crate added for leaf hashing (anchor-lang 0.32.1 split SDK does not re-export solana_program::hash)
- [02-01]: Raw CPI discriminators computed via SHA-256 at runtime matching spl-account-compression Anchor IDL
- [02-01]: NOOP_PROGRAM_ID co-located with ACCOUNT_COMPRESSION_PROGRAM_ID in compression.rs
- [02-02]: Score formula uses sqrt diminishing returns for both task count and time active
- [02-02]: Node.js built-in test runner (node:test) for @gsd/utils tests -- zero extra dependencies
- [02-02]: DataView with explicit little-endian byte writes for Borsh-compatible serialization
- [02-04]: Inline base58 encode/decode in indexer to avoid adding bs58 dependency to webhook handler
- [02-04]: Helius webhook auth uses Authorization header comparison (not query parameter)
- [02-04]: leafIndex defaults to 0 in contribution record (tree indexer updates later if needed)
- [02-04]: One contribution per transaction assumption simplifies processing

### Pending Todos

- User must set up PostgreSQL (DATABASE_URL) and run `npx prisma db push` before full profile/directory flow works
- Run `scripts/setup-multisig.ts` with member public keys to create devnet multisig
- Set NEXT_PUBLIC_MULTISIG_ADDRESS after multisig creation
- Devnet SOL needed in wallet for on-chain PDA registration
- Set up Helius account and configure webhook (see 02-USER-SETUP.md)

### Blockers/Concerns

- [Research]: Legal counsel needed before Phase 4 (revenue sharing securities classification risk)
- [Research]: SolSplits long-term stability uncertain -- evaluate custom split program as alternative in Phase 4
- [01-01]: anchor-bankrun@0.5.0 peer dependency warning with @coral-xyz/anchor@0.32.1 (works, but may need update)
- [01-02]: Auth.js v5 is beta (5.0.0-beta.30) -- monitor for stable release

## Session Continuity

Last session: 2026-02-08
Stopped at: Phase 2 in progress. Plans 01-04 complete (state structs, CPI helpers, shared utils, on-chain instructions, off-chain indexer). Plan 05 remaining.
Resume file: .planning/phases/02-contribution-tracking/02-04-SUMMARY.md
