---
phase: 06-advanced-governance
plan: 06
subsystem: ui, components, pages
tags: [react, next.js, governance, delegation, quadratic-voting, civic-pass, decay, tanstack-query, anchor]

# Dependency graph
requires:
  - phase: 06-advanced-governance
    plan: 01
    provides: "DelegationRecord PDA, GovernanceConfig with quadratic/civic/decay fields, TypeScript identity types"
  - phase: 06-advanced-governance
    plan: 02
    provides: "delegate_vote and revoke_delegation on-chain instructions"
  - phase: 06-advanced-governance
    plan: 04
    provides: "GET /api/governance/delegate endpoint, delegation helper library"
  - phase: 06-advanced-governance
    plan: 05
    provides: "Analytics, decay, and human verification API endpoints"
provides:
  - "Civic Pass configuration (lib/identity/civic.ts) with gatekeeper network addresses"
  - "DelegationPanel component for delegate/revoke on-chain transactions"
  - "DelegateCard and DelegateDirectory for browsing active delegates"
  - "QuadraticVoteDisplay showing sqrt(tokens) = vote weight formula"
  - "HumanVerificationBadge with color-coded Civic Pass status"
  - "DecayedScoreDisplay with original vs effective score and 30/60/90 day projections"
  - "/governance/delegate auth page for delegation management"
  - "/governance/delegates public directory page"
  - "Governance dashboard integration with all advanced governance components"
affects: [06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Civic Pass gatekeeper network config in dedicated identity module"
    - "On-chain transaction components follow DepositPanel pattern (useAnchorProvider, IDL import, PDA derivation)"
    - "Analytics-driven delegate directory using governance analytics API"
    - "Decay projection using shared @gsd/utils decayMultiplier for client-side computation"

key-files:
  created:
    - apps/web/lib/identity/civic.ts
    - apps/web/components/governance/DelegationPanel.tsx
    - apps/web/components/governance/DelegateCard.tsx
    - apps/web/components/governance/DelegateDirectory.tsx
    - apps/web/components/governance/QuadraticVoteDisplay.tsx
    - apps/web/components/governance/HumanVerificationBadge.tsx
    - apps/web/components/governance/DecayedScoreDisplay.tsx
    - apps/web/app/(auth)/governance/delegate/page.tsx
    - apps/web/app/(public)/governance/delegates/page.tsx
  modified:
    - apps/web/app/(public)/governance/dashboard/page.tsx

key-decisions:
  - "DelegationPanel uses useAnchorProvider + direct Program instantiation (matching DepositPanel pattern) rather than useGsdProgram hook"
  - "DelegateDirectory sources data from analytics API topDelegates (not a separate delegates endpoint)"
  - "QuadraticVoteDisplay hardcodes isQuadratic=true in dashboard integration (config toggle deferred to 06-07)"
  - "DecayedScoreDisplay computes 30/60/90 day projections client-side using shared decayMultiplier utility"

patterns-established:
  - "Civic Pass config in lib/identity/ module separate from governance components"
  - "Advanced governance dashboard section pattern: stats grid + action links"

# Metrics
duration: 5min
completed: 2026-02-09
---

# Phase 6 Plan 6: Advanced Governance Frontend Components Summary

**Delegation UI with on-chain delegate/revoke, quadratic vote weight display, Civic Pass verification badge, decay score visualization, and integrated governance dashboard**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-09T14:47:29Z
- **Completed:** 2026-02-09T14:52:44Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Civic Pass configuration with gatekeeper network addresses for liveness and ID verification
- DelegationPanel handles on-chain delegate/revoke transactions via Anchor with PDA derivation, status display, and history
- DelegateCard and DelegateDirectory provide a browsable directory of active delegates from the analytics API
- QuadraticVoteDisplay shows sqrt formula with delegation breakdown (deposit + delegated = total -> sqrt = weight)
- HumanVerificationBadge shows green/yellow/gray shield based on Civic Pass status with expiry detection
- DecayedScoreDisplay visualizes original vs effective score with decay bar and 30/60/90 day projections using shared @gsd/utils decayMultiplier
- Governance dashboard integrates all components with delegation summary and quick links to new pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Civic Pass config, DelegationPanel, DelegateCard, DelegateDirectory, and delegation pages** - `0ccd4d0` (feat)
2. **Task 2: Create QuadraticVoteDisplay, HumanVerificationBadge, DecayedScoreDisplay, and integrate with governance dashboard** - `de58f69` (feat)

## Files Created/Modified
- `apps/web/lib/identity/civic.ts` - Civic Pass gatekeeper network addresses and gateway program ID
- `apps/web/components/governance/DelegationPanel.tsx` - Client component for delegate/revoke on-chain transactions with status and history
- `apps/web/components/governance/DelegateCard.tsx` - Presentational card for delegate directory (wallet, count, amount, badge)
- `apps/web/components/governance/DelegateDirectory.tsx` - Client component fetching top delegates from analytics API with sort
- `apps/web/components/governance/QuadraticVoteDisplay.tsx` - Quadratic/linear vote weight display with formula and delegation breakdown
- `apps/web/components/governance/HumanVerificationBadge.tsx` - Civic Pass status badge with shield icons and inline variant
- `apps/web/components/governance/DecayedScoreDisplay.tsx` - Original vs decayed score with bar, projections using decayMultiplier
- `apps/web/app/(auth)/governance/delegate/page.tsx` - Protected delegation management page with panel and how-it-works section
- `apps/web/app/(public)/governance/delegates/page.tsx` - Public delegate directory page with SEO metadata and explainer
- `apps/web/app/(public)/governance/dashboard/page.tsx` - Extended with advanced governance section, quadratic display, verification badge, decay score

## Decisions Made
- DelegationPanel uses useAnchorProvider + direct Program instantiation matching the existing DepositPanel pattern rather than the useGsdProgram hook (which requires passing IDL through)
- DelegateDirectory fetches from the analytics API's topDelegates array rather than creating a new delegates-specific endpoint
- QuadraticVoteDisplay hardcodes isQuadratic=true in dashboard integration; runtime config toggle will be connected when GovernanceConfig is fetched client-side in 06-07
- DecayedScoreDisplay computes 30/60/90 day projections client-side using the shared decayMultiplier from @gsd/utils (avoiding extra API calls)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all files compiled cleanly with TypeScript (only pre-existing siws.ts and prisma.config.ts errors remain from earlier phases).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 new components ready for use in Plan 06-07 (final integration/testing)
- Delegation, quadratic, verification, and decay UIs functional with existing API endpoints
- Dashboard provides unified view of advanced governance features
- Civic Pass config ready for future gateway token integration

## Self-Check: PASSED

- [x] civic.ts exists
- [x] DelegationPanel.tsx exists
- [x] DelegateCard.tsx exists
- [x] DelegateDirectory.tsx exists
- [x] QuadraticVoteDisplay.tsx exists
- [x] HumanVerificationBadge.tsx exists
- [x] DecayedScoreDisplay.tsx exists
- [x] delegate/page.tsx (auth) exists
- [x] delegates/page.tsx (public) exists
- [x] dashboard/page.tsx updated
- [x] Commit 0ccd4d0 found
- [x] Commit de58f69 found

---
*Phase: 06-advanced-governance*
*Completed: 2026-02-09*
