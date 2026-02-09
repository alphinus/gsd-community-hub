---
phase: 06-advanced-governance
plan: 03
subsystem: utils, scoring
tags: [typescript, tdd, decay, reputation, bigint, node-test]

# Dependency graph
requires:
  - phase: 02-contribution-tracking
    provides: "calculateContributionScore, ScoreInput, bigintSqrt in @gsd/utils"
  - phase: 06-advanced-governance
    plan: 01
    provides: "GovernanceConfig.decay_half_life_days field (180-day default)"
provides:
  - "decayMultiplier function: exponential half-life decay 2^(-age/halfLife)"
  - "calculateDecayedScore function: weighted sum of contributions with age-based decay"
  - "calculateContributionScoreWithDecay function: feeds decayed total into existing score formula"
  - "DECAY_HALF_LIFE_DAYS constant (180)"
  - "DecayContribution and DecayScoreInput types"
  - "22-test TDD suite for decay computation"
affects: [06-04, 06-05, 06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exponential half-life decay formula for reputation weighting"
    - "Float-to-BigInt rounding via Math.round() for precise integer conversion"
    - "Composition pattern: decay functions feed into existing score formula"

key-files:
  created:
    - packages/utils/src/decay.ts
    - packages/utils/tests/decay.test.ts
  modified:
    - packages/utils/src/index.ts

key-decisions:
  - "Test file placed in packages/utils/tests/ (not src/) to match existing test convention"
  - "DecayContribution interface uses number types (not BigInt) since decay multiplier operates in float space"
  - "Math.round() used for float-to-BigInt conversion to ensure exact half-life values (5000n not 4999n)"

patterns-established:
  - "Decay functions compose with existing score functions via modified ScoreInput"
  - "TDD RED/GREEN workflow: stub with throw, write tests, implement, verify"

# Metrics
duration: 3min
completed: 2026-02-09
---

# Phase 6 Plan 3: Reputation Decay Computation Summary

**Exponential half-life decay utility (2^(-age/halfLife)) with TDD test suite for age-weighted contribution scoring in @gsd/utils**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-09T14:21:03Z
- **Completed:** 2026-02-09T14:24:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- decayMultiplier function with exact exponential half-life computation and edge case handling (negative age, zero half-life)
- calculateDecayedScore function summing age-weighted contributions with float-to-BigInt rounding
- calculateContributionScoreWithDecay composing decay with existing score formula for lower aged-contribution scores
- 22-test TDD suite covering all edge cases, determinism, monotonicity, and integration with calculateContributionScore

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Write failing tests for decay functions** - `978ab9f` (test)
2. **Task 2 (GREEN): Implement decay functions to pass all tests** - `45aa7f2` (feat)

## Files Created/Modified
- `packages/utils/src/decay.ts` - decayMultiplier, calculateDecayedScore, calculateContributionScoreWithDecay, DECAY_HALF_LIFE_DAYS, DecayContribution, DecayScoreInput
- `packages/utils/tests/decay.test.ts` - 22 test cases covering all three functions plus constant
- `packages/utils/src/index.ts` - Barrel exports for decay functions, constant, and types

## Decisions Made
- Test file placed in `packages/utils/tests/` directory (not `src/`) to match existing convention from score.test.ts and contribution-hash.test.ts
- DecayContribution uses `number` type for verificationScore (not BigInt) since decay multiplication operates in floating-point space; conversion to BigInt happens at the sum level via Math.round()
- Math.round() chosen over Math.floor() for float-to-BigInt conversion to ensure exact half-life values (10000 * 0.5 = 5000n exactly)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test file location adjusted to match existing convention**
- **Found during:** Task 1 (test setup)
- **Issue:** Plan specified `packages/utils/src/decay.test.ts` but existing tests live in `packages/utils/tests/` directory and the test script uses `tests/**/*.test.ts` glob
- **Fix:** Placed test file at `packages/utils/tests/decay.test.ts` to match convention
- **Files modified:** packages/utils/tests/decay.test.ts (created in correct location)
- **Verification:** `npx tsx --test packages/utils/tests/decay.test.ts` runs successfully
- **Committed in:** 978ab9f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test discovery. No scope creep.

## Issues Encountered
None - TDD RED/GREEN cycle executed cleanly. All 22 tests failed in RED, all 22 pass in GREEN.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Decay functions ready for integration into governance scoring (06-04, 06-05)
- calculateContributionScoreWithDecay can replace calculateContributionScore anywhere aged contributions need weighting
- Existing score tests still pass (22/22) confirming no regression

## Self-Check: PASSED

- [x] packages/utils/src/decay.ts exists
- [x] packages/utils/tests/decay.test.ts exists
- [x] Commit 978ab9f found
- [x] Commit 45aa7f2 found

---
*Phase: 06-advanced-governance*
*Completed: 2026-02-09*
