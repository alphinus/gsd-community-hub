---
phase: 03-governance-idea-rounds
plan: 07
subsystem: ui, api
tags: [treasury, solana-rpc, helius, tanstack-query, dark-theme, spl-token]

# Dependency graph
requires:
  - phase: 03-governance-idea-rounds
    plan: 05
    provides: "Helius webhook infrastructure and API pattern"
  - phase: 01-foundation
    provides: "Transparency config with multisig address, explorerUrl/squadsUrl helpers"
provides:
  - "Treasury RPC client fetching SOL and $GSD balances from Solana cluster"
  - "Treasury transaction history via Helius Enhanced Transactions API"
  - "GET /api/treasury endpoint with 30-second cache"
  - "Public treasury dashboard page with balance cards, transaction list, and Explorer links"
  - "Burn total placeholder for Phase 4 buy-and-burn mechanism"
affects: [phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [Solana RPC balance queries, SPL Token account data parsing (u64 at offset 64), Helius Enhanced Transactions API, TanStack Query with 30s refetch]

key-files:
  created:
    - "apps/web/lib/treasury/client.ts"
    - "apps/web/app/api/treasury/route.ts"
    - "apps/web/app/(public)/treasury/page.tsx"
    - "apps/web/components/treasury/TreasuryDashboard.tsx"
    - "apps/web/components/treasury/TransactionList.tsx"

key-decisions:
  - "Treasury address falls back to System Program address (11111111111111111111111111111111) when NEXT_PUBLIC_TREASURY_ADDRESS not configured"
  - "SPL Token balance parsed via raw Buffer.readBigUInt64LE(64) instead of @solana/spl-token dependency"
  - "Helius API key optional: endpoint returns balance-only with warning when HELIUS_API_KEY missing"

patterns-established:
  - "Treasury data pattern: RPC for real-time balances, Helius for transaction history, combined API with cache headers"
  - "Inflow/outflow categorization: compare treasury address against from/to in native and token transfers"

# Metrics
duration: ~4min
completed: 2026-02-08
---

# Phase 3 Plan 7: Treasury Dashboard Summary

**Treasury RPC client, API endpoint, and public dashboard with SOL/$GSD balance cards, transaction history, and Explorer verification links**

## Performance

- **Duration:** ~4 min
- **Completed:** 2026-02-08
- **Tasks:** 2 (+ checkpoint)
- **Files created:** 5

## Accomplishments
- Treasury RPC client fetching SOL balance and $GSD token balance directly from Solana cluster
- Transaction history via Helius Enhanced Transactions API with inflow/outflow categorization
- API endpoint with 30-second cache and graceful degradation when Helius key not configured
- Public dashboard with 3 balance cards (SOL, $GSD, Burn placeholder), transaction list, and Explorer/Squads links
- Auto-refreshing data via TanStack Query with 30-second refetch interval

## Task Commits

Each task was committed atomically:

1. **Task 1: Treasury RPC client and API endpoint** - `50c389d` (feat)
2. **Task 2: Treasury dashboard page and components** - `93f0f54` (feat)
3. **Deviation fix: Valid base58 placeholder address** - `a5478fe` (fix)

## Files Created/Modified
- `apps/web/lib/treasury/client.ts` - getTreasuryBalance (SOL + $GSD via RPC), getTreasuryTransactions (Helius API), address constants
- `apps/web/app/api/treasury/route.ts` - GET endpoint with 30-second cache, Helius key optional, error fallback
- `apps/web/app/(public)/treasury/page.tsx` - Server Component with SEO metadata, hero, balance cards, transaction list, verification links
- `apps/web/components/treasury/TreasuryDashboard.tsx` - Balance cards (SOL, $GSD, Burn total), skeleton loading, auto-refresh
- `apps/web/components/treasury/TransactionList.tsx` - Inflow/outflow list with Explorer links, empty state, pagination

## Decisions Made
- Placeholder treasury address changed from "PLACEHOLDER_TREASURY_ADDRESS_11111111111111" (invalid base58) to System Program address "11111111111111111111111111111111"
- SPL Token balance read via raw buffer parsing at offset 64 instead of adding @solana/spl-token runtime dependency
- HELIUS_API_KEY is optional -- when missing, transaction history is omitted with yellow warning message

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Invalid base58 placeholder address**
- **Found during:** Task 1 (treasury client creation)
- **Issue:** Initial placeholder "PLACEHOLDER_TREASURY_ADDRESS_11111111111111" was not valid base58, causing PublicKey constructor to throw
- **Fix:** Changed fallback to System Program address "11111111111111111111111111111111"
- **Files modified:** apps/web/lib/treasury/client.ts
- **Verification:** PublicKey construction succeeds, API returns balance data
- **Committed in:** a5478fe

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Trivial placeholder change. No scope creep.

## Issues Encountered
None beyond the auto-fixed base58 issue.

## User Setup Required
- Set `NEXT_PUBLIC_TREASURY_ADDRESS` to real multisig vault PDA after setup
- Set `NEXT_PUBLIC_GSD_MINT` to real $GSD token mint address
- Set `HELIUS_API_KEY` for transaction history (optional -- dashboard works without it)

## Checkpoint Verification
- **Status:** APPROVED by user
- **Verified pages:** /treasury
- **User feedback:** Balance cards render correctly (0.0000 SOL, 0 $GSD, 0 burned), yellow warning for missing Helius key, empty transaction state, dark theme consistent

## Self-Check: PASSED

All 5 files verified present. 3 commits (50c389d, 93f0f54, a5478fe) confirmed in git log. Treasury page returns HTTP 200. Human checkpoint approved.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
