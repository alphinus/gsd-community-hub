---
phase: 03-governance-idea-rounds
plan: 06
subsystem: ui
tags: [governance, react, next-pages, tanstack-query, wallet-adapter, anchor-client, dark-theme]

# Dependency graph
requires:
  - phase: 03-governance-idea-rounds
    plan: 05
    provides: "Governance API endpoints (rounds, ideas, deposits, votes) for UI data fetching"
  - phase: 03-governance-idea-rounds
    plan: 02
    provides: "TypeScript governance types (IdeaRound, Idea, VoteDepositInfo, VoteChoice, RoundStatus)"
provides:
  - "7 governance UI components: RoundStatusBadge, RoundCard, IdeaList, IdeaForm, VotePanel, DepositPanel, VotingPowerDisplay"
  - "Public governance overview page with stats and how-it-works explainer"
  - "Public rounds listing and round detail pages with idea display"
  - "Governance dashboard and token deposit pages with wallet interaction"
  - "Full voting UI: Yes/No/Abstain buttons, vote tallies, voting power display"
affects: [phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [TanStack Query for governance data fetching, wallet-gated UI with client-side auth checks, route group conflict resolution]

key-files:
  created:
    - "apps/web/components/governance/RoundStatusBadge.tsx"
    - "apps/web/components/governance/RoundCard.tsx"
    - "apps/web/components/governance/IdeaList.tsx"
    - "apps/web/components/governance/IdeaForm.tsx"
    - "apps/web/components/governance/VotePanel.tsx"
    - "apps/web/components/governance/DepositPanel.tsx"
    - "apps/web/components/governance/VotingPowerDisplay.tsx"
    - "apps/web/app/(public)/governance/page.tsx"
    - "apps/web/app/(public)/governance/rounds/page.tsx"
    - "apps/web/app/(public)/governance/rounds/[id]/page.tsx"
    - "apps/web/app/(public)/governance/dashboard/page.tsx"
    - "apps/web/app/(public)/governance/deposit/page.tsx"

key-decisions:
  - "Route group conflict between (auth)/governance and (public)/governance caused Turbopack crash; moved auth pages to (public) group with client-side auth checks"
  - "Governance overview page uses Server Component with Prisma aggregates and try/catch for graceful degradation without DATABASE_URL"
  - "Deposit page auto-opens wallet connect modal when no wallet connected"

patterns-established:
  - "Client-side auth pattern: pages in (public) group use useWallet hook to check connection, prompt wallet connect if needed"
  - "Governance component hierarchy: page (Server) -> data-fetching wrapper (Client + TanStack Query) -> presentational components"

# Metrics
duration: ~6min
completed: 2026-02-08
---

# Phase 3 Plan 6: Governance UI Pages Summary

**7 governance components and 5 page routes implementing the full governance user experience: round browsing, idea submission, token-weighted voting, and deposit management**

## Performance

- **Duration:** ~6 min
- **Completed:** 2026-02-08
- **Tasks:** 2 (+ checkpoint)
- **Files created:** 12

## Accomplishments
- 7 governance components covering the full governance interaction surface: status badges, round cards, idea listing/submission, vote panel, deposit panel, voting power display
- 5 page routes: governance overview with stats, rounds listing, round detail with ideas, personal dashboard, token deposit page
- Graceful degradation: all pages render correctly without DATABASE_URL or wallet connection
- Dark theme with emerald accents consistent across all governance UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Governance components** - `8622c94` (feat)
2. **Task 2: Governance page routes** - `c9ab5dc` (feat)
3. **Deviation fix: Route group conflict** - `208a3cc` (fix)

## Files Created/Modified
- `apps/web/components/governance/RoundStatusBadge.tsx` - Status badge with color coding (emerald=Open, amber=Voting, gray=Closed) and stale status detection
- `apps/web/components/governance/RoundCard.tsx` - Round card with status, quorum type, dates, idea count, link to detail
- `apps/web/components/governance/IdeaList.tsx` - Client component with TanStack Query, pagination, sort controls, vote tally bars
- `apps/web/components/governance/IdeaForm.tsx` - Idea submission form with SHA-256 content hash, on-chain tx + off-chain POST
- `apps/web/components/governance/VotePanel.tsx` - Yes/No/Abstain voting with weight display, eligibility checks, vote tallies
- `apps/web/components/governance/DepositPanel.tsx` - Token deposit/withdraw with timelock countdown, balance display
- `apps/web/components/governance/VotingPowerDisplay.tsx` - Compact voting power display with deposit status
- `apps/web/app/(public)/governance/page.tsx` - Overview with "How Idea Rounds Work" 3-step explainer, stats cards, navigation
- `apps/web/app/(public)/governance/rounds/page.tsx` - Round listing with server-side Prisma data
- `apps/web/app/(public)/governance/rounds/[id]/page.tsx` - Round detail with ideas, voting, submission form
- `apps/web/app/(public)/governance/dashboard/page.tsx` - Personal governance dashboard (moved from auth group)
- `apps/web/app/(public)/governance/deposit/page.tsx` - Token deposit page with 4-step guide (moved from auth group)

## Decisions Made
- Moved dashboard and deposit pages from `(auth)/governance/` to `(public)/governance/dashboard/` and `(public)/governance/deposit/` because Next.js route groups cannot share the same URL segment across groups — Turbopack crashed with the conflict
- Client-side wallet connection check replaces server-side auth for governance authenticated pages
- Deposit page auto-triggers wallet connect modal on mount when no wallet detected

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Route group conflict resolution**
- **Found during:** Task 2 (page creation)
- **Issue:** `(auth)/governance` and `(public)/governance` route groups cannot coexist — Turbopack crashes trying to resolve the conflict
- **Fix:** Moved auth governance pages to `(public)/governance/dashboard/` and `(public)/governance/deposit/` with client-side wallet checks
- **Files modified:** Page paths changed from plan
- **Verification:** All pages render without Turbopack errors
- **Committed in:** 208a3cc

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Page paths differ from plan but functionality is identical. No scope creep.

## Issues Encountered
None beyond the auto-fixed route group conflict.

## User Setup Required
None -- pages render with graceful degradation when DATABASE_URL is not configured.

## Checkpoint Verification
- **Status:** APPROVED by user
- **Verified pages:** /governance, /governance/rounds, /governance/dashboard, /governance/deposit
- **User feedback:** Pages render correctly with dark theme, wallet integration works (Phantom detected)

## Self-Check: PASSED

All 12 files verified present. 3 commits (8622c94, c9ab5dc, 208a3cc) confirmed in git log. All pages return HTTP 200. Human checkpoint approved.

---
*Phase: 03-governance-idea-rounds*
*Completed: 2026-02-08*
