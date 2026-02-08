---
phase: 04-revenue-mechanics
plan: 03
subsystem: api, indexer, webhook
tags: [helius, webhook, prisma, nextjs, api, revenue, detection, indexer]

# Dependency graph
requires:
  - phase: 04-revenue-mechanics
    plan: 01
    provides: "Prisma models (RevenueEvent, RevenueClaim, PendingRevenue) and TypeScript revenue types"
  - phase: 04-revenue-mechanics
    plan: 02
    provides: "On-chain revenue instructions (record_revenue_event, claim_revenue_share, execute_burn) with Anchor discriminators"
  - phase: 03-governance-idea-rounds
    provides: "Governance indexer pattern with discriminator-based instruction identification and webhook dual-processor pattern"
  - phase: 02-contribution-tracking
    provides: "HeliusEnhancedTransaction type and contribution indexer pattern"
provides:
  - "Revenue instruction discriminator map (REVENUE_DISCRIMINATORS, REVENUE_DISCRIMINATOR_TO_INSTRUCTION)"
  - "Revenue inflow detection for SOL/USDC treasury transfers (detectRevenueInflow)"
  - "Revenue event indexer processing 4 instruction types (processRevenueEvent)"
  - "Treasury inflow detection processor persisting PendingRevenue records (processRevenueDetection)"
  - "GET /api/revenue/events endpoint with pagination and status filter"
  - "GET /api/revenue/claims endpoint with wallet filter and event context"
  - "GET /api/revenue/burns endpoint with origin_signature traceability"
  - "GET /api/revenue/summary endpoint with aggregate totals and 30s cache"
affects: [04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quad-processor webhook pipeline (contribution + governance + revenue-instructions + revenue-detection)"
    - "Revenue detection as separate concern from instruction indexing"
    - "PendingRevenue flow: detect treasury inflow -> admin review -> distribution"
    - "Shared BigInt serialization helper across revenue API routes"

key-files:
  created:
    - "apps/web/lib/revenue/constants.ts"
    - "apps/web/lib/revenue/detection.ts"
    - "apps/web/lib/revenue/indexer.ts"
    - "apps/web/app/api/revenue/events/route.ts"
    - "apps/web/app/api/revenue/claims/route.ts"
    - "apps/web/app/api/revenue/burns/route.ts"
    - "apps/web/app/api/revenue/summary/route.ts"
  modified:
    - "apps/web/app/api/webhooks/helius/route.ts"

key-decisions:
  - "HeliusEnhancedTransaction nativeTransfers/tokenTransfers accessed via type assertion (fields exist at runtime from Helius but not on minimal interface)"
  - "Revenue detection separated from instruction indexing: detectRevenueInflow runs on every tx, processRevenueEvent only on gsd-hub instructions"
  - "Graceful degradation: all API endpoints return empty data with 200 on database errors"
  - "USDC amount conversion uses Math.round(tokenAmount * 1e6) since Helius provides human-readable decimals"

patterns-established:
  - "BigInt serialization helper for API routes (recursive object traversal)"
  - "Quad-processor webhook: each processor runs independently with try/catch per transaction"
  - "Revenue API pagination pattern: page/limit params, Promise.all for data+count"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 4 Plan 3: Revenue Detection, Indexer & API Summary

**Revenue indexer with discriminator-based instruction processing, SOL/USDC treasury inflow detection via PendingRevenue, and 4 API endpoints (events/claims/burns/summary) with BigInt serialization**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T18:57:07Z
- **Completed:** 2026-02-08T19:01:03Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Revenue indexer identifies 4 instruction types via SHA-256 discriminator matching (init_config, record_event, claim_share, execute_burn)
- Treasury inflow detection (detectRevenueInflow) wired into webhook, persists PendingRevenue records for admin review
- Webhook extended from dual-processor to quad-processor pipeline (contribution + governance + revenue + detection)
- 4 paginated API endpoints return correctly structured JSON with BigInt-as-string serialization
- Idempotent indexing via upsert on transaction signatures
- Graceful degradation when database unavailable (empty arrays with 200)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create revenue indexer and extend Helius webhook** - `aa09a8b` (feat)
2. **Task 2: Create revenue API endpoints** - `d7b2a44` (feat)

## Files Created/Modified
- `apps/web/lib/revenue/constants.ts` - Revenue instruction discriminator map for webhook indexer
- `apps/web/lib/revenue/detection.ts` - SOL/USDC treasury inflow detection logic
- `apps/web/lib/revenue/indexer.ts` - Revenue event processor and treasury inflow detector
- `apps/web/app/api/webhooks/helius/route.ts` - Extended with revenue processor and detection (4th processor)
- `apps/web/app/api/revenue/events/route.ts` - GET /api/revenue/events with pagination and claim counts
- `apps/web/app/api/revenue/claims/route.ts` - GET /api/revenue/claims with wallet filter
- `apps/web/app/api/revenue/burns/route.ts` - GET /api/revenue/burns with origin traceability
- `apps/web/app/api/revenue/summary/route.ts` - GET /api/revenue/summary with aggregate totals and 30s cache

## Decisions Made
- HeliusEnhancedTransaction nativeTransfers/tokenTransfers accessed via type assertion since the contribution indexer interface is minimal but Helius provides these fields at runtime
- Revenue detection separated from instruction indexing to enable treasury inflow monitoring independent of on-chain program events
- All API endpoints use graceful degradation returning empty data with 200 status on database errors
- USDC token amounts converted from Helius human-readable decimals to raw amounts via Math.round(tokenAmount * 1e6)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated Prisma client for revenue models**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Prisma client did not include RevenueEvent, RevenueClaim, or PendingRevenue models (schema was updated in 04-01 but client not regenerated)
- **Fix:** Ran `npx prisma generate` to regenerate client with revenue models
- **Files modified:** apps/web/prisma/generated/ (auto-generated, not committed)
- **Verification:** TypeScript compilation passes with all Prisma model access
- **Committed in:** N/A (generated files not committed)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Prisma client regeneration was required for type safety. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Revenue indexer and API endpoints complete, ready for distribution wiring (04-04)
- PendingRevenue detection pipeline wired into webhook for treasury inflow monitoring
- API endpoints ready for treasury dashboard UI integration (04-05)
- All 4 on-chain instruction types indexed from webhook transactions

## Self-Check: PASSED

All 8 files verified present. Both task commits (aa09a8b, d7b2a44) verified in git log.

---
*Phase: 04-revenue-mechanics*
*Completed: 2026-02-08*
