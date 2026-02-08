# Phase 3: Governance & Idea Rounds - Research

**Researched:** 2026-02-08
**Domain:** On-chain governance with time-bounded idea rounds, token-weighted voting, and attack-resistant mechanisms on Solana
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 introduces the $GSD token's first real utility: structured governance through idea rounds with token-weighted voting. The core challenge is integrating three distinct subsystems -- (1) custom idea rounds with state machine lifecycle (OPEN -> VOTING -> CLOSED), (2) token deposit/voting-weight governance, and (3) attack-resistance mechanisms (timelocks, graduated quorum, veto council) -- while working within the existing Anchor 0.32.1 program and the Solana ecosystem's governance tooling.

**Critical architectural finding:** The `spl-governance` Rust crate (v4.0.0) depends on `solana-program` v1.17, while Anchor 0.32.1 uses the Solana SDK v2 modular crates (solana-account-info 2, solana-pubkey 2, etc.). This creates a version incompatibility that prevents adding `spl-governance` as a direct Cargo dependency for CPI calls from the `gsd-hub` Anchor program. The maintained fork (Mythic-Project) has not published updated crates to crates.io that resolve this. This is a hard constraint that shapes the entire architecture.

**The recommended approach is a hybrid architecture:** Build custom idea round lifecycle and token escrow/voting logic directly in the `gsd-hub` Anchor program (extending the existing program), while using the SPL Governance shared instance (`GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`) client-side via the `governance-idl-sdk` TypeScript package for Realm creation and formal proposal execution. Idea rounds and voting happen in the custom program; approved ideas that require on-chain execution (treasury moves, parameter changes) get promoted to SPL Governance proposals for formal execution with timelock. The Squads v4 multisig (already configured from Phase 1) serves as the veto council.

**Primary recommendation:** Extend the existing `gsd-hub` Anchor program with idea round state machine (IdeaRound PDA, Idea PDA, VoteDeposit PDA, VoteRecord PDA) and token escrow instructions, using SPL Governance only for formal proposal execution via client-side SDK. Do not add `spl-governance` as a Rust dependency.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Anchor | 0.32.1 | On-chain program framework | Already in use. Extend `gsd-hub` with governance instructions |
| anchor-spl | 0.32.1 | SPL Token CPI helpers | Token transfer/escrow operations for vote deposits. Compatible with Anchor 0.32.1 |
| spl-token | (via anchor-spl) | Token operations | Token transfers, account creation for vote escrow. Use through anchor-spl, not directly |
| governance-idl-sdk | latest | SPL Governance TypeScript client | Client-side interaction with SPL Governance Realm for formal proposal execution |
| @sqds/multisig | ^2.1.3 | Squads v4 SDK | Veto council operations (already installed from Phase 1) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/spl-token | latest | Token account queries | Client-side token balance checks, ATA creation |
| @tanstack/react-query | ^5.0.0 | Async state management | Caching governance data, round status polling |
| cron (npm) | latest | Cron expression parsing | Optional: if implementing scheduled state transitions server-side |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom voting in gsd-hub | Full SPL Governance CPI | SPL Governance crate incompatible with Anchor 0.32.1 (solana-program v1 vs v2). Would require pinning/patching dependencies, high risk of build failures |
| Custom voting in gsd-hub | Tribeca governance | Tribeca is Anchor-based but uses older Anchor version (0.29.0). Not updated for Anchor 0.32.1. Low maintenance activity |
| Custom voting in gsd-hub | vetoken (ME Foundation) | Vote-escrow model is a good reference pattern, but also uses Anchor 0.29.0. Not compatible without porting |
| governance-idl-sdk | @solana/spl-governance | @solana/spl-governance last published 2+ years ago (v0.3.28). governance-idl-sdk is the actively maintained replacement from Mythic-Project |
| Client-side round transitions | Clockwork/Tuk Tuk automation | Clockwork shut down in 2023. Tuk Tuk (by Helium) is newer but adds complexity. Client-side crank is simpler for v1 |

**Installation:**
```bash
# Anchor program Cargo.toml additions
# anchor-spl = { version = "0.32.1", features = ["token"] }

# Frontend (in apps/web/)
pnpm add governance-idl-sdk @solana/spl-token

# Already installed from Phase 1:
# @sqds/multisig, @solana/web3.js, @coral-xyz/anchor, @tanstack/react-query
```

## Architecture Patterns

### Recommended Project Structure (Phase 3 Additions)
```
programs/
  gsd-hub/
    src/
      state/
        mod.rs                    # Add new state modules
        developer.rs              # Existing
        contribution.rs           # Existing
        merkle_tree.rs            # Existing
        idea_round.rs             # NEW: IdeaRound PDA
        idea.rs                   # NEW: Idea submission PDA
        vote_deposit.rs           # NEW: Token escrow for voting weight
        vote_record.rs            # NEW: Per-user per-idea vote record
        governance_config.rs      # NEW: Global governance configuration
      instructions/
        mod.rs                    # Add new instructions
        register.rs               # Existing
        update_hash.rs            # Existing
        init_contribution_tree.rs # Existing
        record_contribution.rs    # Existing
        update_score.rs           # Existing
        create_round.rs           # NEW: Admin creates idea round
        submit_idea.rs            # NEW: User submits idea to round
        deposit_tokens.rs         # NEW: Deposit $GSD for voting weight
        withdraw_tokens.rs        # NEW: Withdraw after timelock
        cast_vote.rs              # NEW: Vote Yes/No/Abstain
        transition_round.rs       # NEW: Crank round state transitions
        veto_proposal.rs          # NEW: Veto council blocks proposal
      errors.rs                   # Extend with governance errors
      lib.rs                      # Add new instruction handlers
    tests/
      governance.test.ts          # NEW: Governance integration tests
      voting.test.ts              # NEW: Voting mechanism tests

apps/web/
  app/
    (auth)/
      governance/
        page.tsx                  # Governance dashboard
        rounds/
          [id]/
            page.tsx              # Round detail with ideas
        deposit/
          page.tsx                # Token deposit/withdrawal
        history/
          page.tsx                # Voting history
    (public)/
      governance/
        page.tsx                  # Public governance overview
        rounds/
          page.tsx                # Public round listing
          [id]/
            page.tsx              # Public round detail
      treasury/
        page.tsx                  # Treasury dashboard (TRSY-03)
    api/
      governance/
        rounds/
          route.ts                # Round CRUD API
          [id]/
            route.ts              # Single round API
            ideas/
              route.ts            # Ideas within round
        deposit/
          route.ts                # Deposit status API
        votes/
          route.ts                # Vote history API
      treasury/
        route.ts                  # Treasury balance API
      webhooks/
        helius/
          route.ts                # Extend for governance events
  components/
    governance/
      RoundCard.tsx               # Round status display
      IdeaForm.tsx                # Idea submission form
      IdeaList.tsx                # Ideas in a round
      VotePanel.tsx               # Yes/No/Abstain voting
      DepositPanel.tsx            # Token deposit/withdraw
      VotingPowerDisplay.tsx      # Current voting weight
      GovernanceStats.tsx         # Quorum progress, etc.
    treasury/
      TreasuryDashboard.tsx       # Balance, inflows, outflows
      TransactionList.tsx         # On-chain transaction history
  lib/
    governance/
      indexer.ts                  # Helius webhook processor for governance
      constants.ts                # Governance program constants
    treasury/
      client.ts                   # Treasury RPC queries

packages/
  types/src/
    governance.ts                 # NEW: Governance domain types
    treasury.ts                   # NEW: Treasury types
  utils/src/
    governance-pda.ts             # NEW: Governance PDA derivations
```

### Pattern 1: Idea Round State Machine (On-Chain)
**What:** Each idea round is an on-chain PDA with deterministic state transitions based on timestamps.
**When to use:** All round lifecycle management.

```rust
// programs/gsd-hub/src/state/idea_round.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RoundStatus {
    Open,
    Voting,
    Closed,
}

#[account]
#[derive(InitSpace)]
pub struct IdeaRound {
    /// Admin who created the round
    pub authority: Pubkey,           // 32
    /// Unique round index (auto-incremented)
    pub round_index: u32,            // 4
    /// PDA bump
    pub bump: u8,                    // 1
    /// Current round status
    pub status: RoundStatus,         // 1
    /// Unix timestamp: round opens for idea submissions
    pub submission_start: i64,       // 8
    /// Unix timestamp: submissions close, voting begins
    pub submission_end: i64,         // 8
    /// Unix timestamp: voting closes
    pub voting_end: i64,             // 8
    /// Number of ideas submitted
    pub idea_count: u32,             // 4
    /// Quorum type for this round (determines threshold)
    pub quorum_type: QuorumType,     // 1
    /// Content hash of round description/title (off-chain)
    pub content_hash: [u8; 32],      // 32
}
// Total: 8 (disc) + 32 + 4 + 1 + 1 + 8 + 8 + 8 + 4 + 1 + 32 = 107 bytes

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum QuorumType {
    /// 5% of deposited tokens must vote
    Small,
    /// 20% of deposited tokens must vote
    Treasury,
    /// 33% of deposited tokens must vote
    ParameterChange,
}
```

**PDA seeds:** `["idea_round", round_index.to_le_bytes()]`

**State transition logic:**
```rust
// In transition_round instruction handler:
pub fn handler(ctx: Context<TransitionRound>) -> Result<()> {
    let round = &mut ctx.accounts.idea_round;
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    match round.status {
        RoundStatus::Open => {
            require!(now >= round.submission_end, GovernanceError::TooEarly);
            round.status = RoundStatus::Voting;
        }
        RoundStatus::Voting => {
            require!(now >= round.voting_end, GovernanceError::TooEarly);
            round.status = RoundStatus::Closed;
        }
        RoundStatus::Closed => {
            return Err(GovernanceError::AlreadyClosed.into());
        }
    }
    Ok(())
}
```

**Key design:** State transitions are permissionless "crank" calls. Anyone can call `transition_round` after the deadline passes. The program validates timestamps on-chain. No automation service needed -- the frontend can trigger transitions when users interact, or a simple cron job can call them.

### Pattern 2: Token Escrow for Voting Weight
**What:** Users deposit $GSD tokens into a program-controlled escrow PDA. After a 7-day timelock, deposited tokens grant voting weight (1 token = 1 vote).
**When to use:** All governance voting operations.

```rust
// programs/gsd-hub/src/state/vote_deposit.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VoteDeposit {
    /// The wallet that deposited tokens
    pub authority: Pubkey,           // 32
    /// PDA bump
    pub bump: u8,                    // 1
    /// Amount of $GSD tokens deposited
    pub deposited_amount: u64,       // 8
    /// Unix timestamp of initial deposit
    pub deposit_timestamp: i64,      // 8
    /// Unix timestamp when tokens become vote-eligible (deposit + 7 days)
    pub eligible_at: i64,            // 8
    /// Number of active votes (must be 0 to withdraw)
    pub active_votes: u32,           // 4
}
// Total: 8 (disc) + 32 + 1 + 8 + 8 + 8 + 4 = 69 bytes
```

**PDA seeds:** `["vote_deposit", authority.key()]`

**Escrow token account:** A PDA-controlled associated token account holds the actual $GSD tokens.

```rust
// Deposit instruction (simplified)
pub fn deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
    let deposit = &mut ctx.accounts.vote_deposit;
    let clock = Clock::get()?;

    // Transfer tokens from user ATA to escrow ATA
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    deposit.deposited_amount = deposit.deposited_amount.checked_add(amount)
        .ok_or(GovernanceError::Overflow)?;

    // If first deposit, set timelock
    if deposit.deposit_timestamp == 0 {
        deposit.deposit_timestamp = clock.unix_timestamp;
        deposit.eligible_at = clock.unix_timestamp + (7 * 24 * 60 * 60); // 7 days
    }

    Ok(())
}
```

**Withdrawal constraint:** Tokens can only be withdrawn when `active_votes == 0` AND current time > all vote periods the user participated in have ended.

### Pattern 3: Vote Record Per-User Per-Idea
**What:** Each vote creates a VoteRecord PDA that prevents double-voting and stores the vote choice and weight.
**When to use:** Every vote cast.

```rust
// programs/gsd-hub/src/state/vote_record.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    /// The voter's wallet
    pub voter: Pubkey,               // 32
    /// The idea being voted on
    pub idea: Pubkey,                // 32
    /// The round this vote belongs to
    pub round: Pubkey,               // 32
    /// PDA bump
    pub bump: u8,                    // 1
    /// Vote choice
    pub vote: VoteChoice,            // 1
    /// Voter's weight at time of voting
    pub weight: u64,                 // 8
    /// Unix timestamp of vote
    pub voted_at: i64,               // 8
}
// Total: 8 (disc) + 32 + 32 + 32 + 1 + 1 + 8 + 8 = 122 bytes
```

**PDA seeds:** `["vote_record", voter.key(), idea.key()]` -- guarantees uniqueness (one vote per user per idea).

### Pattern 4: Graduated Quorum Validation
**What:** Different proposal types require different quorum thresholds.
**When to use:** When finalizing round results.

```rust
impl QuorumType {
    /// Returns required quorum as basis points (e.g., 500 = 5%)
    pub fn required_bps(&self) -> u64 {
        match self {
            QuorumType::Small => 500,            // 5%
            QuorumType::Treasury => 2000,        // 20%
            QuorumType::ParameterChange => 3300, // 33%
        }
    }
}

// In round finalization:
fn check_quorum(
    total_deposited: u64,
    total_votes_cast: u64,
    quorum_type: QuorumType,
) -> bool {
    let required = total_deposited
        .checked_mul(quorum_type.required_bps())
        .unwrap()
        .checked_div(10_000)
        .unwrap();
    total_votes_cast >= required
}
```

### Pattern 5: Veto Council via Squads Multisig
**What:** The existing 3-of-5 Squads multisig serves as veto council. Veto is implemented as a program instruction that only the multisig vault PDA can sign.
**When to use:** When blocking malicious proposals during the 48-hour timelock.

```rust
// Veto instruction -- only callable by the Squads multisig vault
#[derive(Accounts)]
pub struct VetoIdea<'info> {
    #[account(
        mut,
        seeds = [b"idea", round.key().as_ref(), &idea.idea_index.to_le_bytes()],
        bump = idea.bump,
    )]
    pub idea: Account<'info, Idea>,

    pub round: Account<'info, IdeaRound>,

    /// The Squads multisig vault PDA -- must match stored veto authority
    #[account(
        constraint = veto_authority.key() == governance_config.veto_authority
            @ GovernanceError::UnauthorizedVeto
    )]
    pub veto_authority: Signer<'info>,

    pub governance_config: Account<'info, GovernanceConfig>,
}
```

**Execution flow:** Multisig members propose a veto transaction through the Squads UI/SDK. Once 3-of-5 approve, the Squads vault PDA signs the `veto_idea` instruction.

### Pattern 6: Treasury Dashboard (Client-Side RPC Queries)
**What:** Real-time treasury data fetched via Solana RPC calls, not stored in database.
**When to use:** Treasury dashboard page (TRSY-03).

```typescript
// lib/treasury/client.ts
import { Connection, PublicKey } from "@solana/web3.js";

export async function getTreasuryBalance(
  connection: Connection,
  treasuryPda: PublicKey,
  gsdMint: PublicKey
) {
  // SOL balance
  const solBalance = await connection.getBalance(treasuryPda);

  // $GSD token balance
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    treasuryPda,
    { mint: gsdMint }
  );

  let gsdBalance = 0n;
  for (const { account } of tokenAccounts.value) {
    // Parse token account data for balance
    const data = account.data;
    // SPL Token account layout: amount is at offset 64, 8 bytes LE
    gsdBalance += data.readBigUInt64LE(64);
  }

  return { solBalance, gsdBalance };
}

// Transaction history via Helius enhanced transactions API
export async function getTreasuryTransactions(
  treasuryAddress: string,
  apiKey: string
) {
  const response = await fetch(
    `https://api.helius.xyz/v0/addresses/${treasuryAddress}/transactions?api-key=${apiKey}&type=TRANSFER`
  );
  return response.json();
}
```

### Pattern 7: Permissionless Crank for State Transitions
**What:** Round state transitions (OPEN -> VOTING -> CLOSED) are triggered by permissionless "crank" calls. Anyone can call the instruction after the deadline passes.
**When to use:** Instead of on-chain automation (Clockwork is dead, Tuk Tuk adds complexity).

The frontend checks timestamps and triggers transitions opportunistically:
- When a user loads a round page and deadline has passed, frontend auto-sends transition tx
- A server-side cron job (Next.js API route called by external cron) serves as fallback
- The on-chain program validates timestamps regardless of who calls

### Anti-Patterns to Avoid
- **Adding spl-governance to Cargo.toml:** Version conflict with Anchor 0.32.1 (solana-program v1 vs v2 crates). Use client-side SDK instead
- **Storing idea full text on-chain:** Use content hash anchoring pattern (established in Phase 1-2). Full text goes in PostgreSQL
- **Client-side vote weight calculation:** All voting weight must be validated on-chain. Never trust client-provided weight
- **Single monolithic governance instruction:** Break into separate instructions: create_round, submit_idea, deposit, withdraw, vote, transition, veto
- **Unlimited token deposits without tracking:** Must track deposit timestamps for 7-day timelock, and active vote count for withdrawal restrictions
- **Polling RPC for round status changes:** Use Helius webhooks (already configured) to push governance events to the off-chain database

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPL Token transfers | Manual lamport manipulation | `anchor-spl::token::transfer` | Handles all edge cases, ATA validation, authority checks |
| Token account creation | Manual account allocation | `anchor_spl::associated_token::AssociatedToken` | Correct rent calculation, idempotent creation |
| Multisig veto execution | Custom multi-signature scheme | Squads v4 (`@sqds/multisig`) | Already deployed, audited, supports timelocks. Existing 3-of-5 from Phase 1 |
| Formal proposal execution | Custom execution queue | SPL Governance shared instance via `governance-idl-sdk` | Battle-tested proposal execution with built-in timelock |
| Treasury transaction history | Custom transaction parsing | Helius Enhanced Transactions API | Parsed, human-readable transaction data. Already integrated |
| Cron scheduling for transitions | Clockwork/custom automation | Permissionless crank + server-side cron fallback | Clockwork shut down 2023. Crank pattern is simpler and proven |

**Key insight:** The governance domain has many subtle edge cases (double-voting, withdrawal during active votes, timelock enforcement, quorum calculation overflow). Building on proven patterns (SPL token escrow, PDA-based vote records, Squads multisig) minimizes these risks while keeping the custom code focused on the novel idea-round lifecycle.

## Common Pitfalls

### Pitfall 1: solana-program v1 vs v2 Crate Conflict
**What goes wrong:** Adding `spl-governance` as a Cargo dependency causes build failures due to `solana-program` version mismatch between v1.17 (spl-governance) and v2 (Anchor 0.32.1).
**Why it happens:** Anchor 0.32.1 switched to Solana SDK v2 modular crates. SPL Governance crate on crates.io has not been updated.
**How to avoid:** Do NOT add `spl-governance` to Cargo.toml. Interact with SPL Governance entirely from the TypeScript client side using `governance-idl-sdk`. Build custom voting logic directly in the Anchor program.
**Warning signs:** `cargo build` fails with "multiple versions of crate `solana_program`" or similar version conflict errors.

### Pitfall 2: Vote Weight Manipulation via Deposit/Withdraw Cycling
**What goes wrong:** User deposits tokens, votes, immediately withdraws, deposits to another wallet, votes again -- effectively double-voting.
**Why it happens:** Insufficient withdrawal restrictions.
**How to avoid:** (1) Track `active_votes` count on VoteDeposit -- increment on vote, decrement when round closes. (2) Block withdrawal while `active_votes > 0`. (3) 7-day timelock prevents rapid deposit-vote-withdraw cycles. (4) VoteRecord PDA with seeds `[voter, idea]` prevents double-voting on same idea.
**Warning signs:** Same token balance appearing in multiple VoteDeposit accounts, vote counts exceeding total deposited tokens.

### Pitfall 3: Quorum Calculation Overflow
**What goes wrong:** Multiplying `total_deposited * required_bps` overflows u64 with large token supplies.
**Why it happens:** $GSD token may have billions of tokens with 9 decimals. u64 max is ~18.4 * 10^18.
**How to avoid:** Use `checked_mul` and `checked_div` for all arithmetic. Consider using u128 intermediate values for quorum calculation. Test with maximum possible token supply.
**Warning signs:** Quorum checks passing when they should fail, or program panicking on large token supplies.

### Pitfall 4: Stale Round Status in Frontend
**What goes wrong:** Frontend shows round as "Open" when deadline has passed but no one has called the transition instruction yet.
**Why it happens:** On-chain status is not updated until someone cranks the transition.
**How to avoid:** Frontend should check both the on-chain `status` field AND compare timestamps against current time. Display "Transitioning..." if deadline passed but status not yet updated. Auto-send transition tx from frontend when detected.
**Warning signs:** Users confused about round status, attempting to submit ideas after deadline.

### Pitfall 5: Missing Token Account Initialization
**What goes wrong:** Deposit instruction fails because the escrow token account doesn't exist yet.
**Why it happens:** Associated Token Accounts must be explicitly created before tokens can be transferred to them.
**How to avoid:** Use `init_if_needed` for the escrow ATA in the deposit instruction's account validation. Or create a separate `init_governance` instruction that sets up all required token accounts.
**Warning signs:** "Account not initialized" errors when first user tries to deposit.

### Pitfall 6: Anchor Account Space for Enums
**What goes wrong:** Account created with wrong space because enum variants have different sizes, or `InitSpace` derive doesn't correctly calculate enum size.
**Why it happens:** Anchor enums are serialized as 1 byte (variant index) when all variants are unit variants. But if any variant has data, the size changes.
**How to avoid:** Keep governance enums as unit variants (no data). Use `InitSpace` derive and verify calculated sizes manually. Test account creation in bankrun.
**Warning signs:** "Account data too small" errors, or accounts silently truncated.

### Pitfall 7: Timelock Bypass via System Clock Manipulation
**What goes wrong:** In testing, Clock::get() returns test-controlled time. In production, validators could theoretically submit transactions with slightly manipulated slot times.
**Why it happens:** Solana clock has ~1-2 second granularity and validators have some latitude.
**How to avoid:** Use reasonable timelock durations (7 days, 48 hours) where 1-2 second variance is irrelevant. Never use timelocks shorter than ~10 minutes for security-critical operations. Validate timelocks server-side as well when indexing events.
**Warning signs:** Votes appearing before eligibility timestamp in edge cases.

### Pitfall 8: Webhook Indexing for New Instruction Types
**What goes wrong:** Helius webhook receiver (already built for contributions) doesn't recognize new governance instruction types, silently dropping events.
**Why it happens:** The existing webhook handler only processes contribution events.
**How to avoid:** Extend the webhook handler to detect governance instruction discriminators. Add new processing functions for round creation, idea submission, vote, and deposit events. Use the same pattern as `processContributionEvent` but for governance events.
**Warning signs:** On-chain governance events not appearing in the off-chain database, stale governance data.

## Code Examples

### Governance Config Account (Global Singleton)
```rust
// programs/gsd-hub/src/state/governance_config.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GovernanceConfig {
    /// Admin authority (can create rounds)
    pub admin: Pubkey,               // 32
    /// Veto council authority (Squads multisig vault PDA)
    pub veto_authority: Pubkey,      // 32
    /// $GSD token mint address
    pub governance_token_mint: Pubkey, // 32
    /// PDA bump
    pub bump: u8,                    // 1
    /// Total number of rounds created (auto-increment counter)
    pub round_count: u32,            // 4
    /// Total tokens deposited across all users (for quorum calculation)
    pub total_deposited: u64,        // 8
    /// Timelock duration in seconds for token eligibility (default: 7 days)
    pub deposit_timelock: i64,       // 8
    /// Timelock duration in seconds for approved proposals (default: 48 hours)
    pub execution_timelock: i64,     // 8
}
// Total: 8 (disc) + 32 + 32 + 32 + 1 + 4 + 8 + 8 + 8 = 133 bytes
```

**PDA seeds:** `["governance_config"]` (singleton)

### Idea Submission Account
```rust
// programs/gsd-hub/src/state/idea.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum IdeaStatus {
    Submitted,
    Approved,
    Rejected,
    Vetoed,
}

#[account]
#[derive(InitSpace)]
pub struct Idea {
    /// Author wallet
    pub author: Pubkey,              // 32
    /// Round this idea belongs to
    pub round: Pubkey,               // 32
    /// Idea index within the round
    pub idea_index: u32,             // 4
    /// PDA bump
    pub bump: u8,                    // 1
    /// Current status
    pub status: IdeaStatus,          // 1
    /// SHA-256 hash of off-chain idea content
    pub content_hash: [u8; 32],      // 32
    /// Unix timestamp of submission
    pub submitted_at: i64,           // 8
    /// Total Yes vote weight
    pub yes_weight: u64,             // 8
    /// Total No vote weight
    pub no_weight: u64,              // 8
    /// Total Abstain vote weight
    pub abstain_weight: u64,         // 8
    /// Number of voters
    pub voter_count: u32,            // 4
    /// Unix timestamp when execution timelock expires (0 = not approved)
    pub execution_eligible_at: i64,  // 8
}
// Total: 8 (disc) + 32 + 32 + 4 + 1 + 1 + 32 + 8 + 8 + 8 + 8 + 4 + 8 = 154 bytes
```

**PDA seeds:** `["idea", round.key(), idea_index.to_le_bytes()]`

### Cast Vote Instruction
```rust
// programs/gsd-hub/src/instructions/cast_vote.rs
use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::GovernanceError;

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"idea", round.key().as_ref(), &idea.idea_index.to_le_bytes()],
        bump = idea.bump,
    )]
    pub idea: Account<'info, Idea>,

    #[account(
        constraint = round.status == RoundStatus::Voting
            @ GovernanceError::RoundNotInVotingState
    )]
    pub round: Account<'info, IdeaRound>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote_record", voter.key().as_ref(), idea.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        seeds = [b"vote_deposit", voter.key().as_ref()],
        bump = vote_deposit.bump,
        constraint = vote_deposit.deposited_amount > 0
            @ GovernanceError::NoDeposit,
        constraint = Clock::get()?.unix_timestamp >= vote_deposit.eligible_at
            @ GovernanceError::TokensNotYetEligible,
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CastVote>, vote: VoteChoice) -> Result<()> {
    let idea = &mut ctx.accounts.idea;
    let vote_deposit = &mut ctx.accounts.vote_deposit;
    let vote_record = &mut ctx.accounts.vote_record;
    let clock = Clock::get()?;

    // Validate round is still in voting period
    require!(
        clock.unix_timestamp < ctx.accounts.round.voting_end,
        GovernanceError::VotingPeriodEnded
    );

    let weight = vote_deposit.deposited_amount;

    // Record vote
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.idea = idea.key();
    vote_record.round = ctx.accounts.round.key();
    vote_record.bump = ctx.bumps.vote_record;
    vote_record.vote = vote;
    vote_record.weight = weight;
    vote_record.voted_at = clock.unix_timestamp;

    // Update idea tallies
    match vote {
        VoteChoice::Yes => {
            idea.yes_weight = idea.yes_weight.checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
        VoteChoice::No => {
            idea.no_weight = idea.no_weight.checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
        VoteChoice::Abstain => {
            idea.abstain_weight = idea.abstain_weight.checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
    }
    idea.voter_count = idea.voter_count.checked_add(1)
        .ok_or(GovernanceError::Overflow)?;

    // Increment active votes on deposit
    vote_deposit.active_votes = vote_deposit.active_votes.checked_add(1)
        .ok_or(GovernanceError::Overflow)?;

    Ok(())
}
```

### Prisma Schema Extensions
```prisma
// New models for governance (added to schema.prisma)

model IdeaRound {
  id              String   @id @default(cuid())
  roundIndex      Int      @unique
  onChainAddress  String   @unique
  title           String   @db.VarChar(200)
  description     String   @db.Text
  contentHash     String
  status          String   @default("open") // open, voting, closed
  submissionStart DateTime
  submissionEnd   DateTime
  votingEnd       DateTime
  ideaCount       Int      @default(0)
  quorumType      String   // small, treasury, parameter_change
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  ideas           Idea[]

  @@index([status])
  @@index([submissionEnd])
  @@index([votingEnd])
}

model Idea {
  id                   String   @id @default(cuid())
  ideaIndex            Int
  onChainAddress       String   @unique
  roundId              String
  authorWallet         String
  title                String   @db.VarChar(200)
  description          String   @db.Text
  contentHash          String
  status               String   @default("submitted")
  yesWeight            BigInt   @default(0)
  noWeight             BigInt   @default(0)
  abstainWeight        BigInt   @default(0)
  voterCount           Int      @default(0)
  transactionSignature String   @unique
  submittedAt          DateTime @default(now())

  round                IdeaRound @relation(fields: [roundId], references: [id])
  votes                Vote[]

  @@index([roundId])
  @@index([authorWallet])
}

model Vote {
  id              String   @id @default(cuid())
  onChainAddress  String   @unique
  ideaId          String
  voterWallet     String
  vote            String   // yes, no, abstain
  weight          BigInt
  transactionSignature String @unique
  votedAt         DateTime

  idea            Idea     @relation(fields: [ideaId], references: [id])

  @@unique([ideaId, voterWallet])
  @@index([voterWallet])
}

model VoteDeposit {
  id              String   @id @default(cuid())
  walletAddress   String   @unique
  depositedAmount BigInt
  depositTimestamp DateTime
  eligibleAt      DateTime
  activeVotes     Int      @default(0)
  updatedAt       DateTime @updatedAt

  @@index([walletAddress])
}
```

### Governance PDA Derivations
```typescript
// packages/utils/src/governance-pda.ts
import { PublicKey } from "@solana/web3.js";

export const GOVERNANCE_CONFIG_SEED = "governance_config";
export const IDEA_ROUND_SEED = "idea_round";
export const IDEA_SEED = "idea";
export const VOTE_DEPOSIT_SEED = "vote_deposit";
export const VOTE_RECORD_SEED = "vote_record";

export function getGovernanceConfigPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GOVERNANCE_CONFIG_SEED)],
    programId
  );
}

export function getIdeaRoundPDA(
  roundIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(roundIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(IDEA_ROUND_SEED), buf],
    programId
  );
}

export function getIdeaPDA(
  round: PublicKey,
  ideaIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(ideaIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(IDEA_SEED), round.toBuffer(), buf],
    programId
  );
}

export function getVoteDepositPDA(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_DEPOSIT_SEED), wallet.toBuffer()],
    programId
  );
}

export function getVoteRecordPDA(
  voter: PublicKey,
  idea: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_RECORD_SEED), voter.toBuffer(), idea.toBuffer()],
    programId
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| spl-governance v3 (direct CPI) | Custom governance + client-side SPL Governance SDK | 2024+ (Anchor SDK v2 migration) | SPL Governance Rust crate stuck on solana-program v1. Must interact client-side |
| @solana/spl-governance (npm) | governance-idl-sdk (npm) | 2024 | Old SDK unmaintained (2+ years). governance-idl-sdk from Mythic-Project is the replacement |
| Clockwork for automation | Permissionless crank + cron fallback | 2023 (Clockwork shutdown) | On-chain automation is dead. Crank pattern is the standard |
| Single governance program | Modular: custom rounds + SPL Governance for execution | Current best practice | Separation of concerns. Custom logic where needed, proven infrastructure for execution |
| Squads v3 | Squads v4 (`@sqds/multisig ^2.1.3`) | 2024 | Time locks, spending limits, roles built in. Already deployed from Phase 1 |

**Deprecated/outdated:**
- `@solana/spl-governance` npm package -- use `governance-idl-sdk` from Mythic-Project
- `spl-governance` Rust crate as Cargo dependency with Anchor 0.32.1 -- version conflict with solana-program v2
- Clockwork for on-chain automation -- shut down 2023
- Tribeca governance framework -- uses Anchor 0.29.0, not updated for v2 SDK
- `@sqds/sdk` (Squads v3) -- use `@sqds/multisig` (Squads v4)

## Open Questions

1. **$GSD Token Mint Address for Devnet**
   - What we know: The $GSD token exists on mainnet (mint referenced in architecture docs: `GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig`). Development needs a devnet token mint for testing.
   - What's unclear: Whether a devnet $GSD mint already exists, or needs to be created for testing.
   - Recommendation: Create a devnet $GSD token mint for testing. Use `spl-token create-token` on devnet. Store mint address in `.env`. Mint test tokens to developer wallets. Document the devnet mint separately from mainnet.

2. **SPL Governance Realm Setup Timing**
   - What we know: GOVR-01 requires "SPL Governance Realm configured with $GSD as governance token." The governance-idl-sdk can create realms client-side.
   - What's unclear: Whether to create the Realm early (Phase 3 setup) or defer until formal proposal execution is needed. The custom voting in gsd-hub handles the core idea round voting.
   - Recommendation: Create the SPL Governance Realm during Phase 3 setup as a one-time admin operation. This satisfies GOVR-01 and establishes the formal governance infrastructure even if most voting happens through the custom program. Realm creation is a single transaction.

3. **Governance Config Initialization Ceremony**
   - What we know: GovernanceConfig is a singleton PDA storing admin authority, veto authority, token mint, and global parameters.
   - What's unclear: Who initializes it and how to handle authority transfers (e.g., initially admin-controlled, later DAO-controlled).
   - Recommendation: Initialize with the deploy wallet as admin, Squads multisig vault as veto_authority, and the $GSD mint. Add an `update_governance_config` instruction that requires the current admin's signature, enabling future authority transfer to the DAO.

4. **Active Vote Tracking for Withdrawal**
   - What we know: Users cannot withdraw while they have active votes. The `active_votes` counter on VoteDeposit must be decremented when rounds close.
   - What's unclear: The exact mechanism for decrementing -- should it happen automatically when a round transitions to CLOSED, or should users "relinquish" votes explicitly?
   - Recommendation: Require users to call a `relinquish_vote` instruction per round after the round closes. This decrements `active_votes` and is required before withdrawal. This avoids the complexity of iterating over all voters during round transition (which could exceed transaction compute limits).

5. **Treasury Inflow/Outflow Tracking**
   - What we know: TRSY-03 requires showing inflows, outflows, and burn totals.
   - What's unclear: How to categorize transactions as inflows vs outflows without a formal revenue system (that comes in Phase 4).
   - Recommendation: For Phase 3, show raw transaction history for the treasury address using Helius Enhanced Transactions API. Categorize as inflow (received) vs outflow (sent) based on transaction direction. Burn tracking deferred to Phase 4 when the burn mechanism is built. Show SOL and $GSD balances in real-time via RPC.

## Sources

### Primary (HIGH confidence)
- [Anchor 0.32.1 Cargo.toml](https://docs.rs/crate/anchor-lang/0.32.1/source/Cargo.toml) - Confirmed Solana SDK v2 modular crates (solana-pubkey 2, solana-cpi 2, etc.)
- [spl-governance 4.0.0 on docs.rs](https://docs.rs/spl-governance/latest/spl_governance/) - GovernanceInstruction enum, VoteRecordV2, TokenOwnerRecord
- [spl-governance on lib.rs](https://lib.rs/crates/spl-governance) - Version 4.0.0, depends on solana-program 1.17, marked deprecated/minimal maintenance
- [SPL Governance README](https://github.com/solana-labs/solana-program-library/blob/master/governance/README.md) - Realm structure, deployment models, shared instance addresses
- [Squads v4 Quickstart](https://docs.squads.so/main/development/introduction/quickstart) - @sqds/multisig ^2.1.3, multisigCreateV2, proposalApprove, vaultTransactionExecute
- [Anchor CPI documentation](https://www.anchor-lang.com/docs/basics/cpi) - Three CPI approaches including manual instruction construction
- [Solana on-chain voting example](https://examples.anchor-lang.com/docs/onchain-voting) - Basic voting pattern with Anchor
- [voter-stake-registry](https://github.com/blockworks-foundation/voter-stake-registry) - Token lockup and vote weight patterns, deposit/registrar/voter architecture
- [Anchor 0.32 release notes](https://www.anchor-lang.com/docs/updates/changelog) - solana-program dependency warning, anchor-spl integration

### Secondary (MEDIUM confidence)
- [governance-idl-sdk](https://github.com/Mythic-Project/governance-sdk) - Maintained SPL Governance TypeScript client from Mythic-Project
- [Helius webhooks documentation](https://www.helius.dev/docs/webhooks) - Up to 100K addresses per webhook, 80+ transaction types
- [Tuk Tuk automation](https://solanacompass.com/learn/accelerate-25/scale-or-die-at-accelerate-2025-tuk-tuk-on-chain-cron-jobs) - Helium's Clockwork replacement
- [SPL Governance technical overview](https://paragraph.com/@xentoshi/spl-governance-a-technical-overview) - Account hierarchy, proposal lifecycle
- [Solana GitHub issue #6897](https://github.com/solana-labs/solana-program-library/issues/6897) - solana-program 2.0.0 breaking SPL crate compatibility

### Tertiary (LOW confidence -- needs validation)
- governance-idl-sdk npm version and exact API surface -- could not fetch npm page due to 403. Verify `pnpm add governance-idl-sdk` installs correctly and provides SplGovernance class with createRealmInstruction
- Mythic-Project spl-governance fork version numbers (v3.1.1, v3.1.2 referenced) -- could not confirm whether updated crates are published to crates.io
- vetoken (ME Foundation) as reference architecture for vote escrow -- uses Anchor 0.29.0, architecture patterns are valid but code not directly portable to 0.32.1
- Exact GovernanceConfig parameters in SPL Governance (voting_base_time, hold_up_time) -- documentation was sparse. Custom program replicates the needed parameters

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - Core stack (Anchor, anchor-spl, Squads) is well-verified. governance-idl-sdk is the maintained option but version/API surface not fully verified via npm
- Architecture: HIGH - Hybrid approach (custom rounds + client-side SPL Governance) is well-grounded in the version incompatibility discovery. Patterns follow established Anchor/Solana conventions
- Pitfalls: HIGH - Version conflict between spl-governance and Anchor 0.32.1 is the most critical finding, verified via Cargo.toml analysis and GitHub issues. Vote manipulation, quorum overflow, and webhook extension pitfalls are based on established governance security patterns
- On-chain state design: MEDIUM-HIGH - Account structures follow Anchor conventions and are informed by SPL Governance and voter-stake-registry patterns. Exact space calculations need verification during implementation

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days -- Anchor/Solana SDK compatibility landscape may shift)
