---
phase: 03-governance-idea-rounds
plan: 02
subsystem: types, database, utils
tags: [typescript, prisma, pda, governance, treasury, solana]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Monorepo structure, @gsd/types and @gsd/utils packages, Prisma schema with User/Contribution models"
  - phase: 02-contribution-tracking
    provides: "BigInt-as-string convention, barrel export pattern without .js extensions, PDA derivation pattern"
  - phase: 03-governance-idea-rounds
    plan: 01
    provides: "On-chain governance state structs and enums (GovernanceConfig, IdeaRound, Idea, VoteDeposit, VoteRecord)"
provides:
  - "TypeScript governance types: RoundStatus, QuorumType, IdeaStatus, VoteChoice, IdeaRound, Idea, VoteRecord, VoteDepositInfo, GovernanceConfig"
  - "TypeScript input types: CreateIdeaInput, CreateRoundInput"
  - "TypeScript treasury types: TreasuryBalance, TreasuryTransaction"
  - "PDA derivation functions: getGovernanceConfigPDA, getIdeaRoundPDA, getIdeaPDA, getVoteDepositPDA, getVoteRecordPDA"
  - "Prisma models: IdeaRound, Idea, Vote, VoteDeposit with relations and indexes"
affects: [03-03, 03-04, 03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: []
  patterns: [governance PDA derivation in TypeScript, Prisma BigInt for vote weights, string union types mirroring Rust enums]

key-files:
  created:
    - "packages/types/src/governance.ts"
    - "packages/types/src/treasury.ts"
    - "packages/utils/src/governance-pda.ts"
  modified:
    - "packages/types/src/index.ts"
    - "packages/utils/src/index.ts"
    - "apps/web/prisma/schema.prisma"

key-decisions:
  - "TypeScript string unions (e.g. 'open' | 'voting' | 'closed') mirror Rust enums with lowercase variants for JSON serialization"
  - "VoteDepositInfo.isEligible is a computed client-side field (not on-chain) for convenience"

patterns-established:
  - "Governance PDA derivation: u32ToLeBytes helper for index-based seeds matching Rust to_le_bytes()"
  - "Prisma BigInt columns for on-chain u64 vote weights (yesWeight, noWeight, abstainWeight, weight, depositedAmount)"
  - "Prisma unique constraints on on-chain addresses for idempotent indexing"

# Metrics
duration: 2min
completed: 2026-02-08
---

# Phase 3 Plan 2: Governance Types, PDAs, and Prisma Models Summary

**TypeScript governance/treasury types mirroring on-chain structs, 5 PDA derivation functions, and 4 Prisma models for off-chain governance indexing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-08T13:56:30Z
- **Completed:** 2026-02-08T13:58:33Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- 11 governance types and 2 input types exported from @gsd/types matching all on-chain state structs and enums
- 2 treasury types for dashboard balance and transaction display
- 5 PDA derivation functions in @gsd/utils matching on-chain seed patterns exactly
- 4 Prisma models (IdeaRound, Idea, Vote, VoteDeposit) with relations, indexes, and BigInt vote weight columns

## Task Commits

Each task was committed atomically:

1. **Task 1: Create governance and treasury TypeScript types + PDA derivation helpers** - `6943991` (feat)
2. **Task 2: Extend Prisma schema with governance models** - `f3d1e2f` (feat)

## Files Created/Modified
- `packages/types/src/governance.ts` - TypeScript types for all governance entities (RoundStatus, QuorumType, IdeaStatus, VoteChoice, IdeaRound, Idea, VoteRecord, VoteDepositInfo, GovernanceConfig, CreateIdeaInput, CreateRoundInput)
- `packages/types/src/treasury.ts` - TreasuryBalance and TreasuryTransaction types for dashboard
- `packages/types/src/index.ts` - Added barrel exports for governance and treasury modules
- `packages/utils/src/governance-pda.ts` - 5 PDA derivation functions with seed constants
- `packages/utils/src/index.ts` - Added barrel exports for governance PDA functions and seed constants
- `apps/web/prisma/schema.prisma` - Added IdeaRound, Idea, Vote, VoteDeposit models with relations and indexes

## Decisions Made
- TypeScript string unions (`"open" | "voting" | "closed"`) used to mirror Rust enums with lowercase naming for natural JSON serialization
- VoteDepositInfo includes `isEligible` as a computed convenience field (derived client-side from comparing eligibleAt to current time, not stored on-chain)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. Database migration (`prisma db push`) is already listed as a pending user setup item from Phase 1.

## Next Phase Readiness
- All governance types available for import in API route handlers (plans 03-03, 03-04)
- PDA derivation functions ready for client-side account lookup in UI components (plans 03-05, 03-06)
- Prisma models ready for indexer and API queries after `prisma db push`
- Treasury types available for dashboard component (plan 03-07)

## Self-Check: PASSED

All 6 files exist. Both commits (6943991, f3d1e2f) verified. 11 governance type exports, 2 treasury type exports, 5 PDA functions, 4 Prisma models (IdeaRound, Idea, Vote, VoteDeposit), and barrel exports all confirmed present.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
