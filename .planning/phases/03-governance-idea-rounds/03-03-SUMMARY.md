---
phase: 03-governance-idea-rounds
plan: 03
subsystem: on-chain, testing
tags: [anchor, solana, bankrun, governance, idea-rounds, permissionless-crank, spl-token]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Anchor project scaffold, program ID, test tooling (ts-mocha, bankrun)"
  - phase: 03-governance-idea-rounds
    plan: 01
    provides: "On-chain state structs (GovernanceConfig, IdeaRound, Idea), enums (RoundStatus, QuorumType, IdeaStatus), GovernanceError codes"
  - phase: 03-governance-idea-rounds
    plan: 02
    provides: "TypeScript governance types and PDA derivation helpers for client-side testing"
provides:
  - "InitGovernanceConfig instruction: PDA-based singleton config with admin, veto authority, token mint, timelocks"
  - "CreateRound instruction: sequential round creation with timestamp validation and admin-only access"
  - "SubmitIdea instruction: time-gated idea submission within open rounds with sequential indexing"
  - "TransitionRound instruction: permissionless crank for Open->Voting->Closed state machine"
  - "7 bankrun integration tests covering full round lifecycle including time-warp deadline enforcement"
  - "SPL Token program .so fixture for mint creation in bankrun tests"
affects: [03-04, 03-05, 03-06, 03-07]

# Tech tracking
tech-stack:
  added: ["@solana/spl-token (devDependency)", "tests/fixtures/spl_token.so"]
  patterns: [permissionless crank pattern for state transitions, bankrun Clock manipulation for time-gated testing, manual SPL Token InitializeMint via raw instruction data]

key-files:
  created:
    - "programs/gsd-hub/src/instructions/init_governance_config.rs"
    - "programs/gsd-hub/src/instructions/create_round.rs"
    - "programs/gsd-hub/src/instructions/submit_idea.rs"
    - "programs/gsd-hub/src/instructions/transition_round.rs"
    - "programs/gsd-hub/tests/governance-rounds.test.ts"
    - "tests/fixtures/spl_token.so"
  modified:
    - "programs/gsd-hub/src/instructions/mod.rs"
    - "programs/gsd-hub/src/lib.rs"
    - "programs/gsd-hub/Cargo.toml"
    - "Cargo.lock"
    - "package.json"
    - "pnpm-lock.yaml"

key-decisions:
  - "anchor-spl idl-build feature required in Cargo.toml for Account<Mint> IDL generation compatibility"
  - "SPL Token program .so downloaded from mainnet and committed to tests/fixtures/ (consistent with existing pattern for spl_account_compression.so)"
  - "Manual InitializeMint instruction via raw Buffer data for bankrun tests (no @solana/spl-token createMint helper needed at runtime)"
  - "Each test creates isolated bankrun context (no shared state between tests)"

patterns-established:
  - "Bankrun Clock manipulation: warpToTimestamp() helper using context.setClock(new Clock(...)) for time-dependent instruction testing"
  - "SPL Token Mint creation in bankrun: createMintAccount() helper using SystemProgram.createAccount + raw InitializeMint instruction data"
  - "Permissionless crank testing: any signer can call transitionRound after deadline passes"

# Metrics
duration: 8min
completed: 2026-02-08
---

# Phase 3 Plan 3: Round Lifecycle Instructions Summary

**4 Anchor instructions implementing governance config, round creation, idea submission, and permissionless Open->Voting->Closed state machine with 7 bankrun integration tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-08T16:14:38Z
- **Completed:** 2026-02-08T16:22:37Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- 4 instruction handlers (init_governance_config, create_round, submit_idea, transition_round) compiled and IDL-generated with all 9 program instructions
- Permissionless crank pattern for round state transitions (Open -> Voting -> Closed) requires no automation service
- Time-gated idea submission with on-chain Clock validation prevents late submissions
- 7 bankrun integration tests covering: config init, round creation, idea submission, deadline enforcement, transition timing, and full lifecycle

## Task Commits

Each task was committed atomically:

1. **Task 1: Round lifecycle instructions** - `85f4980` (feat)
2. **Task 2: Bankrun tests for governance round lifecycle** - `46fc55b` (test)

## Files Created/Modified
- `programs/gsd-hub/src/instructions/init_governance_config.rs` - InitGovernanceConfig instruction with PDA singleton, admin/veto/mint accounts, timelocks
- `programs/gsd-hub/src/instructions/create_round.rs` - CreateRound with timestamp validation, sequential round_index, admin-only
- `programs/gsd-hub/src/instructions/submit_idea.rs` - SubmitIdea with time-gated submission, sequential idea_index, author tracking
- `programs/gsd-hub/src/instructions/transition_round.rs` - TransitionRound permissionless crank with deadline enforcement
- `programs/gsd-hub/src/instructions/mod.rs` - Added module declarations and re-exports for 4 new instructions
- `programs/gsd-hub/src/lib.rs` - Added 4 handler functions to #[program] module
- `programs/gsd-hub/Cargo.toml` - Added anchor-spl/idl-build feature for Mint type IDL generation
- `programs/gsd-hub/tests/governance-rounds.test.ts` - 7 bankrun test cases for full round lifecycle
- `tests/fixtures/spl_token.so` - SPL Token program binary for bankrun mint creation
- `package.json` - Added @solana/spl-token devDependency

## Decisions Made
- Added `anchor-spl/idl-build` to Cargo.toml features because `Account<'info, Mint>` requires IDL build traits from anchor-spl when running `anchor build` (Anchor 0.32.1 specific)
- Downloaded spl_token.so from mainnet and committed to fixtures, following established project pattern from Phase 2 (spl_account_compression.so, spl_noop.so)
- Used raw Buffer instruction data for InitializeMint in bankrun instead of @solana/spl-token helpers to keep test setup explicit and dependency-light

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added anchor-spl/idl-build feature flag to Cargo.toml**
- **Found during:** Task 1 (anchor build)
- **Issue:** `anchor build` failed with "no function or associated item named `create_type` found for struct `anchor_spl::token::Mint`" because the IDL builder couldn't generate type info for Mint without the idl-build feature
- **Fix:** Added `"anchor-spl/idl-build"` to the `idl-build` feature array in Cargo.toml
- **Files modified:** programs/gsd-hub/Cargo.toml
- **Verification:** `anchor build` succeeds, IDL at target/idl/gsd_hub.json contains all 9 instructions
- **Committed in:** 85f4980 (Task 1 commit)

**2. [Rule 3 - Blocking] Downloaded spl_token.so fixture and installed @solana/spl-token**
- **Found during:** Task 2 (test creation)
- **Issue:** Tests require creating an SPL Token Mint account for InitGovernanceConfig, but spl_token.so was not in fixtures and @solana/spl-token was not installed
- **Fix:** Downloaded spl_token.so from mainnet via `solana program dump`, added @solana/spl-token as devDependency
- **Files modified:** tests/fixtures/spl_token.so, package.json, pnpm-lock.yaml
- **Verification:** All 7 tests pass with SPL Token program loaded in bankrun
- **Committed in:** 46fc55b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both fixes necessary for build and test infrastructure. No scope creep.

## Issues Encountered

None beyond the auto-fixed blocking issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 governance instructions available on-chain for voting (03-04), API routes (03-05), and UI (03-06, 03-07)
- IDL updated with all instruction definitions for client code generation
- SPL Token fixture available for future tests requiring mint accounts (vote deposits in 03-04)
- Round state machine (Open -> Voting -> Closed) verified and ready for vote tallying integration

## Self-Check: PASSED

All 6 instruction/test files verified present. Both commits (85f4980, 46fc55b) confirmed in git log. IDL contains all 9 instructions including init_governance_config, create_round, submit_idea, transition_round. All 7 bankrun tests pass.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
