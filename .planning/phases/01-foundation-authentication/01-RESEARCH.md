# Phase 1: Foundation & Authentication - Research

**Researched:** 2026-02-08
**Domain:** Solana dApp scaffold with wallet authentication, on-chain identity (PDA), and multisig program governance
**Confidence:** HIGH

## Summary

Phase 1 establishes the security-first foundation for the GSD Community Hub: a Turborepo monorepo with Next.js 16 frontend, Anchor 0.32.1 on-chain programs, wallet authentication via SIWS (Sign In With Solana), on-chain developer profiles stored as PDAs, and Squads v4 multisig controlling all program upgrade authority. The phase must deliver a complete scaffold where developers can connect their wallet, authenticate, create an on-chain profile, view other profiles, and trust that the platform is transparent and secure.

The technical domain is well-established with mature libraries. The primary complexity lies in correctly integrating SIWS with Auth.js v5 for session management (a pattern that exists but requires careful wiring), designing a cost-efficient on-chain profile PDA (minimal on-chain data, rich off-chain profile in PostgreSQL), and setting up Squads multisig before any mainnet deployment. The 14-day timeline is achievable because every component has established patterns and reference implementations -- there is no novel research required, only disciplined execution of proven approaches.

**Primary recommendation:** Use the Wallet Standard `signIn` feature (not legacy `signMessage`) for SIWS authentication, store minimal identity data on-chain (wallet, bump, timestamps) with all mutable profile data (name, bio, links) in PostgreSQL, deploy to devnet first with a clear mainnet migration path once security audit is complete, and configure Squads multisig from the first devnet deployment.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Identity model:** Both personal identity + on-chain reputation -- name, bio, links combined with contribution data
- **Signer composition:** 3 core team + 2 trusted community members -- signals shared ownership from day one
- **Public changelog:** YES -- every program upgrade logged with what changed, who signed, and on-chain tx. Full transparency for skeptics. Non-negotiable trust signal
- **Trust strategy:** Work first, proof visible -- ship real product that speaks for itself, but make real adoption data easily discoverable
- **No defensive posture:** The on-chain data makes the bull case. The platform just needs to be undeniably real
- **Confidence, not desperation:** Building from a position of strength (real framework, real adoption, accumulating holders)
- **GitHub Org structure:** Platform should align with the SSOT vision -- structured repos with submission standards
- **Profile as movement:** Creating a profile = joining the GSD community. The directory is proof the community exists and is growing

### Claude's Discretion
Claude has flexibility on: pre-connect experience, session management, wallet support (Wallet Standard vs Big 3), token balance display, external links (GitHub/Twitter/X), data storage (on-chain vs off-chain tradeoff), developer directory, frontend framework, Solana program framework, repository structure, hosting, network target (devnet vs mainnet), and security transparency page. All decisions guided by: (1) proof visible trust strategy, (2) 14-day timeline, (3) community-first philosophy, (4) security-first approach.

### Deferred Ideas (OUT OF SCOPE)
- Shorts Engine -- automated content pipeline from merges/demos
- Pinboard/Showcase v1 -- auto-generated project gallery from GitHub
- Hackathon Factory -- monthly hackathons
- Team Edition / Local-host -- Docker/Compose enterprise setup
- Anti-sybil voting -- no fresh accounts without activity
- Retention bonus -- projects active after 30 days
- Community governance for token -- access/perks only if genuine utility
- Submission-based contribution model, "Best of Month" releases, automated shorts
</user_constraints>

## Discretion Recommendations

Recommendations for all areas marked as Claude's Discretion, with rationale.

### Pre-Connect Experience
**Recommendation: Open access for reading, wallet connect for writing.**
- Public pages: developer directory, profile pages, platform info, transparency page -- all accessible without wallet
- Wallet connect required only for: creating a profile, editing profile, any future write operations
- Rationale: Aligns with pitfall research showing "requiring wallet connection before showing any content bounces 80%+ of visitors." The "proof visible" strategy demands that the community's growth is visible to everyone, including skeptics who won't connect a wallet just to look around
- Show a prominent "Join the Movement" CTA encouraging wallet connect, but never gate read access

### Session Management
**Recommendation: Auth.js v5 with JWT strategy, 24-hour session expiry, silent refresh.**
- JWT stored in HTTP-only secure cookie (not localStorage -- prevents XSS)
- Session contains: wallet public key (as user ID), session expiry
- 24-hour expiry balances security (not indefinite) and convenience (not every page load)
- `AUTH_SECRET` environment variable for JWT encryption
- Rationale: dApp users expect persistence across browser refreshes (AUTH-03) but not indefinite sessions. 24 hours matches typical dApp usage patterns. JWT strategy avoids database session lookups on every request

### Wallet Support
**Recommendation: Wallet Standard with empty wallets array (auto-detect all compliant wallets).**
- Pass `wallets={[]}` to `WalletProvider` -- this auto-detects all Wallet Standard-compliant wallets installed by the user
- Phantom, Solflare, and Backpack all support Wallet Standard and will appear automatically
- No need to import individual wallet adapters (PhantomWalletAdapter, etc.) -- Wallet Standard handles this
- Rationale: Wallet Standard is the modern approach. It reduces bundle size, eliminates supply chain attack surface from wallet adapter packages, and future-proofs against new wallets. All three target wallets (Phantom, Solflare, Backpack) already support Wallet Standard. The official Solana guide now recommends this approach

### Token Balance Display
**Recommendation: NO token balance display in Phase 1.**
- Phase 1 is explicitly token-optional (INFR-03). Showing $GSD balance contradicts this
- Displaying token balance in Phase 1 signals "this is about the token" before the platform has proven its utility
- When token integration arrives (Phase 3), add balance display in the governance section where it has functional meaning (voting weight)
- Rationale: Aligns with pitfall research on premature token integration (Pitfall #9) and the "utility first" principle. The platform must prove its value before introducing token signals

### External Links
**Recommendation: YES -- allow GitHub and Twitter/X links on developer profiles.**
- GitHub link is essential: bridges the developer identity between on-chain profile and code contributions
- Twitter/X link is valuable: connects the crypto identity to social presence, enables community discovery
- Optional website/portfolio link: let developers showcase their work
- All links stored off-chain (PostgreSQL), not on-chain -- mutable, zero gas cost
- Rationale: The community bridges crypto and developer worlds. GitHub proves dev credibility. Twitter/X connects social identity. Both serve the "proof visible" strategy by making the community discoverable across platforms

### Data Storage (On-Chain vs Off-Chain)
**Recommendation: Minimal on-chain PDA (immutable identity anchor) + rich off-chain profile (PostgreSQL).**

**On-chain (PDA -- ~73 bytes, ~0.001 SOL rent):**
- `authority` (Pubkey, 32 bytes) -- wallet that owns this profile
- `bump` (u8, 1 byte) -- PDA canonical bump
- `created_at` (i64, 8 bytes) -- profile creation timestamp
- `updated_at` (i64, 8 bytes) -- last on-chain update timestamp
- `profile_hash` (32 bytes) -- SHA-256 hash of off-chain profile for integrity verification
- Discriminator: 8 bytes (Anchor automatic)

**Off-chain (PostgreSQL):**
- `display_name` (String, max 50 chars)
- `bio` (String, max 500 chars)
- `avatar_url` (String, optional)
- `github_url` (String, optional)
- `twitter_url` (String, optional)
- `website_url` (String, optional)
- `wallet_address` (String, indexed -- links to on-chain PDA)
- `profile_hash` (String -- matches on-chain hash for integrity check)
- `created_at`, `updated_at` timestamps

**Rationale:** Storing display_name and bio on-chain would cost 4+50+4+500 = 558 additional bytes per profile (~0.004 SOL). At 10,000 developers = 40 SOL locked in rent. More importantly, every name/bio edit requires an on-chain transaction (~0.000005 SOL + user friction). Off-chain storage is free to update and provides better UX. The on-chain PDA proves "this wallet registered at this time" and the profile_hash enables anyone to verify the off-chain data hasn't been tampered with. This is the Content Hash Anchoring pattern from the architecture research.

### Developer Directory
**Recommendation: YES -- build a public, browsable developer directory.**
- Grid/list view of all registered developers with name, avatar, wallet address (truncated), join date
- Filterable/searchable by name
- Publicly accessible (no wallet required to browse)
- Shows total member count prominently
- Rationale: Directly serves "Profile as movement" (locked decision) and "proof visible" strategy. A growing developer count displayed publicly is the simplest proof that the community exists. This is the single most important "alive, not a ghost town" signal for Phase 1. Minimal implementation cost (one page + one API endpoint)

### Frontend Framework
**Recommendation: Next.js 16 with App Router, Tailwind CSS 4, shadcn/ui.**
- Next.js 16 is the latest stable release with Turbopack as default bundler
- App Router with React Server Components for SEO-friendly public pages (directory, profiles)
- API Routes handle SIWS backend verification
- Tailwind CSS 4 + shadcn/ui for accessible, customizable components without heavy CSS-in-JS
- Rationale: Dominant choice in Solana dApp ecosystem. Server-side rendering matters for public profile pages (SEO, social sharing). API routes eliminate need for separate backend. Well-documented with multiple Solana-specific reference implementations

### Solana Program Framework
**Recommendation: Anchor 0.32.1.**
- Automatic account validation (ownership checks, signer checks)
- IDL generation for type-safe TypeScript client
- `InitSpace` derive macro for automatic account size calculation
- Security macros prevent common vulnerabilities (missing owner checks, missing signer checks)
- Rationale: Native Rust would require manual serialization, validation, and error handling that Anchor automates. The 14-day timeline demands development speed. Anchor's security macros are critical for a "security-first" phase. 0.32.1 is the latest stable release

### Repository Structure
**Recommendation: Turborepo monorepo with pnpm workspaces.**
```
gsd-community-hub/
  apps/
    web/              # Next.js 16 frontend + API routes
  programs/
    gsd-hub/          # Anchor program workspace
  packages/
    types/            # Shared TypeScript types (IDL types, API types)
    utils/            # Shared utilities
  turbo.json
  pnpm-workspace.yaml
  Anchor.toml
  Cargo.toml
  rust-toolchain.toml # Pin Rust version
```
- Rationale: Single repo enables atomic changes across frontend and program, shared types prevent drift, Turborepo caches builds for fast iteration. Matches the Solana Developers reference implementation structure. pnpm provides strict dependency resolution and workspace support

### Hosting
**Recommendation: Vercel for Phase 1 (iteration speed), plan for decentralization later.**
- Vercel provides native Next.js hosting, automatic preview deployments, edge functions
- Free tier sufficient for development and early launch
- Environment variables for RPC URLs, program IDs, database connection
- Rationale: 14-day timeline demands fast iteration. Vercel deploys on every push. Decentralized hosting (IPFS, Arweave) can be evaluated in later phases once the platform has proven its value. The code itself is open source (INFR-01), which is the primary trust mechanism -- where it's hosted is secondary

### Network Target
**Recommendation: Devnet-first with mainnet migration after audit.**
- All Phase 1 development and initial deployment on devnet
- Mainnet deployment requires: security audit completion (INFR-02), Squads multisig configured with 5 signers, community announcement
- Use separate keypairs for devnet and mainnet (never share keys)
- Design all code to be network-agnostic (RPC endpoint from environment variable)
- Rationale: "Security-first" phase demands caution. Devnet allows rapid iteration with free SOL. Mainnet deployment with a security vulnerability would be catastrophic for trust. The public changelog requirement (locked decision) means every program upgrade is visible -- first mainnet deploy must be clean

### Security Transparency Page
**Recommendation: YES -- build a dedicated /transparency page.**
- Show: multisig address, member addresses (labeled by role), threshold (3-of-5), program IDs
- Show: public changelog (every program upgrade with what changed, who signed, tx link)
- Show: link to open source repo, link to security audit (when complete)
- Show: network status (devnet/mainnet), deployment timestamps
- Publicly accessible (no wallet required)
- Rationale: Directly serves the "proof visible" strategy and the locked "public changelog" decision. For a community with rug fear, a transparency page is not a nice-to-have -- it's the single most important trust signal after open source code. Cost: one static page with on-chain data reads

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.x | Full-stack React framework | App Router, RSC, API routes, Turbopack default. Dominant in Solana dApp ecosystem |
| React | 19.x | UI library | Required by Next.js 16. Server Components, Suspense, Actions |
| TypeScript | 5.7+ | Type safety | Non-negotiable for on-chain interactions. Anchor IDL types provide end-to-end safety |
| Anchor | 0.32.1 | Solana program framework | IDL generation, automatic validation, TypeScript client. Latest stable release |
| Rust | 1.91.1 | Program language | Required by Solana runtime. Pin via rust-toolchain.toml |
| @solana/web3.js | 1.x | Solana RPC client | Anchor 0.32.1 only supports v1. Hard constraint |
| @coral-xyz/anchor | 0.32.1 | Anchor TypeScript client | Auto-generated program clients from IDL |
| @solana/wallet-adapter-react | 0.15.x | Wallet connection hooks | useWallet(), useConnection(), useAnchorWallet() |
| @solana/wallet-adapter-react-ui | 0.9.x | Wallet UI components | Pre-built connect button, wallet modal |
| Auth.js (next-auth) | 5.x | Session management | JWT sessions, credentials provider for SIWS |
| Tailwind CSS | 4.x | Styling | Zero-config with Next.js 16, @theme directive |
| shadcn/ui | latest | Component library | Copy-paste Radix-based components. Accessible, customizable |
| PostgreSQL | 16+ | Off-chain database | Profiles, cached data. Relational model fits domain |
| Prisma | 6.x | ORM | Type-safe queries, migrations, generated types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/wallet-standard-util | 1.1.x | SIWS verification | verifySignIn() for server-side signature validation |
| @solana/wallet-standard-features | 1.1.x | SIWS types | SolanaSignInInput/Output type definitions |
| @sqds/multisig | 2.1.x | Squads SDK | Creating multisig, managing members, proposing transactions |
| Zustand | 5.x | Client state | UI state, wallet connection state |
| TanStack Query | 5.x | Server/async state | Caching RPC calls, profile data fetching |
| bs58 | latest | Base58 encoding | Solana address encoding/decoding |
| tweetnacl | latest | Cryptography | ed25519 signature verification (SIWS fallback) |
| Turborepo | latest | Monorepo builds | Build caching, task orchestration |
| pnpm | latest | Package manager | Strict deps, workspace support |
| Vitest | 4.x | Frontend testing | Unit/integration tests |
| solana-bankrun | latest | Program testing | Fast program tests without validator |
| anchor-bankrun | latest | Anchor + bankrun | startAnchor() for test environment |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Auth.js v5 (next-auth) | Custom JWT implementation | Auth.js handles CSRF, session rotation, middleware. Custom = more control but more security risk in DIY code |
| Wallet Standard auto-detect | Manual wallet adapter imports | Manual gives explicit control but adds bundle size and maintenance burden for each wallet |
| PostgreSQL + Prisma | Drizzle ORM | Drizzle is lighter but Prisma's migration system and Studio UI are more mature for team projects |
| Vercel | Self-hosted / Cloudflare Pages | Self-hosted gives more control but adds ops burden. Vercel optimized for Next.js |

**Installation:**
```bash
# Frontend (in apps/web/)
pnpm add next@16 react@19 react-dom@19
pnpm add @solana/web3.js@1 @coral-xyz/anchor@0.32.1
pnpm add @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
pnpm add @solana/wallet-standard-features @solana/wallet-standard-util
pnpm add next-auth@5
pnpm add @prisma/client
pnpm add zustand@5 @tanstack/react-query@5
pnpm add bs58 tweetnacl

# Frontend dev dependencies
pnpm add -D typescript @types/react @types/node
pnpm add -D tailwindcss@4 @tailwindcss/postcss postcss
pnpm add -D prisma
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
pnpm add -D eslint prettier

# shadcn/ui (in apps/web/)
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu input label tabs toast avatar

# Anchor program testing
pnpm add -D solana-bankrun anchor-bankrun

# Squads SDK
pnpm add @sqds/multisig

# System-level tooling
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.32.1 && avm use 0.32.1
```

## Architecture Patterns

### Recommended Project Structure
```
gsd-community-hub/
  apps/
    web/
      app/
        (public)/              # No auth required
          page.tsx             # Landing page
          explore/
            page.tsx           # Developer directory
          profile/
              [wallet]/
                page.tsx       # Public profile view
          transparency/
            page.tsx           # Transparency/security page
        (auth)/                # Auth required (middleware protected)
          dashboard/
            page.tsx           # User dashboard
          profile/
            edit/
              page.tsx         # Edit own profile
        api/
          auth/
            [...nextauth]/
              route.ts         # Auth.js handlers
          profile/
            route.ts           # Profile CRUD
            [wallet]/
              route.ts         # Get profile by wallet
          directory/
            route.ts           # Developer directory endpoint
        layout.tsx             # Root layout with providers
        providers.tsx          # Client providers (wallet, query, etc.)
      components/
        ui/                    # shadcn/ui components
        wallet/                # Wallet connection components
        profile/               # Profile display/edit components
        layout/                # Header, footer, navigation
      lib/
        anchor/                # Anchor client setup, program hooks
        solana/                # Solana helpers (connection, PDA derivation)
        db/                    # Prisma client singleton
        auth/                  # Auth configuration
      prisma/
        schema.prisma          # Database schema
        migrations/            # Prisma migrations
      anchor-idl/              # Generated IDL files
  programs/
    gsd-hub/
      src/
        lib.rs                 # Program entry, declare_id!
        state/
          mod.rs
          developer.rs         # Developer profile PDA
        instructions/
          mod.rs
          register.rs          # Create developer profile
          update_hash.rs       # Update profile hash
        errors.rs              # Custom error codes
      tests/
        register.test.ts       # Profile creation tests
  packages/
    types/
      src/
        idl.ts                 # Auto-generated IDL types
        api.ts                 # API request/response types
        profile.ts             # Profile domain types
    utils/
      src/
        pda.ts                 # PDA derivation helpers
        hash.ts                # SHA-256 hashing for profiles
  turbo.json
  pnpm-workspace.yaml
  Anchor.toml
  Cargo.toml
  rust-toolchain.toml
```

### Pattern 1: SIWS Authentication Flow (Wallet Standard signIn)
**What:** One-click wallet authentication using the Wallet Standard `signIn` feature, replacing the legacy two-step connect+signMessage flow.
**When to use:** Every authentication event (initial sign-in, session refresh).

```
User clicks "Sign In"
    |
    v
Frontend: check if wallet supports signIn feature
    |
    v
Frontend: fetch SolanaSignInInput from backend API
    (contains: domain, statement, nonce, issuedAt)
    |
    v
Wallet: constructs standardized SIWS message
    Wallet: displays message to user
    User: approves sign-in
    |
    v
Wallet returns SolanaSignInOutput:
    { account, signedMessage, signature }
    |
    v
Frontend: POST to /api/auth/callback/credentials
    with { message: signedMessage, signature, publicKey }
    |
    v
Backend (Auth.js CredentialsProvider):
    1. verifySignIn(input, output) via @solana/wallet-standard-util
    2. Verify domain matches NEXTAUTH_URL
    3. Verify nonce matches CSRF token
    4. Signature valid? -> Create JWT session
    |
    v
JWT cookie set (HTTP-only, secure, 24h expiry)
Session contains: { publicKey, iat, exp }
```

**Key code (Auth.js v5 configuration):**
```typescript
// auth.ts (root-level config)
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { verifySignIn } from "@solana/wallet-standard-util"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Solana",
      credentials: {
        message: { type: "text" },
        signature: { type: "text" },
        publicKey: { type: "text" },
      },
      async authorize(credentials) {
        // Verify SIWS signature
        // Return { id: publicKey } on success, null on failure
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.publicKey = user.id
      return token
    },
    async session({ session, token }) {
      session.publicKey = token.publicKey as string
      return session
    },
  },
})
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Pattern 2: PDA-Based Developer Identity
**What:** One deterministic PDA per wallet storing minimal on-chain identity, with rich profile data off-chain.
**When to use:** Developer registration, profile verification, directory listing.

```rust
// programs/gsd-hub/src/state/developer.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DeveloperProfile {
    pub authority: Pubkey,           // 32 bytes - wallet owner
    pub bump: u8,                    // 1 byte - canonical bump
    pub created_at: i64,             // 8 bytes - unix timestamp
    pub updated_at: i64,             // 8 bytes - last update
    pub profile_hash: [u8; 32],      // 32 bytes - SHA-256 of off-chain data
}
// Total: 8 (discriminator) + 81 = 89 bytes
// Rent: ~0.00114 SOL
```

```rust
// programs/gsd-hub/src/instructions/register.rs
use anchor_lang::prelude::*;
use crate::state::DeveloperProfile;

#[derive(Accounts)]
pub struct RegisterDeveloper<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DeveloperProfile::INIT_SPACE,
        seeds = [b"developer", authority.key().as_ref()],
        bump
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterDeveloper>, profile_hash: [u8; 32]) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    profile.authority = ctx.accounts.authority.key();
    profile.bump = ctx.bumps.developer_profile;
    profile.created_at = Clock::get()?.unix_timestamp;
    profile.updated_at = Clock::get()?.unix_timestamp;
    profile.profile_hash = profile_hash;
    Ok(())
}
```

**PDA derivation on client:**
```typescript
// packages/utils/src/pda.ts
import { PublicKey } from "@solana/web3.js"

export function getDeveloperProfilePDA(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("developer"), wallet.toBuffer()],
    programId
  )
}
```

### Pattern 3: Content Hash Anchoring (Off-Chain Profile + On-Chain Verification)
**What:** Store full profile data in PostgreSQL, store SHA-256 hash on-chain for integrity verification.
**When to use:** Any mutable data too large or frequently updated for on-chain storage.

```typescript
// packages/utils/src/hash.ts
export async function computeProfileHash(profile: {
  displayName: string
  bio: string
  githubUrl?: string
  twitterUrl?: string
  websiteUrl?: string
}): Promise<Uint8Array> {
  // Deterministic JSON serialization (sorted keys)
  const canonical = JSON.stringify(profile, Object.keys(profile).sort())
  const encoded = new TextEncoder().encode(canonical)
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded)
  return new Uint8Array(hashBuffer)
}
```

**Verification flow:**
1. User updates profile in UI -> saves to PostgreSQL
2. Frontend computes SHA-256 of new profile data
3. Frontend sends `update_hash` transaction to on-chain program
4. Anyone can verify: fetch off-chain profile, compute hash, compare with on-chain hash

### Pattern 4: Squads Multisig Upgrade Authority
**What:** Program upgrade authority is a Squads v4 multisig, not a single wallet.
**When to use:** Every program deployment on every network (including devnet).

**Setup process:**
1. Create Squads multisig with 5 members (3 core team + 2 community), threshold 3-of-5
2. Deploy program initially with developer wallet as upgrade authority
3. Transfer upgrade authority to Squads multisig vault PDA using Safe Authority Transfer (SAT)
4. Verify on-chain that upgrade authority = Squads vault PDA
5. Document multisig address, member addresses, threshold on /transparency page

**For CI/CD automated upgrades:**
```yaml
# GitHub Actions (future - Phase 1 uses manual deployment)
- uses: Squads-Protocol/squads-v4-program-upgrade@beta
  with:
    network-url: "https://api.devnet.solana.com"
    multisig-pda: ${{ secrets.SQUADS_MULTISIG_PDA }}
    program-id: ${{ secrets.PROGRAM_ID }}
    keypair: ${{ secrets.DEPLOYER_KEYPAIR }}
```

### Pattern 5: Wallet Provider Setup (Next.js App Router)
**What:** Client-side wallet context wrapping the entire application.
**When to use:** Root layout provider setup.

```tsx
// apps/web/app/providers.tsx
"use client"

import { FC, ReactNode, useMemo } from "react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
import "@solana/wallet-adapter-react-ui/styles.css"

export const AppProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet"),
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

Key: `wallets={[]}` enables Wallet Standard auto-detection. All compliant wallets (Phantom, Solflare, Backpack, etc.) appear automatically.

### Anti-Patterns to Avoid
- **Storing display_name/bio on-chain:** 558+ bytes per profile. Use PostgreSQL with on-chain hash verification instead
- **Using signMessage instead of signIn:** Legacy pattern. signIn is standardized, shifts message construction to wallet (safer), and provides one-click UX
- **Single wallet upgrade authority:** Even on devnet, practice with multisig. Never deploy to mainnet with single key
- **Polling RPC for profile changes:** Use TanStack Query with appropriate stale times. Future phases will add webhooks
- **Importing individual wallet adapters:** Wallet Standard auto-detect eliminates need for PhantomWalletAdapter, SolflareWalletAdapter, etc.
- **Using Pages Router:** App Router is the standard since Next.js 13. All new features target App Router only
- **Storing sessions in localStorage:** Use HTTP-only cookies via Auth.js for security (prevents XSS-based session theft)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wallet connection UI | Custom wallet modal, adapter management | @solana/wallet-adapter-react-ui WalletMultiButton | Battle-tested across hundreds of dApps, handles edge cases (disconnect, switch, mobile) |
| Session management | Custom JWT implementation with cookie handling | Auth.js v5 with Credentials provider | CSRF protection, session rotation, middleware guards, secure cookie handling all built in |
| SIWS message format | Custom message construction and verification | @solana/wallet-standard-features signIn + @solana/wallet-standard-util verifySignIn | Standard format prevents phishing, wallet validates domain, consistent UX |
| PDA derivation + validation | Manual seed hashing and bump management | Anchor's seeds/bump constraints with InitSpace | Anchor auto-validates ownership, derivation, and space. Manual = security vulnerabilities |
| Database migrations | Manual SQL scripts | Prisma migrate | Type-safe schema changes, rollback support, team coordination |
| Component library | Custom buttons, modals, forms from scratch | shadcn/ui (Radix-based) | Accessible, keyboard-navigable, styled with Tailwind. Copy-paste = you own the code |
| Multisig management | Custom multisig program | Squads Protocol v4 | Secures $10B+ on Solana. Audited, battle-tested, has CLI and SDK |

**Key insight:** The 14-day timeline leaves zero room for custom implementations of solved problems. Every hour spent building custom wallet connection, session management, or component UI is an hour not spent on the actual differentiating features.

## Common Pitfalls

### Pitfall 1: Node.js Polyfill Issues with Solana Libraries in Next.js
**What goes wrong:** `@solana/web3.js` and Anchor rely on Node.js built-ins (Buffer, crypto, stream) that are not available in browser environments. Next.js 16 with Turbopack may not resolve these automatically.
**Why it happens:** web3.js v1 was designed for Node.js and uses node-native modules. Turbopack's resolve behavior differs from webpack.
**How to avoid:**
- Use `resolveAlias` in `next.config.ts` turbopack section to alias missing Node.js modules
- Add `buffer` package as a dependency and ensure it's available globally
- If Turbopack fails, fallback aliases can be configured via the turbopack config
- Test the build early -- don't wait until end of sprint to discover polyfill issues
**Warning signs:** "Module not found: Can't resolve 'buffer'" or "'crypto' is not available" errors at build time.

### Pitfall 2: Auth.js v5 Breaking Changes from v4 Examples
**What goes wrong:** Most SIWS + NextAuth tutorials use v4 patterns (pages/api/auth/[...nextauth].ts, getServerSession, NEXTAUTH_SECRET). Auth.js v5 has breaking changes: new auth() function, AUTH_ env prefix, @auth/ adapter scope, different import paths.
**Why it happens:** v5 is relatively new. Most search results and tutorials still reference v4.
**How to avoid:**
- Use the root-level `auth.ts` pattern (not pages/api/)
- Export `{ auth, handlers, signIn, signOut }` from auth.ts
- Use `AUTH_SECRET` not `NEXTAUTH_SECRET`
- Use `auth()` not `getServerSession(authOptions)` in server components
- Reference the official migration guide at authjs.dev/getting-started/migrating-to-v5
**Warning signs:** "getServerSession is not a function" errors, cookie prefix mismatches (next-auth vs authjs).

### Pitfall 3: Anchor Account Space Miscalculation
**What goes wrong:** Account created with wrong space, either wasting SOL (too large) or failing at runtime (too small). Anchor's discriminator (8 bytes) is commonly forgotten.
**Why it happens:** Manual space calculation errors. Forgetting the 8-byte discriminator. Not accounting for String/Vec length prefix (4 bytes each).
**How to avoid:**
- Always use `#[derive(InitSpace)]` on account structs
- Always use `space = 8 + AccountStruct::INIT_SPACE` in the init constraint
- Use `#[max_len(N)]` attribute for String and Vec fields
- Test account creation on devnet and verify account size matches expectations
**Warning signs:** "Account data too small" errors at runtime, or unexplained high rent costs.

### Pitfall 4: SIWS Nonce Replay Attacks
**What goes wrong:** An attacker captures a signed SIWS message and replays it to authenticate as the victim. Without nonce verification, the same signature can be used indefinitely.
**Why it happens:** Developers skip nonce generation/verification or use predictable nonces.
**How to avoid:**
- Use Auth.js CSRF token as the SIWS nonce (built-in, unique per session)
- Verify nonce server-side before accepting signature
- Include `issuedAt` and `expirationTime` in SolanaSignInInput
- Nonces must be single-use: consumed on verification
**Warning signs:** Same wallet authenticates from different IPs simultaneously, auth succeeds without fresh nonce request.

### Pitfall 5: PDA Bump Seed Security
**What goes wrong:** Program accepts user-provided bump seeds instead of deriving canonical bumps, allowing an attacker to derive a different PDA than expected.
**Why it happens:** Developer confusion about bumps, or optimizing for compute units by skipping derivation.
**How to avoid:**
- Always use Anchor's `bump` constraint (auto-derives canonical bump)
- Never accept bump as instruction data from the client
- Store the canonical bump in the account struct and verify on subsequent accesses
- Use `seeds::program` if deriving PDAs for other programs
**Warning signs:** Accounts appearing at unexpected addresses, or the same "user" mapping to multiple PDAs.

### Pitfall 6: Squads Multisig Key Management
**What goes wrong:** One of the 5 multisig signers loses their key, reducing effective signer pool. Or, a signer's key is compromised, potentially enabling 3-of-5 threshold with only 2 honest signers.
**Why it happens:** Key management is hard. Hardware wallets get lost. People forget passphrases.
**How to avoid:**
- All 5 signers must use hardware wallets (Ledger) or equivalent cold storage
- Document key recovery procedures for each signer
- Plan for key rotation: Squads supports member replacement via config transaction
- Never have more than 2 signers from the same organization
- Start with a lower-stakes devnet multisig to practice the signing flow before mainnet
**Warning signs:** Signers unable to sign transactions in a timely manner, emergency situations with insufficient available signers.

## Code Examples

### Prisma Schema for Developer Profiles
```prisma
// apps/web/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  walletAddress String   @unique
  displayName   String?  @db.VarChar(50)
  bio           String?  @db.VarChar(500)
  avatarUrl     String?
  githubUrl     String?
  twitterUrl    String?
  websiteUrl    String?
  profileHash   String?  // SHA-256 hash matching on-chain PDA
  onChainPda    String?  // PDA address for quick lookup
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([walletAddress])
}
```

### Environment Variables
```bash
# apps/web/.env.local
AUTH_SECRET="<openssl rand -hex 32>"
AUTH_URL="http://localhost:3000"

NEXT_PUBLIC_RPC_URL="https://api.devnet.solana.com"
NEXT_PUBLIC_PROGRAM_ID="<deployed program ID>"
NEXT_PUBLIC_NETWORK="devnet"

DATABASE_URL="postgresql://user:password@localhost:5432/gsd_hub"

# Future: Helius RPC for production
# NEXT_PUBLIC_RPC_URL="https://devnet.helius-rpc.com/?api-key=YOUR_KEY"
```

### Next.js Middleware for Auth Protection
```typescript
// apps/web/middleware.ts
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/(auth)/:path*", "/api/profile/:path*"],
}
```

### Anchor Program Entry Point
```rust
// programs/gsd-hub/src/lib.rs
use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

declare_id!("GSDHubProgramID11111111111111111111111111111");

#[program]
pub mod gsd_hub {
    use super::*;

    pub fn register_developer(
        ctx: Context<RegisterDeveloper>,
        profile_hash: [u8; 32],
    ) -> Result<()> {
        instructions::register::handler(ctx, profile_hash)
    }

    pub fn update_profile_hash(
        ctx: Context<UpdateProfileHash>,
        new_hash: [u8; 32],
    ) -> Result<()> {
        instructions::update_hash::handler(ctx, new_hash)
    }
}
```

### Update Profile Hash Instruction
```rust
// programs/gsd-hub/src/instructions/update_hash.rs
use anchor_lang::prelude::*;
use crate::state::DeveloperProfile;

#[derive(Accounts)]
pub struct UpdateProfileHash<'info> {
    #[account(
        mut,
        seeds = [b"developer", authority.key().as_ref()],
        bump = developer_profile.bump,
        has_one = authority,
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateProfileHash>, new_hash: [u8; 32]) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    profile.profile_hash = new_hash;
    profile.updated_at = Clock::get()?.unix_timestamp;
    Ok(())
}
```

### Anchor Test Example
```typescript
// programs/gsd-hub/tests/register.test.ts
import { startAnchor } from "anchor-bankrun"
import { Program } from "@coral-xyz/anchor"
import { PublicKey, Keypair } from "@solana/web3.js"
import { BankrunProvider } from "anchor-bankrun"
import { GsdHub } from "../target/types/gsd_hub"

describe("Developer Registration", () => {
  it("creates a developer profile PDA", async () => {
    const context = await startAnchor(".", [], [])
    const provider = new BankrunProvider(context)
    const program = new Program<GsdHub>(IDL, provider)
    const authority = provider.wallet.publicKey

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), authority.toBuffer()],
      program.programId
    )

    const profileHash = new Uint8Array(32).fill(1) // test hash

    await program.methods
      .registerDeveloper(Array.from(profileHash))
      .accounts({
        developerProfile: profilePda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    const account = await program.account.developerProfile.fetch(profilePda)
    expect(account.authority.toBase58()).toBe(authority.toBase58())
    expect(account.profileHash).toEqual(Array.from(profileHash))
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| connect + signMessage | Wallet Standard signIn | 2023 (Phantom v23.11) | One-click auth, wallet constructs message (safer), standardized format |
| @solana/web3.js v2 (Kit) | @solana/web3.js v1 (with Anchor) | Ongoing transition | Must use v1 until Anchor supports Kit. Plan migration path |
| getServerSession(authOptions) | auth() function | Auth.js v5 (2024) | Simpler API, App Router native, edge-compatible |
| NEXTAUTH_SECRET | AUTH_SECRET | Auth.js v5 | All env vars use AUTH_ prefix |
| @next-auth/prisma-adapter | @auth/prisma-adapter | Auth.js v5 | Scope change from next-auth to auth |
| Manual webpack polyfills | Turbopack resolveAlias | Next.js 16 (2025) | Turbopack replaces webpack. Config syntax different |
| Individual wallet imports | Wallet Standard auto-detect | 2023+ | wallets={[]} detects all compliant wallets. Less code, smaller bundle |
| Pages Router | App Router | Next.js 13+ (2023) | Server Components, Suspense, streaming. All new features here |

**Deprecated/outdated:**
- `@project-serum/anchor` -- use `@coral-xyz/anchor`
- Pages Router patterns -- use App Router exclusively
- `getServerSession` / `getToken` from next-auth -- use `auth()` from Auth.js v5
- Manual wallet adapter imports for Phantom/Solflare/Backpack -- Wallet Standard handles this
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` -- use `AUTH_SECRET` / `AUTH_URL`
- webpack fallback configurations -- use Turbopack resolveAlias

## Open Questions

1. **Turbopack + Solana web3.js polyfills**
   - What we know: web3.js v1 needs Node.js polyfills (Buffer, crypto). Turbopack supports resolveAlias but specific Solana configurations are underdocumented for Next.js 16
   - What's unclear: Exact resolveAlias configuration needed. Whether web3.js v1 works out-of-box with Turbopack or needs manual configuration
   - Recommendation: Test early in scaffolding. If Turbopack fails, try `turbopack: false` fallback to webpack temporarily, then fix properly. Document the working config

2. **Auth.js v5 Credentials Provider + SIWS Integration**
   - What we know: Auth.js v5 supports Credentials provider. Phantom's SIWS demo uses wallet-standard signIn. verifySignIn() from @solana/wallet-standard-util handles verification
   - What's unclear: Whether Auth.js v5's Credentials provider works seamlessly with the wallet-standard SolanaSignInOutput types (most examples use v4 patterns)
   - Recommendation: Build a minimal proof-of-concept early (day 1-2). The integration is conceptually simple but the type wiring between wallet-standard and Auth.js may need adapter code

3. **Squads v4 Devnet Setup**
   - What we know: Squads v4 program and accounts exist on devnet. SDK (@sqds/multisig) supports creating multisigs programmatically
   - What's unclear: Whether all 5 proposed signers can be set up on devnet immediately, or if initial devnet deployment uses a simpler multisig (e.g., 2-of-3) for iteration speed
   - Recommendation: Start with 2-of-3 devnet multisig for development velocity, expand to 3-of-5 before mainnet. Document the expansion process

4. **Profile Hash Determinism**
   - What we know: SHA-256 of JSON profile data stored on-chain for integrity verification
   - What's unclear: Whether JSON.stringify with sorted keys produces identical output across all JavaScript engines (edge cases with Unicode, undefined values)
   - Recommendation: Define a strict canonical serialization format. Test across Node.js and browser environments. Consider using a more deterministic serialization like protobuf or CBOR if JSON proves unreliable

## Sources

### Primary (HIGH confidence)
- [Anchor Framework Docs](https://www.anchor-lang.com/docs) -- PDA constraints, InitSpace, program structure
- [Anchor Space Reference](https://www.anchor-lang.com/docs/references/space) -- Account size calculation, type sizes
- [Solana PDA Documentation](https://solana.com/docs/core/pda) -- PDA derivation, canonical bumps
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5) -- Breaking changes, new patterns
- [Phantom SIWS Guide](https://phantom.com/learn/developers/sign-in-with-solana) -- signIn method, Wallet Standard integration
- [Phantom SIWS GitHub](https://github.com/phantom/sign-in-with-solana) -- SolanaSignInInput/Output types, verifySignIn usage
- [Solana Wallet Adapter Guide](https://solana.com/developers/guides/wallets/add-solana-wallet-adapter-to-nextjs) -- Next.js App Router provider setup
- [Squads Documentation](https://docs.squads.so/main) -- Multisig creation, program upgrades, CLI commands
- [Squads v4 Program Upgrade Action](https://github.com/Squads-Protocol/squads-v4-program-upgrade) -- CI/CD program deployment
- [Next.js Turbopack Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack) -- resolveAlias, rules, resolveExtensions
- [QuickNode SIWS + NextAuth Guide](https://www.quicknode.com/guides/solana-development/dapps/how-to-authenticate-users-with-a-solana-wallet) -- Full implementation with code

### Secondary (MEDIUM confidence)
- [Blocksmith Labs solana-next-auth](https://github.com/Blocksmith-Labs/solana-next-auth) -- NextAuth + SIWS reference implementation
- [SIWS Specification (web3auth)](https://siws.web3auth.io/) -- CAIP-74 compliance, message format ABNF
- [Chainstack: Anchor Accounts, Seeds, Bumps, PDAs](https://chainstack.com/solana-anchor-accounts-seeds-bumps-pdas-and-how-the-client-really-works/) -- Comprehensive PDA tutorial
- [Helius: PDA Guide](https://www.helius.dev/blog/solana-pda) -- PDA best practices 2026

### Tertiary (LOW confidence -- needs validation)
- Turbopack + Solana web3.js v1 polyfill configuration -- limited documentation. Needs hands-on testing
- Auth.js v5 + Wallet Standard signIn type compatibility -- most examples use v4 patterns. Integration untested in this specific combination

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm, official docs, and GitHub releases. Version compatibility confirmed
- Architecture: HIGH -- PDA patterns, SIWS flow, and content-hash anchoring are well-documented established patterns
- Pitfalls: HIGH -- Node.js polyfills, Auth.js migration, and PDA security are well-documented. Turbopack-specific issues are MEDIUM
- Discretion recommendations: MEDIUM-HIGH -- recommendations follow established patterns and align with project constraints. Token balance and directory decisions are judgment calls backed by pitfall research

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days -- stable domain, mature libraries)
