---
phase: 06-advanced-governance
plan: 04
subsystem: indexer, api
tags: [helius, webhook, delegation, indexer, prisma, anchor, discriminator, api]

# Dependency graph
requires:
  - phase: 06-advanced-governance
    plan: 01
    provides: "DelegationRecord PDA, Delegation Prisma model, GovernanceConfig extension"
  - phase: 06-advanced-governance
    plan: 02
    provides: "delegate_vote, revoke_delegation, update_governance_config instructions"
  - phase: 05-gsd-framework-integration
    provides: "5-processor Helius webhook pipeline"
provides:
  - "governance-advanced-indexer.ts with processAdvancedGovernanceEvent for delegate_vote, revoke_delegation, update_governance_config"
  - "6-processor Helius webhook pipeline (contribution + governance + revenue + detection + verification + advanced-governance)"
  - "GET /api/governance/delegate endpoint returning delegations and stats for a wallet"
  - "Delegation helper library (getDelegationsForWallet, getDelegateStats, getActiveDelegations)"
affects: [06-05, 06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Separate advanced governance indexer file to avoid bloating existing governance-indexer.ts"
    - "Discriminator-based instruction matching with reverse lookup map for O(1) identification"
    - "Idempotent webhook processing via Prisma upsert on onChainAddress unique key"

key-files:
  created:
    - apps/web/lib/indexers/governance-advanced-indexer.ts
    - apps/web/app/api/governance/delegate/route.ts
  modified:
    - apps/web/app/api/webhooks/helius/route.ts

key-decisions:
  - "Separate indexer file (governance-advanced-indexer.ts) rather than extending governance-indexer.ts to keep domain separation"
  - "effectiveFromRound derived from latest open/voting round at indexing time (defaults to 0 if none active)"
  - "Delegation helper library pre-existed from concurrent 06-05 execution -- reused as-is"

patterns-established:
  - "Advanced governance indexer pattern: separate file per instruction domain within lib/indexers/"
  - "Delegation query API follows deposit route pattern: wallet param, base58 validation, BigInt-as-string"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 6 Plan 4: Delegation Indexer and Query API Summary

**Helius webhook extended to 6 processors with delegation indexer, plus delegation query API backed by helper library**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T14:39:12Z
- **Completed:** 2026-02-09T14:44:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Advanced governance indexer processes delegate_vote (creates Delegation), revoke_delegation (deactivates), and update_governance_config events from Helius webhooks
- Helius webhook pipeline extended from 5 to 6 processors with individual try/catch isolation
- GET /api/governance/delegate returns delegation records and aggregate stats for any wallet
- Delegation helper library provides reusable query functions for analytics plan (06-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create governance advanced indexer and extend Helius webhook** - `1dadd44` (feat)
2. **Task 2: Create delegation helper library and delegation query API** - `8f14905` (feat, pre-existing from concurrent execution)

## Files Created/Modified
- `apps/web/lib/indexers/governance-advanced-indexer.ts` - Processes delegate_vote, revoke_delegation, update_governance_config from Helius webhooks
- `apps/web/app/api/webhooks/helius/route.ts` - Extended from 5 to 6 processors with advanced governance pipeline
- `apps/web/app/api/governance/delegate/route.ts` - GET endpoint returning delegations and stats for a wallet
- `apps/web/lib/governance/delegation.ts` - Helper library with getDelegationsForWallet, getDelegateStats, getActiveDelegations

## Decisions Made
- Separate indexer file (governance-advanced-indexer.ts) rather than extending governance-indexer.ts -- keeps domain separation clean and avoids file bloat
- effectiveFromRound derived from latest open/voting round at indexing time (defaults to 0 if none active)
- Delegation helper library and API route already existed from a concurrent 06-05 execution -- verified they match plan requirements and reused as-is

## Deviations from Plan

None - plan executed exactly as written. Task 2 artifacts (delegation.ts helper library and delegate/route.ts) were already present from concurrent execution; verified they match all plan requirements.

## Issues Encountered
- Task 2 files (delegation helper library and delegate API route) were already committed by a concurrent 06-05 plan execution (commit `8f14905`). Verified they contain all required functionality (getDelegationsForWallet, getDelegateStats, getActiveDelegations, GET endpoint with wallet param). No changes needed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Delegation indexing pipeline operational for webhook processing
- Delegation helper library exported for analytics API (06-05)
- GET /api/governance/delegate ready for delegation UI components (06-06, 06-07)

## Self-Check: PASSED

- [x] governance-advanced-indexer.ts exists
- [x] helius/route.ts exists (modified)
- [x] delegate/route.ts exists
- [x] delegation.ts exists
- [x] 06-04-SUMMARY.md exists
- [x] Commit 1dadd44 found in git log

---
*Phase: 06-advanced-governance*
*Completed: 2026-02-09*
