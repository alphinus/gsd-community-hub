---
phase: 02-contribution-tracking
plan: 02
subsystem: utils
tags: [sha-256, bigint, borsh, merkle-tree, contribution, scoring, tdd]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    provides: "@gsd/types and @gsd/utils package structure, @solana/web3.js dependency"
provides:
  - "ContributionData, ContributionRecord, ContributionScore types in @gsd/types"
  - "computeContributionLeafHash: SHA-256 leaf hash matching on-chain Borsh serialization"
  - "serializeContributionLeaf: 106-byte canonical serialization"
  - "calculateContributionScore: BigInt score calculation with sqrt diminishing returns"
  - "bigintSqrt: Newton's method integer square root for BigInt"
  - "hexToBytes/bytesToHex: hex encoding utilities"
affects: [02-contribution-tracking, 03-governance, 04-revenue-sharing]

# Tech tracking
tech-stack:
  added: [node:test, node:assert]
  patterns: [TDD red-green, BigInt arithmetic, Borsh-compatible serialization, crypto.subtle SHA-256]

key-files:
  created:
    - packages/types/src/contribution.ts
    - packages/utils/src/contribution-hash.ts
    - packages/utils/src/score.ts
    - packages/utils/tests/contribution-hash.test.ts
    - packages/utils/tests/score.test.ts
  modified:
    - packages/types/src/index.ts
    - packages/utils/src/index.ts
    - packages/utils/package.json

key-decisions:
  - "Score formula uses sqrt diminishing returns for both task count and time active"
  - "Node.js built-in test runner (node:test) for utils package tests -- no extra dependency"
  - "Serialization uses DataView for precise little-endian byte layout matching Borsh"

patterns-established:
  - "TDD with node:test and assert/strict for @gsd/utils"
  - "BigInt for all on-chain score arithmetic to prevent overflow"
  - "106-byte Borsh-compatible serialization for contribution leaf data"

# Metrics
duration: 6min
completed: 2026-02-08
---

# Phase 2 Plan 2: Shared Utility Packages Summary

**Contribution types, SHA-256 leaf hash matching on-chain Borsh serialization, and BigInt score calculation with TDD**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-08T12:42:50Z
- **Completed:** 2026-02-08T12:49:01Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- ContributionData, ContributionRecord, and ContributionScore types exported from @gsd/types
- computeContributionLeafHash produces SHA-256 hash from 106-byte Borsh-compatible serialization matching on-chain ContributionLeaf::to_leaf_hash()
- calculateContributionScore uses BigInt throughout with sqrt diminishing returns for volume and longevity
- 34 tests total: 12 hash tests (serialization layout, determinism, uniqueness) + 22 score tests (zero inputs, overflow, monotonicity, BigInt precision)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create contribution types and hash utility with tests** - `63dcef3` (feat)
2. **Task 2: Implement score calculation with TDD** - `c591070` (feat)

_Note: TDD tasks followed red-green cycle. Test hex calculation error caught and fixed during green phase._

## Files Created/Modified
- `packages/types/src/contribution.ts` - ContributionData, ContributionRecord, ContributionScore interfaces
- `packages/types/src/index.ts` - Added contribution type exports
- `packages/utils/src/contribution-hash.ts` - serializeContributionLeaf (106-byte Borsh), computeContributionLeafHash (SHA-256), hexToBytes/bytesToHex
- `packages/utils/src/score.ts` - calculateContributionScore (BigInt), bigintSqrt (Newton's method)
- `packages/utils/src/index.ts` - Added contribution-hash and score exports
- `packages/utils/package.json` - Added test script
- `packages/utils/tests/contribution-hash.test.ts` - 12 tests for serialization and hashing
- `packages/utils/tests/score.test.ts` - 22 tests for score calculation edge cases

## Decisions Made
- **Score formula:** `sqrt(tasks * PRECISION) * totalScore * sqrt(days * PRECISION) / PRECISION` -- gives sqrt diminishing returns on volume and longevity, linear on cumulative quality. This means both prolific and long-term contributors are rewarded, but not linearly (prevents gaming via quantity spam).
- **Test framework:** Node.js built-in `node:test` and `node:assert/strict` -- zero additional dependencies, runs with `npx tsx --test`.
- **Serialization approach:** DataView with explicit little-endian byte writes to match Borsh serialization. PublicKey from @solana/web3.js handles base58 decoding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect timestamp hex calculation in test**
- **Found during:** Task 1 (TDD green phase)
- **Issue:** Test expected 1700000000 = 0x65544F00 but correct value is 0x6553F100
- **Fix:** Updated test assertion bytes from [0x00, 0x4F, 0x54, 0x65] to [0x00, 0xF1, 0x53, 0x65]
- **Files modified:** packages/utils/tests/contribution-hash.test.ts
- **Verification:** All 12 hash tests pass
- **Committed in:** 63dcef3 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed TypeScript strict typing for crypto.subtle.digest**
- **Found during:** Task 1 (TDD green phase, tsc --noEmit)
- **Issue:** `Uint8Array<ArrayBufferLike>` not assignable to `BufferSource` in strict mode
- **Fix:** Cast `serialized.buffer as ArrayBuffer` for crypto.subtle.digest call
- **Files modified:** packages/utils/src/contribution-hash.ts
- **Verification:** tsc --noEmit passes, all tests still pass
- **Committed in:** 63dcef3 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed issues above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- @gsd/types and @gsd/utils now export all contribution-related types and utilities needed by subsequent plans
- Plans 02-03 (API routes), 02-04 (webhook indexer), and 02-05 (tree client) can import these directly
- 34 passing tests provide regression safety for the mathematical functions

## Self-Check: PASSED

All 8 created/modified files verified present. Both task commits (63dcef3, c591070) confirmed in git log.

---
*Phase: 02-contribution-tracking*
*Completed: 2026-02-08*
