---
phase: 02-contribution-tracking
plan: 03
subsystem: blockchain
tags: [anchor, solana, merkle-tree, spl-account-compression, contribution-tracking, cpi]

# Dependency graph
requires:
  - phase: 02-01
    provides: "State structs (ContributionTreeConfig, ContributionLeaf, DeveloperProfile) and CPI helpers (compression, noop)"
provides:
  - "init_contribution_tree instruction: creates tree config PDA and initializes Merkle tree via CPI"
  - "record_contribution instruction: appends leaf to tree with noop emission for indexing"
  - "update_contribution_score instruction: reallocates DeveloperProfile PDA and writes score fields"
  - "Bankrun test suite with SPL program fixtures for contribution instructions"
  - "Generated IDL with all 5 instructions"
affects: [02-04, 02-05, api, indexer]

# Tech tracking
tech-stack:
  added: ["@solana/spl-account-compression@0.4.1"]
  patterns: ["CPI to spl-account-compression for Merkle tree operations", "CPI to spl-noop for indexer data emission", "PDA realloc for backward-compatible account expansion", "bankrun with external program .so fixtures"]

key-files:
  created:
    - "programs/gsd-hub/src/instructions/init_contribution_tree.rs"
    - "programs/gsd-hub/src/instructions/record_contribution.rs"
    - "programs/gsd-hub/src/instructions/update_score.rs"
    - "programs/gsd-hub/tests/contribution.test.ts"
    - "tests/fixtures/spl_account_compression.so"
    - "tests/fixtures/spl_noop.so"
  modified:
    - "programs/gsd-hub/src/instructions/mod.rs"
    - "programs/gsd-hub/src/lib.rs"
    - "package.json"
    - ".gitignore"

key-decisions:
  - "BN.js required for u64 instruction args in Anchor TypeScript client"
  - "Tree test params: depth=3, buffer=8 (1304 bytes) -- small tree sufficient for testing"
  - "External SPL program .so files downloaded from mainnet and committed to tests/fixtures/"

patterns-established:
  - "bankrun extra programs: load SPL .so from tests/fixtures/ via startAnchor extraPrograms parameter"
  - "PDA realloc pattern: realloc = 8 + 130 with realloc::zero = false for backward-compatible expansion"

# Metrics
duration: 7min
completed: 2026-02-08
---

# Phase 2 Plan 3: Contribution Instructions Summary

**Three Anchor instructions (init_contribution_tree, record_contribution, update_contribution_score) with bankrun tests exercising Merkle tree CPI, noop data emission, and PDA realloc**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-08T12:52:50Z
- **Completed:** 2026-02-08T12:59:26Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Implemented init_contribution_tree instruction that creates a ContributionTreeConfig PDA and initializes a concurrent Merkle tree via CPI to spl-account-compression
- Implemented record_contribution instruction that validates authority and score, emits leaf data via spl-noop for indexing, and appends the leaf hash to the Merkle tree
- Implemented update_contribution_score instruction that reallocates DeveloperProfile from 89 to 130 bytes on first call and writes contribution score fields
- All 8 bankrun tests pass (5 new contribution + 3 existing registration), with SPL programs loaded from .so fixtures

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement init_contribution_tree, record_contribution, and update_score instructions** - `89cba91` (feat)
2. **Task 2: Write bankrun tests for contribution instructions** - `03603de` (test)

## Files Created/Modified
- `programs/gsd-hub/src/instructions/init_contribution_tree.rs` - Merkle tree initialization instruction with CPI
- `programs/gsd-hub/src/instructions/record_contribution.rs` - Contribution recording with noop emission and leaf append
- `programs/gsd-hub/src/instructions/update_score.rs` - Score update with PDA realloc from 89 to 130 bytes
- `programs/gsd-hub/src/instructions/mod.rs` - Added three new instruction modules
- `programs/gsd-hub/src/lib.rs` - Added three new instruction entry points in #[program] block
- `programs/gsd-hub/tests/contribution.test.ts` - Bankrun test suite with 5 contribution tests
- `tests/fixtures/spl_account_compression.so` - SPL Account Compression program binary for bankrun
- `tests/fixtures/spl_noop.so` - SPL Noop program binary for bankrun
- `package.json` - Added @solana/spl-account-compression devDependency
- `.gitignore` - Added exception for tests/fixtures/*.so

## Decisions Made
- BN.js instances required for u64 instruction arguments in Anchor TypeScript client (plain numbers cause serialization errors)
- Tree test parameters: depth=3, buffer=8 (1304 bytes) -- small tree sufficient for test coverage without large allocations
- SPL program .so files downloaded from mainnet and committed to tests/fixtures/ with .gitignore exception

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] .gitignore excluded test fixture .so files**
- **Found during:** Task 2 (bankrun test creation)
- **Issue:** Root .gitignore had `*.so` rule that prevented committing SPL program fixtures needed for bankrun tests
- **Fix:** Added `!tests/fixtures/*.so` exception to .gitignore
- **Files modified:** .gitignore
- **Verification:** git add succeeded, files committed
- **Committed in:** 03603de (Task 2 commit)

**2. [Rule 1 - Bug] u64 args required BN instances, not plain objects**
- **Found during:** Task 2 (bankrun test creation)
- **Issue:** Anchor Borsh serialization requires bn.js BN instances for u64 arguments; passing plain objects caused `toArrayLike is not a function` error
- **Fix:** Imported BN from @coral-xyz/anchor and used `new BN(value)` for u64 arguments
- **Files modified:** programs/gsd-hub/tests/contribution.test.ts
- **Verification:** All tests pass
- **Committed in:** 03603de (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for test execution. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three contribution instructions are live in the IDL and tested
- Ready for Plan 04 (API/indexer integration) and Plan 05 (end-to-end flow)
- SPL program fixtures committed for reuse in future tests

## Self-Check: PASSED

All 7 key files verified present. Both task commits (89cba91, 03603de) confirmed in git log.

---
*Phase: 02-contribution-tracking*
*Completed: 2026-02-08*
