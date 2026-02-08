# Project Research Summary

**Project:** GSD Community Hub
**Domain:** Decentralized community development platform on Solana with token-based governance and contribution-weighted revenue sharing
**Researched:** 2026-02-08
**Confidence:** MEDIUM-HIGH

## Executive Summary

GSD Community Hub is a DAO governance and contribution-tracking platform built on Solana, designed to transition the $GSD memecoin into a genuinely useful tool. The research reveals this is fundamentally a trust-rebuilding mission in a hostile environment: the community has rug fear from the selloff, the market is saturated with failed "utility pivots," and every architectural decision must prioritize transparency and security over speed.

The recommended approach is an opinionated stack combining Anchor programs for on-chain logic, SPL Governance for voting infrastructure, Next.js for the frontend, and Solana State Compression for cost-efficient contribution tracking. The critical insight from research is that **the platform must be genuinely useful without requiring $GSD ownership**. Token integration should be additive (enhanced voting power, revenue sharing eligibility) not restrictive (paywalls, access gates). The differentiating features — time-bounded idea rounds, contribution-weighted revenue sharing, and integrated AI verification — have no single direct competitor but require careful execution to avoid perception of "forced utility."

The highest risks are security vulnerabilities in on-chain programs (average 1.4 critical issues per audit), governance attacks via low voter turnout (17% average DAO participation), and securities classification from the revenue-sharing mechanism. Mitigation requires professional security audits before every mainnet deployment, time-locked voting with multisig veto councils, and legal counsel review of revenue distribution design. The project must lead with working open-source software and defer token integration until Phase 3+ to avoid the "desperation pivot" perception that kills similar projects.

## Key Findings

### Recommended Stack

The Solana JavaScript ecosystem is in a major transition from `@solana/web3.js` v1 to `@solana/kit` (v3.x), but Anchor 0.32.1 only supports v1. This creates a hard constraint: use web3.js v1 now, plan migration to Kit when Anchor adds native support. This is the single most important stack decision — getting it wrong means fighting dependency conflicts throughout development.

**Core technologies:**
- **Anchor 0.32.1 + Rust 1.91.1**: Solana program framework with automatic security validations, IDL generation, and TypeScript client support — the dominant choice for Solana smart contracts
- **Next.js 16 + React 19**: Modern full-stack framework with App Router, Server Components, and built-in API routes — eliminates need for separate backend
- **@solana/wallet-adapter-react 0.15.x**: Battle-tested wallet connection library supporting Phantom, Solflare, Backpack — proven across hundreds of dApps
- **SPL Governance (Realms)**: Production-ready DAO governance infrastructure with proposals, voting, and treasury management — used by major Solana DAOs
- **Solana State Compression**: Merkle tree-based storage achieving 99.9% cost reduction (5 SOL vs 12,000 SOL for 1M records) — essential for contribution tracking at scale
- **PostgreSQL + Prisma**: Off-chain storage for idea content, comments, and cached on-chain data — relational model fits contribution/round/proposal relationships better than NoSQL
- **Helius RPC + Webhooks**: Solana-native RPC provider with enhanced APIs, transaction parsing, and event streaming — superior to generic RPC for Solana-specific needs

**Critical version compatibility:**
- `@coral-xyz/anchor@0.32.1` requires `@solana/web3.js@1.x`
- `@solana/spl-token@0.4.x` compatible with web3.js v1 (not Kit)
- Next.js 16 defaults to Turbopack bundler (no manual webpack config)
- Tailwind CSS 4 integrated with shadcn/ui component library

### Expected Features

**Must have (table stakes):**
- **Wallet authentication via SIWS**: Every Solana dApp requires wallet-based identity — users expect Phantom/Solflare integration, not email/password
- **On-chain developer profiles (PDA-based)**: Persistent identity tied to wallet showing contribution history — without this, contribution tracking has nothing to anchor to
- **Proposal creation with time-bounded rounds**: Standard across DAO platforms, but GSD adds urgency through submission deadlines — prevents "100 open proposals nobody reads" problem
- **Token-weighted voting**: Standard governance primitive — $GSD holders expect governance power from their tokens
- **Transparent treasury management**: Community's rug fear makes this non-negotiable — Squads multisig with all transactions visible on-chain
- **Contribution history (viewable per developer)**: Public record of verified work — the core trust mechanism
- **Open-source codebase**: Community demands this — closed-source = assumed scam in this context

**Should have (competitive differentiators):**
- **Contribution-weighted revenue sharing (60/20/10/10 split)**: The killer feature — no competitor does end-to-end revenue distribution based on verified on-chain contributions. Coordinape does peer-allocation, Gitcoin does quadratic funding, Colony does reputation-weighted payments, but none combine them with automated splits based on contribution_weight formula
- **Integrated contribution scoring with decay**: Formula combining `sqrt(tasks_completed * verification_score * time_active)` — no competitor combines all three signals with time decay
- **Buy-and-burn tied to revenue events**: 10% of every revenue distribution swaps for $GSD and burns it — creates transparent, verifiable deflationary pressure directly correlated with platform success
- **GSD framework integration**: AI-powered task verification and contribution scoring — no DAO platform integrates an AI execution framework for automated verification
- **Sybil-resistant quadratic voting**: Prevents whale dominance through `sqrt(tokens)` weighting — but requires identity verification (Human Passport) to prevent wallet-splitting attacks

**Defer (v2+):**
- **Quadratic voting**: HIGH complexity, requires robust sybil resistance — defer until identity verification is proven
- **Reputation decay**: Colony-style time-decay where old contributions count less — important for long-term fairness but adds complexity
- **Multi-project workspaces**: Support multiple active projects with separate tracking — v1 can be single workspace
- **Retroactive funding rounds**: Gitcoin-style rewards for past contributions — powerful but requires funded treasury and proven scoring

**Anti-features (explicitly NOT building):**
- **Staking for yield/APY**: Unsustainable tokenomics, regulatory risk — earning comes from contribution, not passive holding
- **Token-gated exclusive chat**: Creates pay-to-play dynamics, fragments community — open community with small anti-spam thresholds only
- **Anonymous voting**: Contradicts transparency mandate, enables hidden whale manipulation — transparent voting IS the trust mechanism

### Architecture Approach

The architecture separates concerns across on-chain programs, off-chain APIs, and frontend layers. On-chain: GSD Community Hub program handles developer registry (PDAs), idea rounds, and contribution records; SPL Governance manages voting and proposals; Revenue Split program (SolSplits or custom) handles distribution and burn triggers. Off-chain: Next.js API routes manage SIWS authentication, PostgreSQL stores full idea content (hashes on-chain), and Helius webhooks sync on-chain events to the database. Frontend: Next.js 16 App Router with wallet-adapter provides the UI, with Zustand for client state and TanStack Query for RPC caching.

**Major components:**
1. **PDA-Based Identity System**: Each developer wallet maps to exactly one PDA storing on-chain identity and contribution data. Deterministic derivation enables lookup without indexing. State Compression stores contribution records within PDAs for cost efficiency.
2. **Content Hash Anchoring**: Full idea content and proposals stored off-chain (PostgreSQL), SHA-256 hash stored on-chain for integrity verification. Saves 99%+ in on-chain costs while maintaining verifiability.
3. **CPI Composition with SPL Governance**: GSD Hub program makes Cross-Program Invocations to SPL Governance for voting operations. Enables custom logic (time-bounded rounds, quadratic plugins) on top of battle-tested governance infrastructure.
4. **Webhook-Driven Sync**: Helius webhooks push on-chain events to API endpoints which update PostgreSQL. Maintains off-chain cache with ~1-3 second delay for fast queries without hammering RPC.

**Monorepo structure (Turborepo + pnpm):**
- `apps/web/`: Next.js 16 frontend + API routes
- `programs/community-hub/`: Anchor workspace for on-chain programs
- `packages/types/`: Shared TypeScript types (IDL-generated + domain models)
- `packages/utils/`: Shared contribution scoring formula, Solana helpers

**Key architectural patterns:**
- Use PDA derivation for deterministic account addresses (registry, rounds, contributions)
- Store only hashes/proofs on-chain, full content off-chain with verification
- Implement CPI carefully (max depth = 4, each CPI costs ~5000 CU)
- Multiple DAS API indexers with failover for compressed data reads
- Connection pooling (PgBouncer/Prisma Accelerate) for serverless PostgreSQL

### Critical Pitfalls

1. **"Utility Nachtraglich" Perception Death Spiral**: The market has antibodies against memecoin-to-utility pivots (11.6M token failures in 2025, mostly failed utility pivots). Prevention: Lead with framework not token, ship working software BEFORE announcing token utility, make platform useful WITHOUT requiring $GSD, open-source everything from day one. The framework must be visible and functional before token integration is even mentioned publicly.

2. **Governance Attack via Low-Turnout Exploitation**: Average DAO participation is 17%, attackers can pass malicious proposals during dormant periods (Synthetify lost $230K). Prevention: Time-locked voting (tokens staked 7-14 days before gaining vote weight to eliminate flash loan attacks), graduated quorum (5% for small proposals, 20%+ for treasury), veto council (3-5 multisig signers can block but not create proposals), mandatory 48-72 hour review period before voting begins.

3. **Revenue Sharing Triggers Securities Classification**: Distributing revenue directly to token holders based on holdings checks all four Howey Test boxes (investment, common enterprise, profit expectation, efforts of others). Prevention: Route revenue to DAO treasury not holders, distribute to CONTRIBUTORS based on verified work (payment for services, not securities), engage crypto-specialized securities attorney before implementing ANY revenue distribution, consider Wyoming DAO LLC wrapper.

4. **Solana Program Security Vulnerabilities**: Average 10 issues per audit with 1.4 High/Critical vulnerabilities, DAOs lost $780M+ in first half of 2025. Prevention: Use Anchor framework exclusively (automatic validation), enable overflow-checks, use canonical PDA bumps only, professional security audit ($30K-$100K) before mainnet deployment, bug bounty program after launch, never skip audit due to budget.

5. **Upgrade Authority as Single Point of Failure**: Default single-wallet upgrade authority can "replace a DEX with a program that withdraws all liquidity to the upgrader's wallet." For a trust-rebuilding project, single-key upgrade = indistinguishable from rug setup. Prevention: Squads multisig (3-of-5 minimum) from day one, cold storage only (no hot wallets), publish upgrade authority address publicly, consider making programs immutable after battle-testing.

**Additional high-severity pitfalls:**
- On-chain storage cost surprises (10,000 contributors with 10 contributions each = 50MB = 348 SOL locked) — mitigate with State Compression from the start
- Quadratic voting broken by Sybil attacks (splitting 10K tokens across 100 wallets = 10x vote amplification) — DO NOT ship quadratic without identity verification
- Contribution tracking gaming (SourceCred's experiment: algorithmic rewards led to performative signals, extraction over value) — layer human review on algorithmic scoring, implement time-weight and decay
- Premature token integration destroys trust (community interprets token-gating as extraction) — platform MUST be fully usable without $GSD in Phases 1-2, token benefits should be additive not restrictive

## Implications for Roadmap

Based on research, the recommended phase structure prioritizes trust-building and security over speed. The critical insight: **defer all token integration until the platform proves its value independently**. Phases 1-2 must be token-optional to avoid the "desperation pivot" perception.

### Suggested Phase Structure

#### Phase 1: Foundation & Authentication (Security-First)
**Rationale:** Trust is earned through transparency and security from day one. The community has rug fear — every deployment decision must prioritize auditability over convenience. This phase establishes the security baseline that all future phases build on.

**Delivers:**
- Monorepo setup (Turborepo + pnpm) with apps/web, programs/, packages/ structure
- Anchor program scaffold with Rust toolchain pinned
- Next.js 16 frontend with wallet-adapter integration (Phantom, Solflare, Backpack)
- SIWS authentication + NextAuth session management
- PostgreSQL + Prisma schema for off-chain data
- Squads multisig configured for program upgrade authority (3-of-5 minimum)
- Developer PDA identity system (one PDA per wallet with profile metadata)
- Professional security audit of initial program

**Addresses:** Wallet authentication (table stakes), on-chain identity (table stakes), open-source commitment (table stakes)

**Avoids:** Pitfall #5 (single-key upgrade authority), Pitfall #10 (wallet drainer attacks through official domain establishment and transaction previews)

**Research flags:** Standard patterns, well-documented — skip deep research. Use existing wallet-adapter guides and Anchor documentation.

---

#### Phase 2: Contribution Tracking (Scale-Conscious)
**Rationale:** Contribution history is the foundation for all revenue sharing and scoring. Must use State Compression from the start — retrofitting compression later requires expensive migration. This phase proves the platform's core value proposition (verified contribution tracking) before introducing governance complexity.

**Delivers:**
- Solana State Compression integration (Merkle trees for contribution records)
- Contribution record PDAs with task completion, verification scores, timestamps
- On-chain contribution history linked to developer PDAs
- Off-chain contribution detail storage (PostgreSQL) with hash anchoring
- Helius webhook integration to sync on-chain events to database
- Frontend contribution dashboard (view history per developer)
- Basic contribution scoring formula: `sqrt(tasks * verification * time_active)`
- Anomaly detection for gaming patterns (unusual contribution spikes, identical PRs)

**Addresses:** Contribution history (table stakes), contribution scoring with decay (differentiator)

**Avoids:** Pitfall #6 (storage cost surprises — State Compression achieves 99.9% savings), Pitfall #8 (contribution gaming through time-weight and human review layer), Pitfall #14 (indexer dependency through multiple DAS API providers)

**Uses:** Solana State Compression, Helius DAS API, PostgreSQL caching

**Research flags:** Phase-specific research needed for Merkle tree sizing calculations and concurrent tree architecture. Standard contribution tracking patterns exist but need Solana-specific optimization.

---

#### Phase 3: Governance & Idea Rounds (Attack-Resistant)
**Rationale:** Governance is where most DAOs fail — either through attacks (Synthetify lost $230K) or apathy (17% average participation). This phase introduces $GSD's first utility (voting power) but only after Phases 1-2 prove the platform works without token requirements. Time-bounded idea rounds differentiate from Realms' open-ended proposals.

**Delivers:**
- SPL Governance Realm creation with $GSD as governance token
- Time-bounded idea round system (custom program on top of SPL Gov)
- Round PDAs with start/end timestamps, submission counts, status tracking
- Idea submission flow (off-chain content in PostgreSQL, hash + metadata on-chain)
- Token-weighted voting integration (simple 1-token-1-vote initially)
- Graduated quorum requirements (5% small, 20% treasury, 33% parameter changes)
- Time-locked voting (tokens staked 7-14 days before gaining vote weight)
- Veto council (3-5 multisig signers can block malicious proposals)
- Proposal review period (48-72 hours before voting begins)
- Voting results and history dashboard

**Addresses:** Time-bounded idea rounds (differentiator), token-weighted voting (table stakes), proposal lifecycle (table stakes), transparent voting history (table stakes)

**Avoids:** Pitfall #2 (governance attacks through time-locks, graduated quorum, veto council)

**Implements:** CPI Composition architecture (GSD Hub → SPL Governance)

**Research flags:** Standard SPL Governance patterns well-documented. Custom voter-weight plugins for future quadratic voting will need phase-specific research when implemented.

---

#### Phase 4: Revenue Mechanics (Legally Compliant)
**Rationale:** Revenue sharing is the killer feature but also the highest legal risk. This phase comes LAST in the MVP sequence because it requires proven contribution data (Phase 2) and established governance (Phase 3). Legal review is non-negotiable — securities classification would be fatal.

**Delivers:**
- Legal counsel review of revenue distribution mechanism (BEFORE implementation)
- Wyoming DAO LLC or equivalent legal entity establishment
- Revenue Split program (evaluate SolSplits vs custom implementation)
- 60/20/10/10 distribution logic (devs/treasury/burn/maintenance)
- Contribution-weight calculation for developer share allocation
- Buy-and-burn mechanism (10% swapped for $GSD via Jupiter, sent to burn address)
- Revenue collection detection and trigger system
- Claim-based distribution model (users claim rewards, not push to all)
- Treasury dashboard with revenue tracking and distribution history
- Transparent burn records (every burn traceable to specific revenue event)

**Addresses:** Contribution-weighted revenue sharing (differentiator), buy-and-burn mechanism (differentiator)

**Avoids:** Pitfall #3 (securities classification through legal counsel review, DAO-treasury model, payment-for-work not passive-income), Pitfall #12 (unsustainable burns through governable burn rate)

**Research flags:** Phase-specific research needed for SolSplits integration reliability, Jupiter CPI patterns, and legal entity options. This is the most legally complex phase — requires crypto-specialized attorney involvement.

---

#### Phase 5: GSD Framework Integration (Automation Layer)
**Rationale:** AI-powered verification is a genuine differentiator but not essential for MVP. This phase enhances the contribution scoring from Phase 2 by automating verification that was previously manual. Deferred until core platform is proven to avoid "AI gimmick" perception.

**Delivers:**
- GSD framework integration for automated task verification
- Verification score attestation on-chain from framework outputs
- Automated code review and contribution quality assessment
- Framework-generated verification scores feeding into scoring formula
- Fallback to manual peer review when framework uncertain
- AI-powered proposal analysis (feasibility, cost estimation, risk assessment)

**Addresses:** GSD framework integration (differentiator), AI proposal analysis (v2+ feature)

**Research flags:** Phase-specific research needed for framework API integration, attestation mechanisms, and reliability thresholds. This is a novel integration with limited prior art.

---

#### Phase 6: Advanced Governance (Identity-Dependent)
**Rationale:** Quadratic voting is a powerful fairness mechanism but ONLY with robust sybil resistance. Without identity verification, quadratic voting is strictly worse than simple token-weighted (wallet-splitting creates 10x vote amplification). This phase requires Phase 3's governance foundation and adds identity layer.

**Delivers:**
- Identity verification integration (Human Passport or equivalent)
- Sybil resistance for wallet clustering detection
- Quadratic voting voter-weight plugin (`sqrt(tokens)` = vote weight)
- Vote delegation system (inactive holders delegate to active contributors)
- Reputation decay implementation (old contributions count less over time)
- Enhanced governance analytics and participation tracking

**Addresses:** Sybil-resistant quadratic voting (differentiator), vote delegation (v1.x feature), reputation decay (v2 feature)

**Avoids:** Pitfall #7 (Sybil attacks through Human Passport integration and wallet clustering detection)

**Research flags:** Phase-specific research needed for Human Passport integration, custom voter-weight plugin development for SPL Governance, and wallet clustering algorithms. Identity verification on blockchain is complex with limited Solana-specific documentation.

---

### Phase Ordering Rationale

**Why this order:**
1. **Foundation first (Phase 1)**: Security and identity cannot be retrofitted. Multisig upgrade authority, SIWS auth, and PDA identity are prerequisites for everything else.
2. **Contribution tracking before governance (Phase 2 → 3)**: Contribution data is the foundation for weighted revenue sharing. Must exist before voting on distributions makes sense.
3. **Governance before revenue (Phase 3 → 4)**: The community must have decision-making power before revenue flows. Launching revenue distribution without governance creates centralized control perception.
4. **Revenue before AI integration (Phase 4 → 5)**: Prove the economic model works with manual verification before adding automation. AI enhancement is optimization, not foundation.
5. **Advanced governance last (Phase 6)**: Quadratic voting and identity verification are complex enhancements to a working governance system. Build simple first, enhance later.

**Why this grouping:**
- Phases 1-2 are token-optional (build trust, no $GSD required)
- Phase 3 introduces first token utility (governance voting)
- Phase 4 introduces second token utility (revenue claim eligibility)
- Phases 5-6 are enhancements to proven systems

**How this avoids pitfalls:**
- Deferred token integration (Phases 1-2 token-free) prevents Pitfall #9 (premature token integration destroying trust)
- Legal review in Phase 4 before revenue launch prevents Pitfall #3 (securities classification)
- Security audits in Phase 1, 2, 3, 4 prevent Pitfall #4 (program vulnerabilities)
- State Compression in Phase 2 prevents Pitfall #6 (storage cost surprises)
- Identity verification in Phase 6 before quadratic voting prevents Pitfall #7 (Sybil attacks)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Contribution Tracking)**: Merkle tree sizing, concurrent tree architecture, DAS API integration patterns — Solana State Compression has niche documentation requiring phase-specific deep dive
- **Phase 4 (Revenue Mechanics)**: Legal entity options, securities compliance, SolSplits reliability — legal landscape is evolving, needs current research
- **Phase 5 (GSD Framework Integration)**: Framework API design, attestation mechanisms — novel integration with no prior art
- **Phase 6 (Advanced Governance)**: Human Passport integration, voter-weight plugins — complex domain with limited Solana-specific documentation

**Phases with standard patterns (skip deep research):**
- **Phase 1 (Foundation)**: Wallet-adapter, Next.js + Anchor monorepo, SIWS — well-documented established patterns
- **Phase 3 (Governance)**: SPL Governance integration, basic voting — Realms documentation comprehensive, standard DAO patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Verified against official docs, npm registry, GitHub releases. The web3.js v1 vs Kit constraint is well-documented. Version compatibility matrix confirmed across sources. |
| **Features** | MEDIUM-HIGH | Competitor analysis across Realms, Snapshot, Coordinape, Gitcoin, Colony, Nouns DAO confirms feature landscape. Quadratic voting on SPL Governance and SolSplits integration flagged for phase-specific validation. |
| **Architecture** | HIGH | PDA patterns, CPI composition, state compression architecture verified in official Solana docs. Monorepo structure matches solana-developers reference implementations. |
| **Pitfalls** | MEDIUM-HIGH | Security vulnerabilities, governance attacks, storage costs verified across multiple high-confidence sources (Helius, Neodyme, official docs). Legal/regulatory findings are MEDIUM confidence due to evolving landscape — requires attorney review. |

**Overall confidence:** MEDIUM-HIGH

The technical stack, architecture patterns, and security pitfalls are well-researched with official source verification. The main uncertainty areas are legal (securities classification, DAO entity options) and novel integrations (GSD framework, Human Passport). These are addressed through phase-specific research flags and attorney engagement requirements.

### Gaps to Address

**Legal and regulatory:**
- Securities classification of revenue-sharing mechanism requires crypto-specialized attorney review (not just general corporate counsel) — flagged for Phase 4 planning
- DAO legal entity options evolving rapidly (Wyoming DAO LLC, Vermont BBLLC, offshore structures) — requires current research during Phase 1
- Token burn mechanisms and tax implications unclear — needs legal/tax counsel input

**Integration specifics:**
- SolSplits long-term stability and maintenance status unknown (LOW confidence from research) — evaluate alongside custom split program option in Phase 4
- Human Passport integration patterns on Solana sparse (mostly EVM documentation) — needs phase-specific research in Phase 6
- GSD framework API not yet designed for on-chain attestation — requires framework architecture work before Phase 5

**Performance and scale:**
- Merkle tree sizing calculations require modeling at 10x expected contributor volume — calculator needed in Phase 2
- Revenue distribution to 100+ developers may hit transaction size limits (1232 bytes) — claim-based vs push-based distribution decision needed in Phase 4
- RPC rate limits and indexer costs at scale unknown — budget model needed based on Helius pricing tiers

**How to handle during planning:**
- **Legal gaps**: Engage attorney before Phase 1 completion, budget $10K-$20K for legal structure and compliance review
- **Integration gaps**: Add phase-specific research tasks for Phases 4, 5, 6 with explicit success criteria
- **Scale gaps**: Create cost and performance models during Phase 2 planning using Solana rent calculations and Helius pricing

## Sources

### Primary (HIGH confidence)
- [Anchor Framework Docs](https://www.anchor-lang.com/docs) — program framework, TypeScript client patterns
- [Solana Core Documentation](https://solana.com/docs) — PDA derivation, state compression, installation
- [SPL Governance / Realms Docs](https://docs.realms.today/developer-resources/spl-governance) — voting mechanics, account hierarchy
- [Next.js 16 Blog](https://nextjs.org/blog/next-16) — framework features, Turbopack default
- npm registry — all package versions verified (@coral-xyz/anchor@0.32.1, @solana/kit@3.0.3, etc.)
- GitHub repositories — Anchor, wallet-adapter, Kit release histories

### Secondary (MEDIUM confidence)
- [Helius Blog](https://www.helius.dev/blog) — Solana SDK transition, testing patterns, program security, data streaming
- [Snapshot DAO Tool Report 2025](https://daotimes.com/snapshot-dao-tool-report-for-2025/) — 96% market share, voting patterns
- [Colony Reputation System](https://docs.colony.io/learn/governance/reputation/) — reputation decay, domain-specific scoring
- [Protocol Guild Documentation](https://protocol-guild.readthedocs.io/en/latest/01-membership.html) — time-weight formula
- [Neodyme Security Blog](https://neodyme.io/en/blog/solana_upgrade_authority/) — upgrade authority risks
- [Squads Protocol](https://squads.so/) — multisig for treasury and upgrades
- [SolSplits Documentation](https://docs.solsplits.xyz/) — revenue splitting protocol

### Tertiary (LOW confidence — needs validation)
- Anchor 1.0 RC mentions in search results NOT confirmed in official changelog (latest is 0.32.1 per official sources)
- SolSplits long-term stability — limited public information, needs deeper evaluation
- ZK Compression V2 launch status (expected Q2 2025 per Accelerate talk) — verify before relying on it
- Legal precedents for DAO revenue distribution — evolving landscape, requires attorney review

### Research Papers and Analysis (MEDIUM confidence)
- [Frontiers: Delegated Voting in DAOs (2025)](https://www.frontiersin.org/journals/blockchain/articles/10.3389/fbloc.2025.1598283/full) — liquid democracy analysis
- [Stanford Digital Repository: Sybil Resistance in Quadratic Voting](https://purl.stanford.edu/hj860vc2584) — wallet-splitting attacks
- [SourceCred/Coordinape Comparison](https://forum.sky.money/t/sourcecred-and-coordinape-tool-comparison/13299) — contribution tracking gaming patterns

---

*Research completed: 2026-02-08*
*Ready for roadmap: Yes*
*Recommended phases: 6 (Foundation, Contribution Tracking, Governance, Revenue, AI Integration, Advanced Governance)*
