<p align="center">
  <img src=".github/banner.svg" alt="GSD Community Hub" width="100%" />
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Solana-Devnet-4fd1c5?style=for-the-badge&logo=solana&logoColor=white" alt="Solana" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Next.js_16-0f172a?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Anchor_0.32-38b2ac?style=for-the-badge&logo=anchor&logoColor=white" alt="Anchor" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-3b82f6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Rust-38b2ac?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-4fd1c5?style=for-the-badge" alt="MIT" /></a>
</p>

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## The Problem

Memecoins crash. Communities scatter. Devs leave. Tale as old as crypto.

**$GSD** started as a memecoin on Solana — cool branding, decent community, real open-source framework behind it. But zero on-chain utility. Token dumps, holders panic, trust evaporates.

So instead of pretending nothing happened, we built what should've existed from day one:

> **A platform where every contribution is tracked on-chain and every contributor gets their fair cut when the project makes money.**

No promises. No vibes. Just verifiable work and transparent revenue splits.

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## What It Does

<table>
<tr>
<td width="50%">

### 🔐 Identity & Auth
- **Wallet login, not email.** Phantom / Solflare / Backpack — sign a message, you're in
- **On-chain developer profiles.** PDA-based, permissionless, unfakeable
- **Sybil resistance.** Civic Pass — one human, one identity

</td>
<td width="50%">

### 📊 Contribution Tracking
- **State Compression.** Every task on a Merkle tree — 99.9% cheaper
- **AI-powered verification.** Claude API scores completions automatically
- **Peer review fallback.** Low AI confidence? Humans step in
- **Reputation decay.** Stay active or fade out (180-day half-life)

</td>
</tr>
<tr>
<td width="50%">

### 🏛️ Governance
- **Idea Rounds.** Time-bounded submissions, community votes, best wins
- **Quadratic voting.** `sqrt(tokens) = vote weight` — whales can't steamroll
- **Delegation.** Not active? Pass your power to someone who is
- **Attack-resistant.** Timelocks, graduated quorum, veto council

</td>
<td width="50%">

### 💰 Revenue Sharing
- **60/20/10/10 split.** Devs / treasury / burn / maintenance
- **Contribution-weighted.** Your share = your score vs. everyone else's
- **Jupiter buy-and-burn.** 10% of revenue auto-buys $GSD and burns it
- **Full transparency.** Every split, claim, and burn on the dashboard

</td>
</tr>
</table>

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## Architecture

<p align="center">
  <img src=".github/architecture.svg" alt="System Architecture" width="800" />
</p>

**Data flow:**

```
1. User connects wallet → signs SIWS message → gets JWT session
2. Actions hit API routes → write to Prisma + submit Solana txs
3. Solana txs trigger Helius webhooks → 6-processor pipeline
4. Pipeline indexes on-chain events back to PostgreSQL
5. AI verification scores feed into contribution formula
6. Revenue events trigger 60/20/10/10 split + Jupiter buy-and-burn
```

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## Revenue Model

<p align="center">
  <img src=".github/revenue.svg" alt="Revenue Distribution" width="700" />
</p>

Claim your share via on-chain transaction. Every split, every claim, every burn — publicly viewable on the treasury dashboard.

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## Tech Stack

| Layer | Tech |
|:------|:-----|
| **Frontend** | Next.js 16 · React 19 · TailwindCSS 4 · TanStack Query · Recharts |
| **Auth** | Auth.js v5 + Sign In With Solana (SIWS) |
| **Database** | PostgreSQL via Prisma 7 |
| **Blockchain** | Solana · Anchor 0.32.1 · SPL Account Compression |
| **AI** | Anthropic Claude API · Zod schemas |
| **Indexing** | Helius webhooks (6-processor pipeline) |
| **DEX** | Jupiter API (buy-and-burn) |
| **Sybil** | Civic Pass gateway tokens |
| **Build** | pnpm workspaces · Turborepo · Turbopack |

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## On-Chain Program

> **Program ID:** `Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw`

24 instructions across 6 domains:

| Domain | Instructions | # |
|:-------|:------------|:-:|
| **Developer** | `register` · `update_hash` | 2 |
| **Contributions** | `init_contribution_tree` · `record_contribution` · `update_score` | 3 |
| **Verification** | `init_verification_config` · `submit_verification` · `finalize_peer_verification` · `submit_peer_review` | 4 |
| **Governance** | `init_governance_config` · `update_governance_config` · `create_round` · `submit_idea` · `transition_round` · `cast_vote` · `deposit_tokens` · `withdraw_tokens` · `delegate_vote` · `revoke_delegation` · `relinquish_vote` · `veto_idea` | 12 |
| **Revenue** | `init_revenue_config` · `record_revenue_event` · `claim_revenue_share` · `execute_burn` | 4 |

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## Governance

| Layer | Mechanism |
|:------|:----------|
| **Voting** | Quadratic: `sqrt(tokens) = vote weight` — whales matter, but can't dominate |
| **Sybil Gate** | Civic Pass required — no wallet-splitting vote amplification |
| **Delegation** | Inactive holders pass voting power to active contributors |
| **Decay** | 180-day half-life on reputation — sustained participation rewarded |
| **Timelock** | 7 days on deposits, 48 hours on execution |
| **Quorum** | Graduated: 5% (small) / 20% (treasury) / 33% (parameter changes) |
| **Veto** | 3-of-5 multisig council can block malicious proposals |

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env.local with your values

# 3. Set up database
cd apps/web && pnpm db:push && pnpm db:generate && cd ../..

# 4. Build the Anchor program
anchor build

# 5. Run dev server
pnpm dev
```

> Open [localhost:3000](http://localhost:3000) — connect your wallet and start building.

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## Project Structure

```
gsd-community-hub/
│
├── apps/web/                     Next.js 16 web application
│   ├── app/
│   │   ├── (public)/             Public routes (governance, treasury, explore)
│   │   ├── (auth)/               Protected routes (profile edit, voting)
│   │   └── api/                  REST endpoints by domain
│   ├── components/               React components by feature
│   ├── lib/                      Business logic, indexers, config
│   └── prisma/                   Database schema
│
├── packages/
│   ├── types/                    @gsd/types — shared TypeScript interfaces
│   └── utils/                    @gsd/utils — PDA helpers, hashing, scoring
│
├── programs/gsd-hub/             Solana Anchor program
│   └── src/
│       ├── state/                17 on-chain account structs
│       ├── instructions/         24 program instructions
│       └── cpi/                  Cross-program invocations
│
├── scripts/                      Setup utilities
└── tests/                        Test suites + SPL fixtures
```

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

## $GSD Token

```
8116V1BW9zaXUM6pVhWVaAduKrLcEBi3RGXedKTrBAGS
```

The token is **not modified** by this platform. We build utility around it:

- Governance voting weight
- Revenue distribution eligibility
- Buy-and-burn deflationary pressure
- Quadratic voting with sybil resistance

No staking yields. No airdrops. No promises. Just: **build stuff, get tracked, get paid.**

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

<details>
<summary><strong>Environment Variables</strong></summary>

<br>

```bash
# ─── Required ───────────────────────────────────────

# Auth (Auth.js v5)
AUTH_SECRET="<openssl rand -hex 32>"
AUTH_URL="http://localhost:3000"

# Solana
NEXT_PUBLIC_RPC_URL="https://api.devnet.solana.com"
NEXT_PUBLIC_PROGRAM_ID="Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw"
NEXT_PUBLIC_NETWORK="devnet"

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/gsd_hub"

# Helius (on-chain indexing)
HELIUS_API_KEY="<your-helius-key>"
HELIUS_WEBHOOK_AUTH="<openssl rand -hex 32>"

# ─── Optional (full functionality) ──────────────────

NEXT_PUBLIC_TREASURY_ADDRESS="<multisig-vault-pda>"
NEXT_PUBLIC_GSD_MINT="8116V1BW9zaXUM6pVhWVaAduKrLcEBi3RGXedKTrBAGS"
JUPITER_API_KEY="<for-buy-and-burn>"
BURN_AUTHORITY_KEYPAIR="<base58-encoded>"
REVENUE_ADMIN_SECRET="<for-distribution-api>"
ANTHROPIC_API_KEY="<for-ai-verification>"
```

</details>

<details>
<summary><strong>Setup Scripts</strong></summary>

<br>

```bash
# Initialize Squads multisig
npx ts-node scripts/setup-multisig.ts

# Configure Helius webhook
npx ts-node scripts/setup-helius-webhook.ts

# Log a program upgrade
npx ts-node scripts/log-upgrade.ts
```

</details>

<details>
<summary><strong>Run Tests</strong></summary>

<br>

```bash
# Anchor program tests (bankrun)
anchor test

# TypeScript package tests
cd packages/utils && node --test
```

</details>

<details>
<summary><strong>Webhook Pipeline</strong></summary>

<br>

Every Solana transaction runs through 6 specialized indexers:

| # | Processor | What It Catches |
|:-:|:----------|:----------------|
| 1 | **Contribution** | `record_contribution` · `update_score` |
| 2 | **Governance** | `create_round` · `submit_idea` · `cast_vote` · `deposit_tokens` |
| 3 | **Revenue** | `record_revenue_event` · `claim_revenue_share` · `execute_burn` |
| 4 | **Detection** | Treasury inflow monitoring (SOL/USDC transfers) |
| 5 | **Verification** | `submit_verification` · `finalize_peer_verification` |
| 6 | **Advanced Gov** | `delegate_vote` · `revoke_delegation` |

</details>

<details>
<summary><strong>Known Issues (v1.0)</strong></summary>

<br>

| Issue | Impact | Workaround |
|:------|:-------|:-----------|
| `siws.ts` type mismatch | Strict TS build fails | Skip type check in build |
| Auth.js v5 beta | Pinned to `5.0.0-beta.30` | Monitor for stable release |
| `anchor-bankrun` peer dep | Warning only | Works fine, cosmetic |
| No security audit | Programs on devnet only | Audit required before mainnet |

</details>

<p align="center">
  <img src=".github/divider.svg" alt="" width="600" />
</p>

<p align="center">
  <sub>
    <strong>License:</strong> <a href="LICENSE">MIT</a> — open source, because transparency is the whole point.
  </sub>
</p>

<p align="center">
  <sub>
    Built with the GSD framework — 6 phases, 36 plans, 2 days.
  </sub>
</p>
