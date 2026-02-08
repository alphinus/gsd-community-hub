# Architecture Research

**Domain:** Decentralized community development platform on Solana
**Researched:** 2026-02-08
**Confidence:** MEDIUM-HIGH

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
│  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────────┐       │
│  │ Wallet     │  │ Idea Pool    │  │ Governance  │  │ Developer       │       │
│  │ Connection │  │ UI           │  │ Dashboard   │  │ Registry UI     │       │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘  └────────┬────────┘       │
│        │                │                 │                   │               │
│  ┌─────┴────────────────┴─────────────────┴───────────────────┴──────────┐    │
│  │                   Next.js 16 App Router + Wallet Adapter              │    │
│  └──────────────────────────────┬────────────────────────────────────────┘    │
├─────────────────────────────────┼────────────────────────────────────────────┤
│                              API LAYER                                        │
│  ┌──────────────────────────────┴────────────────────────────────────────┐    │
│  │                   Next.js API Routes / Server Actions                  │    │
│  │  ┌────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐         │    │
│  │  │ SIWS   │  │ Off-chain│  │ On-chain  │  │ Helius         │         │    │
│  │  │ Auth   │  │ Data API │  │ Reader    │  │ Webhooks       │         │    │
│  │  └────────┘  └──────────┘  └───────────┘  └────────────────┘         │    │
│  └──────────────────────────────┬────────────────────────────────────────┘    │
├─────────────────────────────────┼────────────────────────────────────────────┤
│                           DATA LAYER                                          │
│  ┌──────────────┐  ┌───────────┴──────────┐  ┌──────────────────────┐        │
│  │ PostgreSQL   │  │ Solana RPC (Helius)   │  │ IPFS (proposal      │        │
│  │ (off-chain)  │  │ (on-chain read/write) │  │ content, optional)  │        │
│  └──────────────┘  └───────────┬──────────┘  └──────────────────────┘        │
├─────────────────────────────────┼────────────────────────────────────────────┤
│                         ON-CHAIN PROGRAMS                                     │
│  ┌──────────────┐  ┌───────────┴───────────┐  ┌─────────────────────┐        │
│  │ GSD          │  │ SPL Governance         │  │ Revenue Split       │        │
│  │ Community    │  │ (Realms)               │  │ Program             │        │
│  │ Hub Program  │  │                        │  │ (SolSplits/custom)  │        │
│  │              │  │ - Realm                │  │                     │        │
│  │ - Registry   │  │ - Governance           │  │ - Split config      │        │
│  │ - Idea Pool  │  │ - Proposals            │  │ - Distribution      │        │
│  │ - Rounds     │  │ - VoteRecords          │  │ - Burn trigger      │        │
│  │ - Contrib.   │  │ - TokenOwnerRecord     │  │                     │        │
│  └──────────────┘  └────────────────────────┘  └─────────────────────┘        │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │                    Solana Blockchain (Mainnet-Beta)                    │     │
│  │              $GSD SPL Token: GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Next.js Frontend** | User interface, wallet connection, form handling, dashboard rendering | API Layer, Solana RPC (via wallet-adapter) |
| **SIWS Auth** | Wallet-based authentication, session management | Wallet Adapter, NextAuth, PostgreSQL |
| **Off-chain Data API** | Store/retrieve idea descriptions, comments, cached profiles | PostgreSQL |
| **On-chain Reader** | Read PDA data, governance state, contribution records | Solana RPC (Helius) |
| **Helius Webhooks** | Listen for on-chain events, sync to off-chain DB | Solana RPC, PostgreSQL |
| **GSD Community Hub Program** | Developer registry (PDAs), idea rounds, contribution records | SPL Governance (CPI), SPL Token |
| **SPL Governance (Realms)** | Voting, proposals, token-weighted governance | $GSD Token, GSD Hub Program |
| **Revenue Split Program** | Revenue distribution, buy-and-burn trigger | $GSD Token, DEX (Jupiter) |
| **PostgreSQL** | Off-chain data persistence, query optimization, cached on-chain data | API Layer |

## Recommended Project Structure

```
gsd-community-hub/
├── apps/
│   └── web/                      # Next.js 16 frontend
│       ├── app/                  # App Router
│       │   ├── (auth)/           # Auth-required routes
│       │   │   ├── dashboard/    # User dashboard
│       │   │   ├── ideas/        # Idea pool UI
│       │   │   ├── rounds/       # Round management
│       │   │   ├── governance/   # Voting & proposals
│       │   │   └── profile/      # Developer profile
│       │   ├── api/              # API routes
│       │   │   ├── auth/         # SIWS + NextAuth endpoints
│       │   │   ├── ideas/        # Idea CRUD
│       │   │   ├── rounds/       # Round management
│       │   │   └── webhooks/     # Helius webhook receivers
│       │   ├── explore/          # Public-facing pages
│       │   └── layout.tsx        # Root layout with providers
│       ├── components/           # React components
│       │   ├── ui/               # shadcn/ui components
│       │   ├── wallet/           # Wallet connection components
│       │   ├── governance/       # Voting, proposal components
│       │   ├── ideas/            # Idea pool components
│       │   └── profile/          # Developer profile components
│       ├── hooks/                # Custom React hooks
│       │   ├── use-program.ts    # Anchor program hook
│       │   ├── use-governance.ts # SPL Governance hooks
│       │   └── use-registry.ts   # Developer registry hooks
│       ├── lib/                  # Utilities
│       │   ├── anchor/           # Anchor client setup
│       │   ├── solana/           # Solana helpers
│       │   └── db/               # Prisma client
│       ├── prisma/
│       │   └── schema.prisma     # Database schema
│       └── anchor-idl/           # Generated IDL files
├── programs/
│   └── community-hub/            # Anchor program
│       ├── programs/
│       │   └── community-hub/
│       │       └── src/
│       │           ├── lib.rs            # Program entry
│       │           ├── state/            # Account structures
│       │           │   ├── developer.rs  # Developer PDA
│       │           │   ├── round.rs      # Idea round PDA
│       │           │   ├── idea.rs       # Idea submission PDA
│       │           │   └── contribution.rs # Contribution record
│       │           ├── instructions/     # Instruction handlers
│       │           │   ├── register.rs   # Developer registration
│       │           │   ├── create_round.rs
│       │           │   ├── submit_idea.rs
│       │           │   └── record_contribution.rs
│       │           └── errors.rs         # Custom errors
│       ├── tests/                # Program tests
│       └── Anchor.toml
├── packages/
│   ├── types/                    # Shared TypeScript types
│   │   ├── idl.ts                # Auto-generated IDL types
│   │   ├── api.ts                # API request/response types
│   │   └── domain.ts             # Domain model types
│   └── utils/                    # Shared utilities
│       ├── contribution-score.ts # Scoring formula
│       └── solana-helpers.ts     # Common Solana operations
├── turbo.json
├── pnpm-workspace.yaml
└── .planning/                    # GSD planning docs
```

### Structure Rationale

- **apps/web/**: Single Next.js app handles both frontend and API. Server Actions and API routes replace the need for a separate backend.
- **programs/community-hub/**: Anchor workspace isolated from frontend. IDL auto-generated on build, copied to `apps/web/anchor-idl/`.
- **packages/types/**: Shared types prevent drift between frontend and program. IDL types auto-generated from Anchor.
- **packages/utils/**: Contribution scoring formula shared between frontend (display) and potential backend verification.

## Data Flow

### Authentication Flow (SIWS)

```
User clicks "Connect Wallet"
    ↓
wallet-adapter opens Phantom/Solflare
    ↓
User approves connection → wallet address available
    ↓
Frontend requests nonce from API → stored in session
    ↓
Frontend constructs SIWS message with nonce
    ↓
wallet.signMessage(siwsMessage) → signature
    ↓
POST /api/auth/siws with { message, signature }
    ↓
Server verifies signature with ed25519 → valid?
    ↓
NextAuth creates JWT session → cookie set
    ↓
User authenticated (wallet = identity)
```

### Idea Submission Flow

```
User writes idea in frontend form
    ↓
Frontend sends to API (off-chain) → PostgreSQL (full content)
    ↓
Frontend calls Anchor program → create Idea PDA (on-chain)
    PDA seeds: [round_pubkey, author_wallet, idea_index]
    PDA data: { author, round, timestamp, content_hash }
    ↓
Helius webhook detects Idea PDA creation
    ↓
Webhook handler links on-chain PDA to off-chain record
    ↓
Idea visible in round with verified on-chain anchor
```

### Voting Flow

```
Round deadline reached → Round moves to VOTING state
    ↓
Frontend loads proposals from SPL Governance
    ↓
User selects vote (Yes/No/Abstain)
    ↓
wallet.signTransaction() → SPL Governance CastVote instruction
    ↓
On-chain: VoteRecord created, voter weight applied ($GSD balance)
    ↓
Vote tipping: if threshold met early, proposal can pass
    ↓
After voting period: proposal state = Succeeded or Defeated
    ↓
Helius webhook syncs result to off-chain DB
```

### Revenue Distribution Flow

```
Revenue event detected (SOL/USDC received at treasury)
    ↓
Revenue Split Program triggered
    ↓
60% → Developer pool (weighted by contribution scores)
    ↓
    For each developer:
        share = (developer_contribution_weight / total_weight) * pool
        ↓
        SOL transferred to developer wallet
    ↓
20% → DAO treasury (Squads multisig)
    ↓
10% → Buy-and-burn
    ↓
    CPI to Jupiter DEX: swap SOL/USDC for $GSD
    ↓
    Transfer $GSD to burn address (0x000...dead)
    ↓
    Burn event recorded on-chain
    ↓
10% → Maintenance fund
```

## On-Chain vs Off-Chain Decisions

| Data | Location | Rationale |
|------|----------|-----------|
| **Developer identity (PDA)** | On-chain | Verifiable, tamper-proof, wallet-anchored. Core trust mechanism. |
| **Contribution records** | On-chain (compressed) | Verifiable history. Use State Compression for cost efficiency. |
| **Contribution scores** | On-chain | Must be verifiable for revenue distribution. Stored in developer PDA. |
| **Vote records** | On-chain | SPL Governance handles natively. Transparent by default. |
| **Idea content (full text)** | Off-chain (PostgreSQL) | Too expensive on-chain. Store content hash on-chain for integrity verification. |
| **User profiles (display name, bio)** | Off-chain (PostgreSQL) | Mutable, potentially large. Link to on-chain PDA via wallet address. |
| **Round metadata** | On-chain (PDA) | Start/end timestamps, status, submission count. Small, critical for governance. |
| **Comments/discussions** | Off-chain (PostgreSQL) | High volume, low verification need. Not worth on-chain cost. |
| **Revenue distribution records** | On-chain | Must be auditable. Every split transaction verifiable. |
| **Token burn events** | On-chain | Transparency is the point. Community must verify burns. |

## Architectural Patterns

### Pattern 1: PDA-Based Identity (Developer Registry)

**What:** Each developer wallet maps to exactly one PDA storing their on-chain identity and contribution data.

**When to use:** Anywhere you need wallet-verified, on-chain state per user.

**Trade-offs:** PDAs are deterministic (good for lookup) but require rent-exempt SOL deposit. State Compression mitigates storage cost for contribution records within the PDA.

```rust
// PDA derivation
#[account(
    init,
    payer = authority,
    space = Developer::SIZE,
    seeds = [b"developer", authority.key().as_ref()],
    bump
)]
pub developer: Account<'info, Developer>,
```

### Pattern 2: Content Hash Anchoring

**What:** Store full content off-chain (PostgreSQL), store SHA-256 hash on-chain for integrity verification.

**When to use:** For any data too large or too frequently updated for on-chain storage (ideas, proposals, profiles).

**Trade-offs:** Adds verification step (hash comparison) but saves 99%+ in on-chain costs.

### Pattern 3: CPI Composition (SPL Governance Integration)

**What:** GSD Hub Program makes Cross-Program Invocations to SPL Governance for voting operations.

**When to use:** When extending SPL Governance with custom logic (time-bounded rounds, quadratic voting plugin).

**Trade-offs:** CPI depth limited to 4 levels on Solana. Each CPI adds ~5000 compute units. Plan instruction chains carefully.

### Pattern 4: Webhook-Driven Sync

**What:** Helius webhooks push on-chain events to API endpoint, which updates PostgreSQL.

**When to use:** For keeping off-chain database in sync with on-chain state.

**Trade-offs:** ~1-3 second delay from on-chain event to DB update. Must handle missed webhooks (polling fallback).

## Anti-Patterns to Avoid

### Anti-Pattern 1: Full Content On-Chain

**What people do:** Store complete idea descriptions, comments, profile bios on-chain.
**Why bad:** Solana rent = 6,960 lamports/byte for 2 years. A 1000-character idea = ~0.007 SOL. At 10,000 ideas = 70 SOL. Unsustainable.
**Instead:** Content hash on-chain, full content in PostgreSQL. Verify integrity via hash comparison when needed.

### Anti-Pattern 2: Client-Side Governance Logic

**What people do:** Compute vote weights, check eligibility, tally results in the frontend.
**Why bad:** Trivially manipulable. Any governance logic in the client can be bypassed.
**Instead:** All governance logic on-chain (SPL Governance + custom program). Frontend is view-only.

### Anti-Pattern 3: Polling for On-Chain Changes

**What people do:** Frontend polls Solana RPC every N seconds for state changes.
**Why bad:** Rate-limited, expensive (burns RPC credits), laggy UX.
**Instead:** Helius webhooks push events to backend. WebSocket subscriptions for real-time UI updates. TanStack Query manages cache invalidation.

### Anti-Pattern 4: Single Monolithic Solana Program

**What people do:** Put all logic (registry, rounds, voting, revenue) in one program.
**Why bad:** Exceeds program size limits, impossible to upgrade independently, blast radius of bugs affects everything.
**Instead:** Separate programs communicating via CPI. GSD Hub (registry + rounds), SPL Governance (voting), Revenue Split (distribution).

## Scaling Considerations

| Concern | At 100 users | At 10K users | At 100K+ users |
|---------|--------------|--------------|----------------|
| **RPC calls** | Free Helius tier (1M credits) | Developer tier ($49/mo, 10M credits) | Business tier, dedicated nodes |
| **PostgreSQL** | Single instance | Connection pooling (PgBouncer/Prisma Accelerate) | Read replicas |
| **On-chain storage** | Standard PDAs (~0.002 SOL each) | State Compression essential | ZK Compression for further savings |
| **Contribution records** | Individual PDAs fine | Compressed Merkle trees mandatory | Batched Merkle Trees (ZK Compression V2) |
| **Voting** | SPL Governance handles natively | Token owner records manageable | Consider vote delegation to reduce active voters |
| **Revenue distribution** | Simple loop over contributors | Batched distributions (Solana tx size limits) | Claim-based distribution (users claim, not push) |

### Scaling Priorities

1. **First bottleneck:** RPC rate limits. Mitigate with Helius webhooks, caching, and TanStack Query.
2. **Second bottleneck:** On-chain storage costs. Mitigate with State Compression from day one.
3. **Third bottleneck:** Transaction size limits (1232 bytes). Revenue distribution to 100+ developers needs batched transactions or claim-based model.

## Build Order (Suggested Phases)

Based on architectural dependencies:

1. **Foundation:** Monorepo setup, Anchor program scaffold, Next.js skeleton, wallet connection, SIWS auth, PostgreSQL schema
2. **Identity:** Developer Registry PDA, profile creation, on-chain identity linked to off-chain profile
3. **Idea Pool:** Round creation, idea submission (on-chain PDA + off-chain content), round lifecycle
4. **Governance:** SPL Governance Realm setup with $GSD token, proposal creation, voting integration
5. **Contribution Tracking:** Record contributions on-chain, compute scores, contribution history view
6. **Revenue Sharing:** Split configuration, distribution mechanism, buy-and-burn integration
7. **Integration:** GSD framework connection, webhook sync, full end-to-end testing
8. **Polish:** Dashboard, notifications, UX improvements, security audit

**Rationale:** Each phase builds on the previous. Identity is required before anything else. Idea Pool and Governance can partially overlap. Revenue Sharing requires contribution data from earlier phases.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Helius RPC** | HTTP RPC + Webhooks + DAS API | Primary Solana data provider. Configure webhook endpoints in API routes. |
| **Jupiter DEX** | CPI from Revenue Split Program | For buy-and-burn: swap SOL/USDC → $GSD. Use Jupiter V6 swap API or direct program CPI. |
| **Squads Protocol** | Multisig for treasury | Treasury operations require N-of-M signatures. Configure during Realm setup. |
| **Vercel** | Frontend hosting | Deploy Next.js app. Environment variables for RPC URLs, program IDs. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ API | Next.js Server Actions + API routes | Same deployment. No CORS issues. |
| API ↔ PostgreSQL | Prisma ORM | Type-safe queries. Connection pooling for serverless. |
| API ↔ Solana | @solana/web3.js + @coral-xyz/anchor | RPC calls via Helius endpoint. |
| GSD Hub Program ↔ SPL Governance | CPI (invoke_signed) | Hub program calls governance instructions. Max depth = 4. |
| Revenue Program ↔ Jupiter | CPI for token swap | Atomic swap + burn in single transaction. |
| Helius ↔ API | Webhooks (HTTP POST) | Event-driven sync. Verify webhook signatures. |

## Sources

- [Solana PDA Documentation](https://solana.com/docs/core/pda) -- PDA derivation patterns
- [SPL Governance / Realms Docs](https://docs.realms.today/developer-resources/spl-governance) -- Account hierarchy, voting mechanics
- [Anchor CPI Guide](https://www.anchor-lang.com/docs/basics/cpi) -- Cross-program invocation patterns
- [Solana Web3.js v2 Architecture](https://www.helius.dev/blog/how-to-start-building-with-the-solana-web3-js-2-0-sdk) -- SDK modularity
- [Solana Data Streaming](https://www.helius.dev/blog/solana-data-streaming) -- Webhooks vs WebSocket vs gRPC
- [Anchor + Next.js Monorepo](https://github.com/solana-developers/anchor-web3js-nextjs) -- Project structure reference
- [SolSplits Documentation](https://docs.solsplits.xyz/) -- Revenue splitting on Solana
- [Solana State Compression](https://solana.com/docs/advanced/state-compression) -- Merkle tree storage optimization

---
*Architecture research for: GSD Community Hub -- Decentralized Community Development Platform on Solana*
*Researched: 2026-02-08*
