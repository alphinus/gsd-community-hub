---
phase: 05-gsd-framework-integration
plan: 03
subsystem: verification, on-chain
tags: [anchor, rust, solana, bankrun, verification, peer-review, pda, instructions]

# Dependency graph
requires:
  - phase: 05-01
    provides: "VerificationConfig, VerificationReport, PeerReview state structs and VerificationError enum"
provides:
  - "init_verification_config instruction with weight sum validation (10000 bps)"
  - "submit_verification instruction with confidence-based status (Completed/Pending)"
  - "submit_peer_review instruction with self-review prevention constraint"
  - "finalize_peer_verification instruction with min_reviewers consensus check"
  - "9 bankrun integration tests covering full verification instruction lifecycle"
affects: [05-04, 05-05, 05-06, 05-07, 05-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verification confidence threshold gates AI-only vs peer-review-required status"
    - "Off-chain consensus calculation with on-chain finalization (complex math off-chain, result recorded on-chain)"
    - "Self-review prevention via reviewer.key() != verification_report.developer constraint"

key-files:
  created:
    - "programs/gsd-hub/src/instructions/init_verification_config.rs"
    - "programs/gsd-hub/src/instructions/submit_verification.rs"
    - "programs/gsd-hub/src/instructions/submit_peer_review.rs"
    - "programs/gsd-hub/src/instructions/finalize_peer_verification.rs"
    - "programs/gsd-hub/tests/verification.test.ts"
  modified:
    - "programs/gsd-hub/src/instructions/mod.rs"
    - "programs/gsd-hub/src/lib.rs"

key-decisions:
  - "Confidence threshold determines AI verification auto-completion vs peer review requirement"
  - "Peer consensus calculation kept off-chain; finalize_peer_verification records result on-chain"
  - "VerificationType import added to lib.rs state re-exports for instruction handler signatures"

patterns-established:
  - "Verification instruction pattern: validate inputs -> set status from config thresholds -> record timestamp"
  - "Peer review flow: submit_verification (Pending) -> N x submit_peer_review -> finalize_peer_verification"
  - "Each bankrun test creates isolated context via startAnchor for zero test coupling"

# Metrics
duration: 6min
completed: 2026-02-09
---

# Phase 5 Plan 3: On-Chain Verification Instructions Summary

**4 Anchor verification instructions (init config, submit AI verification, submit peer review, finalize peer consensus) with 9 bankrun integration tests covering all access control constraints**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-09T12:41:24Z
- **Completed:** 2026-02-09T12:47:38Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- 4 new Anchor instructions compiling cleanly with anchor build (22 total instructions in IDL)
- Self-review prevention enforced on-chain: reviewer.key() != verification_report.developer
- Confidence-based status: AI verification auto-completes if confidence >= threshold, else requires peer review
- Finalize instruction validates min_reviewers before accepting consensus result
- 9 bankrun tests covering valid paths, error paths, and access control for all 4 instructions
- All 40 tests pass (31 existing + 9 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 4 verification instructions** - `686784b` (feat)
2. **Task 2: Write bankrun integration tests for verification instructions** - `84898d9` (test)

## Files Created/Modified
- `programs/gsd-hub/src/instructions/init_verification_config.rs` - Initialize VerificationConfig singleton PDA with weight sum validation
- `programs/gsd-hub/src/instructions/submit_verification.rs` - Record AI verification result with confidence-based status
- `programs/gsd-hub/src/instructions/submit_peer_review.rs` - Record peer review with self-review prevention and reviewer_count increment
- `programs/gsd-hub/src/instructions/finalize_peer_verification.rs` - Finalize peer consensus with min_reviewers validation
- `programs/gsd-hub/src/instructions/mod.rs` - Module declarations and re-exports for 4 new instructions
- `programs/gsd-hub/src/lib.rs` - 4 new instruction handler functions + VerificationType import
- `programs/gsd-hub/tests/verification.test.ts` - 9 bankrun integration tests for verification lifecycle

## Decisions Made
- Confidence threshold determines whether AI verification auto-completes (Completed) or requires peer review (Pending)
- Peer consensus calculation kept off-chain (complex weighted math); finalize_peer_verification just records the consensus result on-chain
- VerificationType enum added to lib.rs state imports for submit_verification handler signature

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required for on-chain instructions.

## Next Phase Readiness
- All 4 verification instructions ready for off-chain integration (API endpoints, indexer)
- IDL updated with all instruction definitions for TypeScript client generation
- Test patterns established for verification flow testing in future plans
- Peer review flow documented: submit_verification (Pending) -> submit_peer_review x N -> finalize_peer_verification

## Self-Check: PASSED

All 7 files verified present. Both task commits (686784b, 84898d9) confirmed in git log.

---
*Phase: 05-gsd-framework-integration*
*Completed: 2026-02-09*
