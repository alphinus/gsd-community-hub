---
phase: 03-governance-idea-rounds
plan: 04
subsystem: blockchain
tags: [anchor, solana, governance, voting, token-escrow, spl-token, bankrun]

# Dependency graph
requires:
  - phase: 03-governance-idea-rounds
    provides: GovernanceConfig, IdeaRound, Idea state accounts and round lifecycle instructions (plan 03)
provides:
  - deposit_tokens instruction with SPL token escrow and 7-day timelock
  - withdraw_tokens instruction with PDA-signed release and active vote restriction
  - cast_vote instruction with weight tallying and VoteRecord PDA uniqueness
  - relinquish_vote instruction for post-round vote cleanup
  - veto_idea instruction for veto authority governance control
  - 9 bankrun integration tests covering full voting lifecycle
affects: [03-05, 03-06, 03-07, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [PDA-signed escrow withdrawal, init_if_needed for cumulative deposits, checked arithmetic on all tallies]

key-files:
  created:
    - programs/gsd-hub/src/instructions/deposit_tokens.rs
    - programs/gsd-hub/src/instructions/withdraw_tokens.rs
    - programs/gsd-hub/src/instructions/cast_vote.rs
    - programs/gsd-hub/src/instructions/relinquish_vote.rs
    - programs/gsd-hub/src/instructions/veto_idea.rs
    - programs/gsd-hub/tests/governance-voting.test.ts
  modified:
    - programs/gsd-hub/src/instructions/mod.rs
    - programs/gsd-hub/src/lib.rs

key-decisions:
  - "Global escrow vault ATA owned by governance_config PDA -- PDA signs for withdrawals"
  - "init_if_needed on VoteDeposit allows cumulative deposits without separate init step"
  - "Timelock test requires custom round timing (short submission window) to test pre-eligible rejection"

patterns-established:
  - "PDA-signed CPI: governance_config PDA as token authority for escrow operations"
  - "Token account helpers: raw SPL Token instructions in bankrun (createTokenAccount, mintTo, getTokenBalance)"

# Metrics
duration: 6min
completed: 2026-02-08
---

# Phase 3 Plan 4: Voting and Token Escrow Summary

**Token deposit/withdrawal with 7-day timelock escrow, Yes/No/Abstain vote casting with weight tallying, vote relinquishment, and veto council authority -- 5 instructions + 9 bankrun tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-08T16:26:52Z
- **Completed:** 2026-02-08T16:32:59Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 5 new Anchor instructions implementing full governance voting lifecycle (GOVR-02 through GOVR-08)
- Token escrow with PDA-signed withdrawal and active vote lock preventing premature withdrawal
- 9 bankrun integration tests covering deposit, timelock enforcement, vote casting, double-vote prevention, withdrawal restriction, relinquishment, withdrawal, veto authority, and unauthorized veto rejection
- All arithmetic uses checked operations (checked_add, checked_sub) for overflow safety

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement deposit, withdraw, cast_vote, relinquish_vote, and veto_idea instructions** - `cd6d7a6` (feat)
2. **Task 2: Bankrun tests for voting and token escrow mechanics** - `254ffae` (test)

## Files Created/Modified
- `programs/gsd-hub/src/instructions/deposit_tokens.rs` - SPL token deposit with timelock and escrow transfer
- `programs/gsd-hub/src/instructions/withdraw_tokens.rs` - PDA-signed escrow withdrawal with active vote guard
- `programs/gsd-hub/src/instructions/cast_vote.rs` - Vote casting with weight tallying and VoteRecord init
- `programs/gsd-hub/src/instructions/relinquish_vote.rs` - Post-round vote cleanup decrementing active_votes
- `programs/gsd-hub/src/instructions/veto_idea.rs` - Veto authority governance control for Submitted/Approved ideas
- `programs/gsd-hub/src/instructions/mod.rs` - Added 5 new module declarations and pub use exports
- `programs/gsd-hub/src/lib.rs` - Added 5 new instruction handlers and VoteChoice import
- `programs/gsd-hub/tests/governance-voting.test.ts` - 9 bankrun tests with SPL token helpers

## Decisions Made
- Global escrow vault ATA owned by governance_config PDA; PDA signs for withdrawals using signer seeds
- init_if_needed on VoteDeposit allows cumulative deposits without separate initialization step
- Timelock test uses custom round timing (short submission window ending before timelock expiry) to properly test pre-eligible vote rejection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed timelock test timing conflict**
- **Found during:** Task 2 (bankrun tests)
- **Issue:** The shared setupFullGovernance helper creates rounds where submission_end > eligible_at, making it impossible to test timelock rejection in Voting state
- **Fix:** Created dedicated test with custom timing: short submission window (baseTime + 1000) ending before timelock (baseTime + 604800), with long voting period
- **Files modified:** programs/gsd-hub/tests/governance-voting.test.ts
- **Verification:** Test correctly catches TokensNotYetEligible error
- **Committed in:** 254ffae (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correct timelock test coverage. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All on-chain governance logic complete (9 instructions from plans 03 + 04)
- IDL includes all 14 program instructions
- Ready for plan 05 (governance TypeScript SDK / client helpers) and plan 06 (integration tests)
- Combined with Plan 03's round lifecycle, GOVR-01 through GOVR-08 are satisfied

## Self-Check: PASSED

All 8 created/modified files verified present. Both task commits (cd6d7a6, 254ffae) verified in git log.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
