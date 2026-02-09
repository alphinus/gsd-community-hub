/**
 * Compact codebase summary for AI proposal analysis context.
 *
 * Per research pitfall 4, never send the full codebase to Claude.
 * Instead, provide a prebuilt static summary (5-10KB) covering architecture,
 * on-chain state, instructions, routes, types, and dependencies.
 *
 * This summary is updated per phase, not dynamically at runtime.
 */

/**
 * Returns a prebuilt summary of the GSD Community Hub codebase.
 * Used as context for AI proposal analysis so the AI understands
 * what already exists and can assess impact accurately.
 *
 * @returns Compact codebase summary string (under 10KB)
 */
export async function getCodebaseSummary(): Promise<string> {
  return CODEBASE_SUMMARY;
}

const CODEBASE_SUMMARY = `# GSD Community Hub - Codebase Summary

## Architecture Overview

Monorepo structure:
- programs/gsd-hub/ - Solana on-chain program (Anchor 0.32.1, Rust)
- apps/web/ - Frontend + API (Next.js 16, React 19, TypeScript)
- packages/types/ - Shared TypeScript type definitions (@gsd/types)
- packages/utils/ - Shared utilities: PDA derivation, hashing, scoring (@gsd/utils)

Tech stack: Anchor 0.32.1, Next.js 16, Prisma 7, React 19, Tailwind CSS 4, Zustand 5
Blockchain: Solana (devnet), SPL Token, SPL Account Compression (Merkle trees)
AI: Anthropic Claude API (@anthropic-ai/sdk), Zod structured outputs
Auth: Auth.js v5 with Sign-In With Solana (SIWS)

## On-Chain Program State (gsd-hub)

All state accounts are PDAs (Program Derived Addresses):

### Developer & Contribution State
- DeveloperProfile: Per-developer PDA storing wallet, profile hash, contribution score (u16 0-10000), task count, registration timestamp
- ContributionLeaf: Merkle tree leaf structure for individual contributions (task hash, content hash, verification score, timestamp)

### Governance State
- GovernanceConfig: Singleton config for governance parameters (quorum types, round durations, veto authority)
- IdeaRound: Time-bounded round for idea submissions (status: Submission/Voting/Ended, idea count, timestamps)
- Idea: Individual governance proposal (title hash, author, round reference, vote weights, status)
- VoteDeposit: Token escrow for voting power (deposited amount, timelock, eligible timestamp)
- VoteRecord: Individual vote cast on an idea (vote type: Yes/No/Abstain, weight, timestamp)

### Revenue State
- RevenueConfig: Singleton config for revenue distribution (share percentages, burn rate, minimum thresholds)
- RevenueEvent: Individual revenue distribution event (total amount, share calculations, vault reference)
- RevenueClaim: Per-developer claim for a revenue event (amount, claimed status, timestamp)

### Verification State
- VerificationConfig: Singleton config for verification parameters (weights, thresholds, version)
- VerificationReport: Per-task verification result (score, confidence, report hash, verification type AI/Peer)
- PeerReview: Individual peer review record (reviewer, score, evidence hash, tier weight)
- ReviewerProfile: Per-reviewer stats (tier 1-3, total reviews, domain experience, quality score)

## Anchor Instructions

### Profile & Contribution
- register: Create DeveloperProfile PDA for new developer
- update_hash: Update developer's off-chain profile content hash
- update_score: Update developer's contribution score (admin/verification authority)
- init_contribution_tree: Initialize SPL Account Compression Merkle tree for contributions
- record_contribution: Append contribution leaf to Merkle tree

### Governance
- init_governance_config: Initialize governance singleton config
- create_round: Create new idea submission round
- submit_idea: Submit idea to an active round
- transition_round: Move round between phases (Submission -> Voting -> Ended)
- deposit_tokens: Deposit $GSD tokens for voting power (with timelock)
- withdraw_tokens: Withdraw tokens after timelock expires
- cast_vote: Vote on an idea (Yes/No/Abstain with token weight)
- relinquish_vote: Remove a cast vote
- veto_idea: Authority vetoes a technically infeasible idea

### Revenue
- init_revenue_config: Initialize revenue distribution config
- record_revenue_event: Record a new revenue distribution event
- claim_revenue_share: Developer claims their share of a revenue event
- execute_burn: Execute buy-and-burn of $GSD tokens from revenue

### Verification
- init_verification_config: Initialize verification system config
- submit_verification: Record AI verification result on-chain
- submit_peer_review: Record individual peer review
- finalize_peer_verification: Finalize peer review after consensus reached

## Frontend Routes

- /profile - Developer profile registration and management
- /profile/[wallet] - Public developer profile view with contribution history
- /explore - Developer directory with search and filtering
- /governance - Governance dashboard (rounds, ideas, voting)
- /governance/rounds/[id] - Individual round with idea list and voting
- /governance/deposit - Token deposit for voting power
- /treasury - Treasury dashboard (balance, revenue, distributions, claims)
- /transparency - Project transparency page with changelog

## API Surface

### Auth
- POST /api/auth/[...nextauth] - Auth.js SIWS authentication
- POST /api/auth/signin-input - Solana sign-in input generation

### Profile
- GET/POST /api/profile - Current user profile
- GET /api/profile/[wallet] - Public profile by wallet
- GET /api/directory - Paginated developer directory

### Contributions
- GET /api/contributions - List contributions (paginated)
- GET /api/contributions/[wallet] - Contributions by wallet

### Governance
- GET/POST /api/governance/rounds - List/create idea rounds
- GET /api/governance/rounds/[id] - Round details
- GET/POST /api/governance/rounds/[id]/ideas - List/submit ideas for a round
- GET/POST /api/governance/votes - List/cast votes
- POST /api/governance/deposit - Token deposit management

### Revenue
- GET /api/revenue/events - Revenue distribution events
- GET /api/revenue/claims - Revenue claims for a developer
- POST /api/revenue/distribute - Trigger revenue distribution (admin)
- GET /api/revenue/burns - Buy-and-burn history
- GET /api/revenue/summary - Revenue dashboard summary

### Treasury
- GET /api/treasury - Treasury balance and transaction history

### Transparency
- GET /api/transparency - Project transparency data
- GET /api/transparency/changelog - Platform changelog

### Webhooks
- POST /api/webhooks/helius - Helius webhook receiver (contribution, governance, revenue indexing)

## Type Packages (@gsd/types)

Shared TypeScript types across the monorepo:
- profile.ts: DeveloperProfile, ProfileFormData, ProfileResponse
- contribution.ts: Contribution, ContributionLeaf, ContributionScore (verificationScore: u16 0-10000)
- governance.ts: IdeaRound, Idea, Vote, VoteDeposit, GovernanceConfig, RoundStatus, VoteType
- revenue.ts: RevenueConfig, RevenueEvent, RevenueClaim, DistributionResult, BurnResult
- verification.ts: VerificationReport, VerificationConfig, VerificationType (AI/Peer), VerificationStatus
- review.ts: PeerReview, ReviewerProfile, ReviewerTier (Explorer/Builder/Architect), ConsensusResult
- treasury.ts: TreasuryBalance, TreasuryTransaction

## External Dependencies

- Solana: On-chain program execution, PDA accounts, SPL Token, SPL Account Compression
- Helius: Webhook-based transaction indexing for off-chain database sync
- Jupiter: DEX aggregator for buy-and-burn swap execution
- Anthropic Claude: AI verification engine (task scoring) and proposal analysis (feasibility assessment)
- PostgreSQL (via Prisma 7): Off-chain data storage for profiles, contributions, governance, revenue, verification reports
`;
