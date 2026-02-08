---
phase: 04-revenue-mechanics
plan: 02
subsystem: instructions, testing
tags: [anchor, rust, solana, bankrun, revenue, pda, spl-token, system-program]

# Dependency graph
requires:
  - phase: 04-revenue-mechanics
    plan: 01
    provides: "Revenue state structs (RevenueConfig, RevenueEvent, RevenueClaim), RevenueError enum, vault seed constant"
  - phase: 02-contribution-tracking
    provides: "DeveloperProfile with contribution_score for weighted claim calculation"
provides:
  - "init_revenue_config instruction with 60/20/10/10 bps split"
  - "record_revenue_event instruction with split calculation and SOL vault funding"
  - "claim_revenue_share instruction with PDA-signed SOL transfer from vault"
  - "execute_burn instruction with SPL token burn and traceability"
  - "Updated IDL with 4 new revenue instructions"
  - "7 bankrun tests covering full revenue lifecycle"
affects: [04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SystemAccount PDA as SOL vault with CpiContext::new_with_signer for PDA-signed transfers"
    - "u128 intermediary for overflow-safe contribution-weighted share calculation"
    - "PDA init uniqueness for double-claim prevention (not init_if_needed)"
    - "Rounding remainder assigned to developer_pool in basis-point split"

key-files:
  created:
    - "programs/gsd-hub/src/instructions/init_revenue_config.rs"
    - "programs/gsd-hub/src/instructions/record_revenue_event.rs"
    - "programs/gsd-hub/src/instructions/claim_revenue_share.rs"
    - "programs/gsd-hub/src/instructions/execute_burn.rs"
    - "programs/gsd-hub/tests/revenue.test.ts"
  modified:
    - "programs/gsd-hub/src/instructions/mod.rs"
    - "programs/gsd-hub/src/lib.rs"

key-decisions:
  - "Anchor seeds use .as_ref() on all elements for consistent slice types in PDA derivation"
  - "bankrun getSolBalance uses getAccountInfo().lamports instead of getBalance (not available in bankrun)"
  - "Vault bump stored on RevenueEvent for claim instruction to re-derive vault PDA signer"

patterns-established:
  - "Revenue vault PDA-signed transfer: derive seeds from event_index, use CpiContext::new_with_signer"
  - "Basis-point split with rounding remainder: compute 4 splits, assign total-sum difference to developer_pool"
  - "Admin authority constraint via revenue_config.admin comparison"

# Metrics
duration: 6min
completed: 2026-02-08
---

# Phase 4 Plan 2: Revenue Instructions Summary

**Four on-chain revenue instructions (init_config, record_event, claim_share, execute_burn) with PDA-signed SOL vault transfers and 7 bankrun tests covering the full revenue lifecycle**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-08T18:47:59Z
- **Completed:** 2026-02-08T18:54:25Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Four revenue instructions compiling and generating IDL entries
- 60/20/10/10 basis-point split calculation with rounding remainder to developer_pool
- Actual SOL transfers: admin funds vault via system_program::transfer, contributors claim via PDA-signed CPI
- SPL token burn via anchor_spl::token::burn with burn_signature traceability
- Double-claim prevention via PDA init uniqueness (not init_if_needed)
- 7 bankrun tests passing: init, record+vault funding, threshold rejection, weighted claim with SOL transfer, double-claim, burn traceability, double-burn
- All 31 tests passing (no regressions in contribution, governance, or profile tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement four revenue instructions** - `f601ea1` (feat)
2. **Task 2: Write bankrun tests for revenue instructions** - `293a195` (test)

## Files Created/Modified
- `programs/gsd-hub/src/instructions/init_revenue_config.rs` - Revenue config initialization with 60/20/10/10 split
- `programs/gsd-hub/src/instructions/record_revenue_event.rs` - Event recording with split calculation and SOL vault funding
- `programs/gsd-hub/src/instructions/claim_revenue_share.rs` - Contribution-weighted claim with PDA-signed vault transfer
- `programs/gsd-hub/src/instructions/execute_burn.rs` - SPL token burn with burn_signature traceability
- `programs/gsd-hub/src/instructions/mod.rs` - Added 4 new module declarations and re-exports
- `programs/gsd-hub/src/lib.rs` - Added 4 entry points, imported RevenueToken enum
- `programs/gsd-hub/tests/revenue.test.ts` - 7 bankrun tests for full revenue lifecycle

## Decisions Made
- Anchor PDA seeds use `.as_ref()` on all elements for consistent `&[u8]` slice types (required by Anchor macro)
- bankrun `getSolBalance` helper uses `getAccountInfo().lamports` since `getBalance` is not available in bankrun provider
- Vault bump stored on RevenueEvent.vault_bump for claim instruction to re-derive vault PDA signer seeds

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Anchor seeds type mismatch**
- **Found during:** Task 1 (instruction compilation)
- **Issue:** `seeds = [b"revenue_event", &revenue_config.event_count.to_le_bytes()]` failed with "expected array size 13, found 4" because Anchor macro infers array types from first seed element
- **Fix:** Added `.as_ref()` to all seed elements: `seeds = [b"revenue_event".as_ref(), revenue_config.event_count.to_le_bytes().as_ref()]`
- **Files modified:** record_revenue_event.rs, claim_revenue_share.rs, execute_burn.rs
- **Verification:** cargo check passes
- **Committed in:** f601ea1

**2. [Rule 1 - Bug] Fixed bankrun getSolBalance using unavailable API**
- **Found during:** Task 2 (test execution)
- **Issue:** `provider.connection.getBalance` is not a function in bankrun's BankrunProvider connection
- **Fix:** Changed to `provider.connection.getAccountInfo(account)` and read `.lamports` property
- **Files modified:** revenue.test.ts
- **Verification:** All 7 revenue tests pass
- **Committed in:** 293a195

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for compilation and test execution. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Revenue instructions complete and tested, ready for detection and distribution wiring (04-03)
- IDL updated with all 4 instruction definitions for TypeScript client integration
- Vault PDA pattern established for off-chain distributor to interact with

## Self-Check: PASSED

All 7 files verified present. Both task commits (f601ea1, 293a195) verified in git log.

---
*Phase: 04-revenue-mechanics*
*Completed: 2026-02-08*
