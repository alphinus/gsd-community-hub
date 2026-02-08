---
phase: 03-governance-idea-rounds
plan: 05
subsystem: api
tags: [governance, helius, webhook, indexer, next-api, prisma, anchor-discriminators]

# Dependency graph
requires:
  - phase: 03-governance-idea-rounds
    provides: TypeScript governance types with string union enums (plan 02)
  - phase: 03-governance-idea-rounds
    provides: Voting and token escrow instructions defining account struct layouts (plan 04)
provides:
  - Governance event indexer processing 8 on-chain instruction types via Helius webhook
  - Anchor instruction discriminator constants for governance instructions
  - GET/POST /api/governance/rounds endpoint with status filter and pagination
  - GET /api/governance/rounds/:id endpoint with nested ideas
  - GET/POST /api/governance/rounds/:id/ideas endpoint with sort options
  - GET /api/governance/deposit endpoint with computed isEligible
  - GET /api/governance/votes endpoint with ideaId/wallet filters
affects: [03-06, 03-07, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [Anchor SHA-256 discriminator matching, dual-processor webhook handler, reverse discriminator lookup map]

key-files:
  created:
    - apps/web/lib/governance/constants.ts
    - apps/web/lib/governance/indexer.ts
    - apps/web/app/api/governance/rounds/route.ts
    - apps/web/app/api/governance/rounds/[id]/route.ts
    - apps/web/app/api/governance/rounds/[id]/ideas/route.ts
    - apps/web/app/api/governance/deposit/route.ts
    - apps/web/app/api/governance/votes/route.ts
  modified:
    - apps/web/app/api/webhooks/helius/route.ts

key-decisions:
  - "Dual-processor webhook: transactions routed through both contribution and governance processors (match by discriminator)"
  - "Off-chain content submitted via POST endpoints, on-chain events create stub records via indexer"
  - "Reverse discriminator lookup map for O(1) instruction identification in indexer"

patterns-established:
  - "Governance API pattern: pagination with status/sort filters, BigInt as string, 404 for missing rounds"
  - "POST upsert by onChainAddress: allows UI to attach title/description after on-chain creation"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 3 Plan 5: Governance Indexer and API Endpoints Summary

**Helius webhook governance indexer processing 8 instruction types, plus 5 API routes serving paginated rounds, ideas, deposits, and votes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T16:36:34Z
- **Completed:** 2026-02-08T16:40:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Governance indexer identifies and processes all 8 governance instruction types from Helius webhooks using Anchor discriminator matching
- Webhook handler extended to dual-process both contribution and governance events per transaction
- 5 API route files with 7 total handlers (GET and POST) serving governance data with pagination, filtering, and BigInt serialization

## Task Commits

Each task was committed atomically:

1. **Task 1: Create governance indexer and extend Helius webhook** - `cc77405` (feat)
2. **Task 2: Create governance API endpoints** - `9bc7b55` (feat)

## Files Created/Modified
- `apps/web/lib/governance/constants.ts` - Anchor discriminator map for 8 governance instructions using SHA-256
- `apps/web/lib/governance/indexer.ts` - Processes governance on-chain events: create_round, submit_idea, transition_round, cast_vote, deposit_tokens, withdraw_tokens, relinquish_vote, veto_idea
- `apps/web/app/api/webhooks/helius/route.ts` - Extended to route transactions through both contribution and governance processors
- `apps/web/app/api/governance/rounds/route.ts` - GET (paginated list with status filter) + POST (off-chain content upsert)
- `apps/web/app/api/governance/rounds/[id]/route.ts` - GET single round with nested ideas and vote counts
- `apps/web/app/api/governance/rounds/[id]/ideas/route.ts` - GET (paginated with sort) + POST (off-chain idea content)
- `apps/web/app/api/governance/deposit/route.ts` - GET deposit info with computed isEligible for a wallet
- `apps/web/app/api/governance/votes/route.ts` - GET paginated votes filtered by ideaId or wallet

## Decisions Made
- Dual-processor webhook: each transaction runs through both contribution and governance processors; they match on different instruction types (noop for contributions, discriminators for governance)
- Off-chain content (title/description) submitted via POST endpoints separately from on-chain event indexing; indexer creates stub records with placeholder text
- Reverse discriminator lookup map (`DISCRIMINATOR_TO_INSTRUCTION`) for O(1) instruction identification rather than iterating discriminator entries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Helius webhook setup was completed in Phase 2.

## Next Phase Readiness
- Governance indexer and API endpoints are live, ready for UI integration (plan 06/07)
- POST endpoints allow UI to attach off-chain content to on-chain-created rounds and ideas
- All BigInt serialization consistent with project convention
- Combined with plans 01-04, the full governance backend is complete

## Self-Check: PASSED

All 7 created files and 1 modified file verified present. Both task commits (cc77405, 9bc7b55) verified in git log.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
