---
phase: 04-revenue-mechanics
plan: 01
subsystem: state, types, database
tags: [anchor, rust, solana, prisma, typescript, pda, revenue]

# Dependency graph
requires:
  - phase: 02-contribution-tracking
    provides: "Contribution scoring system that revenue distribution is proportional to"
  - phase: 03-governance-idea-rounds
    provides: "GovernanceError pattern for domain-separated error enums, governance state struct patterns"
provides:
  - "RevenueConfig singleton PDA struct for split ratios and admin config"
  - "RevenueEvent per-event PDA struct with split amounts and burn traceability"
  - "RevenueClaim per-contributor per-event PDA struct"
  - "RevenueVault seed constant for SystemAccount PDA"
  - "RevenueError enum with 11 error codes"
  - "TypeScript revenue types (RevenueStatus, RevenueToken, RevenueEventInfo, RevenueClaimInfo, RevenueConfigInfo, RevenueSummary)"
  - "PDA derivation functions (getRevenueConfigPDA, getRevenueEventPDA, getRevenueClaimPDA, getRevenueVaultPDA)"
  - "Prisma models (RevenueEvent, RevenueClaim, PendingRevenue)"
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Domain-separated error enum (RevenueError) following GovernanceError pattern"
    - "SystemAccount PDA vault pattern (no Anchor struct, just seed constant)"
    - "Burn traceability via origin_signature and burn_signature fields"

key-files:
  created:
    - "programs/gsd-hub/src/state/revenue_config.rs"
    - "programs/gsd-hub/src/state/revenue_event.rs"
    - "programs/gsd-hub/src/state/revenue_claim.rs"
    - "programs/gsd-hub/src/state/revenue_vault.rs"
    - "packages/types/src/revenue.ts"
    - "packages/utils/src/revenue-pda.ts"
  modified:
    - "programs/gsd-hub/src/state/mod.rs"
    - "programs/gsd-hub/src/errors.rs"
    - "packages/types/src/index.ts"
    - "packages/utils/src/index.ts"
    - "apps/web/prisma/schema.prisma"

key-decisions:
  - "RevenueVault uses SystemAccount PDA pattern (no Anchor struct) since it only holds SOL; USDC uses ATA derived from the PDA"
  - "RevenueError kept as separate enum from GsdHubError and GovernanceError for domain separation"
  - "PendingRevenue model added for treasury inflow detection flow (REVN-01 detection)"

patterns-established:
  - "Revenue vault as SystemAccount PDA with seed constant only"
  - "Burn traceability: origin_signature links to revenue tx, burn_signature links to burn tx"
  - "Contribution score snapshot in RevenueEvent prevents manipulation after recording"

# Metrics
duration: 3min
completed: 2026-02-08
---

# Phase 4 Plan 1: Revenue State Foundation Summary

**Revenue state account structs (RevenueConfig/Event/Claim) with InitSpace derives, 11 error codes, TypeScript types/PDA helpers, and Prisma models for off-chain persistence**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-08T18:41:59Z
- **Completed:** 2026-02-08T18:45:02Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Three Rust state structs (RevenueConfig 189B, RevenueEvent 226B, RevenueClaim 105B) compile with InitSpace derive
- RevenueError enum with 11 error codes covering all revenue failure cases
- TypeScript types mirror Rust enums with lowercase string unions following established governance pattern
- PDA derivation functions with correct seed matching between Rust and TypeScript
- Prisma schema extended with RevenueEvent, RevenueClaim, and PendingRevenue models

## Task Commits

Each task was committed atomically:

1. **Task 1: Create revenue state account structs and error codes** - `597b3aa` (feat)
2. **Task 2: Create TypeScript revenue types, PDA helpers, and Prisma models** - `89754e5` (feat)

## Files Created/Modified
- `programs/gsd-hub/src/state/revenue_config.rs` - RevenueConfig singleton PDA struct (admin, split ratios, mints)
- `programs/gsd-hub/src/state/revenue_event.rs` - RevenueEvent per-event PDA + RevenueStatus/RevenueToken enums
- `programs/gsd-hub/src/state/revenue_claim.rs` - RevenueClaim per-contributor per-event PDA
- `programs/gsd-hub/src/state/revenue_vault.rs` - REVENUE_VAULT_SEED constant for SystemAccount PDA
- `programs/gsd-hub/src/state/mod.rs` - Added revenue module declarations and re-exports
- `programs/gsd-hub/src/errors.rs` - Added RevenueError enum with 11 error codes
- `packages/types/src/revenue.ts` - TypeScript revenue types (5 types + 1 summary interface)
- `packages/types/src/index.ts` - Barrel export for revenue types
- `packages/utils/src/revenue-pda.ts` - PDA derivation functions (4 functions + 4 seed constants)
- `packages/utils/src/index.ts` - Barrel export for revenue PDA helpers
- `apps/web/prisma/schema.prisma` - RevenueEvent, RevenueClaim, PendingRevenue models

## Decisions Made
- RevenueVault uses SystemAccount PDA pattern (no Anchor struct) since it only holds SOL; USDC uses ATA derived from the PDA
- RevenueError kept as separate enum from GsdHubError and GovernanceError for domain separation (matching GovernanceError pattern from 03-01)
- PendingRevenue model added for treasury inflow detection flow before admin review

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Revenue state foundation complete, ready for instruction implementation (04-02)
- All PDA seeds consistent between Rust and TypeScript
- Error codes cover all anticipated failure cases for instructions

## Self-Check: PASSED

All 11 files verified present. Both task commits (597b3aa, 89754e5) verified in git log.

---
*Phase: 04-revenue-mechanics*
*Completed: 2026-02-08*
