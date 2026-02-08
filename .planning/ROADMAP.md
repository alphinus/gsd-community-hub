# Roadmap: GSD Community Hub

## Overview

GSD Community Hub transforms the $GSD memecoin into a genuine utility token through a decentralized community development platform on Solana. The roadmap progresses from trust-building foundations (wallet auth, open-source, multisig security) through contribution tracking and governance, to revenue sharing mechanics -- deliberately deferring token integration until Phase 3 to avoid the "desperation pivot" perception. Phases 5-6 extend into AI-powered verification and advanced governance for v2.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Authentication** - Security-first project scaffold with wallet auth, on-chain identity, and multisig governance
- [x] **Phase 2: Contribution Tracking** - On-chain contribution records via State Compression with scoring and verification
- [x] **Phase 3: Governance & Idea Rounds** - Custom governance with time-bounded idea rounds, token-weighted voting, and attack-resistant mechanisms
- [ ] **Phase 4: Revenue Mechanics** - Contribution-weighted revenue sharing with buy-and-burn mechanism
- [ ] **Phase 5: GSD Framework Integration** - AI-powered task verification and automated contribution scoring (v2)
- [ ] **Phase 6: Advanced Governance** - Sybil-resistant quadratic voting, delegation, and reputation decay (v2)

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Developers can connect their Solana wallet, create an on-chain identity, and trust that the platform is secure and transparent from day one
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, TRSY-01, TRSY-02, TRSY-04, INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. User can connect Phantom/Solflare/Backpack wallet and authenticate via SIWS, with session persisting across browser refresh
  2. User can create an on-chain developer profile (PDA) linked to their wallet, with display name and bio
  3. User can view any developer's public profile page showing their wallet address and profile information
  4. All program upgrade authority is controlled by Squads multisig (3-of-5), verifiable on-chain -- no single wallet controls deployments
  5. Platform source code is publicly available on GitHub and the platform is fully usable without owning $GSD tokens
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md -- Monorepo scaffold + Anchor program with developer profile PDA
- [x] 01-02-PLAN.md -- Next.js web app with wallet connection, SIWS auth, and database
- [x] 01-03-PLAN.md -- Developer profiles (create/edit/view) and public directory
- [x] 01-04-PLAN.md -- Transparency page with multisig details and public changelog

### Phase 2: Contribution Tracking
**Goal**: Every developer's work is recorded on-chain with verifiable history and transparent scoring, forming the foundation for fair revenue distribution
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, INFR-04, INFR-05
**Success Criteria** (what must be TRUE):
  1. Contributions are recorded on-chain via Solana State Compression (Merkle trees) with task reference, verification score, and timestamp
  2. User can view their complete contribution history on their profile page, and anyone can independently verify it on-chain
  3. Contribution scores are calculated using the formula sqrt(tasks_completed * verification_score * time_active) and stored on-chain in the developer's PDA
  4. Off-chain contribution data is integrity-verifiable via on-chain SHA-256 content hashes
  5. On-chain events sync to the off-chain database within 3 seconds via Helius webhooks
**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md -- On-chain state structs (ContributionLeaf, TreeConfig, DeveloperProfile extension) and raw CPI helpers
- [x] 02-02-PLAN.md -- Shared TypeScript packages: contribution types, hash utility, and score calculation (TDD)
- [x] 02-03-PLAN.md -- On-chain instructions (init_tree, record_contribution, update_score) with bankrun tests
- [x] 02-04-PLAN.md -- Prisma Contribution model, Helius webhook receiver, indexer, and setup script
- [x] 02-05-PLAN.md -- Contribution API endpoints, UI components, and profile page integration

### Phase 3: Governance & Idea Rounds
**Goal**: $GSD holders can participate in structured governance through time-bounded idea rounds with attack-resistant voting, introducing the token's first real utility
**Depends on**: Phase 2
**Requirements**: IDEA-01, IDEA-02, IDEA-03, IDEA-04, IDEA-05, IDEA-06, GOVR-01, GOVR-02, GOVR-03, GOVR-04, GOVR-05, GOVR-06, GOVR-07, GOVR-08, GOVR-09, GOVR-10, TRSY-03
**Success Criteria** (what must be TRUE):
  1. Admin can create a time-bounded idea round, and users can submit ideas during the open period and view all submissions
  2. Rounds automatically transition through OPEN -> VOTING -> CLOSED states based on deadlines, and users can view round history with outcomes
  3. User can deposit $GSD tokens to gain voting weight (1 token = 1 vote), vote Yes/No/Abstain on proposals, and view complete voting history for any proposal
  4. Governance is attack-resistant: voting tokens require 7-day time-lock, proposals require graduated quorum (5%/20%/33%), approved proposals have 48-hour timelock, and veto council (3-of-5 multisig) can block malicious proposals
  5. Treasury dashboard shows balance, inflows, outflows, and burn totals in real-time, with all transactions visible on-chain
**Plans:** 7 plans

Plans:
- [x] 03-01-PLAN.md -- On-chain governance state accounts (GovernanceConfig, IdeaRound, Idea, VoteDeposit, VoteRecord) and error codes
- [x] 03-02-PLAN.md -- Shared TypeScript governance types, PDA helpers, and Prisma schema extension
- [x] 03-03-PLAN.md -- On-chain round lifecycle instructions (init_config, create_round, submit_idea, transition_round) with bankrun tests
- [x] 03-04-PLAN.md -- On-chain voting instructions (deposit, withdraw, cast_vote, relinquish_vote, veto) with bankrun tests
- [x] 03-05-PLAN.md -- Governance webhook indexer and API endpoints (rounds, ideas, deposits, votes)
- [x] 03-06-PLAN.md -- Governance UI pages (round listing, round detail, idea submission, voting, deposit)
- [x] 03-07-PLAN.md -- Treasury dashboard with real-time balances and transaction history

### Phase 4: Revenue Mechanics
**Goal**: Revenue from successful projects is distributed fairly based on verified contribution history, with transparent burn mechanics that tie token value to platform success
**Depends on**: Phase 3
**Requirements**: REVN-01, REVN-02, REVN-03, REVN-04, REVN-05, REVN-06, REVN-07
**Success Criteria** (what must be TRUE):
  1. When SOL/USDC arrives at the DAO treasury, revenue is automatically split according to the 60/20/10/10 model (devs/treasury/burn/maintenance)
  2. Each contributor's share is weighted by their on-chain contribution score relative to the total, and contributors can claim their share via on-chain transaction
  3. 10% of every revenue event triggers buy-and-burn: $GSD is purchased on Jupiter and sent to a burn address, with every burn traceable to its originating revenue event
  4. Revenue distribution history is publicly viewable on the treasury dashboard, showing all splits, claims, and burns
**Plans:** 5 plans

Plans:
- [ ] 04-01-PLAN.md -- Revenue state accounts, error codes, TypeScript types, PDA helpers, and Prisma models
- [ ] 04-02-PLAN.md -- On-chain revenue instructions (init_config, record_event, claim_share, execute_burn) with bankrun tests
- [ ] 04-03-PLAN.md -- Revenue webhook indexer and API endpoints (events, claims, burns, summary)
- [ ] 04-04-PLAN.md -- Server-side Jupiter buy-and-burn distributor and distribution API endpoint
- [ ] 04-05-PLAN.md -- Revenue claim UI components and treasury dashboard integration

### Phase 5: GSD Framework Integration
**Goal**: AI-powered task verification automates contribution scoring that was previously manual, making the platform's differentiating feature -- framework-integrated development -- real (v2)
**Depends on**: Phase 4
**Requirements**: AIXT-01, AIXT-02, AIXT-03, AIXT-04
**Success Criteria** (what must be TRUE):
  1. GSD framework automatically verifies task completion and generates verification scores that feed into the on-chain contribution scoring formula
  2. AI-powered proposal analysis provides feasibility assessment, cost estimation, and risk assessment for submitted ideas
  3. When AI verification confidence is below threshold, the system falls back to manual peer review with clear indication to the user
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Advanced Governance
**Goal**: Governance evolves from simple token-weighted voting to sybil-resistant quadratic voting with delegation and reputation decay, preventing whale dominance while rewarding sustained participation (v2)
**Depends on**: Phase 5
**Requirements**: ADVG-01, ADVG-02, ADVG-03, ADVG-04, ADVG-05
**Success Criteria** (what must be TRUE):
  1. Users are verified via Human Passport (or equivalent) for sybil resistance, preventing wallet-splitting vote amplification attacks
  2. Voting weight uses quadratic formula (sqrt(tokens) = vote weight), reducing whale dominance while still rewarding token holdings
  3. Inactive token holders can delegate voting power to active contributors, and delegation is visible on governance dashboard
  4. Contribution reputation decays over time so old contributions count less, incentivizing sustained participation
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation & Authentication | 4/4 | Complete | 2026-02-08 |
| 2. Contribution Tracking | 5/5 | Complete | 2026-02-08 |
| 3. Governance & Idea Rounds | 7/7 | Complete | 2026-02-08 |
| 4. Revenue Mechanics | 0/5 | Planned | - |
| 5. GSD Framework Integration | 0/TBD | Not started | - |
| 6. Advanced Governance | 0/TBD | Not started | - |
