---
phase: 04-revenue-mechanics
plan: 04
subsystem: api, revenue, blockchain
tags: [jupiter, swap, burn, distribution, nextjs, prisma, solana, bigint]

# Dependency graph
requires:
  - phase: 04-revenue-mechanics
    plan: 01
    provides: "Prisma RevenueEvent/PendingRevenue models, revenue TypeScript types, SOL_MINT/USDC_MINT constants"
  - phase: 04-revenue-mechanics
    plan: 02
    provides: "On-chain execute_burn instruction for $GSD token burn after Jupiter swap"
  - phase: 04-revenue-mechanics
    plan: 03
    provides: "detectRevenueInflow for treasury inflow detection, PendingRevenue webhook pipeline, revenue API endpoints"
provides:
  - "executeBuyAndBurn: Jupiter Swap API quote/swap/sign/send with graceful failure handling"
  - "distributeRevenue: 60/20/10/10 split computation with Prisma persistence and optional buy-and-burn"
  - "loadBurnAuthority: Keypair loader from BURN_AUTHORITY_KEYPAIR env var (base58 or JSON file)"
  - "POST /api/revenue/distribute: admin-authenticated distribution trigger with direct and PendingRevenue modes"
affects: [04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Jupiter Swap API integration: quote -> swap -> sign -> send with per-step try/catch"
    - "Non-blocking buy-and-burn: null return on failure, distribution continues"
    - "Admin-secret auth pattern for server-to-server endpoints (REVENUE_ADMIN_SECRET)"
    - "Dual-mode API: direct params or PendingRevenue ID for flexible triggering"

key-files:
  created:
    - "apps/web/lib/revenue/distributor.ts"
    - "apps/web/app/api/revenue/distribute/route.ts"
  modified: []

key-decisions:
  - "Distribution triggered manually via admin API, not automatically on webhook (v1 safety measure per research)"
  - "Buy-and-burn failure returns null instead of throwing, allowing distribution to complete without burn"
  - "Inline base58 decode for burn authority keypair loading (project convention from 02-04)"
  - "Jupiter swap confirmation failure still returns signature (swap may land on-chain despite timeout)"

patterns-established:
  - "Jupiter API integration: quote with slippageBps -> swap with dynamic CU and priority fees -> sign VersionedTransaction -> send skipPreflight"
  - "BigInt split computation with remainder assigned to largest bucket (developer pool)"
  - "PendingRevenue lifecycle: detected -> pending -> processed (with processedEventId link)"

# Metrics
duration: 3min
completed: 2026-02-08
---

# Phase 4 Plan 4: Distribution Pipeline & Admin API Summary

**Jupiter buy-and-burn distributor with 60/20/10/10 split computation, admin-authenticated distribution API supporting direct and PendingRevenue modes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-08T19:03:48Z
- **Completed:** 2026-02-08T19:07:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Jupiter Swap API integration with per-step error handling (quote, swap build, sign/send, confirm) -- failure at any step returns null without blocking distribution
- Revenue distribution pipeline computes 60/20/10/10 splits with integer division remainder assigned to developer pool, persists RevenueEvent to database, and optionally executes buy-and-burn
- Admin distribution API endpoint with dual-mode support: direct parameters for ad-hoc distributions and PendingRevenue ID for processing webhook-detected inflows
- Idempotency via originSignature uniqueness check (409 on duplicate), authentication via REVENUE_ADMIN_SECRET header comparison

## Task Commits

Each task was committed atomically:

1. **Task 1: Create revenue detection and Jupiter buy-and-burn distributor** - `0a80252` (feat)
2. **Task 2: Create distribution API endpoint** - `55b4f13` (feat)

## Files Created/Modified
- `apps/web/lib/revenue/distributor.ts` - Jupiter buy-and-burn execution, revenue distribution pipeline, burn authority loader
- `apps/web/app/api/revenue/distribute/route.ts` - POST /api/revenue/distribute with admin auth, direct and PendingRevenue modes, idempotency

## Decisions Made
- Distribution is manually triggered via admin API (not automatic on webhook) per research recommendation for v1 safety
- Buy-and-burn failure returns null rather than throwing, so the 60/20 treasury/maintenance splits still complete even if Jupiter swap fails
- Jupiter swap confirmation timeout still returns the signature (swap may land on-chain; caller can verify separately)
- Inline base58 decode for keypair loading follows project convention established in plan 02-04

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None for this plan. Jupiter API key and burn authority keypair are referenced by the plan's user_setup section but are optional (distribution works without them, just skips burn). Setup will be needed before production burn execution:
- `JUPITER_API_KEY` from Jupiter Station
- `BURN_AUTHORITY_KEYPAIR` (base58-encoded Solana keypair secret)
- `REVENUE_ADMIN_SECRET` for authenticating distribution API calls

## Next Phase Readiness
- Distribution pipeline complete, ready for treasury dashboard UI (04-05)
- PendingRevenue -> distribution flow end-to-end: webhook detects inflow -> admin reviews -> POST /api/revenue/distribute with pendingRevenueId -> splits computed and persisted
- Revenue API endpoints (from 04-03) ready for dashboard consumption

## Self-Check: PASSED

All 2 files verified present. Both task commits (0a80252, 55b4f13) verified in git log.

---
*Phase: 04-revenue-mechanics*
*Completed: 2026-02-08*
