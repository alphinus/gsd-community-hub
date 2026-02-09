# Phase 6: Advanced Governance - Research

**Researched:** 2026-02-09
**Domain:** Sybil-resistant quadratic voting, vote delegation, reputation decay, and governance analytics on Solana
**Confidence:** MEDIUM

## Summary

Phase 6 transforms the existing v1 governance system (1 token = 1 vote) into a sybil-resistant quadratic voting system with delegation and reputation decay. The existing `gsd-hub` Anchor program already has a complete governance stack from Phase 3 (GovernanceConfig, IdeaRound, Idea, VoteDeposit, VoteRecord) and a verification/reputation system from Phase 5 (VerificationConfig, VerificationReport, PeerReview, ReviewerProfile). Phase 6 modifies the vote weight calculation, adds identity verification gating, introduces delegation mechanics, applies time-decay to contribution scores, and builds governance analytics.

The central technical challenge is implementing quadratic voting (`sqrt(tokens) = vote_weight`) on-chain in Rust using integer math while simultaneously enforcing sybil resistance. Without sybil resistance, quadratic voting is trivially gamed by splitting tokens across multiple wallets (since `sqrt(N/2) + sqrt(N/2) > sqrt(N)`). The standard approach is to require proof-of-personhood -- verifying each voter represents a unique human -- before applying the quadratic formula. Civic Pass is the dominant identity verification provider on Solana, offering an on-chain Gateway Protocol that programs can verify via CPI or account validation. The `solana_gateway` crate provides `Gateway::verify_gateway_token_account_info()` for on-chain verification in Anchor programs. An alternative is World ID via Wormhole (available on Solana since Q3 2024), though it requires cross-chain verification which adds complexity.

The second major subsystem is vote delegation: allowing inactive token holders to transfer their voting power to active contributors. This requires new on-chain state (DelegationRecord PDA) and modifications to the `cast_vote` instruction to use delegated weight. Delegation must be visible on the governance dashboard and revocable at any time.

The third subsystem is reputation decay: old contributions count less over time, incentivizing sustained participation. The existing contribution score formula (`sqrt(tasks) * totalVerificationScore * sqrt(days) / PRECISION`) does not decay -- it monotonically increases. Phase 6 introduces a time-decay multiplier where each contribution's verification score is weighted by a decay factor based on its age. This requires modifying the off-chain score computation and the `update_contribution_score` instruction pipeline.

**Primary recommendation:** Use Civic Pass (Liveness or ID Verification tier) for sybil resistance via the `solana_gateway` crate on-chain. Implement quadratic vote weight (`isqrt(deposited_amount)`) directly in the `cast_vote` instruction using Rust integer sqrt. Add a DelegationRecord PDA for vote delegation. Implement reputation decay as an exponential half-life decay (`score * 0.5^(age/half_life)`) computed off-chain and written to the DeveloperProfile via the existing `update_contribution_score` instruction. Build governance analytics as read-only off-chain queries over the existing Prisma models.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Anchor | 0.32.1 | On-chain program framework | Already in use. Extend `gsd-hub` with new instructions and state |
| anchor-spl | 0.32.1 | SPL Token CPI helpers | Already in use. No changes needed |
| solana_gateway | latest | Civic Pass on-chain verification | Provides `Gateway::verify_gateway_token_account_info()` for CPI-free gateway token validation. Used by Civic's own workshop examples |
| @civic/solana-gateway-react | latest | React component for Civic Pass verification flow | Frontend identity verification UI. Provides `useGateway` hook and `GatewayProvider` |
| @civic/solana-gateway-ts | latest | Gateway token lookup and verification utilities | Client-side gateway token discovery via `findGatewayToken()` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.0.0 | Async state management for analytics | Already in use. Extend for delegation and analytics queries |
| recharts | latest | Governance analytics charts | Participation trends, voting power distribution, delegation graphs |
| Prisma | ^7.0.0 | Off-chain analytics data layer | Already in use. Add delegation, decay, analytics models |
| Helius webhooks | current | Index new governance events | Already integrated. Add delegation and enhanced vote event processors |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Civic Pass (Liveness) | World ID via Wormhole | World ID has higher sybil resistance (iris biometrics) but requires cross-chain Wormhole verification, adding latency and complexity. Civic is native Solana, simpler integration |
| Civic Pass (Liveness) | Solana Attestation Service (SAS) | SAS is an open permissionless attestation protocol launched 2025 -- Civic is already a SAS provider. Using SAS directly adds abstraction without benefit since Civic is the primary sybil-resistance attestor on SAS |
| Custom gateway check | SPL Governance voter weight plugin (Civic plugin) | The Civic voter weight plugin is designed for SPL Governance Realms. This project uses custom governance, not SPL Governance. Direct gateway token validation is simpler |
| On-chain sqrt (custom) | ra-solana-math crate | ra-solana-math provides isqrt but adds a dependency. Newton's method isqrt is 10 lines of Rust and well-understood. Minimal dependency preferred |
| Exponential decay (off-chain) | On-chain decay computation | On-chain decay requires floating-point emulation or complex fixed-point math per-contribution. Off-chain computation with on-chain aggregate storage (existing pattern) is simpler and cheaper |
| recharts | d3.js | recharts is React-native, simpler API, sufficient for governance dashboards. d3 is more powerful but overkill here |

**Installation:**
```bash
# Anchor program Cargo.toml addition
# solana_gateway = "0.4" (or latest compatible)

# Frontend (in apps/web/)
pnpm add @civic/solana-gateway-react @civic/solana-gateway-ts recharts
```

## Architecture Patterns

### Recommended Project Structure (Phase 6 Additions)
```
programs/
  gsd-hub/
    src/
      state/
        mod.rs                              # Add new state modules
        governance_config.rs                # MODIFY: add quadratic_voting_enabled, civic_gatekeeper_network
        vote_deposit.rs                     # MODIFY: add delegated_to, delegation fields
        delegation_record.rs                # NEW: DelegationRecord PDA
        human_passport.rs                   # NEW: HumanPassport verification record PDA
      instructions/
        mod.rs                              # Add new instructions
        cast_vote.rs                        # MODIFY: quadratic weight + delegation + sybil check
        deposit_tokens.rs                   # MODIFY: sybil verification on first deposit
        delegate_vote.rs                    # NEW: Delegate voting power
        revoke_delegation.rs                # NEW: Revoke delegation
        verify_human.rs                     # NEW: Record Civic Pass verification
        update_governance_config.rs         # NEW: Enable quadratic voting, set gatekeeper network
      errors.rs                             # Extend with delegation and sybil errors

apps/web/
  app/
    (auth)/
      governance/
        delegate/
          page.tsx                          # NEW: Delegation management page
    (public)/
      governance/
        analytics/
          page.tsx                          # NEW: Governance analytics dashboard
        delegates/
          page.tsx                          # NEW: Public delegate directory
        dashboard/
          page.tsx                          # MODIFY: Add delegation info, decayed scores
    api/
      governance/
        delegate/
          route.ts                          # NEW: Delegation CRUD API
        analytics/
          route.ts                          # NEW: Governance analytics API
        human-verification/
          route.ts                          # NEW: Human verification status API
      webhooks/
        helius/
          route.ts                          # EXTEND: Add delegation event processor
  components/
    governance/
      DelegationPanel.tsx                   # NEW: Delegate/revoke UI
      DelegateCard.tsx                      # NEW: Delegate profile card
      DelegateDirectory.tsx                 # NEW: Browse active delegates
      QuadraticVoteDisplay.tsx              # NEW: Shows sqrt(tokens) = weight
      HumanVerificationBadge.tsx            # NEW: Verified human indicator
      GovernanceAnalytics.tsx               # NEW: Analytics charts and stats
      ParticipationChart.tsx                # NEW: Voter turnout over time
      VotingPowerDistribution.tsx           # NEW: Power distribution visualization
      DecayedScoreDisplay.tsx               # NEW: Shows original vs decayed score
  lib/
    governance/
      delegation.ts                        # NEW: Delegation helper functions
      quadratic.ts                         # NEW: Client-side quadratic weight preview
      decay.ts                             # NEW: Reputation decay computation
      analytics.ts                         # NEW: Analytics query functions
    identity/
      civic.ts                             # NEW: Civic Pass gateway configuration
      constants.ts                         # NEW: Gatekeeper network addresses

packages/
  types/src/
    governance.ts                          # EXTEND: Add delegation, quadratic, analytics types
    identity.ts                            # NEW: Identity verification types
  utils/src/
    governance-pda.ts                      # EXTEND: Add delegation PDA derivations
    decay.ts                               # NEW: Decay formula (shared between web and score updater)
```

### Pattern 1: On-Chain Sybil Gate via Civic Pass Gateway Token
**What:** Before a user can vote or deposit tokens for voting, the program verifies they hold a valid Civic Pass gateway token. This prevents one person from creating multiple wallets to amplify quadratic voting power.
**When to use:** Every `cast_vote` and `deposit_tokens` instruction call.

```rust
// In cast_vote instruction accounts
use solana_gateway::Gateway;

#[derive(Accounts)]
pub struct CastVote<'info> {
    // ... existing accounts ...

    /// The voter's Civic Pass gateway token
    /// CHECK: Verified by solana_gateway::Gateway::verify_gateway_token_account_info
    pub gateway_token: UncheckedAccount<'info>,

    #[account(
        seeds = [b"governance_config"],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,
}

pub fn handler(ctx: Context<CastVote>, vote: VoteChoice) -> Result<()> {
    // Verify Civic Pass if quadratic voting is enabled
    if ctx.accounts.governance_config.quadratic_voting_enabled {
        Gateway::verify_gateway_token_account_info(
            &ctx.accounts.gateway_token,
            &ctx.accounts.voter.key(),
            &ctx.accounts.governance_config.civic_gatekeeper_network,
            None, // No expiry check (gateway handles expiry)
        ).map_err(|_| GovernanceError::HumanVerificationRequired)?;
    }

    // Calculate quadratic weight: sqrt(deposited_amount)
    let weight = if ctx.accounts.governance_config.quadratic_voting_enabled {
        isqrt(ctx.accounts.vote_deposit.deposited_amount)
    } else {
        ctx.accounts.vote_deposit.deposited_amount // v1 fallback: 1 token = 1 vote
    };

    // ... rest of voting logic using `weight` ...
    Ok(())
}

/// Integer square root via Newton's method.
/// Returns floor(sqrt(n)) for n >= 0.
fn isqrt(n: u64) -> u64 {
    if n == 0 { return 0; }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}
```

**Key design:** The `quadratic_voting_enabled` flag on GovernanceConfig allows a staged rollout. Phase 6 enables it after Civic Pass integration is complete. The `civic_gatekeeper_network` Pubkey identifies which Civic Pass type to require (Liveness, ID Verification, etc.).

### Pattern 2: Vote Delegation via DelegationRecord PDA
**What:** A token holder delegates their voting power to another wallet. The delegate can vote using the delegator's token weight (quadratic of their combined deposits). Delegation is one-to-one (each holder can delegate to exactly one delegate).
**When to use:** When inactive holders want active contributors to vote on their behalf.

```rust
// programs/gsd-hub/src/state/delegation_record.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DelegationRecord {
    /// The wallet delegating their voting power (32 bytes)
    pub delegator: Pubkey,
    /// The wallet receiving delegated power (32 bytes)
    pub delegate: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Amount of voting power delegated (snapshot at delegation time) (8 bytes)
    pub delegated_amount: u64,
    /// Unix timestamp when delegation was created (8 bytes)
    pub delegated_at: i64,
    /// Whether this delegation is currently active (1 byte)
    pub is_active: bool,
}
// PDA seeds: ["delegation", delegator.key()]
// Total: 8 (disc) + 32 + 32 + 1 + 8 + 8 + 1 = 90 bytes
```

**Delegation semantics:**
- One-to-one: A delegator can delegate to exactly one delegate (PDA seeded by delegator only)
- Full delegation: The delegator's entire deposit is delegated; they cannot vote while delegation is active
- Revocable: The delegator can revoke at any time via `revoke_delegation` instruction
- Non-transitive: A delegate cannot re-delegate received power
- Snapshot: Delegated amount is the deposit at delegation time; if delegator adds more tokens, they must re-delegate

**Cast vote with delegation:**
```rust
// In cast_vote, the voter's effective weight includes received delegations
// Option 1: Simple -- delegate votes with their own deposit + all delegated deposits
// The delegate must pass all DelegationRecord accounts as remaining_accounts
// Option 2: Precomputed -- a separate instruction aggregates delegations into the VoteDeposit

// Recommended: Option 1 with remaining_accounts iteration
pub fn handler(ctx: Context<CastVote>, vote: VoteChoice) -> Result<()> {
    // ... sybil check ...

    // Base weight from voter's own deposit
    let mut total_tokens = ctx.accounts.vote_deposit.deposited_amount;

    // Add delegated tokens from remaining accounts
    for account_info in ctx.remaining_accounts.iter() {
        let delegation = Account::<DelegationRecord>::try_from(account_info)?;
        require!(
            delegation.delegate == ctx.accounts.voter.key(),
            GovernanceError::InvalidDelegation
        );
        require!(delegation.is_active, GovernanceError::DelegationInactive);
        total_tokens = total_tokens
            .checked_add(delegation.delegated_amount)
            .ok_or(GovernanceError::Overflow)?;
    }

    // Apply quadratic formula to total tokens
    let weight = if ctx.accounts.governance_config.quadratic_voting_enabled {
        isqrt(total_tokens)
    } else {
        total_tokens
    };

    // ... record vote with weight ...
    Ok(())
}
```

### Pattern 3: Reputation Decay via Half-Life Exponential Model
**What:** Each contribution's verification score is multiplied by a decay factor based on its age. The formula uses a half-life model: a contribution at age `T` has weight `score * 2^(-T/half_life)`. Computed off-chain, the decayed aggregate is written on-chain.
**When to use:** Every contribution score recalculation.

```typescript
// packages/utils/src/decay.ts

/** Half-life in days -- contribution value halves every 180 days (6 months) */
export const DECAY_HALF_LIFE_DAYS = 180;

/**
 * Calculate the decay multiplier for a contribution of a given age.
 *
 * Uses exponential decay: multiplier = 2^(-age/halfLife)
 *
 * @param ageDays - Age of the contribution in days
 * @param halfLifeDays - Half-life in days (default 180)
 * @returns Multiplier between 0 and 1 (as a number)
 */
export function decayMultiplier(
  ageDays: number,
  halfLifeDays: number = DECAY_HALF_LIFE_DAYS
): number {
  if (ageDays <= 0) return 1.0;
  return Math.pow(2, -ageDays / halfLifeDays);
}

/**
 * Calculate the decayed total verification score for a developer.
 *
 * Each contribution's verification score is weighted by its age-based
 * decay multiplier, then summed.
 *
 * @param contributions - Array of { verificationScore: number, ageDays: number }
 * @param halfLifeDays - Half-life in days (default 180)
 * @returns Decayed total verification score (integer, scaled to match on-chain precision)
 */
export function calculateDecayedScore(
  contributions: Array<{ verificationScore: number; ageDays: number }>,
  halfLifeDays: number = DECAY_HALF_LIFE_DAYS
): bigint {
  let total = 0;
  for (const c of contributions) {
    total += c.verificationScore * decayMultiplier(c.ageDays, halfLifeDays);
  }
  // Round to integer (verification scores are 0-10000)
  return BigInt(Math.round(total));
}
```

**Pipeline:**
1. Cron job (or triggered by new contribution) fetches all contributions for a developer from Prisma
2. For each contribution, compute age in days from `createdAt` to now
3. Apply `decayMultiplier()` to each contribution's verification score
4. Sum to get `decayedTotalVerificationScore`
5. Recompute `contributionScore` using existing formula but with decayed total
6. Call `update_contribution_score` on-chain with new values
7. Helius webhook syncs to off-chain DB

**Why off-chain:** Computing decay per-contribution on-chain would require iterating over all contributions in a single transaction, which exceeds compute limits for active contributors. The existing pattern (off-chain compute, on-chain store) is proven and consistent.

### Pattern 4: Governance Analytics Queries
**What:** Read-only analytics computed from existing Prisma models. No new on-chain state needed.
**When to use:** Governance analytics dashboard.

```typescript
// lib/governance/analytics.ts

export interface GovernanceAnalytics {
  /** Voter turnout rate per round (votes cast / total depositors) */
  turnoutByRound: Array<{ roundIndex: number; turnout: number }>;
  /** Voting power distribution (Gini coefficient, top-10 concentration) */
  powerDistribution: {
    giniCoefficient: number;
    top10Percentage: number;
    totalVoters: number;
  };
  /** Delegation stats */
  delegationStats: {
    totalDelegations: number;
    totalDelegatedTokens: bigint;
    topDelegates: Array<{ wallet: string; delegatorCount: number; totalDelegated: bigint }>;
  };
  /** Participation trends (30/60/90 day rolling averages) */
  participationTrends: {
    period: string;
    avgTurnout: number;
    uniqueVoters: number;
  }[];
  /** Quadratic vs linear vote impact comparison */
  quadraticImpact: {
    whaleReduction: number; // % reduction in top-10 voting power
    smallHolderBoost: number; // % increase in bottom-50 voting power
  };
}
```

**Key metrics:**
- Voter turnout per round: `COUNT(DISTINCT voterWallet) / COUNT(DISTINCT walletAddress FROM VoteDeposit)`
- Voting power Gini coefficient: Standard Gini formula over `depositedAmount` distribution
- Delegation network: Graph of delegator -> delegate relationships
- Quadratic impact: Compare linear vs quadratic weight distributions to show whale reduction

### Anti-Patterns to Avoid
- **Quadratic voting without sybil resistance:** Trivially gamed by splitting tokens. `sqrt(50) + sqrt(50) = 14.14 > sqrt(100) = 10`. MUST have identity verification
- **On-chain sqrt with floating point:** Solana programs have no native float support. Use integer Newton's method only
- **Transitive delegation:** A delegates to B, B delegates to C. Creates complexity and potential cycles. Keep delegation one-hop only
- **Full on-chain decay computation:** Iterating over all contributions per developer in a single transaction will exceed compute limits. Use off-chain computation
- **Storing full delegation graph on-chain:** Only store individual DelegationRecord PDAs. Aggregate in off-chain DB for analytics
- **Making sybil gate mandatory before token deposit:** Allow deposits without Civic Pass (preserves existing flow). Require Civic Pass only when voting with quadratic weight. This avoids blocking token holders who don't want to verify
- **Decaying scores without notifying users:** Decay changes revenue share allocation. Users must see their decayed vs. original scores clearly in the UI

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sybil resistance / proof of personhood | Custom identity verification system | Civic Pass (Liveness tier) via `solana_gateway` crate | KYC/biometric verification is a regulated, complex domain. Civic handles privacy, compliance, and verification infrastructure |
| Gateway token on-chain verification | Custom CPI to gateway program | `solana_gateway::Gateway::verify_gateway_token_account_info()` | One function call. Handles gateway token lookup, expiry, gatekeeper network matching |
| Frontend identity verification flow | Custom verification UI | `@civic/solana-gateway-react` GatewayProvider + IdentityButton | Handles the entire verification flow (iframe, biometric capture, token issuance) |
| Integer square root on-chain | Floating-point approximation or external crate | Newton's method isqrt (10 lines of Rust) | Well-known algorithm. No external dependency. Runs in O(log n) iterations. Compute-efficient |
| Analytics charts | Custom SVG rendering | recharts library | React-native, declarative API, handles responsive, tooltips, animations |
| Decay formula computation | On-chain per-contribution iteration | Off-chain computation via cron + existing `update_contribution_score` pipeline | Proven pattern from Phase 2. Avoids compute limits. Allows complex decay without on-chain constraints |

**Key insight:** Phase 6 modifies *existing* governance mechanics rather than building from scratch. The heaviest new infrastructure is the Civic Pass integration (1 crate + 2 npm packages). Everything else extends proven patterns: new PDA types (DelegationRecord follows VoteDeposit pattern), modified instructions (cast_vote adds sqrt + delegation), off-chain computation (decay follows existing score pipeline).

## Common Pitfalls

### Pitfall 1: Quadratic Voting Without Sybil Resistance Is Worse Than Linear
**What goes wrong:** Deploying `sqrt(tokens)` vote weight without identity verification. Whales split tokens across wallets to amplify power. A whale with 10,000 tokens in one wallet has `sqrt(10000) = 100` weight. Split across 100 wallets of 100 tokens each: `100 * sqrt(100) = 1000` weight -- 10x amplification.
**Why it happens:** Underestimating the attack vector. "We'll add sybil resistance later."
**How to avoid:** Never enable quadratic voting without simultaneous sybil gate. Use the `quadratic_voting_enabled` flag that requires `civic_gatekeeper_network` to be set. Enforce at the smart contract level.
**Warning signs:** Unusual number of new wallets depositing small amounts right before voting periods.

### Pitfall 2: solana_gateway Crate Version Compatibility
**What goes wrong:** The `solana_gateway` crate may depend on `solana-program` v1.x, creating the same version conflict seen with `spl-governance` in Phase 3 (Anchor 0.32.1 uses Solana SDK v2 modular crates).
**Why it happens:** Civic's gateway crate may not be updated for the latest Anchor.
**How to avoid:** Check `solana_gateway` Cargo.toml dependencies before adding. If incompatible, use a manual gateway token account check: pass the gateway token as `UncheckedAccount`, manually deserialize the account data, and validate the expected fields (owner, gatekeeper_network, state = Active, expiry). The gateway token account layout is documented in the Gateway Protocol specification.
**Warning signs:** `cargo build` fails with multiple versions of `solana_program` or `solana-pubkey`.

### Pitfall 3: Delegation Double-Counting
**What goes wrong:** A delegator delegates their 100 tokens to a delegate. The delegator also votes directly. Now the same 100 tokens count twice (once via delegation, once directly).
**Why it happens:** Delegation and direct voting are not mutually exclusive by default.
**How to avoid:** When delegation is active, the delegator's `cast_vote` instruction must reject with `GovernanceError::VotingPowerDelegated`. Check `DelegationRecord.is_active` for the voter in the `cast_vote` instruction. Seeds: `["delegation", voter.key()]` -- if the account exists and `is_active`, reject.
**Warning signs:** Total vote weight for an idea exceeding total deposited tokens.

### Pitfall 4: Delegation Revocation Timing
**What goes wrong:** A delegator revokes delegation mid-round after the delegate has already voted using the delegated power. The delegate's votes now include power the delegator reclaimed.
**Why it happens:** No lockout period for delegation changes during active voting.
**How to avoid:** Option A: Lock delegation changes during active voting rounds (can only delegate/revoke when no rounds are in VOTING status). Option B: Delegation changes take effect only in the next round (epoch-based delegation). Option B is simpler and more predictable. Record `effective_round_index` on DelegationRecord.
**Warning signs:** Delegation revocations clustered right before round closes.

### Pitfall 5: Decay Causing Revenue Share Disruption
**What goes wrong:** Reputation decay reduces contribution scores, which directly affects revenue share calculations (from Phase 4). A contributor who was earning 5% of revenue suddenly drops to 2% without making any changes -- just because time passed.
**Why it happens:** Decay is applied to scores that feed into revenue share proportions.
**How to avoid:** Communicate clearly in UI: show "base score" (no decay) and "effective score" (with decay). Show projected score at 30/60/90 days. Allow users to "refresh" their effective score by completing new verified contributions. Consider a minimum floor (e.g., scores never decay below 10% of their original value) to avoid penalizing early contributors too harshly.
**Warning signs:** Contributor complaints about dropping revenue share. Confusion about why scores decreased.

### Pitfall 6: Integer Overflow in Quadratic + Delegation Weight
**What goes wrong:** When aggregating delegated tokens before applying sqrt, the total could exceed u64 max if many large delegations are combined.
**Why it happens:** Multiple large token holders delegating to one delegate.
**How to avoid:** Use `checked_add` for all delegation aggregation. Consider using u128 for the intermediate sum before taking sqrt. The sqrt result will always fit in u64 since `sqrt(u64::MAX) ≈ 4.29 * 10^9` which fits in u64. But the sum of delegations could theoretically exceed u64 if there are enough large delegators.
**Warning signs:** Overflow errors during vote casting with many delegations.

### Pitfall 7: Civic Pass Expiry and Revalidation
**What goes wrong:** A voter's Civic Pass expires between when they deposited tokens and when they try to vote. The `verify_gateway_token_account_info` call fails.
**Why it happens:** Civic Passes have expiry dates. Liveness pass may need periodic renewal.
**How to avoid:** Frontend checks gateway token validity before allowing vote transaction. Display clear messaging: "Your identity verification has expired. Please re-verify to vote." Provide a "Re-verify" button that launches the Civic Pass flow. Do not check gateway at deposit time -- only at vote time.
**Warning signs:** Voting failures with "HumanVerificationRequired" errors. Users confused about why they can't vote after depositing.

### Pitfall 8: Decay Half-Life Tuning
**What goes wrong:** A half-life that's too short (e.g., 30 days) penalizes anyone who takes a vacation. Too long (e.g., 365 days) doesn't create meaningful incentive for sustained participation.
**Why it happens:** No empirical data for the optimal half-life.
**How to avoid:** Start with 180 days (6 months) as a moderate default. Make the half-life a configurable parameter in GovernanceConfig so it can be adjusted via governance vote. Monitor contribution patterns and adjust. Show decay projections in the UI so contributors understand the impact.
**Warning signs:** Mass score drops causing community backlash. Or: no meaningful score differentiation between active and inactive contributors.

## Code Examples

### GovernanceConfig Extensions
```rust
// MODIFY: programs/gsd-hub/src/state/governance_config.rs
#[account]
#[derive(InitSpace)]
pub struct GovernanceConfig {
    // ... existing fields (admin, veto_authority, governance_token_mint, bump, round_count,
    //                     total_deposited, deposit_timelock, execution_timelock) ...

    /// Whether quadratic voting is enabled (1 byte)
    pub quadratic_voting_enabled: bool,
    /// Civic Pass gatekeeper network for sybil resistance (32 bytes)
    /// Set to Pubkey::default() when quadratic voting is disabled
    pub civic_gatekeeper_network: Pubkey,
    /// Decay half-life in days for reputation scoring (2 bytes)
    pub decay_half_life_days: u16,
}
// New total: 133 (existing) + 1 + 32 + 2 = 168 bytes
// NOTE: Requires realloc of existing GovernanceConfig accounts
```

### DelegationRecord PDA
```rust
// NEW: programs/gsd-hub/src/state/delegation_record.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DelegationRecord {
    /// The wallet delegating their voting power (32 bytes)
    pub delegator: Pubkey,
    /// The wallet receiving delegated power (32 bytes)
    pub delegate: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Amount of voting power delegated (8 bytes)
    pub delegated_amount: u64,
    /// Unix timestamp when delegation was created (8 bytes)
    pub delegated_at: i64,
    /// Whether this delegation is currently active (1 byte)
    pub is_active: bool,
    /// Round index from which this delegation is effective (4 bytes)
    pub effective_from_round: u32,
}
// PDA seeds: ["delegation", delegator.key()]
// Total: 8 (disc) + 32 + 32 + 1 + 8 + 8 + 1 + 4 = 94 bytes
```

### Delegate Vote Instruction
```rust
// NEW: programs/gsd-hub/src/instructions/delegate_vote.rs
use anchor_lang::prelude::*;
use crate::errors::GovernanceError;
use crate::state::{DelegationRecord, GovernanceConfig, VoteDeposit};

#[derive(Accounts)]
pub struct DelegateVote<'info> {
    #[account(
        seeds = [b"governance_config"],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        seeds = [b"vote_deposit", delegator.key().as_ref()],
        bump = vote_deposit.bump,
        constraint = vote_deposit.deposited_amount > 0 @ GovernanceError::NoDeposit,
        constraint = vote_deposit.active_votes == 0 @ GovernanceError::ActiveVotesExist,
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(
        init,
        payer = delegator,
        space = 8 + DelegationRecord::INIT_SPACE,
        seeds = [b"delegation", delegator.key().as_ref()],
        bump
    )]
    pub delegation_record: Account<'info, DelegationRecord>,

    #[account(mut)]
    pub delegator: Signer<'info>,

    /// CHECK: The delegate wallet -- no constraints needed, just stored as pubkey
    pub delegate: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DelegateVote>) -> Result<()> {
    let record = &mut ctx.accounts.delegation_record;
    let clock = Clock::get()?;

    record.delegator = ctx.accounts.delegator.key();
    record.delegate = ctx.accounts.delegate.key();
    record.bump = ctx.bumps.delegation_record;
    record.delegated_amount = ctx.accounts.vote_deposit.deposited_amount;
    record.delegated_at = clock.unix_timestamp;
    record.is_active = true;
    record.effective_from_round = ctx.accounts.governance_config.round_count;

    Ok(())
}
```

### Integer Square Root (On-Chain)
```rust
// In programs/gsd-hub/src/instructions/cast_vote.rs (or a shared utils module)

/// Integer square root via Newton's method.
/// Returns floor(sqrt(n)).
/// Runs in O(log n) iterations, well within Solana compute budget.
pub fn isqrt(n: u64) -> u64 {
    if n == 0 { return 0; }
    if n == 1 { return 1; }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_isqrt() {
        assert_eq!(isqrt(0), 0);
        assert_eq!(isqrt(1), 1);
        assert_eq!(isqrt(4), 2);
        assert_eq!(isqrt(100), 10);
        assert_eq!(isqrt(10000), 100);
        assert_eq!(isqrt(99), 9); // floor(sqrt(99)) = 9
        assert_eq!(isqrt(u64::MAX), 4294967295); // sqrt(2^64 - 1) ≈ 2^32
    }
}
```

### Prisma Schema Extensions
```prisma
// Add to schema.prisma

model Delegation {
  id               String   @id @default(cuid())
  onChainAddress   String   @unique
  delegatorWallet  String   @unique // One delegation per delegator
  delegateWallet   String
  delegatedAmount  BigInt
  isActive         Boolean  @default(true)
  effectiveFromRound Int
  transactionSignature String @unique
  delegatedAt      DateTime
  revokedAt        DateTime?
  createdAt        DateTime @default(now())

  @@index([delegateWallet])
  @@index([isActive])
}

model HumanVerification {
  id                  String   @id @default(cuid())
  walletAddress       String   @unique
  gatekeeperNetwork   String   // Civic Pass type identifier
  verified            Boolean  @default(false)
  verifiedAt          DateTime?
  expiresAt           DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([walletAddress])
}

// MODIFY existing VoteDeposit: no schema change needed,
// delegation is tracked in separate Delegation model

// MODIFY existing Vote: add quadratic weight info
// (No schema change -- weight field already stores the actual weight used)
```

### Governance PDA Derivations (Additions)
```typescript
// EXTEND: packages/utils/src/governance-pda.ts

export const DELEGATION_SEED = "delegation";

/**
 * Derive a DelegationRecord PDA by delegator wallet.
 * Seeds: ["delegation", delegator.key()]
 */
export function getDelegationPDA(
  delegator: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(DELEGATION_SEED), delegator.toBuffer()],
    programId
  );
}
```

### Civic Pass Frontend Integration
```typescript
// lib/identity/civic.ts
import { PublicKey } from "@solana/web3.js";

/**
 * Civic Pass Gatekeeper Network addresses.
 *
 * These identify which type of verification is required:
 * - LIVENESS: Video selfie verification (proves human, not unique identity)
 * - ID_VERIFICATION: Government ID + liveness (proves unique identity)
 *
 * Source: Civic Pass documentation
 * NOTE: Verify these addresses are current at implementation time
 */
export const CIVIC_GATEKEEPER_NETWORKS = {
  /** Liveness pass -- biometric check, lower friction */
  LIVENESS: new PublicKey("uniqobk8oGh4XBLMqM68K8M2zNc3fG7mV4oPHgHNbPk"),
  /** ID Verification -- government ID + liveness + sanctions */
  ID_VERIFICATION: new PublicKey("bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw"),
} as const;

/** Default gatekeeper network for GSD governance */
export const DEFAULT_GATEKEEPER_NETWORK = CIVIC_GATEKEEPER_NETWORKS.LIVENESS;
```

```tsx
// In the governance deposit or vote page:
import { GatewayProvider, IdentityButton } from "@civic/solana-gateway-react";
import { DEFAULT_GATEKEEPER_NETWORK } from "@/lib/identity/civic";

function GovernanceVotePage() {
  const wallet = useWallet();

  return (
    <GatewayProvider
      wallet={wallet}
      gatekeeperNetwork={DEFAULT_GATEKEEPER_NETWORK}
    >
      <IdentityButton />
      {/* Rest of voting UI */}
    </GatewayProvider>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 1 token = 1 vote (linear) | Quadratic voting with sybil resistance | Gaining adoption 2024-2026 | Reduces whale dominance. Requires identity layer |
| No identity verification | Civic Pass (Liveness/ID) on Solana | Civic SAS integration May 2025 | On-chain sybil resistance via gateway protocol. Native Solana |
| No identity on Solana | World ID via Wormhole | Q3 2024 | Cross-chain proof-of-personhood. Higher sybil resistance (iris) but more complex |
| Static contribution scores | Time-decayed scores with half-life | Emerging pattern 2024-2026 | Incentivizes sustained participation. Prevents reputation hoarding |
| No delegation | Token delegation to representatives | Standard in mature DAOs | Increases participation via representatives. Already in SPL Governance via plugins |
| Basic governance dashboards | Rich analytics with participation tracking | DeepDAO, Boardroom standard | Data-driven governance decisions. Transparency into power distribution |
| Clockwork automation | Permissionless crank + cron | Clockwork dead 2023 | Same as Phase 3 -- no change |

**Deprecated/outdated:**
- `spl-governance` Rust crate as Cargo dependency with Anchor 0.32.1 -- still incompatible (solana-program v1 vs v2), same constraint from Phase 3
- Clockwork for automation -- still dead, same as Phase 3
- Custom KYC systems for sybil resistance -- regulated domain, use Civic Pass or World ID

## Open Questions

1. **solana_gateway Crate Compatibility with Anchor 0.32.1**
   - What we know: The `solana_gateway` crate is used in Civic's workshop examples and token-guard. Civic's token-extensions-transfer-hook repo has an Anchor.toml suggesting Anchor usage.
   - What's unclear: Whether the latest `solana_gateway` crate version depends on `solana-program` v1 (like `spl-governance`) or has been updated for v2. This is the same type of version conflict that blocked `spl-governance` in Phase 3.
   - Recommendation: Before implementation, run `cargo add solana_gateway` in the gsd-hub project and check for build errors. If incompatible, implement manual gateway token verification: pass the gateway token as `UncheckedAccount`, deserialize the account data (8-byte discriminator + fields), and validate `owner`, `state`, `gatekeeper_network`, and `expire_time`. The account layout is documented in the Gateway Protocol spec. This fallback avoids the crate dependency entirely.
   - **Confidence:** LOW -- needs validation at implementation time

2. **Civic Pass Gatekeeper Network Addresses**
   - What we know: Civic offers multiple pass types (CAPTCHA, Liveness, ID Verification). Each has a unique gatekeeper network public key.
   - What's unclear: The exact public keys for each gatekeeper network on devnet vs mainnet. The addresses listed in code examples are based on research but may be outdated.
   - Recommendation: Verify addresses from Civic's current documentation at implementation time. Store the gatekeeper network address in `GovernanceConfig` so it can be updated without program redeployment.
   - **Confidence:** LOW -- needs validation

3. **Civic Pass Pricing for DAO Scale**
   - What we know: Civic Pass has free and paid tiers. The pricing page was not accessible during research.
   - What's unclear: Cost per verification for Liveness pass at DAO scale (100-1000 users). Whether there are per-verification fees or monthly subscription.
   - Recommendation: Contact Civic or check their current pricing page. For a small DAO, the free tier may suffice. If costs are prohibitive, consider CAPTCHA pass (lower cost, lower sybil resistance) as a starting point with upgrade path to Liveness.
   - **Confidence:** LOW -- needs validation

4. **Decay Half-Life Optimal Value**
   - What we know: 180 days (6 months) is a moderate starting point. Too short penalizes intermittent contributors, too long doesn't incentivize sustained participation.
   - What's unclear: The optimal value for this specific community. No empirical data exists yet.
   - Recommendation: Start with 180 days. Make configurable via GovernanceConfig (the `decay_half_life_days` field). Plan to adjust based on community feedback after 2-3 months of operation. Show decay projections in the UI so contributors can understand impact before it takes effect.
   - **Confidence:** MEDIUM -- the formula is sound, the parameter needs tuning

5. **Migration from Linear to Quadratic Voting**
   - What we know: Existing VoteDeposit accounts have tokens deposited under the 1-token-1-vote model. Switching to quadratic changes everyone's voting power.
   - What's unclear: Whether to migrate in a single cutover or phase in gradually. How to handle rounds that are in-progress during the transition.
   - Recommendation: Wait for any active rounds to close. Enable quadratic voting on GovernanceConfig. All new rounds use quadratic. Existing deposit accounts don't need migration -- the weight is calculated at vote time, not at deposit time. Communicate the change clearly: "Your 1000 tokens now give you sqrt(1000) = 31.6 voting weight instead of 1000."
   - **Confidence:** HIGH -- the architecture supports this cleanly

6. **Delegation Effective Round vs Immediate**
   - What we know: Delegation that takes effect immediately during a voting round creates a revocation timing attack (delegate, vote, revoke). Epoch-based delegation (effective from next round) is safer.
   - What's unclear: Whether the community will accept a delay in delegation taking effect.
   - Recommendation: Use `effective_from_round` on DelegationRecord. Delegation takes effect starting from the NEXT round after the current `round_count`. This prevents mid-round power shifts while keeping the mental model simple. Display "Delegation will be active starting Round X" in the UI.
   - **Confidence:** HIGH -- this is a well-understood pattern in governance systems

## Sources

### Primary (HIGH confidence)
- Existing codebase: `programs/gsd-hub/src/` -- All on-chain state (GovernanceConfig, VoteDeposit, VoteRecord, DeveloperProfile, VerificationReport, ReviewerProfile) verified by reading source code
- Existing codebase: `apps/web/prisma/schema.prisma` -- All off-chain models verified
- Existing codebase: `packages/utils/src/score.ts` -- Contribution score formula: `sqrt(tasks) * totalVerificationScore * sqrt(days) / PRECISION`
- [SPL Governance addin-api voter_weight.rs](https://github.com/solana-labs/solana-program-library/blob/master/governance/addin-api/src/voter_weight.rs) -- VoterWeightRecord interface: realm, governing_token_mint, governing_token_owner, voter_weight, voter_weight_expiry, weight_action, weight_action_target
- [Helius Solana Arithmetic blog](https://www.helius.dev/blog/solana-arithmetic) -- Integer math best practices: multiply before divide, basis points, checked_arithmetic, no floats
- [Civic Pass workshop (GitHub)](https://github.com/civicteam/solana-civic-pass-workshop/blob/main/programs/gated-airdrop/src/lib.rs) -- `Gateway::verify_gateway_token_account_info()` usage pattern with `UncheckedAccount` gateway token and gatekeeper_network pubkey

### Secondary (MEDIUM confidence)
- [Civic Sybil-Resistant ID Verification docs](https://docs.civic.com/use-cases/communities-and-daos/sybil-resistant-id-verification) -- Civic Pass types (CAPTCHA, Liveness, ID Verification), gateway protocol architecture, verification levels
- [Civic joins Solana Attestation Service](https://www.biometricupdate.com/202505/civic-joins-solana-attestation-service-for-solid-foundation-for-verifiable-credentials) -- SAS integration May 2025, open permissionless attestation protocol
- [World ID on Solana via Wormhole](https://world.org/blog/announcements/wormhole-brings-world-id-solana-new-integrations-take-off-globally) -- Cross-chain World ID verification available since Q3 2024
- [Governor-C: Sybil-Resistant Quadratic Voting (GitHub)](https://github.com/D3LAB-DAO/Governor-C) -- Probabilistic Quadratic Voting (PQV): "splitting voting power makes expected value lower than 1 consolidated vote"
- [D3LAB Chainlink Grant for PQV](https://blog.chain.link/d3lab-chainlink-grant-probabilistic-quadratic-voting/) -- PQV makes sybil attacks unprofitable via probabilistic element + VRF
- [Blockchain Reputation Systems](https://par.nsf.gov/servlets/purl/10300606) -- Time decay mechanisms in blockchain reputation: "newer evaluations are more important," exponential/logarithmic decay functions
- [Quadratic Governance: What's Working](https://research.dorahacks.io/2022/07/11/quadratic-governance/) -- Sybil resistance approaches: KYC, whitelisting, SBTs, zk-identity. "No good way to enforce sybil resistance in QV without identity"
- [DAO Analytics KPIs](https://arxiv.org/html/2601.14927v1) -- Composite sustainability score: Network Participation + Accumulated Funds + Voting Mechanism Efficiency + Decentralization
- [DeepDAO](https://deepdao.io/) -- Industry standard for DAO analytics: treasury, voting, participation, delegation tracking

### Tertiary (LOW confidence -- needs validation)
- `solana_gateway` crate compatibility with Anchor 0.32.1 -- not verified. May have same solana-program v1 vs v2 conflict. Must test at implementation time
- Civic Pass gatekeeper network public key addresses -- based on research but may be outdated. Verify from current Civic docs at implementation time
- Civic Pass pricing -- could not access pricing page. Contact Civic or check updated docs
- `ra-solana-math` crate for isqrt -- could not verify version or Anchor compatibility. Newton's method manual implementation preferred as zero-dependency alternative
- Decay half-life of 180 days -- reasonable starting point based on reputation systems research but no empirical validation for this specific use case

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH -- Core stack extension is proven (Anchor 0.32.1, existing gsd-hub). Civic Pass is well-documented but crate compatibility needs validation
- Architecture: HIGH -- All patterns extend existing Phase 3/5 architecture. DelegationRecord follows VoteDeposit PDA pattern. Decay follows existing off-chain computation pipeline. No novel infrastructure
- Sybil resistance: MEDIUM -- Civic Pass is the clear choice for Solana. Integration pattern is documented in workshop examples. Unknown: crate version compatibility and pricing
- Quadratic voting: HIGH -- Well-understood math. Integer sqrt is trivial. The challenge is sybil resistance, not the sqrt formula
- Delegation: MEDIUM-HIGH -- Standard DAO pattern. PDA design follows existing patterns. Edge cases (timing, revocation) are well-documented in governance literature
- Reputation decay: MEDIUM -- Formula is mathematically sound. Half-life parameter needs empirical tuning. Off-chain computation pipeline is proven
- Pitfalls: HIGH -- Version compatibility, sybil attack vectors, delegation double-counting, and decay disruption are well-understood from governance literature and Phase 3 experience
- Analytics: HIGH -- Pure read-only queries over existing data. No new on-chain state needed

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days -- Civic Pass integration landscape and crate compatibility may shift)
