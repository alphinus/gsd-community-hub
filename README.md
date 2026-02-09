<p align="center">
  <img src=".github/gsd-logo.png" alt="GSD" width="160" />
</p>

<p align="center">
  <img src=".github/hero.png" alt="GSD Community Hub" width="600" />
</p>

<h1 align="center">GSD Community Hub</h1>

<p align="center">
  <strong>Ship fast. Track everything. Get paid fairly.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0-blue?style=flat-square" alt="v1.0" />
  <img src="https://img.shields.io/badge/solana-devnet-9945FF?style=flat-square&logo=solana&logoColor=white" alt="Solana" />
  <img src="https://img.shields.io/badge/anchor-0.32.1-blue?style=flat-square" alt="Anchor" />
  <img src="https://img.shields.io/badge/next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/rust-%23000000.svg?style=flat-square&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/typescript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
</p>

---

## Why This Exists

Memecoins crash. Communities scatter. Devs leave. Tale as old as crypto.

**$GSD** started as a memecoin on Solana. Cool branding, decent community, real open-source framework behind it -- but zero on-chain utility. Token price dumps, holders panic, trust evaporates. Classic.

So instead of pretending nothing happened, we built the thing that should've existed from day one: **a platform where every contribution is tracked on-chain and every contributor gets their fair cut when the project makes money.**

No promises. No vibes. Just verifiable work and transparent revenue splits.

> This is **v1.0** -- quick and dirty, but you get the idea.

<p align="center">
  <img src=".github/milestone-v1.png" alt="v1.0 Milestone Complete" width="560" />
</p>

---

## What It Does

<table>
<tr>
<td width="50%">

### Identity & Auth
- **Wallet login, not email.** Phantom / Solflare / Backpack -- sign a message, you're in
- **On-chain developer profiles.** PDA-based, permissionless, unfakeable
- **Sybil resistance.** Civic Pass -- one human, one identity

</td>
<td width="50%">

### Contribution Tracking
- **State Compression.** Every task recorded on a Merkle tree -- 99.9% cheaper
- **AI-powered verification.** Claude API scores completions automatically
- **Peer review fallback.** Low AI confidence? Humans step in
- **Reputation decay.** Stay active or fade out (180-day half-life)

</td>
</tr>
<tr>
<td width="50%">

### Governance
- **Idea Rounds.** Time-bounded submissions, community votes, best wins
- **Quadratic voting.** sqrt(tokens) = vote weight -- whales can't steamroll
- **Delegation.** Not active? Pass your power to someone who is
- **Attack-resistant.** Timelocks, graduated quorum, veto council

</td>
<td width="50%">

### Revenue
- **60/20/10/10 split.** Devs / treasury / burn / maintenance
- **Contribution-weighted.** Your share = your score vs. everyone else's
- **Jupiter buy-and-burn.** 10% of revenue auto-buys $GSD and burns it
- **Full transparency.** Every split, claim, and burn on the dashboard

</td>
</tr>
</table>

---

## Tech Stack

| Layer | Tech |
|:------|:-----|
| **Frontend** | Next.js 15 &bull; React 19 &bull; TailwindCSS 4 &bull; TanStack Query &bull; recharts |
| **Auth** | Auth.js v5 + Sign In With Solana (SIWS) |
| **Database** | PostgreSQL via Prisma 7 |
| **Blockchain** | Solana &bull; Anchor 0.32.1 &bull; SPL Account Compression |
| **AI** | Anthropic Claude API &bull; Zod schemas |
| **Indexing** | Helius webhooks (6-processor pipeline) |
| **DEX** | Jupiter API (buy-and-burn) |
| **Sybil** | Civic Pass gateway tokens |
| **Build** | pnpm workspaces &bull; Turborepo &bull; Turbopack |

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env.local with your values (see Environment section below)

# 3. Set up database
cd apps/web && pnpm db:push && pnpm db:generate && cd ../..

# 4. Build the Anchor program
anchor build

# 5. Run dev server (Turbopack)
pnpm dev
```

> Open [localhost:3000](http://localhost:3000) -- connect your wallet and start building.

---

## Project Structure

```
gsd-utility/
│
├── apps/web/                     Next.js 15 web application
│   ├── app/
│   │   ├── (public)/             Public routes (governance, treasury, profiles, explore)
│   │   ├── (auth)/               Protected routes (profile edit, voting)
│   │   └── api/                  REST endpoints by domain
│   ├── components/               React components by feature
│   ├── lib/                      Business logic, indexers, config
│   └── prisma/                   Database schema
│
├── packages/
│   ├── types/                    @gsd/types -- shared TypeScript interfaces
│   └── utils/                    @gsd/utils -- PDA helpers, hashing, scoring, decay
│
├── programs/gsd-hub/             Solana Anchor program
│   └── src/
│       ├── state/                17 on-chain account structs
│       ├── instructions/         24 program instructions
│       └── cpi/                  Cross-program invocations
│
├── scripts/                      Setup utilities (multisig, webhooks, upgrades)
└── tests/                        Test suites + SPL program fixtures
```

---

## On-Chain Program

> **Program ID:** `Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw`

24 instructions across 6 domains:

| Domain | Instructions | Count |
|:-------|:------------|:-----:|
| **Developer** | `register` &bull; `update_hash` | 2 |
| **Contributions** | `init_contribution_tree` &bull; `record_contribution` &bull; `update_score` | 3 |
| **Verification** | `init_verification_config` &bull; `submit_verification` &bull; `finalize_peer_verification` &bull; `submit_peer_review` | 4 |
| **Governance** | `init_governance_config` &bull; `update_governance_config` &bull; `create_round` &bull; `submit_idea` &bull; `transition_round` &bull; `cast_vote` &bull; `deposit_tokens` &bull; `withdraw_tokens` &bull; `delegate_vote` &bull; `revoke_delegation` &bull; `relinquish_vote` &bull; `veto_idea` | 12 |
| **Revenue** | `init_revenue_config` &bull; `record_revenue_event` &bull; `claim_revenue_share` &bull; `execute_burn` | 4 |

---

## Architecture

```
                         ┌─────────────────┐
                         │    Browser       │
                         │  (Solana Wallet) │
                         └────────┬────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      Next.js App Router     │
                    │   (API Routes + SSR Pages)  │
                    └──┬──────────────────────┬───┘
                       │                      │
              ┌────────▼────────┐    ┌────────▼────────┐
              │   PostgreSQL    │    │     Solana       │
              │   (Prisma 7)   │    │   (Anchor 0.32)  │
              └────────▲────────┘    └────────┬────────┘
                       │                      │
              ┌────────┴──────────────────────▼────────┐
              │         Helius Webhook Pipeline         │
              │                                        │
              │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
              │  │Contri│ │Govern│ │Reven │ │Detect│  │
              │  │bution│ │ance  │ │ue    │ │ion   │  │
              │  └──────┘ └──────┘ └──────┘ └──────┘  │
              │  ┌──────┐ ┌──────┐                     │
              │  │Verifi│ │Adv.  │    6 processors     │
              │  │cation│ │Gov.  │                     │
              │  └──────┘ └──────┘                     │
              └────────────────────────────────────────┘
                       │                      │
              ┌────────▼────────┐    ┌────────▼────────┐
              │   Claude API    │    │    Jupiter API   │
              │  (Verification) │    │  (Buy & Burn)   │
              └─────────────────┘    └─────────────────┘
```

**Data flow:**
1. User connects wallet &rarr; signs SIWS message &rarr; gets JWT session
2. Actions hit API routes &rarr; write to Prisma + submit Solana txs
3. Solana txs trigger Helius webhooks &rarr; 6-processor pipeline
4. Pipeline indexes on-chain events back to PostgreSQL
5. AI verification scores feed into contribution formula
6. Revenue events trigger 60/20/10/10 split + Jupiter buy-and-burn

---

## Revenue Model

```
  Revenue Event (SOL/USDC arrives at treasury)
  │
  ├── 60%  ───▶  Developer Pool    (weighted by contribution score)
  ├── 20%  ───▶  DAO Treasury      (community-governed)
  ├── 10%  ───▶  Buy & Burn        (Jupiter swap → burn address)
  └── 10%  ───▶  Maintenance       (infrastructure costs)
```

Claim your share via on-chain transaction. Every split, every claim, every burn -- publicly viewable on the treasury dashboard.

---

## Governance

<table>
<tr><th>Layer</th><th>Mechanism</th></tr>
<tr>
<td><strong>Voting</strong></td>
<td>Quadratic: <code>sqrt(tokens) = vote weight</code> -- whales matter, but can't dominate</td>
</tr>
<tr>
<td><strong>Sybil Gate</strong></td>
<td>Civic Pass required -- no wallet-splitting vote amplification</td>
</tr>
<tr>
<td><strong>Delegation</strong></td>
<td>Inactive holders pass voting power to active contributors</td>
</tr>
<tr>
<td><strong>Decay</strong></td>
<td>180-day half-life on reputation -- sustained participation rewarded</td>
</tr>
<tr>
<td><strong>Timelock</strong></td>
<td>7 days on deposits, 48 hours on execution</td>
</tr>
<tr>
<td><strong>Quorum</strong></td>
<td>Graduated: 5% (small) / 20% (treasury) / 33% (parameter changes)</td>
</tr>
<tr>
<td><strong>Veto</strong></td>
<td>3-of-5 multisig council can block malicious proposals</td>
</tr>
</table>

---

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
# Initialize Squads multisig (needs member public keys)
npx ts-node scripts/setup-multisig.ts

# Configure Helius webhook for on-chain indexing
npx ts-node scripts/setup-helius-webhook.ts

# Log a program upgrade to the changelog
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

---

## Webhook Pipeline

Every Solana transaction runs through 6 specialized indexers:

| # | Processor | What It Catches |
|:-:|:----------|:----------------|
| 1 | **Contribution** | `record_contribution` &bull; `update_score` |
| 2 | **Governance** | `create_round` &bull; `submit_idea` &bull; `cast_vote` &bull; `deposit_tokens` |
| 3 | **Revenue** | `record_revenue_event` &bull; `claim_revenue_share` &bull; `execute_burn` |
| 4 | **Detection** | Treasury inflow monitoring (SOL/USDC transfers) |
| 5 | **Verification** | `submit_verification` &bull; `finalize_peer_verification` |
| 6 | **Advanced Gov** | `delegate_vote` &bull; `revoke_delegation` |

---

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

---

## Known Issues (v1.0)

| Issue | Impact | Workaround |
|:------|:-------|:-----------|
| `siws.ts` type mismatch | Strict TS build fails | Skip type check in build |
| Auth.js v5 beta | Pinned to `5.0.0-beta.30` | Monitor for stable release |
| `anchor-bankrun` peer dep | Warning only | Works fine, cosmetic |
| No security audit | Programs on devnet only | Audit required before mainnet |
| Manual revenue distribution | Admin-triggered, not automatic | v1 safety measure |
| Static AI codebase summary | 6.9KB hardcoded context | Needs dynamic generation |

---

## Stats

| Metric | Value |
|:-------|------:|
| Phases | 6 |
| Plans | 36 |
| Feature commits | 64 |
| Files | 329 |
| Lines of code | ~147K |
| Languages | TypeScript + Rust |
| Build time | 2 days |
| Avg plan execution | ~5.8 min |

---

## License

[MIT](LICENSE) -- open source, because transparency is the whole point.

---

<p align="center">
  <sub>Built with the <a href="https://github.com/get-shit-done">GSD framework</a> -- 6 phases, 36 plans, 2 days. That's how we roll.</sub>
</p>
