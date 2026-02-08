---
phase: 02-contribution-tracking
plan: 01
subsystem: on-chain
tags: [anchor, solana, merkle-tree, spl-account-compression, spl-noop, cpi, sha2]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    provides: "DeveloperProfile struct, anchor build setup, program ID"
provides:
  - "ContributionLeaf data struct (106 bytes) with SHA-256 leaf hashing"
  - "ContributionTreeConfig PDA account for Merkle tree metadata"
  - "Extended DeveloperProfile (130 bytes) with contribution score fields"
  - "Raw CPI helpers for spl-account-compression (append_leaf, init_empty_merkle_tree)"
  - "Raw CPI helper for spl-noop (wrap_application_data)"
  - "Contribution-related error codes"
affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: [sha2 0.10]
  patterns: [raw-cpi-via-invoke, anchor-discriminator-computation, leaf-hash-pattern]

key-files:
  created:
    - programs/gsd-hub/src/state/contribution.rs
    - programs/gsd-hub/src/state/merkle_tree.rs
    - programs/gsd-hub/src/cpi/compression.rs
    - programs/gsd-hub/src/cpi/noop.rs
    - programs/gsd-hub/src/cpi/mod.rs
  modified:
    - programs/gsd-hub/src/state/developer.rs
    - programs/gsd-hub/src/state/mod.rs
    - programs/gsd-hub/src/errors.rs
    - programs/gsd-hub/src/lib.rs
    - programs/gsd-hub/Cargo.toml
    - Cargo.lock

key-decisions:
  - "sha2 crate added for leaf hashing since anchor-lang 0.32.1 does not re-export solana_program::hash module (split SDK)"
  - "Raw CPI discriminators computed via SHA-256 at runtime to match spl-account-compression Anchor IDL"
  - "NOOP_PROGRAM_ID defined in compression.rs alongside ACCOUNT_COMPRESSION_PROGRAM_ID for co-location"

patterns-established:
  - "Raw CPI pattern: construct Instruction manually with discriminator + serialized args, use invoke/invoke_signed"
  - "Leaf hash pattern: serialize struct via AnchorSerialize, SHA-256 hash for Merkle tree leaf"
  - "Backward-compatible struct extension: append fields at end, existing handlers unchanged"

# Metrics
duration: 6min
completed: 2026-02-08
---

# Phase 2 Plan 1: Contribution State Structs and CPI Helpers Summary

**ContributionLeaf (106 bytes), ContributionTreeConfig PDA, extended DeveloperProfile (130 bytes), and raw CPI helpers for spl-account-compression/spl-noop -- all compiling cleanly with anchor build**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-08T12:42:10Z
- **Completed:** 2026-02-08T12:48:37Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- ContributionLeaf struct (106 bytes) with to_leaf_hash() method using SHA-256 for Merkle tree insertion
- ContributionTreeConfig PDA account storing tree authority, address, contribution count, and creation metadata
- DeveloperProfile extended from 89 to 130 bytes with 7 contribution score fields appended at end (backward compatible)
- Raw CPI helpers for spl-account-compression (append_leaf, init_empty_merkle_tree) with PDA and keypair authority support
- Raw CPI helper for spl-noop (wrap_application_data) for emitting full contribution data to transaction logs
- Five new error codes for contribution validation (InvalidVerificationScore, TreeFull, etc.)
- All 3 existing tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create contribution state structs and extend DeveloperProfile** - `2bde747` (feat)
2. **Task 2: Create raw CPI helper modules for spl-account-compression and spl-noop** - `3e82627` (feat)

## Files Created/Modified
- `programs/gsd-hub/src/state/contribution.rs` - ContributionLeaf data struct with to_leaf_hash method
- `programs/gsd-hub/src/state/merkle_tree.rs` - ContributionTreeConfig PDA account
- `programs/gsd-hub/src/state/developer.rs` - Extended DeveloperProfile with 7 contribution score fields
- `programs/gsd-hub/src/state/mod.rs` - Module exports for contribution and merkle_tree
- `programs/gsd-hub/src/errors.rs` - Five new contribution-related error codes
- `programs/gsd-hub/src/cpi/compression.rs` - Raw CPI for spl-account-compression (append_leaf, init_empty_merkle_tree)
- `programs/gsd-hub/src/cpi/noop.rs` - Raw CPI for spl-noop (wrap_application_data)
- `programs/gsd-hub/src/cpi/mod.rs` - CPI module exports
- `programs/gsd-hub/src/lib.rs` - Added cpi module declaration
- `programs/gsd-hub/Cargo.toml` - Added sha2 dependency
- `Cargo.lock` - Updated with sha2

## Decisions Made
- **sha2 crate for hashing:** Anchor 0.32.1 uses split Solana SDK (solana-pubkey, solana-cpi, etc.) and does not re-export `solana_program::hash`. Added `sha2 = "0.10"` as a direct dependency (already a transitive dependency, no binary size increase) for ContributionLeaf hashing and Anchor discriminator computation.
- **Discriminator computation:** spl-account-compression uses Anchor-style discriminators (`SHA-256("global:<name>")[..8]`). Computed at runtime rather than hardcoding bytes for readability and maintainability.
- **Program ID co-location:** Both ACCOUNT_COMPRESSION_PROGRAM_ID and NOOP_PROGRAM_ID defined in compression.rs since they're always used together in CPI calls.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] solana_program::hash module not available in Anchor 0.32.1**
- **Found during:** Task 1 (ContributionLeaf to_leaf_hash implementation)
- **Issue:** Plan specified `anchor_lang::solana_program::hash::hash()` for leaf hashing, but Anchor 0.32.1 uses split Solana SDK v2.3.0 which does not re-export the `hash` module
- **Fix:** Added `sha2 = "0.10"` to Cargo.toml and used `sha2::Sha256` for both leaf hashing and CPI discriminator computation. sha2 was already a transitive dependency (via solana-sha256-hasher) so no new binary artifact.
- **Files modified:** programs/gsd-hub/Cargo.toml, programs/gsd-hub/src/state/contribution.rs, programs/gsd-hub/src/cpi/compression.rs
- **Verification:** anchor build succeeds, all existing tests pass
- **Committed in:** 2bde747 (Task 1), 3e82627 (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minimal -- functionally equivalent hashing via sha2 crate instead of solana_program::hash. No scope creep.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All state structs and CPI helpers are ready for Plan 02 (TypeScript types) and Plan 03 (on-chain instructions)
- ContributionTreeConfig and ContributionLeaf will appear in the IDL once referenced by instruction Accounts structs (Plan 03)
- DeveloperProfile IDL already includes all 12 fields (verified)

## Self-Check: PASSED

- All 10 key files: FOUND
- Commit 2bde747 (Task 1): FOUND
- Commit 3e82627 (Task 2): FOUND
- anchor build: SUCCESS (no new errors)
- anchor test --skip-deploy: 3/3 tests passing (no regressions)

---
*Phase: 02-contribution-tracking*
*Completed: 2026-02-08*
