---
phase: 05-gsd-framework-integration
plan: 04
subsystem: verification
tags: [anthropic-sdk, claude-api, zod, structured-outputs, proposal-analysis, governance, codebase-summary]

# Dependency graph
requires:
  - phase: 05-01
    provides: "On-chain verification state, Prisma IdeaAnalysis model, verification PDA constants"
  - phase: 05-02
    provides: "AI verification engine pattern, Anthropic SDK, Zod schemas, constants (PROPOSAL_MODEL, MAX_PROPOSAL_TOKENS)"
  - phase: 03-05
    provides: "Idea submission endpoint (POST /api/governance/rounds/[id]/ideas)"
provides:
  - "AI proposal analyzer with codebase-aware context (Claude Sonnet 4.5 + structured output)"
  - "Compact codebase summary generator (6.9KB static summary)"
  - "Async analysis trigger on idea submission (fire-and-forget)"
  - "GET /api/governance/ideas/[id]/analysis endpoint with pending/completed/unavailable states"
  - "ProposalAnalysisOutputSchema (Zod) for structured feasibility analysis"
affects: [05-05, 05-06, 05-07, 05-08]

# Tech tracking
tech-stack:
  added: []
  patterns: ["fire-and-forget async analysis on POST", "codebase-aware AI prompting with static summary", "polling-friendly API with status field"]

key-files:
  created:
    - apps/web/lib/verification/codebase-summary.ts
    - apps/web/lib/verification/proposal-analyzer.ts
    - apps/web/app/api/governance/ideas/[id]/analysis/route.ts
  modified:
    - apps/web/app/api/governance/rounds/[id]/ideas/route.ts

key-decisions:
  - "Static codebase summary (6.9KB hardcoded) rather than dynamic generation -- updated per phase, not at runtime"
  - "JSON.parse(JSON.stringify(analysis)) for Prisma 7 Json field compatibility"
  - "Temperature 0 on proposal analysis calls for consistent scoring"
  - "Analysis endpoint returns status field (pending/completed/unavailable) for polling support"

patterns-established:
  - "Fire-and-forget async pattern: analyzeProposal().catch(log) after upsert, response returns immediately"
  - "Codebase-aware AI prompting: provide compact architecture summary, not full codebase"
  - "Graceful degradation on AI failure: log error, never throw, never block user-facing operation"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 5 Plan 04: AI Proposal Analyzer Summary

**Codebase-aware AI proposal analysis with Claude Sonnet 4.5 structured output, async idea submission integration, and polling-friendly analysis retrieval endpoint**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T12:41:13Z
- **Completed:** 2026-02-09T12:45:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Built compact codebase summary generator (6.9KB) covering architecture, on-chain state, instructions, routes, types, and dependencies
- Built AI proposal analyzer calling Claude Sonnet 4.5 with ProposalAnalysisOutputSchema (feasibility, effort, impact, risk, recommendation, cost)
- Integrated async fire-and-forget analysis trigger into existing idea submission endpoint
- Created GET /api/governance/ideas/[id]/analysis endpoint with pending/completed/unavailable status

## Task Commits

Each task was committed atomically:

1. **Task 1: Create codebase summary generator and proposal analyzer** - `4257cb5` (feat)
2. **Task 2: Integrate proposal analysis with idea submission and create analysis GET endpoint** - `fa2a694` (feat)

## Files Created/Modified
- `apps/web/lib/verification/codebase-summary.ts` - Static codebase summary (6.9KB) for AI context
- `apps/web/lib/verification/proposal-analyzer.ts` - AI proposal analyzer with Zod structured output and Prisma persistence
- `apps/web/app/api/governance/ideas/[id]/analysis/route.ts` - GET endpoint for analysis retrieval with polling status
- `apps/web/app/api/governance/rounds/[id]/ideas/route.ts` - Added async analyzeProposal() trigger after idea upsert

## Decisions Made
- Static codebase summary (6.9KB hardcoded template) rather than dynamic generation to keep costs predictable and avoid runtime complexity
- Used JSON.parse(JSON.stringify(analysis)) to convert Zod-parsed output to Prisma 7's strict Json field type
- Temperature 0 on proposal analysis calls matching verification engine convention for consistent scoring
- Analysis GET endpoint returns status field ("pending", "completed", "unavailable") so clients can poll without error handling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Prisma 7 Json field type compatibility**
- **Found during:** Task 1 (Proposal analyzer implementation)
- **Issue:** Prisma 7 strict typing rejects `Record<string, unknown>` for Json fields -- type error TS2322
- **Fix:** Used `JSON.parse(JSON.stringify(analysis))` to produce a plain JSON-compatible value
- **Files modified:** apps/web/lib/verification/proposal-analyzer.ts
- **Verification:** TypeScript compilation passes with no new errors
- **Committed in:** 4257cb5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial type cast fix for Prisma 7 compatibility. No scope creep.

## Issues Encountered
None beyond the Prisma Json type issue documented above.

## User Setup Required

**Environment variable required before proposal analysis can be used:**
- `ANTHROPIC_API_KEY` - Required for Claude API access (already noted from 05-02)

## Next Phase Readiness
- Proposal analyzer is operational and ready for UI integration (ProposalAnalysis component in future plans)
- Analysis results available via GET /api/governance/ideas/[id]/analysis for frontend polling
- Codebase summary should be updated when new phases add significant architecture changes

## Self-Check: PASSED

All 4 files verified present on disk. Both task commits (4257cb5, fa2a694) verified in git log.

---
*Phase: 05-gsd-framework-integration*
*Completed: 2026-02-09*
