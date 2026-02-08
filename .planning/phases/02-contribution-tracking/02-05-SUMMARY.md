---
phase: 02-contribution-tracking
plan: 05
subsystem: api, ui
tags: [next.js, prisma, tanstack-query, solana, merkle-tree, contribution-tracking]

# Dependency graph
requires:
  - phase: 02-03
    provides: "On-chain contribution instructions and Merkle tree state"
  - phase: 02-04
    provides: "Off-chain indexer with Prisma Contribution model and Helius webhook"
  - phase: 01-03
    provides: "Developer profile page and profile header component"
provides:
  - "GET /api/contributions/[wallet] - paginated contributions by wallet with summary stats"
  - "GET /api/contributions - recent activity feed across all developers"
  - "ScoreBadge component with emerald gradient and breakdown stats"
  - "ContributionCard component with verification score bar and Solana Explorer link"
  - "ContributionList component with TanStack Query pagination and loading skeletons"
  - "Profile page integration with server-side score calculation and graceful degradation"
  - "Merkle tree TypeScript client helpers: PDA derivation, cost calculation, alloc instruction"
affects: [03-governance, 04-revenue-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-side contribution aggregation with Prisma aggregate queries"
    - "BigInt score passed as string through server/client boundary"
    - "TanStack Query with SSR initialData for contribution list hydration"
    - "Merkle tree size formula implemented locally (avoiding broken spl-account-compression package)"

key-files:
  created:
    - "apps/web/app/api/contributions/[wallet]/route.ts"
    - "apps/web/app/api/contributions/route.ts"
    - "apps/web/lib/contributions/tree.ts"
    - "apps/web/components/contributions/score-badge.tsx"
    - "apps/web/components/contributions/contribution-card.tsx"
    - "apps/web/components/contributions/contribution-list.tsx"
  modified:
    - "apps/web/app/(public)/profile/[wallet]/page.tsx"
    - "packages/utils/src/index.ts"
    - "packages/types/src/index.ts"

key-decisions:
  - "Implemented Merkle tree helpers using only @solana/web3.js (spl-account-compression v0.4.1 has broken dist paths)"
  - "Score passed as string across server/client boundary to avoid BigInt serialization issues"
  - "Removed .js extensions from @gsd/utils and @gsd/types barrel exports (Turbopack module resolution fix)"

patterns-established:
  - "Contribution API pagination: page/limit params, same pattern as /api/directory"
  - "Server-side Prisma aggregate for score calculation, passed as initialData to client"

# Metrics
duration: 9min
completed: 2026-02-08
---

# Phase 2 Plan 5: Contribution Display Summary

**Contribution API endpoints, score badge with breakdown, paginated contribution history with Solana Explorer verification links integrated into developer profile page**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-08T13:03:04Z
- **Completed:** 2026-02-08T13:11:39Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- GET /api/contributions/[wallet] returns paginated contributions with wallet validation and summary stats (tasksCompleted, averageVerificationScore)
- GET /api/contributions returns recent activity feed with contributor display names from User relation
- Merkle tree client helpers provide PDA derivation, account size calculation, and SystemProgram.createAccount instruction
- ScoreBadge displays BigInt score with emerald gradient bar and "X tasks | Y% avg score | Z days active" breakdown
- ContributionCard shows task reference, color-coded verification score bar (green/yellow/red), content hash with copy button, and "Verify on-chain" Solana Explorer link
- ContributionList uses TanStack Query with SSR initialData, loading skeletons, and pagination controls
- Profile page fetches all contribution data server-side with calculateContributionScore and passes to client components
- Empty states handled gracefully throughout (no contributions, database errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build contribution API endpoints and tree client helpers** - `94d99cf` (feat)
2. **Task 2: Build contribution UI components and integrate into profile page** - `2fd1796` (feat)

## Files Created/Modified
- `apps/web/app/api/contributions/[wallet]/route.ts` - GET endpoint for paginated contributions by wallet
- `apps/web/app/api/contributions/route.ts` - GET endpoint for recent contributions across all developers
- `apps/web/lib/contributions/tree.ts` - Merkle tree client helpers (PDA, cost, alloc IX)
- `apps/web/components/contributions/score-badge.tsx` - Score display with emerald gradient and breakdown
- `apps/web/components/contributions/contribution-card.tsx` - Single contribution with verification bar and Explorer link
- `apps/web/components/contributions/contribution-list.tsx` - Paginated list with TanStack Query and skeletons
- `apps/web/app/(public)/profile/[wallet]/page.tsx` - Updated with contribution section (server-side data fetch)
- `packages/utils/src/index.ts` - Removed .js extensions from imports (Turbopack fix)
- `packages/types/src/index.ts` - Removed .js extensions from imports (Turbopack fix)

## Decisions Made
- Implemented Merkle tree helpers locally using `@solana/web3.js` SystemProgram instead of `@solana/spl-account-compression` v0.4.1 (broken package: `dist/cjs/index.js` and `dist/types/index.d.ts` paths missing, actual files are under `dist/cjs/src/` and `dist/types/src/`)
- BigInt score serialized as string for server-to-client boundary (JSON cannot serialize BigInt)
- Removed `.js` extensions from `@gsd/utils` and `@gsd/types` barrel exports to fix Turbopack module resolution (pre-existing issue from 02-02/02-03)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] spl-account-compression v0.4.1 broken package exports**
- **Found during:** Task 1 (tree client helpers)
- **Issue:** `@solana/spl-account-compression@0.4.1` has broken package.json -- `main` points to `dist/cjs/index.js` but actual file is `dist/cjs/src/index.js`; same for `types`. TypeScript cannot resolve the module.
- **Fix:** Removed the dependency and implemented tree helpers using only `@solana/web3.js` (SPL program IDs as constants, account size formula, SystemProgram.createAccount for allocation)
- **Files modified:** `apps/web/lib/contributions/tree.ts`, `apps/web/package.json`
- **Verification:** TypeScript compiles, exports match plan specification
- **Committed in:** `94d99cf` (Task 1 commit)

**2. [Rule 3 - Blocking] .js extension imports in workspace packages break Turbopack build**
- **Found during:** Task 2 (build verification)
- **Issue:** `@gsd/utils/src/index.ts` and `@gsd/types/src/index.ts` used `.js` extensions in re-exports (ESM convention). Turbopack cannot resolve `.js` to `.ts` when packages export raw TypeScript source files. Pre-existing issue from plans 02-02/02-03.
- **Fix:** Removed `.js` extensions from barrel exports in both packages. Tests still pass (tsx resolves extensionless imports).
- **Files modified:** `packages/utils/src/index.ts`, `packages/types/src/index.ts`
- **Verification:** `pnpm -C packages/utils test` passes all 34 tests, Turbopack compiles successfully
- **Committed in:** `2fd1796` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correct compilation. No scope creep. Tree helpers provide identical API surface using @solana/web3.js instead of broken spl-account-compression package.

## Issues Encountered
- Pre-existing `siws.ts` type error (Phase 01-02) causes `next build` TypeScript check to fail. Turbopack compilation succeeds; only the strict TS checker rejects the `SolanaSignInOutput` type mismatch. Not related to this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (Contribution Tracking) is now complete: on-chain program, shared utilities, off-chain indexer, and user-facing display all integrated
- End-to-end flow: on-chain recording -> Helius webhook -> indexer -> database -> API -> profile page display
- Ready for Phase 3 (Governance) which will build on contribution scores for voting weight
- Pre-existing `siws.ts` type error should be addressed before production deployment

## Self-Check: PASSED

All 8 files verified present. Both task commits (94d99cf, 2fd1796) found in git history.

---
*Phase: 02-contribution-tracking*
*Completed: 2026-02-08*
