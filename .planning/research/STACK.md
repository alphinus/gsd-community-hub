# Stack Research

**Domain:** Decentralized community development platform on Solana
**Researched:** 2026-02-08
**Confidence:** MEDIUM-HIGH (verified against official docs, npm, and GitHub releases; some areas flagged)

---

## Critical Compatibility Note

The Solana JavaScript ecosystem is in a **major transition**. The legacy `@solana/web3.js` v1 has been superseded by `@solana/kit` (v3.x, formerly web3.js v2). However, **Anchor's TypeScript client (`@coral-xyz/anchor`) only supports web3.js v1** as of 0.32.1. This creates a hard constraint:

**Decision: Use `@solana/web3.js` v1 for the client layer, with `@solana/web3-compat` as the bridge to Kit-compatible code where needed.** Migrate to `@solana/kit` fully when Anchor adds native support (expected with Anchor 1.0).

This is the single most important stack decision. Getting it wrong means fighting dependency conflicts throughout development.

---

## Recommended Stack

### On-Chain Programs (Smart Contracts)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Anchor** | 0.32.1 | Solana program framework | The dominant framework for Solana programs. Provides IDL generation, automatic (de)serialization, account validation macros, and CPI helpers. 0.32.1 is the latest stable release (Oct 2025) with optimized CU usage and `solana-verify` integration. 0.31.0 introduced LazyAccount for memory optimization and custom discriminators. | HIGH |
| **Rust** | 1.91.1 (pinned via rust-toolchain.toml) | Program language | Required by Solana runtime (SBF target). Pin via `rust-toolchain.toml` to avoid version drift. | HIGH |
| **Solana CLI** | 3.0.x | Deployment and testing | Required for `solana-test-validator`, keypair management, and program deployment. Install via `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`. | HIGH |
| **AVM (Anchor Version Manager)** | latest | Anchor CLI management | Manages Anchor CLI versions per-project. Install via `cargo install --git https://github.com/coral-xyz/anchor avm`. | HIGH |

### Frontend Web Application

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Next.js** | 16.x | React framework | Latest stable (Oct 2025). Turbopack stable as default bundler, React Compiler 1.0 support, `use cache` directive for explicit caching, App Router with RSC. Use App Router exclusively -- Pages Router is legacy. | HIGH |
| **React** | 19.x | UI library | Required by Next.js 16. Server Components, Suspense, `use()` hook, Actions API. | HIGH |
| **TypeScript** | 5.7+ | Type safety | Non-negotiable for a project with on-chain interactions. Anchor IDL types integrate with TypeScript for end-to-end type safety from program to frontend. | HIGH |
| **Tailwind CSS** | 4.x | Styling | v4 ships with new `@theme` directive, OKLCH colors, and zero-config setup with Next.js 16. Dominant in the Solana dApp ecosystem. | HIGH |
| **shadcn/ui** | latest | Component library | Not an npm package -- copy-paste components built on Radix primitives. Accessible, keyboard-navigable, fully customizable. v4 Tailwind support confirmed. Use over Chakra/MUI because you own the code and bundle only what you use. | HIGH |

### Solana Client Libraries

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **@solana/web3.js** | 1.x (legacy) | Solana RPC client | Use v1 because Anchor's TypeScript client requires it. Do NOT use v2/@solana/kit yet -- Anchor has no support for it. Pin to `@solana/web3.js@1` explicitly in package.json. | HIGH |
| **@coral-xyz/anchor** | 0.32.1 | Anchor TypeScript client | Auto-generated program clients from IDL. Provides `Program`, `Provider`, `AnchorProvider` classes. Depends on web3.js v1. | HIGH |
| **@solana/spl-token** | 0.4.x | SPL token interactions | For $GSD token operations (balance queries, transfers, approvals). Use this version (not `@solana-program/token`) because it's compatible with web3.js v1. | HIGH |
| **@solana/spl-governance** | 0.3.28 | SPL Governance client | Client for Realms/SPL Governance program interactions. Enables creating realms, proposals, and voting. Note: governance program source has moved to `Mythic-Project/solana-program-library`. | MEDIUM |
| **@solana/web3-compat** | latest | Bridge layer | Use ONLY if you need to call `@solana/kit`-native APIs from web3.js v1 code. Provides conversion helpers between old and new types. Not needed initially but useful during future migration. | MEDIUM |

### Wallet Connection

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **@solana/wallet-adapter-react** | 0.15.x | React wallet hooks | Mature, battle-tested library for wallet connection in React apps. Provides `useWallet()`, `useConnection()`, `useAnchorWallet()` hooks. Auto-detect installed wallets. | HIGH |
| **@solana/wallet-adapter-react-ui** | 0.9.x | Wallet UI components | Pre-built connect button, wallet modal, multi-wallet selector. Saves significant development time. | HIGH |
| **@solana/wallet-adapter-base** | 0.9.x | Wallet adapter core | Base types and interfaces. Peer dependency of the React adapter. | HIGH |
| **@solana/wallet-adapter-wallets** | 0.19.x | Wallet implementations | Includes Phantom, Solflare, Backpack, and other wallet adapters. Configure which wallets to support. | HIGH |

**Note on ConnectorKit:** The Solana Foundation has released `@solana/connector` (v0.2.x) as a next-gen wallet connector supporting both Kit and legacy web3.js. It is headless, framework-agnostic, and Wallet Standard-first. However, it is early-stage (0.2.x, 48 GitHub stars). **Recommendation: Start with wallet-adapter (proven, 0.15.x) and evaluate ConnectorKit migration when it reaches 1.0.** ConnectorKit is the future, but wallet-adapter is the present.

### State Management

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Zustand** | 5.x | Client state | Minimal, hook-first, no boilerplate, no Provider wrapper needed. Standard choice in 2025-2026 React ecosystem. Use for wallet state, UI state, form state. | HIGH |
| **TanStack Query (React Query)** | 5.x | Server/async state | For caching RPC calls, on-chain data fetching, and off-chain API calls. Handles stale data, background refetching, and optimistic updates. Pairs with Zustand (Zustand = client state, TanStack Query = server state). | HIGH |

### Database (Off-Chain Data)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **PostgreSQL** | 16+ | Relational database | For off-chain data: user profiles, idea submissions, round metadata, contribution details (before on-chain finalization), cached on-chain data for fast queries. Battle-tested, excellent JSON support. | HIGH |
| **Prisma** | 6.x | ORM / database client | Type-safe database access with auto-generated TypeScript types. Declarative schema with migrations. Excellent Next.js integration. Use connection pooling for serverless (PgBouncer or Prisma Accelerate). | HIGH |

### Authentication

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Sign In With Solana (SIWS)** | latest | Wallet-based auth | Standard for wallet-verified authentication, modeled after EIP-4361/CAIP-122. User signs a structured message to prove wallet ownership. No passwords, no email -- pure wallet identity. Supported by Phantom, Solflare. | MEDIUM |
| **NextAuth.js / Auth.js** | 5.x | Session management | Handle session tokens after SIWS verification. Provides JWT/session cookies, middleware auth checks, and route protection. Custom credential provider wraps the SIWS flow. | MEDIUM |

### RPC and Infrastructure

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Helius** | API v1 | RPC + Enhanced APIs | Solana-native RPC provider with DAS (Digital Asset Standard) API, transaction parsing, webhooks, and Geyser plugin streams. Free tier: 1M credits, 10 RPS. Developer tier ($49/mo): 10M credits, 50 RPS. Use over generic RPC because Solana-specific optimizations matter. | MEDIUM |
| **Vercel** | -- | Frontend hosting | Native Next.js hosting with edge functions, ISR, and preview deployments. Free tier sufficient for development. | MEDIUM |

### Testing

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **Vitest** | 4.x | Frontend unit/integration tests | Vite-native, fast, ESM-first. Official Next.js testing recommendation alongside RTL. Use `@vitejs/plugin-react` and `jsdom` environment. Note: async Server Components not yet supported -- use E2E for those. | HIGH |
| **React Testing Library** | latest | Component testing | DOM-focused testing that encourages accessible component design. Use with Vitest. | HIGH |
| **Playwright** | latest | E2E testing | Cross-browser E2E testing. Use for wallet connection flows, form submissions, full user journeys. Handles async Server Components that Vitest cannot. | HIGH |
| **solana-bankrun** | latest | On-chain program testing (fast) | Orders of magnitude faster than `solana-test-validator`. Supports time travel, custom account data, concurrent test execution. Use for 90% of program tests. | HIGH |
| **anchor-bankrun** | latest | Anchor + Bankrun integration | One-line integration: `startAnchor()` auto-deploys workspace programs to test environment. Use with Jest or Vitest on the program side. | HIGH |
| **solana-test-validator** | (via Solana CLI) | On-chain integration testing | Use for tests requiring real RPC behavior or methods Bankrun does not support. Slower but more realistic. Use sparingly. | HIGH |

### On-Chain Protocols (External Programs to Integrate With)

| Protocol | Program ID / Status | Purpose | Integration Notes | Confidence |
|----------|-------------------|---------|-------------------|------------|
| **SPL Governance (Realms)** | `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw` | DAO governance, voting, proposals | Use `@solana/spl-governance` client. Create a Realm with $GSD as governance token. Supports community + council governance, proposals, voting with token weight. Token Extensions now supported. | MEDIUM |
| **SolSplits** | External program | Revenue splitting | Composable on-chain payment splits. Each Split is a payable smart contract. Manual splits cost 0.005 SOL; automated 1.5% fee. Supports SOL and SPL tokens. No official token (beware scams). **LOW confidence on long-term stability -- evaluate writing custom split program as fallback.** | LOW |
| **Solana State Compression** | SPL Account Compression | Cheap on-chain data via Merkle trees | Concurrent Merkle trees for 99.9% cheaper storage. ZK Compression V2 with Batched Merkle Trees launched/launching 2025. Use for contribution records to minimize costs. | MEDIUM |
| **Metaplex Bubblegum** | -- | Compressed NFTs (if needed) | Built on state compression. Use only if contribution badges or achievement NFTs are in scope. | LOW (not needed for MVP) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Package manager | Faster installs, strict dependency resolution, workspace support for monorepo. Use over npm/yarn. |
| **Turborepo** | Monorepo build system | If using monorepo (recommended): `apps/web` for Next.js, `programs/` for Anchor, `packages/` for shared types/utils. Handles build caching and task orchestration. |
| **ESLint** | Linting | Use with Next.js built-in config. `next lint` is the entry point. |
| **Prettier** | Formatting | Consistent code style. Configure once. |
| **Anchor CLI** | Program builds/deploys | `anchor build`, `anchor deploy`, `anchor test`, `anchor idl`. IDL auto-upload on deploy (0.32.0+). |
| **Solana Explorer** | On-chain debugging | Use devnet explorer for transaction inspection during development. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Frontend Framework** | Next.js 16 | Vite + React SPA | Next.js provides SSR/SSG for SEO, API routes for SIWS backend, and edge functions. A pure SPA loses server-side capabilities needed for auth flows and data aggregation. |
| **Frontend Framework** | Next.js 16 | Remix | Smaller ecosystem, less Solana community adoption, no equivalent to Vercel's deployment story. |
| **Styling** | Tailwind + shadcn/ui | Chakra UI | Chakra bundles an entire component library (larger bundle). shadcn/ui copies only what you use and gives you full ownership. Chakra's runtime CSS-in-JS conflicts with RSC. |
| **Styling** | Tailwind + shadcn/ui | Material UI (MUI) | Heavy bundle, opinionated Google design, runtime CSS conflicts with RSC, poor fit for crypto/web3 aesthetics. |
| **State** | Zustand + TanStack Query | Redux Toolkit | Redux requires more boilerplate (slices, actions, reducers). Zustand achieves the same with 80% less code. Redux is overkill for this project's client state needs. |
| **State** | Zustand + TanStack Query | Jotai | Jotai is atom-based (bottom-up), Zustand is store-based (top-down). Store-based is more intuitive for this domain where state groups naturally (wallet state, UI state, governance state). |
| **ORM** | Prisma | Drizzle | Drizzle is closer-to-SQL and lighter, but Prisma's migration system, Studio UI, and generated types are more mature for a team project. Evaluate Drizzle if Prisma's query overhead becomes a bottleneck. |
| **Solana SDK** | @solana/web3.js v1 | @solana/kit (v3) | Kit is the future but Anchor does not support it yet. Using Kit would require Codama-generated clients instead of Anchor's native TypeScript support, adding significant complexity. Wait for Anchor's Kit support. |
| **Wallet** | wallet-adapter | ConnectorKit (@solana/connector) | ConnectorKit is v0.2.x with minimal adoption. wallet-adapter is proven in production across hundreds of dApps. Migrate later when ConnectorKit stabilizes. |
| **Program Framework** | Anchor | Native Rust (no framework) | Native Rust gives more control but requires manual serialization, account validation, and error handling that Anchor automates. Anchor's security macros prevent common vulnerabilities. Only go native for hot-path programs needing absolute CU optimization. |
| **Testing (on-chain)** | Bankrun | solana-test-validator only | Test validator is 10x slower and doesn't support time travel or custom account injection. Use validator only for integration tests that need real RPC behavior. |
| **Governance** | SPL Governance (Realms) | Squads Protocol | Squads is focused on multisig, not DAO governance with token-weighted voting. SPL Governance is purpose-built for DAOs with proposals, voting, and treasury management. |
| **Governance** | SPL Governance (Realms) | Custom governance program | Writing custom governance is months of security-critical work. SPL Governance is battle-tested across major Solana DAOs. Extend it, don't replace it. |
| **Revenue Splitting** | SolSplits (with custom fallback) | Custom split program only | SolSplits provides a working solution now. Build custom only if SolSplits proves unreliable or its 1.5% automated fee is unacceptable. |
| **Database** | PostgreSQL + Prisma | MongoDB | Relational data model fits better: users have contributions, contributions belong to rounds, rounds have proposals. Strong referential integrity matters for financial data. |
| **Helper Library** | @solana-developers/helpers | gill | Gill is a newer, Kit-compatible helper library with excellent DX. However, since we're using web3.js v1 (due to Anchor), stick with `@solana-developers/helpers` which is v1-compatible. Evaluate gill when migrating to Kit. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **@solana/kit / @solana/web3.js v2** (as primary SDK) | Anchor 0.32.1 does not support it. Using Kit alongside Anchor requires `@solana/web3-compat` bridge code everywhere, doubling complexity. | `@solana/web3.js@1` for now. Plan migration to Kit when Anchor 1.0 ships with native support. |
| **@project-serum/anchor** | Deprecated package name. Serum rebranded; this package is unmaintained. | `@coral-xyz/anchor` is the current, maintained package. |
| **Webpack** (manual config) | Next.js 16 uses Turbopack by default. Manual webpack config fights the framework. `@coral-xyz/anchor` has known webpack 5 polyfill issues. | Let Next.js 16's Turbopack handle bundling. If polyfill issues arise, configure `next.config.js` fallbacks. |
| **Pages Router** | Legacy Next.js pattern. App Router with RSC is the standard since Next.js 13. All new Next.js features target App Router only. | App Router exclusively. |
| **Create React App (CRA)** | Officially deprecated. No SSR, no RSC, no API routes. | Next.js 16. |
| **Chakra UI / MUI** (for this project) | Runtime CSS-in-JS conflicts with React Server Components. Larger bundles. | Tailwind CSS + shadcn/ui. |
| **Redux** | Unnecessary complexity for this project's state needs. | Zustand (client) + TanStack Query (server). |
| **Mongoose** | MongoDB ORM. Wrong database choice for relational contribution/governance data. | Prisma with PostgreSQL. |
| **Hardhat / Foundry** | Ethereum tooling. Incompatible with Solana's runtime. | Anchor CLI + Solana CLI. |
| **ethers.js / viem** | Ethereum libraries. Will not work with Solana. | `@solana/web3.js` + `@coral-xyz/anchor`. |
| **Seahorse (Python on Solana)** | Experimental, thin community, limited IDE support. Anchor/Rust is the established path. | Anchor (Rust). |
| **Solang (Solidity on Solana)** | Niche, incomplete feature coverage compared to native Rust/Anchor programs. | Anchor (Rust). |

---

## Stack Patterns by Context

**For on-chain program development:**
- Use Anchor 0.32.1 with Rust, targeting Solana SBF
- Test with `anchor-bankrun` (fast, 90% of tests) + `solana-test-validator` (integration, 10%)
- Generate TypeScript client automatically from Anchor IDL
- Deploy via `anchor deploy` (auto-uploads IDL since 0.32.0)

**For frontend development:**
- Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui
- `@solana/wallet-adapter-react` for wallet connection
- `@coral-xyz/anchor` for program interaction (wraps `@solana/web3.js` v1)
- Zustand for client state, TanStack Query for RPC/API data caching
- SIWS for authentication, NextAuth/Auth.js for session management

**For off-chain data persistence:**
- PostgreSQL + Prisma for structured data (profiles, rounds, contributions)
- Cache on-chain data in PostgreSQL for fast queries (avoid hammering RPC)
- Use Helius webhooks to sync on-chain events to database

**For monorepo structure (recommended):**
```
gsd-community-hub/
  apps/
    web/           # Next.js 16 frontend
  programs/
    community-hub/ # Anchor program(s)
  packages/
    types/         # Shared TypeScript types (IDL types, API types)
    utils/         # Shared utility functions
  turbo.json       # Turborepo config
  pnpm-workspace.yaml
```

---

## Version Compatibility Matrix

| Package A | Compatible With | Incompatible With | Notes |
|-----------|-----------------|-------------------|-------|
| `@coral-xyz/anchor@0.32.1` | `@solana/web3.js@1.x` | `@solana/kit@3.x`, `@solana/web3.js@2.x` | This is the hard constraint driving SDK choice |
| `@solana/wallet-adapter-react@0.15.x` | `@solana/web3.js@1.x`, React 18+, React 19 | -- | Works with both React 18 and 19 |
| `@solana/spl-token@0.4.x` | `@solana/web3.js@1.x` | `@solana/kit@3.x` | For Kit, use `@solana-program/token` instead |
| `@solana/spl-governance@0.3.28` | `@solana/web3.js@1.x` | `@solana/kit@3.x` | Legacy API, monitor for Kit-compatible replacement |
| Next.js 16.x | React 19, Tailwind 4, TypeScript 5.7+ | React 17 or earlier | Turbopack is default bundler |
| Anchor CLI 0.32.1 | Solana CLI 3.0.x, Rust 1.91.x | -- | Pin Rust version via `rust-toolchain.toml` |
| Prisma 6.x | PostgreSQL 12-17, Node.js 18+ | -- | Use connection pooling for serverless |

---

## Installation

```bash
# Frontend (in apps/web/)
pnpm add next@16 react@19 react-dom@19
pnpm add @solana/web3.js@1 @coral-xyz/anchor@0.32.1
pnpm add @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
pnpm add @solana/spl-token@0.4 @solana/spl-governance
pnpm add zustand@5 @tanstack/react-query@5
pnpm add @prisma/client
pnpm add next-auth@5
pnpm add bs58  # Base58 encoding for Solana addresses

# Frontend dev dependencies
pnpm add -D typescript @types/react @types/node
pnpm add -D tailwindcss@4 @tailwindcss/postcss postcss
pnpm add -D prisma
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
pnpm add -D playwright @playwright/test
pnpm add -D eslint prettier

# Anchor program setup (from project root)
anchor init programs/community-hub --no-git
# OR if adding to existing project:
# anchor new community-hub

# Anchor test dependencies (in programs/ or root)
pnpm add -D solana-bankrun anchor-bankrun jest @types/jest ts-jest

# Solana CLI (system-level)
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Anchor CLI via AVM (system-level)
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.32.1
avm use 0.32.1

# shadcn/ui (run in apps/web/)
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu input label select tabs toast
```

---

## Future Migration Path: web3.js v1 --> @solana/kit

When Anchor ships Kit support (likely Anchor 1.0, timing unknown):

1. Replace `@solana/web3.js@1` with `@solana/kit@3`
2. Replace `@solana/spl-token@0.4` with `@solana-program/token`
3. Replace `@solana/spl-governance@0.3` with Kit-compatible governance client (if available)
4. Evaluate replacing `@solana/wallet-adapter-react` with `@solana/connector` (ConnectorKit)
5. Evaluate replacing `@solana-developers/helpers` with `gill`
6. Update Anchor TypeScript client usage from class-based to functional patterns
7. Use `@solana/web3-compat` as bridge during incremental migration

**Impact:** Mostly import path changes and type conversions. Architecture remains the same. Plan for 1-2 sprint migration effort.

---

## Sources

### Official Documentation (HIGH confidence)
- [Anchor Framework Docs](https://www.anchor-lang.com/docs) -- versions, changelog, TypeScript client
- [Anchor Changelog](https://www.anchor-lang.com/docs/updates/changelog) -- confirmed 0.32.0 as latest major, no 1.0 RC published
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- stable Oct 2025, Turbopack default
- [Solana PDA Documentation](https://solana.com/docs/core/pda) -- deterministic address derivation
- [Solana Installation Guide](https://solana.com/docs/intro/installation) -- CLI versions
- [Solana Wallet Adapter Guide](https://solana.com/developers/cookbook/wallets/connect-wallet-react) -- integration patterns
- [SPL Governance Docs](https://docs.realms.today/spl-governance) -- Realms integration
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) -- Tailwind v4 support confirmed
- [@solana/web3-compat](https://solana.com/docs/frontend/web3-compat) -- bridge layer docs
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) -- official testing setup

### npm Registry (HIGH confidence for versions)
- [@coral-xyz/anchor@0.32.1](https://www.npmjs.com/package/@coral-xyz/anchor) -- published ~Nov 2025
- [@solana/kit@3.0.3](https://www.npmjs.com/package/@solana/kit) -- published ~Jan 2026
- [@solana/wallet-adapter-react@0.15.39](https://www.npmjs.com/package/@solana/wallet-adapter-react)
- [@solana/spl-governance@0.3.28](https://www.npmjs.com/package/@solana/spl-governance)
- [@solana/spl-token@0.4.14](https://www.npmjs.com/package/@solana/spl-token)
- [@tanstack/react-query@5.90.20](https://www.npmjs.com/package/@tanstack/react-query)
- [vitest@4.0.18](https://www.npmjs.com/package/vitest)

### GitHub Repositories (HIGH confidence)
- [Anchor GitHub](https://github.com/solana-foundation/anchor) -- release history, no 1.0 RC found
- [ConnectorKit GitHub](https://github.com/solana-foundation/connectorkit) -- v0.2.x, 48 stars, early stage
- [Solana Kit GitHub](https://github.com/anza-xyz/kit) -- SDK architecture, modular packages
- [Wallet Adapter GitHub](https://github.com/anza-xyz/wallet-adapter) -- maintained by Anza

### Verified Web Sources (MEDIUM confidence)
- [Helius Blog: Solana Web3.js 2.0 SDK](https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk) -- Anchor/Kit incompatibility confirmed
- [Anza Blog: Solana JS SDK 2.0 Release](https://www.anza.xyz/blog/solana-web3-js-2-release) -- Kit history
- [Helius Blog: Testing Solana Programs](https://www.helius.dev/blog/a-guide-to-testing-solana-programs) -- Bankrun vs validator comparison
- [Solana Bankrun Guide](https://solana.com/developers/guides/advanced/testing-with-jest-and-bankrun) -- official testing guide
- [SolSplits Docs](https://docs.solsplits.xyz/) -- revenue splitting protocol
- [Helius Pricing](https://www.helius.dev/pricing) -- RPC tier information
- [Triton Blog: Intro to Solana Kit](https://blog.triton.one/intro-to-the-new-solana-kit-formerly-web3-js-2/) -- Kit migration context
- [Phantom SIWS](https://phantom.com/learn/developers/sign-in-with-solana) -- authentication standard
- [QuickNode: DAO with Realms](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/dao-with-realms) -- Realms integration guide

### WebSearch Only (LOW confidence -- needs validation)
- Anchor 1.0-rc.1 / 1.0-rc.2 mentioned in initial search results but NOT confirmed in official changelog or GitHub releases. The official changelog shows 0.32.0 (Oct 2025) as latest. **Treat any Anchor 1.0 RC claims as unverified.**
- SolSplits long-term stability and maintenance status -- limited public information available
- ZK Compression V2 launch status (was "expected Q2 2025" per Accelerate 2025 talk) -- verify current status before relying on it

---

*Stack research for: GSD Community Hub -- Decentralized Community Development Platform on Solana*
*Researched: 2026-02-08*
