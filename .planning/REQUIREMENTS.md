# Requirements: GSD Community Hub

**Defined:** 2026-02-08
**Core Value:** Every contributor's work is tracked on-chain and rewarded proportionally -- if the software succeeds economically, participants earn their fair share based on verified contributions.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Identity

- [ ] **AUTH-01**: User can connect Solana wallet (Phantom, Solflare, Backpack) to access the platform
- [ ] **AUTH-02**: User can authenticate via Sign In With Solana (SIWS) to prove wallet ownership
- [ ] **AUTH-03**: User session persists across browser refresh via JWT/cookie
- [ ] **AUTH-04**: User can create on-chain developer profile (PDA) linked to their wallet
- [ ] **AUTH-05**: User can set display name and bio in their off-chain profile
- [ ] **AUTH-06**: User can view any developer's public profile with contribution history

### Idea Pool & Rounds

- [ ] **IDEA-01**: Admin can create a time-bounded idea round with start and end timestamps
- [ ] **IDEA-02**: User can submit an idea during an open round (on-chain PDA + off-chain content)
- [ ] **IDEA-03**: User can view all ideas within a round, sorted by submission time
- [ ] **IDEA-04**: Round automatically transitions from OPEN to VOTING state when deadline passes
- [ ] **IDEA-05**: Round transitions from VOTING to CLOSED after voting period ends
- [ ] **IDEA-06**: User can view round history with outcomes (approved/rejected ideas)

### Governance & Voting

- [ ] **GOVR-01**: Platform has an SPL Governance Realm configured with $GSD as governance token
- [ ] **GOVR-02**: User can deposit $GSD tokens to gain voting weight in the Realm
- [ ] **GOVR-03**: User can vote Yes/No/Abstain on proposals within a round's voting period
- [ ] **GOVR-04**: Voting weight equals deposited $GSD balance (1 token = 1 vote for v1)
- [ ] **GOVR-05**: Proposals require graduated quorum (5% small, 20% treasury, 33% parameter changes)
- [ ] **GOVR-06**: Voting tokens are time-locked (minimum 7 days staked before gaining vote weight)
- [ ] **GOVR-07**: Approved proposals have mandatory 48-hour timelock before execution
- [ ] **GOVR-08**: Veto council (3-of-5 multisig) can block malicious proposals
- [ ] **GOVR-09**: User can view complete voting history (who voted, how, when) for any proposal
- [ ] **GOVR-10**: User can view their own voting power and active governance positions

### Contribution Tracking

- [ ] **CONT-01**: Contributions are recorded on-chain via Solana State Compression (Merkle trees)
- [ ] **CONT-02**: Each contribution record stores task reference, verification score, and timestamp
- [ ] **CONT-03**: User can view their complete contribution history on their profile
- [ ] **CONT-04**: Contribution score is calculated: sqrt(tasks_completed * verification_score * time_active)
- [ ] **CONT-05**: Contribution scores are stored on-chain in the developer's PDA
- [ ] **CONT-06**: Anyone can verify a developer's contribution history independently on-chain

### Revenue Sharing

- [ ] **REVN-01**: Revenue events are detected when SOL/USDC arrives at the DAO treasury
- [ ] **REVN-02**: Revenue is split according to 60/20/10/10 model (devs/treasury/burn/maintenance)
- [ ] **REVN-03**: Developer share is weighted by contribution score relative to total
- [ ] **REVN-04**: Contributors can claim their revenue share via on-chain transaction
- [ ] **REVN-05**: 10% of revenue triggers buy-and-burn: swap for $GSD on Jupiter, send to burn address
- [ ] **REVN-06**: Every burn event is traceable to its originating revenue event on-chain
- [ ] **REVN-07**: Revenue distribution history is publicly viewable on the treasury dashboard

### Treasury & Transparency

- [ ] **TRSY-01**: DAO treasury uses Squads multisig (3-of-5 minimum)
- [ ] **TRSY-02**: All treasury transactions are visible on-chain and in the platform dashboard
- [ ] **TRSY-03**: Dashboard shows treasury balance, inflows, outflows, and burn totals in real-time
- [ ] **TRSY-04**: Program upgrade authority is a Squads multisig (not single wallet)

### Infrastructure & Security

- [ ] **INFR-01**: All source code is open source on GitHub from day one
- [ ] **INFR-02**: On-chain programs receive professional security audit before mainnet deployment
- [ ] **INFR-03**: Platform is fully usable without owning $GSD tokens (token-optional for Phases 1-2)
- [ ] **INFR-04**: Off-chain data integrity verifiable via on-chain content hashes (SHA-256)
- [ ] **INFR-05**: Helius webhooks sync on-chain events to off-chain database within 3 seconds

## v2 Requirements

Deferred to future release. Mapped to Phases 5-6 in comprehensive roadmap.

### Advanced Governance

- **ADVG-01**: Sybil resistance via Human Passport or equivalent identity verification
- **ADVG-02**: Quadratic voting (sqrt(tokens) = vote weight) with sybil-resistant plugin
- **ADVG-03**: Vote delegation -- inactive holders can delegate to active contributors
- **ADVG-04**: Reputation decay -- old contributions count less over time
- **ADVG-05**: Enhanced governance analytics and participation tracking

### AI Integration

- **AIXT-01**: GSD framework integration for automated task verification
- **AIXT-02**: Verification scores from AI framework feed into contribution scoring formula
- **AIXT-03**: AI-powered proposal analysis (feasibility, cost estimation, risk assessment)
- **AIXT-04**: Fallback to manual peer review when AI verification is uncertain

### Platform Expansion

- **PLAT-01**: Multi-project workspaces with separate contribution tracking
- **PLAT-02**: Retroactive funding rounds for past contributions
- **PLAT-03**: Cross-DAO collaboration (other DAOs use GSD for contribution tracking)
- **PLAT-04**: Notification system (email/webhook/Discord bot for round events, votes, assignments)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Staking for yield/APY | Unsustainable tokenomics, regulatory risk. Earning comes from contribution, not passive holding. |
| Token-gated exclusive chat | Creates pay-to-play dynamics, fragments community. Open community with anti-spam thresholds only. |
| Anonymous voting | Contradicts transparency mandate. Community has rug fear -- transparent voting IS the trust mechanism. |
| Built-in DEX/token swap | Jupiter, Raydium, Orca already exist. Building DEX invites regulatory scrutiny and security liability. |
| Airdrop mechanics | Attracts mercenary capital, not contributors. Post-selloff token airdrops look desperate. |
| Separate governance token | Fragments ecosystem. $GSD IS the governance token -- one token, multiple utilities. |
| Real-time collaborative editing | Enormous complexity, solved by existing tools (Notion, HackMD). |
| NFT rewards/badges | Distraction from revenue sharing. Contribution history IS the badge. |
| Cross-chain governance | $GSD is Solana-only. Cross-chain bridges are security risks. |
| Custom L1/L2 blockchain | Too complex for v1. Prove utility on Solana first. |
| Mobile native app | Web-first, responsive design sufficient. |
| Fiat on/off ramps | External wallets handle this. |
| Automatic proposal execution without timelock | Dangerous -- malicious proposals can drain treasury before review. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

### v1 Requirements (Phases 1-4)

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| IDEA-01 | Phase 3 | Pending |
| IDEA-02 | Phase 3 | Pending |
| IDEA-03 | Phase 3 | Pending |
| IDEA-04 | Phase 3 | Pending |
| IDEA-05 | Phase 3 | Pending |
| IDEA-06 | Phase 3 | Pending |
| GOVR-01 | Phase 3 | Pending |
| GOVR-02 | Phase 3 | Pending |
| GOVR-03 | Phase 3 | Pending |
| GOVR-04 | Phase 3 | Pending |
| GOVR-05 | Phase 3 | Pending |
| GOVR-06 | Phase 3 | Pending |
| GOVR-07 | Phase 3 | Pending |
| GOVR-08 | Phase 3 | Pending |
| GOVR-09 | Phase 3 | Pending |
| GOVR-10 | Phase 3 | Pending |
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 2 | Pending |
| CONT-04 | Phase 2 | Pending |
| CONT-05 | Phase 2 | Pending |
| CONT-06 | Phase 2 | Pending |
| REVN-01 | Phase 4 | Pending |
| REVN-02 | Phase 4 | Pending |
| REVN-03 | Phase 4 | Pending |
| REVN-04 | Phase 4 | Pending |
| REVN-05 | Phase 4 | Pending |
| REVN-06 | Phase 4 | Pending |
| REVN-07 | Phase 4 | Pending |
| TRSY-01 | Phase 1 | Pending |
| TRSY-02 | Phase 1 | Pending |
| TRSY-03 | Phase 3 | Pending |
| TRSY-04 | Phase 1 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Pending |
| INFR-04 | Phase 2 | Pending |
| INFR-05 | Phase 2 | Pending |

### v2 Requirements (Phases 5-6)

| Requirement | Phase | Status |
|-------------|-------|--------|
| AIXT-01 | Phase 5 | Pending |
| AIXT-02 | Phase 5 | Pending |
| AIXT-03 | Phase 5 | Pending |
| AIXT-04 | Phase 5 | Pending |
| ADVG-01 | Phase 6 | Pending |
| ADVG-02 | Phase 6 | Pending |
| ADVG-03 | Phase 6 | Pending |
| ADVG-04 | Phase 6 | Pending |
| ADVG-05 | Phase 6 | Pending |

### v2 Requirements (Deferred beyond Phase 6)

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Deferred | Pending |
| PLAT-02 | Deferred | Pending |
| PLAT-03 | Deferred | Pending |
| PLAT-04 | Deferred | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

- v2 requirements: 13 total
- Mapped to phases 5-6: 9
- Deferred (PLAT): 4

---
*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after roadmap creation*
