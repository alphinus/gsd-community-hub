# GSD Community Hub

## What This Is

A decentralized community development platform built on Solana that transforms the $GSD memecoin into a genuine utility token. Features wallet-verified developer registration, on-chain contribution tracking via State Compression, time-bounded idea rounds with attack-resistant governance, contribution-weighted revenue sharing with buy-and-burn mechanics, AI-powered task verification, and sybil-resistant quadratic voting with delegation -- all open source and verifiable on-chain.

## Core Value

Every contributor's work is tracked on-chain and rewarded proportionally — if the software succeeds economically, participants earn their fair share based on verified contributions.

## Requirements

### Validated

- ✓ Wallet-verified developer registration on Solana (PDA-based identity) — v1.0
- ✓ Idea Pool with time-bounded submission rounds — v1.0
- ✓ $GSD-weighted voting and approval system (custom governance) — v1.0
- ✓ On-chain contribution tracking with verifiable developer history — v1.0
- ✓ Revenue sharing based on contribution weight (60/20/10/10 model) — v1.0
- ✓ Token burn mechanism on revenue events (Jupiter buy-and-burn) — v1.0
- ✓ Integration with GSD execution framework for AI-powered development — v1.0
- ✓ Sybil-resistant quadratic voting with Civic Pass — v1.0
- ✓ Vote delegation for inactive token holders — v1.0
- ✓ Reputation decay for sustained participation incentives — v1.0
- ✓ Governance analytics dashboard — v1.0

### Active

- [ ] Multi-project workspaces with separate contribution tracking
- [ ] Retroactive funding rounds for past contributions
- [ ] Cross-DAO collaboration (other DAOs use GSD for contribution tracking)
- [ ] Notification system (email/webhook/Discord bot for round events, votes, assignments)
- [ ] Fix siws.ts type error for production builds
- [ ] Auth.js v5 stable migration (currently pinned to beta)
- [ ] Security audit for on-chain programs before mainnet

### Out of Scope

- Custom L1/L2 blockchain — Too complex, revisit after proving utility on Solana
- Mobile native app — Web-first, responsive design sufficient
- Real-time chat/messaging — Use existing tools (Discord/Telegram), don't rebuild
- NFT marketplace — Not core to contribution/revenue model
- Cross-chain bridges — Solana-only, bridges are security risks
- Fiat on/off ramps — External wallets handle this
- Staking for yield/APY — Unsustainable tokenomics, regulatory risk
- Token-gated exclusive chat — Creates pay-to-play dynamics
- Anonymous voting — Contradicts transparency mandate
- Built-in DEX/token swap — Jupiter/Raydium already exist
- Airdrop mechanics — Attracts mercenary capital, not contributors
- Separate governance token — $GSD IS the governance token
- Automatic proposal execution without timelock — Dangerous for treasury security

## Context

Shipped v1.0 with ~146,772 LOC (TypeScript + Rust) across 329 files.
Tech stack: Next.js 15, Anchor 0.32.1, Prisma 7, Solana Web3.js, Auth.js v5, TanStack Query, recharts.
Built in 2 days (2026-02-08 to 2026-02-09) across 6 phases, 36 plans, 64 feature commits.

**Token Context:**
- $GSD exists on Solana: `GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig6N3j1`
- ~3,390 holders, ~$900K-$3.6M market cap
- Token now has genuine utility: governance voting, contribution scoring, revenue distribution, buy-and-burn

**Architecture:**
- Monorepo (pnpm): `programs/gsd-hub` (Anchor), `apps/web` (Next.js), `packages/types`, `packages/utils`
- On-chain: PDA-based profiles, State Compression contributions, custom governance, revenue vault, verification records, delegation
- Off-chain: Prisma PostgreSQL, Helius 6-processor webhook pipeline, Jupiter integration
- AI: Claude API verification engine with Zod schemas, peer review fallback

**Known Issues:**
- siws.ts type mismatch causes strict TS build failure (workaround: skip TS check in build)
- Auth.js v5 beta pinned to 5.0.0-beta.30
- anchor-bankrun@0.5.0 peer dependency warning
- On-chain programs need security audit before mainnet
- Legal review needed for revenue sharing (securities classification risk)

## Constraints

- **Blockchain**: Solana — $GSD token already exists here, no migration possible
- **Token Contract**: Existing SPL token `GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig6N3j1` — cannot modify
- **Open Source**: Everything fully open source — transparency non-negotiable
- **Identity**: GSD branding and "get shit done" philosophy
- **Trust**: Every claim must be verifiable on-chain
- **Framework**: Integrates with actual GSD execution framework

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build on Solana (not custom chain) | $GSD token already exists on Solana, proven ecosystem | ✓ Good |
| PDA-based developer registry | On-chain, permissionless, verifiable identity | ✓ Good |
| Custom governance (not SPL Governance) | More control over idea rounds, voting mechanics, attack resistance | ✓ Good |
| Contribution-weighted revenue sharing | Fair distribution based on verified work | ✓ Good |
| Time-bounded idea rounds | Creates urgency, prevents stagnation | ✓ Good |
| √(tokens) quadratic voting | Prevents whale dominance while rewarding holders | ✓ Good |
| 60/20/10/10 revenue split | Balanced distribution: devs, treasury, burn, maintenance | ✓ Good |
| Open source from day one | Trust rebuilding requires full transparency | ✓ Good |
| State Compression for contributions | 99.9% cheaper on-chain storage via Merkle trees | ✓ Good |
| Helius webhook pipeline | Real-time on-chain to off-chain sync, evolved from 1 to 6 processors | ✓ Good |
| AI verification with peer review fallback | Automated scoring with human override for low-confidence results | ✓ Good |
| Civic Pass for sybil resistance | Gateway token verification prevents wallet-splitting attacks | ✓ Good |
| Manual revenue distribution (v1) | Safety measure — admin-triggered, not automatic on webhook | ⚠️ Revisit |
| Auth.js v5 beta | Only version supporting SIWS pattern — monitor for stable | ⚠️ Revisit |
| Static codebase summary for AI | Hardcoded 6.9KB context — needs dynamic generation for evolving codebase | ⚠️ Revisit |

## Future Vision: GSD as Protocol

Captured from Rettungsplan v3.0 (2026-02-08) for future roadmap consideration.

**Core idea:** Evolve GSD from a single tool to an open, client-agnostic protocol. Define structured schemas (`.gsd/` directory: `project.json`, `requirements.json`, `roadmap.json`, `plan.json`, `state.json`) so that any IDE/CLI can implement GSD workflows.

**Related concepts:**
- Deterministic Mode: fixed LLM settings for reproducible team outputs
- Build League: continuous seasonal challenges replacing one-off hackathons
- awesome-gsd: curated extension registry
- Anti-Rug Standard: exportable checklist/badge for transparent token governance

**When to revisit:** After v1.0 deployed to mainnet and community feedback gathered.

---
*Last updated: 2026-02-09 after v1.0 milestone*
