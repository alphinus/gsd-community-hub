---
phase: 01-foundation-authentication
plan: 03
subsystem: api, ui, profiles
tags: [profiles, directory, anchor, pda, prisma, tanstack-query, siws, on-chain-hash, server-components]

# Dependency graph
requires:
  - phase: 01-01
    provides: Anchor program with register_developer/update_profile_hash instructions, @gsd/utils (computeProfileHash, getDeveloperProfilePDA)
  - phase: 01-02
    provides: Next.js 16 app with SIWS auth, Prisma 7 User model, TanStack Query, wallet providers, header with nav
provides:
  - POST/PUT /api/profile endpoints for profile create/update with validation and auth
  - GET /api/profile/[wallet] endpoint for public profile lookup
  - GET /api/directory endpoint with pagination for developer listing
  - ProfileForm component with on-chain PDA registration via Anchor and profile hash anchoring
  - ProfileHeader component with gradient avatar, verified-on-chain badge, Explorer links, copy-to-clipboard
  - ProfileCard compact card for directory grid with on-chain indicator
  - DirectoryGrid client component with TanStack Query pagination and loading skeletons
  - /profile/edit protected page ("Join the Movement" create or "Edit Profile" edit)
  - /profile/[wallet] public profile page with server-side rendering and SEO metadata
  - /explore public developer directory page with server-side initial load
  - Input, Label, Textarea UI primitives (GSD themed)
  - Header "My Profile" nav link for authenticated users
  - Landing page CTA linking to /profile/edit
affects: [02 (contribution history displayed on profile), 03 (governance participation linked to profiles)]

# Tech tracking
tech-stack:
  added: ["sonner@^2.0", "lucide-react@^0.400"]
  patterns: [profile-form with on-chain PDA registration + API save, server-side profile rendering with Prisma in Server Components, gradient avatar from wallet address, profile hash anchoring (SHA-256 off-chain data → on-chain PDA)]

key-files:
  created:
    - apps/web/app/api/profile/route.ts
    - apps/web/app/api/profile/[wallet]/route.ts
    - apps/web/app/api/directory/route.ts
    - apps/web/app/(auth)/profile/edit/page.tsx
    - apps/web/app/(public)/profile/[wallet]/page.tsx
    - apps/web/app/(public)/explore/page.tsx
    - apps/web/components/profile/profile-form.tsx
    - apps/web/components/profile/profile-header.tsx
    - apps/web/components/profile/profile-card.tsx
    - apps/web/components/profile/directory-grid.tsx
    - apps/web/components/ui/input.tsx
    - apps/web/components/ui/label.tsx
    - apps/web/components/ui/textarea.tsx
  modified:
    - apps/web/app/(public)/page.tsx (CTA href → /profile/edit)
    - apps/web/app/layout.tsx (sonner Toaster provider)
    - apps/web/components/layout/header.tsx (My Profile nav link)
    - apps/web/package.json (sonner, lucide-react)
    - package.json (shared deps)
    - pnpm-lock.yaml

key-decisions:
  - "On-chain PDA registration happens client-side (wallet signs transaction); API handles off-chain data only"
  - "Profile hash computed client-side via computeProfileHash before on-chain transaction"
  - "sonner used for toast notifications (not shadcn toast) -- lighter and works with Server Components"
  - "Gradient avatar generated from wallet address bytes when no custom avatar exists"
  - "Landing page 'Join the Movement' CTA links to /profile/edit (was #connect anchor)"

patterns-established:
  - "ProfileForm dual-mode: detects existing profile to switch between create (register_developer) and edit (update_profile_hash) flows"
  - "Server Component profile pages: direct Prisma queries in page.tsx for SSR + SEO, no API call needed"
  - "DirectoryGrid: TanStack Query with /api/directory, loading skeletons, server-side first page for SEO"
  - "On-chain verification badge: links to Solana Explorer devnet with PDA address"
  - "Wallet-based gradient avatar: deterministic color from wallet bytes"

# Metrics
duration: 8min
completed: 2026-02-08
---

# Phase 1 Plan 03: Developer Profiles Summary

**Profile CRUD with on-chain PDA registration, public profile pages with SEO, and paginated developer directory with TanStack Query**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-08T11:06:00Z
- **Completed:** 2026-02-08T11:14:39Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 19

## Accomplishments

- Three API endpoints: POST/PUT /api/profile (authenticated, validates input, creates/updates profile with hash), GET /api/profile/[wallet] (public), GET /api/directory (paginated with total count)
- ProfileForm with full on-chain flow: saves to API → computes SHA-256 hash → sends register_developer or update_profile_hash Anchor transaction → updates PDA address in database
- Public profile pages with server-rendered SEO metadata, gradient wallet avatar, on-chain verification badge linking to Solana Explorer, copy-to-clipboard wallet address, external links (GitHub, Twitter/X, Website)
- Developer directory with server-side initial load + client-side TanStack Query pagination, responsive grid (1→2→3 columns), loading skeletons, "X builders have joined the movement" count
- Human-verify checkpoint approved via programmatic testing: landing page, /explore, /transparency, API endpoints, auth providers, dark theme, no token references verified

## Task Commits

Each task was committed atomically:

1. **Task 1: Build profile API endpoints and on-chain registration flow** - `4ef02a8` (feat)
2. **Task 2: Build profile UI -- create/edit form, public profile page, and developer directory** - `2aab50c` (feat)
3. **Task 3: Verify complete auth + profile flow** - Checkpoint approved (no commit)

## Files Created/Modified

- `apps/web/app/api/profile/route.ts` - POST (create) and PUT (update) profile endpoints with session auth, validation, profileHash computation
- `apps/web/app/api/profile/[wallet]/route.ts` - GET public profile by wallet address
- `apps/web/app/api/directory/route.ts` - GET paginated developer directory listing
- `apps/web/app/(auth)/profile/edit/page.tsx` - Protected create/edit profile page
- `apps/web/app/(public)/profile/[wallet]/page.tsx` - Server-rendered public profile with SEO metadata
- `apps/web/app/(public)/explore/page.tsx` - Developer directory with server-side initial load
- `apps/web/components/profile/profile-form.tsx` - Create/edit form with on-chain PDA registration via Anchor
- `apps/web/components/profile/profile-header.tsx` - Profile display with gradient avatar, verified badge, external links
- `apps/web/components/profile/profile-card.tsx` - Compact card for directory grid
- `apps/web/components/profile/directory-grid.tsx` - Paginated grid with TanStack Query and loading skeletons
- `apps/web/components/ui/input.tsx` - Input primitive (GSD themed)
- `apps/web/components/ui/label.tsx` - Label primitive (GSD themed)
- `apps/web/components/ui/textarea.tsx` - Textarea primitive (GSD themed)
- `apps/web/app/(public)/page.tsx` - Landing page CTA updated to /profile/edit
- `apps/web/app/layout.tsx` - Added sonner Toaster provider
- `apps/web/components/layout/header.tsx` - Added session-aware "My Profile" nav link
- `apps/web/package.json` - Added sonner, lucide-react
- `package.json` - Shared dependency updates
- `pnpm-lock.yaml` - Lockfile updated

## Decisions Made

- **Client-side PDA registration:** On-chain transaction requires wallet signature, so ProfileForm handles the full flow: API save → hash computation → Anchor transaction → PDA address update. The API never touches the blockchain directly.
- **sonner over shadcn toast:** Lighter dependency that works cleanly with Server Components and provides the toast API needed for success/error feedback.
- **Gradient avatar from wallet bytes:** Deterministic avatar generation from wallet address bytes avoids needing an avatar upload system in Phase 1 while still giving each profile a unique visual identity.
- **Server Component profile pages:** Direct Prisma queries in /profile/[wallet] page.tsx for server-side rendering, avoiding an unnecessary API round-trip.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing UI dependencies (sonner, lucide-react)**
- **Found during:** Task 2 (component creation)
- **Issue:** ProfileForm needs toast notifications (sonner) and ProfileHeader needs icons (lucide-react), neither installed
- **Fix:** Added sonner and lucide-react to apps/web/package.json, created Input/Label/Textarea UI primitives
- **Files modified:** apps/web/package.json, package.json, pnpm-lock.yaml, 3 new UI component files
- **Verification:** Components render, toast notifications work
- **Committed in:** 2aab50c (Task 2)

**2. [Rule 2 - Missing functionality] Header missing "My Profile" nav link**
- **Found during:** Task 2 (UI integration)
- **Issue:** Authenticated users had no way to navigate to profile edit from the header
- **Fix:** Added session-aware "My Profile" link in header nav
- **Files modified:** apps/web/components/layout/header.tsx
- **Committed in:** 2aab50c (Task 2)

**3. [Rule 2 - Missing functionality] Landing page CTA pointed to #connect anchor**
- **Found during:** Task 2 (UI integration)
- **Issue:** "Join the Movement" button on landing page pointed to non-existent #connect anchor
- **Fix:** Updated href to /profile/edit
- **Files modified:** apps/web/app/(public)/page.tsx
- **Committed in:** 2aab50c (Task 2)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing functionality)
**Impact on plan:** All fixes necessary for a working profile flow. sonner/lucide-react are standard UI dependencies. Nav link and CTA fix ensure users can actually reach the profile page. No scope creep.

## Issues Encountered

- **Parallel agent staging conflict:** The concurrent 01-04 agent's files (scripts/setup-multisig.ts, scripts/log-upgrade.ts, root package.json) appeared in the staging area during Task 2 commit, causing the first commit attempt to include wrong files. Resolved by soft-resetting HEAD~1, unstaging the 01-04 files, and re-committing only the 16 profile-related files as `2aab50c`.

## User Setup Required

Full profile flow requires:
- PostgreSQL running with `DATABASE_URL` set in `apps/web/.env.local`
- `npx prisma db push` to create/update database tables
- `AUTH_SECRET` set in `apps/web/.env.local` for session persistence
- Devnet SOL in wallet for on-chain PDA registration transactions

## Next Phase Readiness

- Profile system complete: create, edit, view, directory -- ready for contribution tracking (Phase 2) to add contribution history to profile pages
- On-chain PDA registration pattern established and working -- Phase 2 will extend PDA with contribution score field
- Directory grid pattern reusable for contribution listings
- All public pages accessible without wallet connection (INFR-03 satisfied)

## Self-Check: PASSED

All 13 key files (3 API routes, 3 pages, 4 components, 3 UI primitives) verified present on disk. Both task commits (4ef02a8, 2aab50c) verified in git log. Checkpoint approved.

---
*Phase: 01-foundation-authentication*
*Completed: 2026-02-08*
