---
phase: 02-contribution-tracking
plan: 04
subsystem: database, api
tags: [prisma, helius, webhooks, postgresql, indexer, solana, noop]

# Dependency graph
requires:
  - phase: 02-contribution-tracking
    plan: 02
    provides: "Shared types (ContributionData) and utils (computeContributionLeafHash, serializeContributionLeaf)"
  - phase: 01-foundation
    plan: 02
    provides: "Prisma schema with User model and database connection setup"
provides:
  - "Prisma Contribution model with transactionSignature idempotency"
  - "POST /api/webhooks/helius endpoint for Helius enhanced transaction webhooks"
  - "processContributionEvent indexer function for webhook payload processing"
  - "setup-helius-webhook.ts CLI script for webhook creation via REST API"
affects: [02-05, 03, 04]

# Tech tracking
tech-stack:
  added: [helius-rest-api]
  patterns: [webhook-auth-header, transaction-signature-idempotency, noop-instruction-parsing, base58-encode-decode]

key-files:
  created:
    - apps/web/app/api/webhooks/helius/route.ts
    - apps/web/lib/contributions/indexer.ts
    - scripts/setup-helius-webhook.ts
    - .planning/phases/02-contribution-tracking/02-USER-SETUP.md
  modified:
    - apps/web/prisma/schema.prisma
    - apps/web/.env.local.example

key-decisions:
  - "Inline base58 encode/decode to avoid adding bs58 dependency to webhook handler"
  - "Helius webhook auth uses Authorization header (not query param) for security"
  - "leafIndex defaults to 0 (updated by tree indexer if needed in future)"
  - "One contribution per transaction assumption (break after first match)"

patterns-established:
  - "Webhook authentication: compare Authorization header against env secret"
  - "Idempotency via unique transactionSignature: upsert with empty update block"
  - "Noop instruction parsing: decode base58 data, check 106-byte size, deserialize ContributionLeaf"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 2 Plan 4: Off-chain Indexer Summary

**Prisma Contribution model with Helius webhook receiver indexing on-chain contributions via noop instruction parsing and transaction signature idempotency**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T12:53:58Z
- **Completed:** 2026-02-08T12:58:19Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Contribution model added to Prisma schema with unique transactionSignature constraint and wallet/tree indexes
- Webhook receiver authenticates requests, processes Helius enhanced transactions, and extracts ContributionLeaf from noop inner instructions
- Indexer upserts contributions to PostgreSQL with duplicate-safe idempotency
- CLI script creates Helius webhooks via REST API (no helius-sdk dependency)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Prisma Contribution model and Helius webhook receiver** - `ee91aef` (feat)
2. **Task 2: Create Helius webhook setup script** - `6ddec42` (feat)

## Files Created/Modified
- `apps/web/prisma/schema.prisma` - Added Contribution model with User relation
- `apps/web/lib/contributions/indexer.ts` - Webhook payload processing and Prisma upsert logic
- `apps/web/app/api/webhooks/helius/route.ts` - POST endpoint for Helius enhanced transaction webhooks
- `apps/web/.env.local.example` - Added HELIUS_API_KEY and HELIUS_WEBHOOK_AUTH
- `scripts/setup-helius-webhook.ts` - CLI script to create Helius webhooks via REST API
- `.planning/phases/02-contribution-tracking/02-USER-SETUP.md` - Helius service configuration guide

## Decisions Made
- Inline base58 encode/decode in indexer to avoid adding bs58 dependency to the server-side webhook handler (keeps the dependency footprint minimal)
- Helius webhook auth uses Authorization header comparison (not query parameter) for better security
- leafIndex defaults to 0 in the contribution record (tree indexer can update it later if needed)
- One contribution per transaction assumption simplifies processing (break after first noop match)

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration.** See [02-USER-SETUP.md](./02-USER-SETUP.md) for:
- HELIUS_API_KEY from Helius Dashboard
- HELIUS_WEBHOOK_AUTH secret generation
- Webhook creation via setup script

## Next Phase Readiness
- Contribution model ready for API endpoints (plan 05)
- Webhook infrastructure ready for deployment and testing
- Helius account and webhook creation required before live indexing (documented in USER-SETUP.md)

## Self-Check: PASSED

All 7 files verified present. Both task commits (ee91aef, 6ddec42) verified in git log.

---
*Phase: 02-contribution-tracking*
*Completed: 2026-02-08*
