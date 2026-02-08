---
phase: 03-governance-idea-rounds
plan: 01
subsystem: on-chain
tags: [anchor, solana, governance, pda, spl-token, state-accounts]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Anchor program scaffold, program ID, developer PDA pattern"
  - phase: 02-contribution-tracking
    provides: "Existing state module pattern (developer.rs, contribution.rs)"
provides:
  - "GovernanceConfig singleton PDA account struct (133 bytes)"
  - "IdeaRound PDA with RoundStatus and QuorumType enums (107 bytes)"
  - "Idea PDA with IdeaStatus enum and vote tally fields (154 bytes)"
  - "VoteDeposit PDA for token escrow tracking (69 bytes)"
  - "VoteRecord PDA with VoteChoice enum (122 bytes)"
  - "GovernanceError enum with 16 governance-specific error codes"
  - "anchor-spl dependency with token feature for CPI"
affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: [anchor-spl 0.32.1, spl-token 8.0.0, spl-associated-token-account 7.0.0]
  patterns: [governance PDA seeds, QuorumType bps lookup, separate error enums per domain]

key-files:
  created:
    - "programs/gsd-hub/src/state/governance_config.rs"
    - "programs/gsd-hub/src/state/idea_round.rs"
    - "programs/gsd-hub/src/state/idea.rs"
    - "programs/gsd-hub/src/state/vote_deposit.rs"
    - "programs/gsd-hub/src/state/vote_record.rs"
  modified:
    - "programs/gsd-hub/Cargo.toml"
    - "programs/gsd-hub/src/state/mod.rs"
    - "programs/gsd-hub/src/errors.rs"
    - "Cargo.lock"

key-decisions:
  - "QuorumType::required_bps() impl placed on governance_config.rs (co-located with GovernanceConfig which uses it)"
  - "GovernanceError kept as separate enum from GsdHubError for domain separation"

patterns-established:
  - "Governance PDA seeds: governance_config, idea_round+index, idea+round+index, vote_deposit+authority, vote_record+voter+idea"
  - "Domain-scoped error enums: GsdHubError for core, GovernanceError for governance"
  - "QuorumType basis points: Small=500 (5%), Treasury=2000 (20%), ParameterChange=3300 (33%)"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 3 Plan 1: Governance State Accounts Summary

**5 governance PDA account structs with enums, 16 error codes, and anchor-spl token dependency for on-chain idea rounds and voting**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T13:49:12Z
- **Completed:** 2026-02-08T13:53:02Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- All 5 governance state account structs defined with correct InitSpace derives and PDA seed documentation
- 4 enums (RoundStatus, QuorumType, IdeaStatus, VoteChoice) with unit variants for on-chain governance lifecycle
- GovernanceError enum with 16 error codes covering round management, voting, authorization, and token operations
- anchor-spl dependency added enabling token CPI for deposit/withdraw in later plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Add anchor-spl dependency and create all governance state accounts** - `6affb77` (feat)
2. **Task 2: Extend errors.rs with governance error codes** - `d884a9c` (feat)

## Files Created/Modified
- `programs/gsd-hub/Cargo.toml` - Added anchor-spl with token feature
- `programs/gsd-hub/src/state/governance_config.rs` - GovernanceConfig singleton PDA (admin, veto authority, token mint, timelocks)
- `programs/gsd-hub/src/state/idea_round.rs` - IdeaRound PDA with RoundStatus and QuorumType enums
- `programs/gsd-hub/src/state/idea.rs` - Idea PDA with IdeaStatus enum and vote weight tallies
- `programs/gsd-hub/src/state/vote_deposit.rs` - VoteDeposit PDA for token escrow with active vote tracking
- `programs/gsd-hub/src/state/vote_record.rs` - VoteRecord PDA with VoteChoice enum
- `programs/gsd-hub/src/state/mod.rs` - Added module declarations and re-exports for all 5 governance modules
- `programs/gsd-hub/src/errors.rs` - Added GovernanceError enum with 16 error codes
- `Cargo.lock` - Updated with anchor-spl and transitive dependencies

## Decisions Made
- QuorumType::required_bps() impl placed in governance_config.rs rather than idea_round.rs since GovernanceConfig is the primary consumer of quorum calculations
- GovernanceError kept as a separate enum from GsdHubError for domain separation -- Anchor supports multiple error enums per program

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All governance state types are compiled and exported, ready for instruction handlers in plans 03-02 through 03-07
- anchor-spl token feature available for deposit/withdraw CPI instructions
- GovernanceError codes available for all governance instruction error handling

## Self-Check: PASSED

All 8 files exist. Both commits (6affb77, d884a9c) verified. All structs, enums, error codes, dependency, and re-exports confirmed present.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
