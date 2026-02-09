# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core value:** Every contributor's work is tracked on-chain and rewarded proportionally -- if the software succeeds economically, participants earn their fair share based on verified contributions.
**Current focus:** Phase 5 in progress. GSD Framework Integration -- verification and peer review subsystem.

## Current Position

Phase: 5 of 6 (GSD Framework Integration)
Plan: 6 of 8 in current phase -- COMPLETE
Status: Executing
Last activity: 2026-02-09 -- Completed 05-06-PLAN.md (Peer review system)

Progress: [█████████████████████████░░] 90% (26/29 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 26
- Average duration: 7.0 min
- Total execution time: 3.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | 71 min | 18 min |
| 02 | 5 | 31 min | 6.2 min |
| 03 | 7 | 34 min | 4.9 min |
| 04 | 5 | 24 min | 4.8 min |
| 05 | 5 | 27 min | 5.4 min |

**Recent Trend:**
- Last 5 plans: 8m, 5m, 7m, 4m, 5m
- Trend: Peer review plan ~5m; Proposal analysis plan ~4m; AI engine plans ~6-7m

*Updated after each plan completion*
| Phase 05 P05 | 6 | 2 tasks | 6 files |

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
- [03-04]: Global escrow vault ATA owned by governance_config PDA; PDA signs for withdrawals
- [03-04]: init_if_needed on VoteDeposit allows cumulative deposits without separate init step
- [03-04]: Timelock test requires custom round timing to test pre-eligible vote rejection
- [03-05]: Dual-processor webhook routes transactions through both contribution and governance processors
- [03-05]: Off-chain content submitted via POST endpoints; indexer creates stub records from on-chain events
- [03-05]: Reverse discriminator lookup map for O(1) instruction identification in governance indexer
- [03-06]: Route group conflict resolved by moving auth governance pages to (public) group with client-side wallet checks
- [03-06]: Deposit page auto-triggers wallet connect modal on mount
- [03-07]: Treasury address falls back to System Program address when NEXT_PUBLIC_TREASURY_ADDRESS not set
- [03-07]: SPL Token balance parsed via raw Buffer.readBigUInt64LE(64) instead of adding spl-token runtime dep
- [03-07]: HELIUS_API_KEY optional for treasury -- balance-only mode with warning when key missing
- [04-01]: RevenueVault uses SystemAccount PDA pattern (no Anchor struct) -- SOL held directly, USDC via ATA
- [04-01]: RevenueError kept as separate enum from GsdHubError/GovernanceError for domain separation
- [04-01]: PendingRevenue model stores detected treasury inflows for admin review before distribution
- [04-02]: Anchor PDA seeds use .as_ref() on all elements for consistent slice types in seed derivation
- [04-02]: bankrun getSolBalance uses getAccountInfo().lamports (getBalance not available in bankrun)
- [04-02]: Vault bump stored on RevenueEvent.vault_bump for claim instruction PDA signer re-derivation
- [04-03]: HeliusEnhancedTransaction nativeTransfers/tokenTransfers accessed via type assertion (runtime fields not on minimal interface)
- [04-03]: Revenue detection separated from instruction indexing (detectRevenueInflow on every tx, processRevenueEvent on gsd-hub only)
- [04-03]: USDC amount conversion uses Math.round(tokenAmount * 1e6) for Helius human-readable decimals
- [04-03]: Quad-processor webhook pipeline (contribution + governance + revenue-instructions + revenue-detection)
- [04-04]: Distribution triggered manually via admin API, not automatically on webhook (v1 safety measure per research)
- [04-04]: Buy-and-burn failure returns null instead of throwing, allowing distribution to complete without burn
- [04-04]: Inline base58 decode for burn authority keypair loading (project convention from 02-04)
- [04-04]: Jupiter swap confirmation failure still returns signature (swap may land on-chain despite timeout)
- [04-05]: TreasuryTabs client component wraps tab navigation while treasury page remains Server Component for SEO
- [04-05]: Claim panel shows claim history only (not 'claim now' button) -- v1 server-side distribution model
- [04-05]: BigInt string amounts formatted client-side with token-specific decimal divisors
- [05-01]: VerificationError as separate enum following GovernanceError/RevenueError domain separation pattern
- [05-01]: PDA seeds: verification_config, verification, peer_review, reviewer -- consistent between Rust and TypeScript
- [05-01]: ReviewerProfile stores aggregate totals on-chain; domain-specific breakdown in Prisma JSON fields
- [05-01]: IdeaAnalysis model added to Prisma with relation to Idea for AI feasibility analysis
- [05-01]: Verification scores use 0-10000 basis points normalization consistent with revenue/governance conventions
- [05-02]: Zod v4.3.6 installed -- Anthropic SDK v0.74.0 supports zod v3 and v4 as peer dependencies
- [05-02]: Server-side weighted score recomputation: AI overallScore is informational only, authoritative score computed by computeWeightedScore
- [05-02]: Temperature 0 on verification calls to minimize scoring variance
- [05-02]: Domain tags inferred from file paths via glob pattern matching, merged with AI-inferred tags
- [05-02]: Using GA output_config.format API (not deprecated output_format parameter)
- [05-03]: Confidence threshold determines AI verification auto-completion vs peer review requirement
- [05-03]: Peer consensus calculation kept off-chain; finalize_peer_verification records result on-chain
- [05-03]: VerificationType import added to lib.rs state re-exports for instruction handler signatures
- [05-04]: Static codebase summary (6.9KB hardcoded) rather than dynamic generation for AI proposal analysis context
- [05-04]: Temperature 0 on proposal analysis calls matching verification engine convention
- [05-04]: Analysis GET endpoint returns status field (pending/completed/unavailable) for polling support
- [05-04]: JSON.parse(JSON.stringify(analysis)) for Prisma 7 strict Json field type compatibility
- [05-06]: Score input as 0-100 at API level, scaled to 0-10000 BPS internally for on-chain consistency
- [05-06]: Reviewer profiles auto-created on first review submission (permissionless entry to review system)
- [05-06]: JSON.parse(JSON.stringify()) for Prisma 7 strict Json field compatibility on evidence and domain maps
- [05-06]: Wallet address truncation (4+4 chars) in status endpoint for reviewer privacy
- [Phase 05]: [05-05]: Auth uses session.publicKey pattern (matching profile route convention) not session.user.name
- [Phase 05]: [05-05]: On-chain recording deferred -- reports stored off-chain first, on-chain recording triggered separately when server signing available
- [Phase 05]: [05-05]: GET verification endpoints are public (no auth) for transparency -- every report is publicly auditable
- [Phase 05]: [05-05]: 5-processor Helius webhook pipeline (contribution + governance + revenue + detection + verification)

### Pending Todos

- User must set up PostgreSQL (DATABASE_URL) and run `npx prisma db push` before full profile/directory flow works
- Run `scripts/setup-multisig.ts` with member public keys to create devnet multisig
- Set NEXT_PUBLIC_MULTISIG_ADDRESS after multisig creation
- Devnet SOL needed in wallet for on-chain PDA registration
- Set up Helius account and configure webhook (see 02-USER-SETUP.md)
- Pre-existing siws.ts type error (Phase 01-02) causes `next build` TS check to fail -- needs fix before production
- Set NEXT_PUBLIC_TREASURY_ADDRESS to real multisig vault PDA
- Set NEXT_PUBLIC_GSD_MINT to real $GSD token mint address
- Set HELIUS_API_KEY for treasury transaction history
- Set JUPITER_API_KEY for buy-and-burn swap execution
- Generate and set BURN_AUTHORITY_KEYPAIR for burn operations
- Set REVENUE_ADMIN_SECRET for distribution API endpoint
- Set ANTHROPIC_API_KEY for AI verification engine (Claude API access)

### Blockers/Concerns

- [Research]: Legal counsel needed before Phase 4 (revenue sharing securities classification risk)
- [Research]: SolSplits long-term stability uncertain -- evaluate custom split program as alternative in Phase 4
- [01-01]: anchor-bankrun@0.5.0 peer dependency warning with @coral-xyz/anchor@0.32.1 (works, but may need update)
- [01-02]: Auth.js v5 is beta (5.0.0-beta.30) -- monitor for stable release
- [01-02]: siws.ts SolanaSignInOutput type mismatch with @solana/wallet-standard-features -- causes strict TS build failure

## Session Continuity

Last session: 2026-02-09
Stopped at: Completed 05-06-PLAN.md (Peer review system)
Resume file: .planning/phases/05-gsd-framework-integration/05-06-SUMMARY.md
