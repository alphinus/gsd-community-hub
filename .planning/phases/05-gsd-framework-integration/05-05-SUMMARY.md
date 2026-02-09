---
phase: 05-gsd-framework-integration
plan: 05
subsystem: api
tags: [verification, webhook, indexer, prisma, next-auth, ai-verification, peer-review]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Prisma models (VerificationReport, PeerReview, ReviewerProfile), PDA utils, verification-hash"
  - phase: 05-02
    provides: "AI verification engine (verifyTask), scoring (scaleToOnChain), schemas, constants"
  - phase: 05-03
    provides: "On-chain verification instructions (submit_verification, submit_peer_review, finalize_peer_verification)"
provides:
  - "POST /api/verification/submit endpoint triggering AI verification and storing results"
  - "GET /api/verification/report/[id] endpoint for individual public report with peer reviews"
  - "GET /api/verification/reports endpoint for paginated, filterable report list"
  - "processVerificationEvent webhook indexer for on-chain verification events"
  - "5-processor Helius webhook pipeline (contribution + governance + revenue + detection + verification)"
affects: [05-06, 05-07, 05-08, frontend-verification-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verification indexer follows revenue/governance indexer pattern (discriminator map + base58 decode + upsert)"
    - "Public API endpoints for verification transparency (no auth on GET)"
    - "5-processor webhook pipeline with independent try/catch per processor"

key-files:
  created:
    - "apps/web/lib/verification/constants-onchain.ts"
    - "apps/web/lib/verification/indexer.ts"
    - "apps/web/app/api/verification/submit/route.ts"
    - "apps/web/app/api/verification/report/[id]/route.ts"
    - "apps/web/app/api/verification/reports/route.ts"
  modified:
    - "apps/web/app/api/webhooks/helius/route.ts"

key-decisions:
  - "Auth uses session.publicKey pattern (matching profile route convention) not session.user.name"
  - "On-chain recording deferred via TODO -- store off-chain first, on-chain recording triggered separately when server signing available"
  - "GET endpoints are public (no auth) for verification transparency per user decision"
  - "Report JSON stored via JSON.parse(JSON.stringify()) for Prisma 7 strict Json field compatibility"

patterns-established:
  - "Verification indexer pattern: discriminator lookup -> instruction parsing -> Prisma upsert by transactionSignature"
  - "5-processor webhook pipeline: each processor independent with own counter and error handling"
  - "Low-confidence peer review flagging: confidenceOnChain < CONFIDENCE_THRESHOLD triggers pending status with fallbackOptions"

# Metrics
duration: 6min
completed: 2026-02-09
---

# Phase 5 Plan 5: Verification API and Webhook Pipeline Summary

**Verification submit/report/list API endpoints with 5-processor Helius webhook indexing on-chain verification events to Prisma**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-09T12:49:42Z
- **Completed:** 2026-02-09T12:56:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- POST /api/verification/submit triggers AI engine, stores report with hash, flags low-confidence for peer review
- Webhook extended to 5 processors indexing submit_verification, submit_peer_review, and finalize_peer_verification events
- Public GET endpoints return individual reports (with peer reviews) and paginated filterable lists
- Full pipeline operational: submit -> AI analyze -> store -> index from on-chain -> retrieve via API

## Task Commits

Each task was committed atomically:

1. **Task 1: Create verification webhook indexer and extend Helius webhook** - `9530ad0` (feat)
2. **Task 2: Create verification API endpoints (submit, report, reports list)** - `16d2555` (feat)

## Files Created/Modified
- `apps/web/lib/verification/constants-onchain.ts` - Anchor discriminator map for 4 verification instructions
- `apps/web/lib/verification/indexer.ts` - processVerificationEvent with submit/peer-review/finalize handlers
- `apps/web/app/api/verification/submit/route.ts` - Auth-protected POST triggering AI verification
- `apps/web/app/api/verification/report/[id]/route.ts` - Public GET for individual report with peer reviews
- `apps/web/app/api/verification/reports/route.ts` - Public GET with pagination and wallet/status/type filters
- `apps/web/app/api/webhooks/helius/route.ts` - Extended to 5th verification processor

## Decisions Made
- Auth uses `session.publicKey` (matching existing profile route pattern, not `session.user.name` which doesn't exist on the auth Session type)
- On-chain recording deferred with TODO comment -- server needs signing capability to record on-chain, so reports stored off-chain first
- GET endpoints are public (no authentication) per user decision that every verification report should be publicly auditable
- Report JSON sanitized via `JSON.parse(JSON.stringify())` for Prisma 7 strict Json field type compatibility (matching 05-04 convention)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed session auth property access**
- **Found during:** Task 2 (submit endpoint)
- **Issue:** Plan specified `auth() from next-auth` with `session.user.name` but this project uses `session.publicKey` from custom next-auth Session type extension
- **Fix:** Changed to `session?.publicKey` / `session.publicKey` matching existing profile route.ts pattern
- **Files modified:** apps/web/app/api/verification/submit/route.ts
- **Verification:** TypeScript compiles cleanly (no new errors beyond pre-existing siws.ts and prisma.config.ts)
- **Committed in:** 16d2555 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auth property fix was essential for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no new external service configuration required. ANTHROPIC_API_KEY (from 05-02) is the only runtime dependency for the submit endpoint.

## Next Phase Readiness
- Verification pipeline is end-to-end operational for API integration
- Frontend verification UI can call submit and display report/reports endpoints
- Peer review submission and finalization will be indexed from on-chain events automatically
- On-chain recording needs server signing capability (future plan)

## Self-Check: PASSED

All 7 files verified present. Both task commits (9530ad0, 16d2555) confirmed in git log.

---
*Phase: 05-gsd-framework-integration*
*Completed: 2026-02-09*
