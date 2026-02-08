---
phase: 01-foundation-authentication
plan: 01
subsystem: infra, on-chain
tags: [turborepo, pnpm, anchor, solana, pda, rust, typescript, monorepo]

# Dependency graph
requires: []
provides:
  - Turborepo monorepo with pnpm workspaces (apps/*, packages/*)
  - Anchor program gsd-hub with register_developer and update_profile_hash instructions
  - DeveloperProfile PDA (89 bytes) with deterministic derivation from wallet
  - @gsd/types package with DeveloperProfile, CreateProfileInput, UpdateProfileInput
  - @gsd/utils package with getDeveloperProfilePDA and computeProfileHash
  - Generated IDL at target/idl/gsd_hub.json and TypeScript types at target/types/gsd_hub.ts
affects: [01-02 (web app scaffold), 01-03 (profile features), 01-04 (multisig)]

# Tech tracking
tech-stack:
  added: [turborepo@2.8.3, typescript@5.9.3, anchor-lang@0.32.1, "@solana/web3.js@1.98.4", "@coral-xyz/anchor@0.32.1", anchor-bankrun@0.5.0, solana-bankrun@0.4.0, ts-mocha@11.1.0, chai@6.2.2]
  patterns: [PDA-based identity, content hash anchoring, workspace protocol imports, bankrun testing]

key-files:
  created:
    - turbo.json
    - pnpm-workspace.yaml
    - Anchor.toml
    - Cargo.toml
    - programs/gsd-hub/src/lib.rs
    - programs/gsd-hub/src/state/developer.rs
    - programs/gsd-hub/src/instructions/register.rs
    - programs/gsd-hub/src/instructions/update_hash.rs
    - programs/gsd-hub/src/errors.rs
    - programs/gsd-hub/tests/register.test.ts
    - packages/types/src/profile.ts
    - packages/utils/src/pda.ts
    - packages/utils/src/hash.ts
  modified:
    - package.json
    - .gitignore

key-decisions:
  - "Root package.json without type:module to support CJS test tooling (ts-mocha); sub-packages individually declare type:module"
  - "Solana CLI v3.0.15 required for Anchor 0.32.1 dependency compatibility (v2.1.x ships rustc 1.79.0-dev which is too old)"
  - "Program ID: Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw"

patterns-established:
  - "PDA derivation: seeds [b'developer', authority.key().as_ref()] on-chain = [Buffer.from('developer'), wallet.toBuffer()] in TypeScript"
  - "Content hash anchoring: SHA-256 of canonical JSON (sorted keys, filtered undefined) stored on-chain as [u8; 32]"
  - "Anchor test pattern: startAnchor + BankrunProvider + Program<GsdHub> with IDL JSON"
  - "Workspace packages consumed as TS source (no build step) via workspace:* protocol"

# Metrics
duration: 41min
completed: 2026-02-08
---

# Phase 1 Plan 01: Monorepo & Anchor Program Summary

**Turborepo monorepo with Anchor 0.32.1 on-chain program providing DeveloperProfile PDA (89 bytes, deterministic wallet-derived), register/update instructions, and shared @gsd/types + @gsd/utils packages**

## Performance

- **Duration:** 41 min
- **Started:** 2026-02-08T10:01:02Z
- **Completed:** 2026-02-08T10:43:01Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments

- Turborepo monorepo with pnpm workspaces supporting apps/*, packages/* layout
- Anchor program compiles and passes all 3 bankrun tests (create profile, prevent duplicate, update hash)
- Shared @gsd/types exports DeveloperProfile, CreateProfileInput, UpdateProfileInput interfaces
- Shared @gsd/utils exports getDeveloperProfilePDA (matching on-chain seeds) and computeProfileHash (deterministic SHA-256)
- IDL and TypeScript types auto-generated for downstream consumption

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Turborepo monorepo with pnpm workspaces and shared packages** - `b1b1c7b` (feat)
2. **Task 2: Build Anchor program with DeveloperProfile PDA and registration/update instructions** - `61019ff` (feat)

## Files Created/Modified

- `turbo.json` - Turborepo task pipeline (build, dev, lint, test)
- `pnpm-workspace.yaml` - Workspace packages definition (apps/*, packages/*)
- `package.json` - Root monorepo config with dev dependencies
- `rust-toolchain.toml` - Pinned Rust 1.91.1 with rustfmt and clippy
- `.gitignore` - Covers node_modules, target, .next, dist, env files, test-ledger
- `Anchor.toml` - Program config for localnet and devnet
- `Cargo.toml` - Workspace root with release profile (overflow-checks, LTO)
- `programs/gsd-hub/Cargo.toml` - Program crate config with anchor-lang 0.32.1
- `programs/gsd-hub/src/lib.rs` - Program entry with declare_id! and two instructions
- `programs/gsd-hub/src/state/developer.rs` - DeveloperProfile account struct (89 bytes)
- `programs/gsd-hub/src/instructions/register.rs` - PDA init with authority, timestamps, hash
- `programs/gsd-hub/src/instructions/update_hash.rs` - Hash update with authority check
- `programs/gsd-hub/src/errors.rs` - Custom error codes
- `programs/gsd-hub/tests/register.test.ts` - 3 bankrun tests (create, duplicate, update)
- `packages/types/src/profile.ts` - DeveloperProfile, CreateProfileInput, UpdateProfileInput
- `packages/utils/src/pda.ts` - getDeveloperProfilePDA with DEVELOPER_SEED constant
- `packages/utils/src/hash.ts` - computeProfileHash and profileHashToBytes32
- `tsconfig.json` - Root TypeScript config for Anchor tests

## Decisions Made

- **Root package.json CJS mode:** Removed `"type": "module"` from root package.json to support ts-mocha CJS test tooling. Sub-packages (@gsd/types, @gsd/utils) retain their own `"type": "module"` for ESM. The web app (apps/web/) will also have its own `"type": "module"`.
- **Solana CLI v3.0.15:** Anchor 0.32.1's dependency chain (indexmap@2.13.0 via proc-macro-crate@3.4.0) requires rustc >= 1.82. Solana CLI v2.1.x shipped rustc 1.79.0-dev which was incompatible. Upgraded to Solana CLI v3.0.15 (stable) which ships a compatible BPF toolchain.
- **Program ID:** `Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw` -- generated from `anchor build` keypair, synced in both lib.rs and Anchor.toml.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @types/node to @gsd/utils**
- **Found during:** Task 1 (TypeScript compilation check)
- **Issue:** `Buffer` type not found in packages/utils/src/pda.ts
- **Fix:** Added `@types/node` as devDependency to packages/utils/package.json
- **Files modified:** packages/utils/package.json
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** b1b1c7b (Task 1 commit)

**2. [Rule 3 - Blocking] Added overflow-checks to Cargo.toml**
- **Found during:** Task 2 (first anchor build)
- **Issue:** Anchor 0.32.1 requires `overflow-checks = true` in release profile
- **Fix:** Added `[profile.release]` section with overflow-checks, LTO, and codegen-units settings
- **Files modified:** Cargo.toml
- **Verification:** `anchor build` succeeds
- **Committed in:** 61019ff (Task 2 commit)

**3. [Rule 3 - Blocking] Upgraded Solana CLI from v2.1.21 to v3.0.15**
- **Found during:** Task 2 (anchor build dependency resolution)
- **Issue:** Solana CLI v2.1.21 ships rustc 1.79.0-dev; Anchor 0.32.1 dependency chain requires rustc >= 1.82 (indexmap@2.13.0)
- **Fix:** Installed Solana CLI stable (v3.0.15) which ships a compatible BPF toolchain
- **Files modified:** System tooling (not committed)
- **Verification:** `anchor build` compiles successfully

**4. [Rule 3 - Blocking] Added localnet config to Anchor.toml**
- **Found during:** Task 2 (running bankrun tests)
- **Issue:** `startAnchor` requires `[programs.localnet]` section in Anchor.toml; only `[programs.devnet]` existed
- **Fix:** Added `[programs.localnet]` with same program ID
- **Files modified:** Anchor.toml
- **Verification:** All 3 tests pass
- **Committed in:** 61019ff (Task 2 commit)

**5. [Rule 3 - Blocking] Removed `"type": "module"` from root package.json**
- **Found during:** Task 2 (running ts-mocha tests)
- **Issue:** ESM module resolution conflicted with ts-mocha CJS compilation; imports could not resolve target/types paths
- **Fix:** Removed `"type": "module"` from root; sub-packages retain their own ESM declaration
- **Files modified:** package.json
- **Verification:** ts-mocha runs and all 3 tests pass
- **Committed in:** 61019ff (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (5 blocking issues)
**Impact on plan:** All auto-fixes were necessary for compilation and test execution. No scope creep. The Solana CLI upgrade from v2.1.x to v3.0.x is the most significant deviation but was required by Anchor 0.32.1's dependency chain.

## Issues Encountered

- Solana CLI v2.2.x binaries failed to extract on macOS x86_64 (`failed to iterate over archive`), required jumping directly to v3.0.15 stable channel.
- anchor-bankrun@0.5.0 shows unmet peer dependency warning for `@coral-xyz/anchor@^0.30.0` with 0.32.1 installed. This is a semver range issue in the package metadata; the library works correctly with 0.32.1.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Monorepo structure ready for apps/web/ (Plan 02: Next.js web app scaffold)
- Anchor program IDL available for TypeScript client generation in web app
- @gsd/types and @gsd/utils importable via workspace protocol for use in web app
- Program deployed artifact (target/deploy/gsd_hub.so) ready for devnet deployment
- PDA derivation function matches on-chain seeds -- ready for frontend integration

## Self-Check: PASSED

All 14 key files verified present. Both task commits (b1b1c7b, 61019ff) verified in git log.

---
*Phase: 01-foundation-authentication*
*Completed: 2026-02-08*
