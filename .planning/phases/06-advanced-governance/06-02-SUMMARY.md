---
phase: 06-advanced-governance
plan: 02
subsystem: instructions, testing
tags: [anchor, rust, quadratic-voting, civic-pass, delegation, sybil-resistance, bankrun, gateway-token]

# Dependency graph
requires:
  - phase: 06-advanced-governance
    plan: 01
    provides: "GovernanceConfig with quadratic fields, DelegationRecord PDA, GovernanceError variants"
  - phase: 03-governance-idea-rounds
    provides: "cast_vote instruction, VoteDeposit, VoteRecord, IdeaRound, governance test patterns"
provides:
  - "Modified cast_vote with quadratic weight (isqrt), sybil gate (Civic Pass validation), delegation aggregation"
  - "delegate_vote instruction creating DelegationRecord PDA"
  - "revoke_delegation instruction closing DelegationRecord and returning rent"
  - "update_governance_config instruction with realloc for quadratic/Civic/decay fields"
  - "7 bankrun tests for quadratic voting and sybil gate"
  - "6 bankrun tests for delegation lifecycle"
affects: [06-03, 06-04, 06-05, 06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual gateway token deserialization -- zero external crate dependency for Civic Pass validation"
    - "Account discriminator computed via SHA-256('account:AccountName')[..8] for raw data validation"
    - "remaining_accounts pattern for delegation aggregation in cast_vote"
    - "Mock gateway token accounts in bankrun using setAccount with custom owner/data"

key-files:
  created:
    - programs/gsd-hub/src/instructions/delegate_vote.rs
    - programs/gsd-hub/src/instructions/revoke_delegation.rs
    - programs/gsd-hub/src/instructions/update_governance_config.rs
    - programs/gsd-hub/tests/quadratic-voting.test.ts
    - programs/gsd-hub/tests/delegation.test.ts
  modified:
    - programs/gsd-hub/src/instructions/cast_vote.rs
    - programs/gsd-hub/src/instructions/mod.rs
    - programs/gsd-hub/src/lib.rs
    - programs/gsd-hub/src/errors.rs
    - programs/gsd-hub/tests/governance-voting.test.ts

key-decisions:
  - "Manual gateway token deserialization (byte offsets) instead of solana_gateway crate dependency"
  - "Civic Gateway program ID corrected to gatbGF9DvLAw3kWyn1EmH5Nh1Sqp8sTukF7yaQpSc71 (plan had invalid base58)"
  - "DelegationRecord closed on revoke (close = delegator) allowing new delegation PDA creation"
  - "Delegation check in cast_vote uses raw byte deserialization to avoid Anchor Account<> lifetime issues"
  - "Existing governance-voting tests updated with governanceConfig and gatewayToken: null accounts"

patterns-established:
  - "Mock gateway token creation: setAccount with Civic Gateway owner, 81-byte layout, for bankrun sybil gate testing"
  - "remaining_accounts iteration with discriminator check for delegation aggregation in cast_vote"

# Metrics
duration: 14min
completed: 2026-02-09
---

# Phase 6 Plan 2: Voting Instructions Summary

**Quadratic voting with isqrt weight, Civic Pass sybil gate via manual gateway token deserialization, vote delegation with remaining_accounts aggregation, and comprehensive bankrun test suites (13 new tests)**

## Performance

- **Duration:** 14 min
- **Started:** 2026-02-09T14:20:59Z
- **Completed:** 2026-02-09T14:35:35Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- cast_vote supports both linear (v1) and quadratic (v2) voting based on governance_config flag with isqrt weight calculation
- Sybil gate validates Civic Pass gateway tokens: program owner, subject match, gatekeeper network, active state, expiry -- all via manual byte deserialization (zero external deps)
- Delegation lifecycle: delegate_vote creates DelegationRecord, cast_vote aggregates delegated weight via remaining_accounts, revoke_delegation closes PDA and returns rent
- 3 new instruction handlers (delegate_vote, revoke_delegation, update_governance_config) integrated into mod.rs and lib.rs
- 7 quadratic voting bankrun tests + 6 delegation lifecycle bankrun tests + 9 existing governance tests = all 53 tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement quadratic voting, sybil gate, delegation, and governance config instructions** - `1bbe430` (feat)
2. **Task 2: Bankrun tests for quadratic voting, sybil gate, and delegation lifecycle** - `d6f072a` (test)

## Files Created/Modified
- `programs/gsd-hub/src/instructions/cast_vote.rs` - Added isqrt function, GovernanceConfig account, gateway_token optional account, manual Civic Pass validation, delegation check, remaining_accounts aggregation
- `programs/gsd-hub/src/instructions/delegate_vote.rs` - New: DelegateVote instruction creating DelegationRecord PDA
- `programs/gsd-hub/src/instructions/revoke_delegation.rs` - New: RevokeDelegation instruction closing DelegationRecord
- `programs/gsd-hub/src/instructions/update_governance_config.rs` - New: UpdateGovernanceConfig with realloc to 168 bytes
- `programs/gsd-hub/src/instructions/mod.rs` - Added 3 new module declarations and re-exports
- `programs/gsd-hub/src/lib.rs` - Added 3 new instruction handler dispatches
- `programs/gsd-hub/src/errors.rs` - Added 7 new GovernanceError variants (gateway token + delegation)
- `programs/gsd-hub/tests/quadratic-voting.test.ts` - 7 tests: linear fallback, sqrt weight, sybil rejection, wrong owner, expired token, config update, unauthorized config
- `programs/gsd-hub/tests/delegation.test.ts` - 6 tests: create, delegator blocked, combined weight, revoke, no deposit, active votes
- `programs/gsd-hub/tests/governance-voting.test.ts` - Updated all castVote calls with governanceConfig and gatewayToken accounts

## Decisions Made
- Manual gateway token deserialization avoids solana_gateway crate dependency (Anchor 0.32.1 compatibility uncertainty)
- Civic Gateway program ID corrected from plan's invalid `gatem74V238djXdzWnJf2FWTnQ8pUV3yHZ7BLKhys` to valid `gatbGF9DvLAw3kWyn1EmH5Nh1Sqp8sTukF7yaQpSc71`
- DelegationRecord closed on revoke (close = delegator constraint) allowing fresh PDA init for future delegations
- Raw byte deserialization for delegation check in cast_vote avoids Anchor Account<> lifetime conflicts with remaining_accounts
- Account discriminator computed inline via SHA-256("account:DelegationRecord")[..8] using sha2 crate (already in Cargo.toml)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid Civic Gateway program ID**
- **Found during:** Task 2 (quadratic voting tests)
- **Issue:** Plan specified `gatem74V238djXdzWnJf2FWTnQ8pUV3yHZ7BLKhys` which is not valid base58 -- PublicKey constructor threw "Invalid public key input"
- **Fix:** Corrected to valid Civic Gateway program ID `gatbGF9DvLAw3kWyn1EmH5Nh1Sqp8sTukF7yaQpSc71` in both Rust code and test files
- **Files modified:** programs/gsd-hub/src/instructions/cast_vote.rs, programs/gsd-hub/tests/quadratic-voting.test.ts, programs/gsd-hub/tests/delegation.test.ts
- **Verification:** All 53 tests pass, gateway token validation works correctly
- **Committed in:** d6f072a (Task 2 commit)

**2. [Rule 3 - Blocking] Raw byte deserialization for delegation check instead of Account<DelegationRecord>**
- **Found during:** Task 1 (cast_vote modification)
- **Issue:** Using Account<DelegationRecord>::try_from() with remaining_accounts caused Rust lifetime conflicts between CastVote struct lifetimes
- **Fix:** Used raw byte deserialization of DelegationRecord fields (discriminator, delegate, is_active, delegated_amount) with SHA-256 discriminator verification
- **Files modified:** programs/gsd-hub/src/instructions/cast_vote.rs
- **Verification:** anchor build compiles cleanly, all delegation aggregation tests pass
- **Committed in:** 1bbe430 (Task 1 commit)

**3. [Rule 1 - Bug] Updated existing governance-voting tests for new cast_vote signature**
- **Found during:** Task 2 (test regression prevention)
- **Issue:** cast_vote now requires governanceConfig account and optional gatewayToken -- existing 9 tests would fail without update
- **Fix:** Added governanceConfig: governanceConfigPda and gatewayToken: null to all 7 castVote calls in governance-voting.test.ts
- **Files modified:** programs/gsd-hub/tests/governance-voting.test.ts
- **Verification:** All 9 existing governance-voting tests pass unchanged behavior
- **Committed in:** d6f072a (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bug fixes, 1 blocking)
**Impact on plan:** All fixes necessary for correctness. Invalid program ID would have caused runtime failures. Lifetime fix was required by Rust compiler. Test updates prevent regression.

## Issues Encountered
- Bankrun's getAccountInfo throws "Could not find" error on closed accounts instead of returning null -- adjusted revoke delegation test to use try/catch on fetch instead

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All voting instructions complete: cast_vote (quadratic + linear), delegate_vote, revoke_delegation, update_governance_config
- 53 bankrun tests passing across all suites (zero regressions)
- Ready for TypeScript SDK layer (06-03), API endpoints (06-04), and frontend components (06-06, 06-07)
- DelegationRecord PDA lifecycle fully tested (create -> block -> aggregate -> revoke -> re-vote)

## Self-Check: PASSED

- [x] delegate_vote.rs exists
- [x] revoke_delegation.rs exists
- [x] update_governance_config.rs exists
- [x] quadratic-voting.test.ts exists
- [x] delegation.test.ts exists
- [x] Commit 1bbe430 found
- [x] Commit d6f072a found

---
*Phase: 06-advanced-governance*
*Completed: 2026-02-09*
