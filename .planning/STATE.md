# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Every contributor's work is tracked on-chain and rewarded proportionally -- if the software succeeds economically, participants earn their fair share based on verified contributions.
**Current focus:** Phase 3 Governance and Idea Rounds in progress.

## Current Position

Phase: 3 of 6 (Governance and Idea Rounds)
Plan: 3 of 7 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 03-03-PLAN.md (round lifecycle instructions + bankrun tests)

Progress: [████████████░░░░] 75% (12/16 estimated total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 10 min
- Total execution time: 1.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | 71 min | 18 min |
| 02 | 5 | 31 min | 6.2 min |
| 03 | 3 | 14 min | 4.7 min |

**Recent Trend:**
- Last 5 plans: 4m, 9m, 4m, 2m, 8m
- Trend: instruction + test plans take longer than pure type plans

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
- [02-03]: BN.js required for u64 instruction args in Anchor TypeScript client
- [02-03]: Tree test params: depth=3, buffer=8 (1304 bytes) for bankrun tests
- [02-03]: SPL program .so files downloaded from mainnet and committed to tests/fixtures/
- [02-04]: Inline base58 encode/decode in indexer to avoid adding bs58 dependency to webhook handler
- [02-04]: Helius webhook auth uses Authorization header comparison (not query parameter)
- [02-04]: leafIndex defaults to 0 in contribution record (tree indexer updates later if needed)
- [02-04]: One contribution per transaction assumption simplifies processing
- [02-05]: Merkle tree helpers implemented locally using @solana/web3.js (spl-account-compression v0.4.1 has broken dist paths)
- [02-05]: BigInt score serialized as string for server/client boundary (JSON cannot serialize BigInt)
- [02-05]: Removed .js extensions from @gsd/utils and @gsd/types barrel exports (Turbopack module resolution)
- [03-01]: QuorumType::required_bps() impl placed in governance_config.rs (co-located with GovernanceConfig)
- [03-01]: GovernanceError kept as separate enum from GsdHubError for domain separation
- [03-02]: TypeScript string unions mirror Rust enums with lowercase variants for JSON serialization
- [03-02]: VoteDepositInfo.isEligible is a computed client-side field (not on-chain) for convenience
- [03-03]: anchor-spl/idl-build feature required in Cargo.toml for Account<Mint> IDL generation compatibility
- [03-03]: SPL Token program .so downloaded from mainnet to tests/fixtures/ for bankrun mint creation
- [03-03]: Each bankrun test creates isolated context (no shared state between tests)

### Pending Todos

- User must set up PostgreSQL (DATABASE_URL) and run `npx prisma db push` before full profile/directory flow works
- Run `scripts/setup-multisig.ts` with member public keys to create devnet multisig
- Set NEXT_PUBLIC_MULTISIG_ADDRESS after multisig creation
- Devnet SOL needed in wallet for on-chain PDA registration
- Set up Helius account and configure webhook (see 02-USER-SETUP.md)
- Pre-existing siws.ts type error (Phase 01-02) causes `next build` TS check to fail -- needs fix before production

### Blockers/Concerns

- [Research]: Legal counsel needed before Phase 4 (revenue sharing securities classification risk)
- [Research]: SolSplits long-term stability uncertain -- evaluate custom split program as alternative in Phase 4
- [01-01]: anchor-bankrun@0.5.0 peer dependency warning with @coral-xyz/anchor@0.32.1 (works, but may need update)
- [01-02]: Auth.js v5 is beta (5.0.0-beta.30) -- monitor for stable release
- [01-02]: siws.ts SolanaSignInOutput type mismatch with @solana/wallet-standard-features -- causes strict TS build failure

## Session Continuity

Last session: 2026-02-08
Stopped at: Phase 3 plan 3 complete. Round lifecycle instructions + bankrun tests done. Continue with 03-04 (vote deposit and casting).
Resume file: .planning/phases/03-governance-idea-rounds/03-03-SUMMARY.md
