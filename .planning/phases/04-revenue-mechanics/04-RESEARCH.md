# Phase 4: Revenue Mechanics - Research

**Researched:** 2026-02-08
**Domain:** On-chain revenue splitting, contributor-weighted distribution, buy-and-burn tokenomics, and treasury dashboard integration on Solana
**Confidence:** MEDIUM

## Summary

Phase 4 introduces the economic core of the GSD ecosystem: when revenue (SOL or USDC) arrives at the DAO treasury, it must be automatically split 60/20/10/10 (developers/treasury reserve/buy-and-burn/maintenance), with the developer share further subdivided by on-chain contribution scores. Contributors claim their share via on-chain transactions, 10% triggers a $GSD buy-and-burn via Jupiter, and the entire distribution history is publicly viewable.

The primary technical challenge is orchestrating four distinct subsystems: (1) detecting revenue events on the treasury address via Helius webhooks, (2) computing and recording the 60/20/10/10 split on-chain with per-contributor weights, (3) executing Jupiter swaps for the buy-and-burn, and (4) extending the existing treasury dashboard with distribution/claim/burn views. A secondary but critical challenge is that the Squads 3-of-5 multisig currently controls the treasury, meaning revenue splitting either needs to flow through Squads approval workflows or the treasury architecture needs a dedicated revenue vault PDA that the program controls directly.

The recommended architecture uses a **hybrid on-chain/off-chain approach**: a new `RevenueEvent` PDA records each revenue event and its computed splits on-chain. The 60% developer pool is held in a program-controlled escrow PDA, where individual contributors claim proportional shares based on their `contribution_score` relative to the total. The 10% buy-and-burn is executed server-side via the Jupiter Swap API (not CPI, due to the jupiter-cpi crate being archived in November 2025 and transaction size constraints), with the resulting $GSD tokens burned via `anchor_spl::token::burn`. The 20% treasury reserve and 10% maintenance allocations are simple transfers to designated wallets/vaults. Revenue detection uses the existing Helius webhook infrastructure, extended with a new `processRevenueEvent` handler. A prior decision flags that **legal counsel is needed before this phase ships** due to securities classification risk with revenue-sharing tokens.

**Primary recommendation:** Extend the existing `gsd-hub` Anchor program with revenue event recording, contribution-weighted claim instructions, and on-chain burn tracking. Use the Jupiter Swap API (server-side, not CPI) for buy-and-burn execution. Build a custom split program rather than depending on SolSplits (stability concerns flagged in prior research). Detect revenue via Helius webhooks (existing infrastructure). Gate production deployment on legal review.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Anchor | 0.32.1 | On-chain program framework | Already in use. Extend `gsd-hub` with revenue instructions |
| anchor-spl | 0.32.1 | SPL Token CPI (transfer, burn) | Token transfers for splits, token burns for buy-and-burn. Already a dependency |
| Jupiter Swap API | v1 | Buy-and-burn swap execution | Server-side swap SOL/USDC -> $GSD. Official API at `api.jup.ag/swap/v1/` |
| Helius webhooks | current | Revenue event detection | Already configured for contribution and governance events. Extend for TRANSFER type |
| Prisma | ^7.0.0 | Revenue event persistence | Already in use for contribution/governance indexing. Add revenue models |
| @tanstack/react-query | ^5.0.0 | Dashboard data fetching | Already in use for treasury dashboard. Extend for revenue views |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/spl-token | latest | Token account queries, ATA creation | Client-side token operations for claim UI |
| @solana/web3.js | ^1.98.0 | Transaction building, signing | Server-side Jupiter swap transaction signing and submission |
| bs58 | ^6.0.0 | Base58 encoding/decoding | Already installed. Webhook data parsing |
| @sqds/multisig | ^2.1.3 | Squads vault interaction | If revenue flows through multisig approval (architecture decision) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom split program | SolSplits | SolSplits charges 1.5% on automated transactions, long-term stability uncertain (flagged in prior research), limited developer documentation, closed-source program. Custom program is safer for a core economic primitive |
| Custom split program | Streamflow SDK | Streamflow specializes in vesting/streaming, not revenue splitting. Adds external dependency for core revenue flow. Better suited for payroll-style distribution, not event-driven splits |
| Jupiter Swap API (server-side) | Jupiter CPI (on-chain) | `jupiter-cpi` crate archived November 2025. CPI approach limited by 1232-byte transaction size with no ALT support. Server-side API gives full Versioned Transaction + ALT support |
| Jupiter Swap API (server-side) | Jupiter Ultra API | Ultra API is simpler but doesn't support custom instructions. Swap API with `/swap-instructions` endpoint gives full control |
| Custom claim mechanism | Merkle distributor (airdrop style) | Merkle distributor is batch-oriented (snapshot + proof). Revenue events are continuous and per-event. Claim-from-escrow is more natural for ongoing revenue sharing |
| Helius webhooks | Geyser plugins | Helius webhooks already integrated, lower operational complexity. Geyser requires running infrastructure |

**Installation:**
```bash
# No new Cargo.toml dependencies needed -- anchor-spl already includes token::burn
# anchor-lang and anchor-spl 0.32.1 already present

# Frontend (in apps/web/) -- most already installed
# Jupiter Swap API is REST-based, no SDK needed
# @solana/web3.js already installed for transaction building
```

## Architecture Patterns

### Recommended Project Structure (Phase 4 Additions)
```
programs/
  gsd-hub/
    src/
      state/
        mod.rs                        # Add revenue state modules
        revenue_event.rs              # NEW: RevenueEvent PDA (per revenue receipt)
        revenue_config.rs             # NEW: RevenueConfig singleton (split ratios, addresses)
        revenue_claim.rs              # NEW: RevenueClaim PDA (per-contributor per-event)
      instructions/
        mod.rs                        # Add revenue instructions
        init_revenue_config.rs        # NEW: Initialize revenue configuration
        record_revenue_event.rs       # NEW: Record revenue arrival + compute splits
        claim_revenue_share.rs        # NEW: Contributor claims their portion
        execute_burn.rs               # NEW: Record burn event on-chain after Jupiter swap
      errors.rs                       # Extend with revenue errors

apps/web/
  app/
    api/
      webhooks/
        helius/
          route.ts                    # Extend: add processRevenueEvent handler
      revenue/
        events/
          route.ts                    # NEW: List revenue events
        claims/
          route.ts                    # NEW: Claim status per contributor
        burns/
          route.ts                    # NEW: Burn history
        distribute/
          route.ts                    # NEW: Server-side: trigger split + Jupiter swap
    (public)/
      treasury/
        page.tsx                      # EXTEND: Add revenue distribution, claims, burns tabs
  components/
    treasury/
      TreasuryDashboard.tsx           # EXTEND: Real burn totals (replace placeholder)
      TransactionList.tsx             # EXTEND: Revenue event annotations
      RevenueDistribution.tsx         # NEW: Revenue split visualization
      ClaimPanel.tsx                  # NEW: Contributor claim interface
      BurnHistory.tsx                 # NEW: Buy-and-burn event log
  lib/
    revenue/
      indexer.ts                      # NEW: Helius webhook processor for revenue events
      distributor.ts                  # NEW: Server-side Jupiter swap + distribution logic
      constants.ts                    # NEW: Revenue program constants, discriminators

packages/
  types/src/
    revenue.ts                        # NEW: Revenue domain types
  utils/src/
    revenue-pda.ts                    # NEW: Revenue PDA derivations
```

### Pattern 1: Revenue Event Recording (On-Chain)
**What:** When revenue (SOL or USDC) is detected arriving at the treasury, a `RevenueEvent` PDA is created on-chain that records the total amount, computed splits, and status.
**When to use:** Every revenue receipt that triggers distribution.

```rust
// programs/gsd-hub/src/state/revenue_event.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RevenueStatus {
    Recorded,       // Event logged, splits computed
    Distributing,   // Transfers in progress
    Completed,      // All splits executed, burn confirmed
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RevenueToken {
    Sol,
    Usdc,
}

#[account]
#[derive(InitSpace)]
pub struct RevenueEvent {
    /// Sequential event index (4 bytes)
    pub event_index: u32,
    /// PDA bump (1 byte)
    pub bump: u8,
    /// Token type (SOL or USDC) (1 byte)
    pub token: RevenueToken,
    /// Total revenue amount in lamports or token base units (8 bytes)
    pub total_amount: u64,
    /// 60% developer pool amount (8 bytes)
    pub developer_pool: u64,
    /// 20% treasury reserve amount (8 bytes)
    pub treasury_reserve: u64,
    /// 10% burn amount (8 bytes)
    pub burn_amount: u64,
    /// 10% maintenance amount (8 bytes)
    pub maintenance_amount: u64,
    /// Current status (1 byte)
    pub status: RevenueStatus,
    /// Unix timestamp of revenue detection (8 bytes)
    pub recorded_at: i64,
    /// Transaction signature of the originating revenue tx (64 bytes)
    pub origin_signature: [u8; 64],
    /// Total contribution score at time of recording, for share calculation (8 bytes)
    pub total_contribution_score: u64,
    /// Amount claimed from developer pool so far (8 bytes)
    pub claimed_amount: u64,
    /// Burn transaction signature (64 bytes, zeroed until burn executes)
    pub burn_signature: [u8; 64],
    /// $GSD amount burned (8 bytes)
    pub gsd_burned: u64,
}
// PDA seeds: ["revenue_event", event_index.to_le_bytes()]
// Total: 8 (disc) + 4 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 64 + 8 + 8 + 64 + 8 = 217 bytes
```

**Design rationale:** Each revenue event is a discrete, auditable on-chain record. The `origin_signature` links back to the original revenue transaction. The `burn_signature` and `gsd_burned` fields provide traceability for the buy-and-burn requirement (REVN-06). `total_contribution_score` is snapshotted at recording time to prevent score manipulation between recording and claiming.

### Pattern 2: Revenue Configuration Singleton
**What:** A global configuration PDA storing split ratios, destination addresses, and operational parameters.
**When to use:** Initialized once, referenced by all revenue instructions.

```rust
// programs/gsd-hub/src/state/revenue_config.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RevenueConfig {
    /// Admin authority who can update config (32 bytes)
    pub admin: Pubkey,
    /// PDA bump (1 byte)
    pub bump: u8,
    /// Developer pool split in basis points (e.g., 6000 = 60%) (2 bytes)
    pub developer_bps: u16,
    /// Treasury reserve split in basis points (e.g., 2000 = 20%) (2 bytes)
    pub treasury_bps: u16,
    /// Burn split in basis points (e.g., 1000 = 10%) (2 bytes)
    pub burn_bps: u16,
    /// Maintenance split in basis points (e.g., 1000 = 10%) (2 bytes)
    pub maintenance_bps: u16,
    /// Treasury reserve destination address (32 bytes)
    pub treasury_address: Pubkey,
    /// Maintenance wallet address (32 bytes)
    pub maintenance_address: Pubkey,
    /// $GSD token mint address (32 bytes)
    pub gsd_mint: Pubkey,
    /// USDC token mint address (32 bytes)
    pub usdc_mint: Pubkey,
    /// Total revenue events recorded (4 bytes)
    pub event_count: u32,
    /// Minimum revenue threshold to trigger distribution (lamports/base units) (8 bytes)
    pub min_revenue_threshold: u64,
}
// PDA seeds: ["revenue_config"]
// Total: 8 (disc) + 32 + 1 + 2 + 2 + 2 + 2 + 32 + 32 + 32 + 32 + 4 + 8 = 189 bytes
```

**Key design:** Split ratios stored as basis points allow governance to adjust them later (e.g., from 60/20/10/10 to 50/25/15/10) without program upgrades. The bps values must sum to 10000. `min_revenue_threshold` prevents dust amounts from triggering expensive distribution flows.

### Pattern 3: Contribution-Weighted Claims
**What:** Each contributor claims their share of the 60% developer pool based on their `contribution_score` relative to the total. A `RevenueClaim` PDA prevents double-claiming.
**When to use:** Every contributor claim.

```rust
// programs/gsd-hub/src/state/revenue_claim.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RevenueClaim {
    /// The contributor's wallet (32 bytes)
    pub claimant: Pubkey,
    /// The revenue event being claimed from (32 bytes)
    pub revenue_event: Pubkey,
    /// PDA bump (1 byte)
    pub bump: u8,
    /// Contributor's score at time of claim (8 bytes)
    pub contribution_score: u64,
    /// Total contribution score (snapshot from RevenueEvent) (8 bytes)
    pub total_score: u64,
    /// Amount claimed (8 bytes)
    pub amount: u64,
    /// Unix timestamp of claim (8 bytes)
    pub claimed_at: i64,
}
// PDA seeds: ["revenue_claim", claimant.key(), revenue_event.key()]
// Total: 8 (disc) + 32 + 32 + 1 + 8 + 8 + 8 + 8 = 105 bytes
```

**Claim calculation (on-chain):**
```rust
// In claim_revenue_share instruction handler:
pub fn handler(ctx: Context<ClaimRevenueShare>) -> Result<()> {
    let event = &ctx.accounts.revenue_event;
    let profile = &ctx.accounts.developer_profile;
    let claim = &mut ctx.accounts.revenue_claim;

    // Contributor's share = developer_pool * (their_score / total_score)
    // Use u128 intermediate to avoid overflow
    let numerator = (event.developer_pool as u128)
        .checked_mul(profile.contribution_score as u128)
        .ok_or(RevenueError::Overflow)?;
    let share = numerator
        .checked_div(event.total_contribution_score as u128)
        .ok_or(RevenueError::DivisionByZero)?;
    let amount = share as u64;

    // Transfer from developer pool escrow to claimant
    // ... CPI transfer with PDA signer ...

    claim.claimant = ctx.accounts.claimant.key();
    claim.revenue_event = ctx.accounts.revenue_event.key();
    claim.bump = ctx.bumps.revenue_claim;
    claim.contribution_score = profile.contribution_score;
    claim.total_score = event.total_contribution_score;
    claim.amount = amount;
    claim.claimed_at = Clock::get()?.unix_timestamp;

    // Update claimed amount on revenue event
    let event_mut = &mut ctx.accounts.revenue_event;
    event_mut.claimed_amount = event_mut.claimed_amount
        .checked_add(amount)
        .ok_or(RevenueError::Overflow)?;

    Ok(())
}
```

**PDA seeds `["revenue_claim", claimant, revenue_event]`** guarantee one claim per contributor per event (prevents double-claiming).

### Pattern 4: Server-Side Buy-and-Burn via Jupiter API
**What:** The 10% burn allocation is swapped from SOL/USDC to $GSD via Jupiter Swap API, then the $GSD is burned using `anchor_spl::token::burn`. Executed server-side with a dedicated burn authority keypair.
**When to use:** After every revenue event recording.

```typescript
// lib/revenue/distributor.ts (server-side)

// Step 1: Get Jupiter quote
const quoteResponse = await fetch(
  `https://api.jup.ag/swap/v1/quote?` +
  `inputMint=${SOL_MINT}&` +      // or USDC_MINT
  `outputMint=${GSD_MINT}&` +
  `amount=${burnAmountLamports}&` +
  `slippageBps=100`,
  { headers: { 'x-api-key': JUPITER_API_KEY } }
).then(r => r.json());

// Step 2: Get swap instructions (not serialized tx, for custom assembly)
const swapInstructions = await fetch(
  'https://api.jup.ag/swap/v1/swap-instructions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': JUPITER_API_KEY,
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: burnAuthority.publicKey.toBase58(),
    }),
  }
).then(r => r.json());

// Step 3: Build versioned transaction with swap + burn instructions
// Step 4: Sign with burn authority keypair
// Step 5: Send and confirm
// Step 6: Record burn signature on RevenueEvent PDA via execute_burn instruction
```

**Why server-side:** The `jupiter-cpi` Rust crate was archived in November 2025. CPI-based Jupiter swaps are limited by the 1232-byte transaction size constraint (no ALT support in CPI). The server-side Swap API supports Versioned Transactions with Address Lookup Tables, enabling complex multi-hop routes that may be needed for $GSD liquidity.

### Pattern 5: On-Chain Burn with Traceability
**What:** After the Jupiter swap acquires $GSD tokens, they are burned via `anchor_spl::token::burn`, and the burn is recorded on the `RevenueEvent` PDA linking it to the originating revenue.
**When to use:** Every buy-and-burn execution.

```rust
// programs/gsd-hub/src/instructions/execute_burn.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount, Mint};
use crate::state::RevenueEvent;

#[derive(Accounts)]
pub struct ExecuteBurn<'info> {
    #[account(
        mut,
        seeds = [b"revenue_event", &revenue_event.event_index.to_le_bytes()],
        bump = revenue_event.bump,
    )]
    pub revenue_event: Account<'info, RevenueEvent>,

    /// Burn authority -- must match revenue_config.admin or dedicated burn authority
    pub burn_authority: Signer<'info>,

    #[account(mut)]
    pub gsd_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub gsd_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<ExecuteBurn>,
    gsd_amount: u64,
    burn_tx_signature: [u8; 64],
) -> Result<()> {
    // Burn the $GSD tokens
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.gsd_mint.to_account_info(),
            from: ctx.accounts.gsd_token_account.to_account_info(),
            authority: ctx.accounts.burn_authority.to_account_info(),
        },
    );
    token::burn(cpi_ctx, gsd_amount)?;

    // Record burn details on revenue event
    let event = &mut ctx.accounts.revenue_event;
    event.burn_signature = burn_tx_signature;
    event.gsd_burned = gsd_amount;

    Ok(())
}
```

**Traceability chain:** Revenue inflow tx -> RevenueEvent PDA (origin_signature) -> Jupiter swap tx -> execute_burn tx -> RevenueEvent PDA (burn_signature, gsd_burned). Every burn is traceable to its originating revenue event (REVN-06).

### Pattern 6: Revenue Event Detection via Helius Webhook
**What:** Extend the existing Helius webhook handler to detect incoming SOL/USDC transfers to the treasury address and trigger the revenue distribution pipeline.
**When to use:** Automated revenue detection.

```typescript
// lib/revenue/indexer.ts

export async function processRevenueEvent(
  transaction: HeliusEnhancedTransaction
): Promise<number> {
  const { signature, nativeTransfers, tokenTransfers } = transaction;

  // Check for SOL inflows to treasury
  const solInflow = nativeTransfers?.filter(
    t => t.toUserAccount === TREASURY_ADDRESS_STR && t.amount > 0
  );

  // Check for USDC inflows to treasury
  const usdcInflow = tokenTransfers?.filter(
    t => t.toUserAccount === TREASURY_ADDRESS_STR && t.mint === USDC_MINT_STR
  );

  if (!solInflow?.length && !usdcInflow?.length) return 0;

  // Compute splits and persist to database
  // Queue distribution job (send on-chain record_revenue_event tx)
  // Queue Jupiter swap for buy-and-burn
  // ...
}
```

### Anti-Patterns to Avoid
- **CPI to Jupiter from on-chain program:** The `jupiter-cpi` crate is archived (Nov 2025). CPI swaps hit the 1232-byte transaction size limit without ALT support. Use server-side Jupiter Swap API instead
- **Sending tokens to a "burn address":** Solana's SPL Token program has a native `burn` instruction that permanently reduces supply. Never send to `1nc1nerator...` or `11111...` -- use `anchor_spl::token::burn`
- **Computing contribution shares off-chain and trusting the result:** Share calculation MUST happen on-chain in the claim instruction, reading the contributor's `DeveloperProfile.contribution_score` and the event's `total_contribution_score` directly from PDAs
- **Processing all distributions in a single transaction:** With many contributors, this will exceed compute limits. Use per-contributor claim pattern instead
- **Automatic distribution without multisig approval:** Revenue events should be validated. Consider requiring multisig approval for the `record_revenue_event` instruction, or at minimum, restrict it to authorized callers
- **Storing split amounts only off-chain:** The 60/20/10/10 split computation and amounts must be recorded on-chain (in RevenueEvent PDA) for transparency and auditability

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token swaps (SOL/USDC -> $GSD) | Custom AMM interaction | Jupiter Swap API (`api.jup.ag/swap/v1/`) | Jupiter aggregates all Solana DEX liquidity, finds best route. No single DEX has guaranteed $GSD liquidity |
| Token burning | Transfer to dead address | `anchor_spl::token::burn` CPI | Native SPL Token burn permanently reduces supply. Traceable, auditable, supply-reducing. Transfer to dead address doesn't reduce supply |
| SPL Token transfers | Manual lamport manipulation | `anchor_spl::token::transfer` | Already in use from Phase 3. Handles all edge cases |
| Revenue event detection | Custom RPC polling | Helius webhooks (TRANSFER type) | Already integrated. Webhooks push events in real-time. Polling is expensive and slow |
| Treasury multisig operations | Custom multi-sig | Squads v4 (`@sqds/multisig`) | Already deployed 3-of-5 from Phase 1. Audited, supports vault transactions |
| Transaction history display | Custom block parsing | Helius Enhanced Transactions API | Already integrated in treasury client. Parsed, human-readable data |

**Key insight:** Phase 4's economic primitives (revenue splitting, token burns, contribution-weighted distribution) are the most security-critical code in the platform. Every split ratio, share calculation, and burn must be verifiable on-chain. Custom program code is justified here because no existing Solana primitive handles the specific 60/20/10/10 model with contribution-weighted sub-splitting, but we should maximize use of proven components (SPL Token for transfers/burns, Jupiter for swaps, Helius for detection).

## Common Pitfalls

### Pitfall 1: Contribution Score Manipulation Between Recording and Claiming
**What goes wrong:** A contributor inflates their score after a revenue event is recorded but before claiming, getting a larger share than deserved.
**Why it happens:** If the claim instruction reads the contributor's _current_ score instead of the score at the time the revenue event was recorded.
**How to avoid:** Snapshot `total_contribution_score` in the `RevenueEvent` PDA at recording time. The claim instruction uses the contributor's `contribution_score` from their `DeveloperProfile` (which was set before the event). Consider also snapshotting individual scores if score updates could occur between event recording and claims -- or implement a claim window after which scores are frozen for that event.
**Warning signs:** Contributors rushing to update scores right before claiming. Total claimed exceeding the developer pool.

### Pitfall 2: Integer Division Rounding Leaves Dust in Escrow
**What goes wrong:** When dividing the developer pool among contributors, rounding errors leave small amounts permanently locked in the escrow.
**Why it happens:** `developer_pool * score / total_score` truncates. Over many events and contributors, dust accumulates.
**How to avoid:** Accept minor dust as a known limitation. Either: (a) allow the admin to sweep dust after all claims for an event are complete, or (b) allocate dust to the last claimant, or (c) roll dust into the next revenue event. Document the chosen approach. Never try to implement exact division -- it's not possible with integer math.
**Warning signs:** Escrow balance slowly growing with unclaimed micro-amounts.

### Pitfall 3: Jupiter Swap Failure Blocking the Entire Distribution
**What goes wrong:** The Jupiter swap for buy-and-burn fails (slippage, low liquidity, API downtime), and the entire revenue distribution stalls.
**Why it happens:** If the distribution pipeline is sequential and synchronous.
**How to avoid:** Decouple the buy-and-burn from the rest of the distribution. Record the revenue event and release the 20% treasury + 10% maintenance + 60% developer pool immediately. Process the 10% buy-and-burn asynchronously with retries. The `RevenueEvent.burn_signature` being zeroed indicates pending burn. A cron job or manual trigger retries failed burns.
**Warning signs:** Revenue events stuck in "Distributing" status. Burns falling behind revenue events.

### Pitfall 4: Squads Multisig Bottleneck on Revenue Flow
**What goes wrong:** Every revenue distribution requires 3-of-5 multisig approval, creating delays and manual overhead.
**Why it happens:** The treasury is a Squads vault, and all outflows require multisig signatures.
**How to avoid:** Two approaches: (a) **Dedicated revenue vault**: Create a program-controlled PDA vault that receives the revenue, separate from the main Squads treasury. Revenue automatically flows to this PDA, and the program splits from there without multisig. The 20% treasury reserve is then sent _to_ the Squads vault. (b) **Pre-approved spending limits**: Squads v4 supports spending limits -- configure an allowance for the revenue distribution bot. **Recommendation:** Approach (a) is cleaner. The revenue vault PDA is fully program-controlled, transparent, and auditable. The Squads multisig retains control over the 20% treasury reserve that accumulates.
**Warning signs:** Revenue events waiting days for multisig approval. Contributors unable to claim.

### Pitfall 5: Reentrancy / Double-Claim via Race Condition
**What goes wrong:** A contributor submits multiple claim transactions simultaneously, and both execute before the `RevenueClaim` PDA is created.
**Why it happens:** If the claim instruction uses `init` (not `init_if_needed`), two simultaneous transactions could both fail, but with `init_if_needed`, one could overwrite the other.
**How to avoid:** Use `init` (NOT `init_if_needed`) for the `RevenueClaim` PDA. Anchor's `init` constraint means the PDA must not already exist -- if two transactions race, one will fail with "account already exists." This is the standard double-claim prevention pattern.
**Warning signs:** "Account already in use" errors during claims (which is actually the protection working correctly).

### Pitfall 6: Securities Classification Risk
**What goes wrong:** Revenue-sharing tokens may be classified as securities under the Howey Test, exposing the project to SEC enforcement.
**Why it happens:** The Howey Test asks: (1) investment of money, (2) in a common enterprise, (3) with expectation of profit, (4) from the efforts of others. Revenue-sharing tokens arguably satisfy all four prongs.
**How to avoid:** **This is flagged as a prior decision: legal counsel is required before Phase 4 ships to production.** Mitigations include: (a) ensuring $GSD is primarily a utility token (governance voting from Phase 3), (b) revenue sharing is based on _verified work contribution_, not passive holding, (c) the project operates as a DAO, not a company. But these are not substitutes for legal advice. **Gate production deployment on legal review completion.**
**Warning signs:** No legal review completed before launch. Revenue sharing available to non-contributors (passive holders).

### Pitfall 7: USDC Detection Requires Token Account Monitoring
**What goes wrong:** Helius webhook only fires for native SOL transfers to the treasury address, but misses USDC (SPL token) transfers.
**Why it happens:** Token transfers are to Associated Token Accounts (ATAs), not directly to the treasury pubkey. The webhook must be configured to watch the treasury's USDC ATA address as well.
**How to avoid:** Configure the Helius webhook to watch both: (a) the treasury SOL address (for native SOL transfers), and (b) the treasury's USDC ATA address (for USDC transfers). Alternatively, use the TRANSFER transaction type filter which covers both. In enhanced webhook mode, `tokenTransfers` array captures SPL token transfers.
**Warning signs:** SOL revenue detected but USDC revenue missed. USDC accumulating in treasury without triggering distributions.

### Pitfall 8: Burn Amount Mismatch Due to Swap Slippage
**What goes wrong:** The `RevenueEvent` records a specific `burn_amount` (in SOL/USDC), but the Jupiter swap yields a different amount of $GSD due to slippage, and the on-chain burn records the $GSD amount.
**Why it happens:** Price slippage between quote and execution. Also, the "burn amount" in SOL/USDC is not the same as the "$GSD burned."
**How to avoid:** The `RevenueEvent` records both: `burn_amount` (SOL/USDC allocated for burn) and `gsd_burned` (actual $GSD destroyed). These are different fields representing different tokens. The dashboard should display both: "0.5 SOL allocated for burn -> 1,234 $GSD burned." Set reasonable slippage tolerance (100-200 bps). If slippage exceeds tolerance, retry later when conditions improve.
**Warning signs:** Large discrepancies between burn_amount and gsd_burned. Failed swaps due to excessive slippage.

## Code Examples

### Revenue Config Initialization
```rust
// programs/gsd-hub/src/instructions/init_revenue_config.rs
use anchor_lang::prelude::*;
use crate::state::RevenueConfig;

#[derive(Accounts)]
pub struct InitRevenueConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + RevenueConfig::INIT_SPACE,
        seeds = [b"revenue_config"],
        bump,
    )]
    pub revenue_config: Account<'info, RevenueConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitRevenueConfig>,
    treasury_address: Pubkey,
    maintenance_address: Pubkey,
    gsd_mint: Pubkey,
    usdc_mint: Pubkey,
    min_revenue_threshold: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.revenue_config;
    config.admin = ctx.accounts.admin.key();
    config.bump = ctx.bumps.revenue_config;
    config.developer_bps = 6000;  // 60%
    config.treasury_bps = 2000;   // 20%
    config.burn_bps = 1000;       // 10%
    config.maintenance_bps = 1000; // 10%
    config.treasury_address = treasury_address;
    config.maintenance_address = maintenance_address;
    config.gsd_mint = gsd_mint;
    config.usdc_mint = usdc_mint;
    config.event_count = 0;
    config.min_revenue_threshold = min_revenue_threshold;
    Ok(())
}
```

### Prisma Schema Extensions for Revenue
```prisma
model RevenueEvent {
  id                      String   @id @default(cuid())
  eventIndex              Int      @unique
  onChainAddress          String   @unique
  token                   String   // "sol" or "usdc"
  totalAmount             BigInt
  developerPool           BigInt
  treasuryReserve         BigInt
  burnAmount              BigInt
  maintenanceAmount       BigInt
  status                  String   @default("recorded")
  originSignature         String   @unique
  totalContributionScore  BigInt
  claimedAmount           BigInt   @default(0)
  burnSignature           String?
  gsdBurned               BigInt   @default(0)
  recordedAt              DateTime
  createdAt               DateTime @default(now())

  claims                  RevenueClaim[]

  @@index([status])
  @@index([recordedAt])
}

model RevenueClaim {
  id                  String   @id @default(cuid())
  revenueEventId      String
  claimantWallet      String
  contributionScore   BigInt
  totalScore          BigInt
  amount              BigInt
  transactionSignature String  @unique
  claimedAt           DateTime

  revenueEvent        RevenueEvent @relation(fields: [revenueEventId], references: [id])

  @@unique([revenueEventId, claimantWallet])
  @@index([claimantWallet])
}
```

### Revenue PDA Derivations
```typescript
// packages/utils/src/revenue-pda.ts
import { PublicKey } from "@solana/web3.js";

export const REVENUE_CONFIG_SEED = "revenue_config";
export const REVENUE_EVENT_SEED = "revenue_event";
export const REVENUE_CLAIM_SEED = "revenue_claim";

export function getRevenueConfigPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVENUE_CONFIG_SEED)],
    programId
  );
}

export function getRevenueEventPDA(
  eventIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(eventIndex);
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVENUE_EVENT_SEED), buf],
    programId
  );
}

export function getRevenueClaimPDA(
  claimant: PublicKey,
  revenueEvent: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(REVENUE_CLAIM_SEED),
      claimant.toBuffer(),
      revenueEvent.toBuffer(),
    ],
    programId
  );
}
```

### Jupiter Buy-and-Burn Flow (Server-Side)
```typescript
// lib/revenue/distributor.ts
import { Connection, VersionedTransaction, Keypair } from "@solana/web3.js";

const JUPITER_API_BASE = "https://api.jup.ag/swap/v1";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export async function executeBuyAndBurn(
  connection: Connection,
  burnAuthority: Keypair,
  inputMint: string,  // SOL_MINT or USDC_MINT
  gsdMint: string,
  amountLamports: bigint,
  jupiterApiKey: string,
): Promise<{ swapSignature: string; gsdBurned: bigint }> {
  // 1. Quote
  const quoteUrl = `${JUPITER_API_BASE}/quote?` +
    `inputMint=${inputMint}&` +
    `outputMint=${gsdMint}&` +
    `amount=${amountLamports}&` +
    `slippageBps=150`;
  const quoteResponse = await fetch(quoteUrl, {
    headers: { "x-api-key": jupiterApiKey },
  }).then(r => r.json());

  // 2. Get swap transaction
  const swapResponse = await fetch(`${JUPITER_API_BASE}/swap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": jupiterApiKey,
    },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: burnAuthority.publicKey.toBase58(),
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 500_000,
          priorityLevel: "high",
        },
      },
    }),
  }).then(r => r.json());

  // 3. Sign and send swap transaction
  const swapTx = VersionedTransaction.deserialize(
    Buffer.from(swapResponse.swapTransaction, "base64")
  );
  swapTx.sign([burnAuthority]);
  const swapSignature = await connection.sendRawTransaction(
    swapTx.serialize(),
    { skipPreflight: true }
  );
  await connection.confirmTransaction(swapSignature);

  // 4. The $GSD tokens are now in burnAuthority's ATA
  // 5. Build + send execute_burn on-chain instruction
  //    (burns tokens and records on RevenueEvent PDA)

  return {
    swapSignature,
    gsdBurned: BigInt(quoteResponse.outAmount),
  };
}
```

### Helius Webhook Revenue Handler
```typescript
// Extend existing apps/web/app/api/webhooks/helius/route.ts

import { processRevenueEvent } from "@/lib/revenue/indexer";

// Inside the existing POST handler, after governance processing:
try {
  const count = await processRevenueEvent(tx);
  revenueProcessed += count;
} catch (error) {
  // ... error handling
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jupiter CPI via `jupiter-cpi` crate | Jupiter Swap API server-side | Nov 2025 (crate archived) | Must use REST API. Server-side approach is now recommended by Jupiter |
| Send tokens to burn address | `spl-token burn` instruction | Standard since SPL Token v1 | True supply reduction vs. dead-address lockup. SPL burn is the Solana convention |
| SolSplits for revenue splitting | Custom split program | Ongoing | SolSplits has uncertain long-term stability. Custom is recommended for core economic primitives |
| Polling RPC for treasury changes | Helius webhooks (TRANSFER type) | Already integrated | Push-based, real-time, lower cost. Already infrastructure in place |
| Manual treasury management | Squads v4 multisig | Already deployed | 3-of-5 from Phase 1. Spending limits and vault transactions for automated flows |

**Deprecated/outdated:**
- `jupiter-cpi` Rust crate -- archived November 2025, read-only on GitHub
- Sending tokens to `1nc1nerator11111111111111111111111111111111` for "burning" -- use SPL Token burn instruction instead
- SolSplits for automated splitting -- 1.5% fee, uncertain stability, limited docs

## Open Questions

1. **Revenue Vault Architecture: Squads vs. Program PDA**
   - What we know: The treasury is currently a Squads 3-of-5 multisig vault. Revenue distribution needs to split funds automatically. Squads requires multisig approval for every outflow.
   - What's unclear: Whether revenue should flow directly to the Squads vault (requiring multisig approval per distribution) or to a dedicated program-controlled PDA vault (automatic, but different trust model).
   - Recommendation: Use a **dedicated revenue vault PDA** controlled by the `gsd-hub` program. Revenue is sent to this PDA (not the Squads vault). The program splits automatically. The 20% treasury reserve is sent _to_ the Squads vault after splitting. This avoids the multisig bottleneck while the Squads vault retains custody of the accumulated reserves. The revenue vault's behavior is fully determined by program code (transparent, auditable). This is an architecture decision that should be validated in planning.

2. **Legal Review Status and Revenue Sharing Structure**
   - What we know: A prior decision flags "legal counsel needed before Phase 4" due to securities classification risk. Revenue sharing based on contribution scores (not passive token holding) has a stronger argument against Howey, but is not a legal guarantee.
   - What's unclear: Whether legal review has begun, its expected timeline, and whether it might require structural changes to the revenue model (e.g., framing as "service provider compensation" rather than "revenue sharing").
   - Recommendation: **Production deployment of Phase 4 MUST be gated on legal review completion.** Development can proceed in parallel on devnet. The revenue model should be structured as "compensation for verified contributions" rather than "profit sharing with token holders" to strengthen the utility argument. Include a configuration flag to enable/disable revenue distribution (off by default in production until legal clearance).

3. **Burn Authority Key Management**
   - What we know: The buy-and-burn requires a server-side keypair to sign Jupiter swap transactions and the on-chain burn instruction. This keypair needs SOL for fees and access to the burn allocation.
   - What's unclear: How to securely manage this keypair. It needs to be accessible to the server-side distribution job but cannot be compromised without risking the burn allocation funds.
   - Recommendation: Use a **dedicated burn authority keypair** with minimal permissions. It should only hold the 10% burn allocation at any given time (transferred per revenue event, not bulk). Store the keypair in a secrets manager (not environment variables). Consider using a Squads multisig sub-account for the burn authority, where the server holds one key of a 1-of-2 multisig (the other key held by the team for emergency recovery). Alternatively, for simpler implementation, a standard Keypair loaded from an encrypted file with a Helius/Jupiter API key rotation schedule.

4. **Contribution Score Snapshot Timing**
   - What we know: The claim calculation divides the developer pool by contribution scores. Scores can be updated at any time via `update_contribution_score`.
   - What's unclear: The exact moment scores should be "frozen" for a revenue event. If scores update between recording and claiming, different contributors get different share calculations.
   - Recommendation: Snapshot `total_contribution_score` at recording time (already in the RevenueEvent PDA). Individual scores are read from `DeveloperProfile` at claim time. This means scores at claim time are used, which could differ from recording time. For stronger guarantees: implement a "claim window" (e.g., 7 days) during which scores are effectively frozen for that event, or create per-contributor score snapshots in RevenueClaim. The simplest approach (read current scores at claim) is acceptable for v1 if score updates are infrequent relative to revenue events.

5. **USDC vs. SOL Revenue Handling Differences**
   - What we know: Revenue can arrive as SOL or USDC. Both need 60/20/10/10 splitting. The buy-and-burn needs to swap to $GSD.
   - What's unclear: Whether SOL and USDC distributions should be handled by the same instruction (with a token type parameter) or separate instructions. Also, whether the developer pool should be denominated in the original token or converted.
   - Recommendation: Use a single `record_revenue_event` instruction with a `RevenueToken` enum discriminator. The developer pool is distributed in the original token (contributors claim SOL if revenue was SOL, USDC if USDC). Only the 10% burn allocation is swapped. This avoids unnecessary swaps and keeps the developer claim flow simple. The `RevenueEvent` PDA includes a `token` field to track which denomination.

6. **Minimum Revenue Threshold**
   - What we know: Very small revenue amounts (dust) would create disproportionate overhead (PDA creation costs, transaction fees for each contributor claim, Jupiter swap minimum).
   - What's unclear: What the minimum threshold should be.
   - Recommendation: Set a configurable `min_revenue_threshold` in the `RevenueConfig`. Suggested default: 0.1 SOL or 10 USDC equivalent (adjustable via governance). Revenue below threshold accumulates in the revenue vault until it crosses the threshold. Jupiter has implicit minimum swap amounts based on liquidity and fees.

7. **Jupiter API Key and Rate Limits**
   - What we know: Jupiter Swap API requires an `x-api-key` header. The API is rate-limited.
   - What's unclear: Exact rate limits, pricing tiers, and whether a free tier is sufficient for the expected volume of buy-and-burn operations.
   - Recommendation: Register for a Jupiter API key. For Phase 4 launch, revenue events will be infrequent (likely fewer than 100/month). A free or basic tier should suffice. Implement exponential backoff retry for swap failures. Cache quotes briefly (they expire within seconds due to price movement).

## Sources

### Primary (HIGH confidence)
- [Jupiter Swap API - Build Swap Transaction](https://dev.jup.ag/docs/swap-api/build-swap-transaction) - Confirmed `/swap/v1/swap` and `/swap/v1/swap-instructions` endpoints, request/response format, API key requirement
- [Jupiter Quote API](https://dev.jup.ag/docs/swap/get-quote) - Confirmed `api.jup.ag/swap/v1/quote` endpoint, required parameters (inputMint, outputMint, amount, slippageBps)
- [Solana SPL Token Burn](https://solana.com/developers/guides/games/interact-with-tokens) - Confirmed `anchor_spl::token::burn` CPI pattern, Burn accounts struct, authority handling
- [anchor-spl 0.32.1 on crates.io](https://crates.io/crates/anchor-spl) - Confirmed version, token::burn function available
- [Helius Webhooks](https://www.helius.dev/docs/webhooks) - Enhanced vs Raw webhooks, TRANSFER transaction type, up to 100K addresses, payload format with nativeTransfers and tokenTransfers
- Existing codebase: `apps/web/lib/treasury/client.ts`, `apps/web/lib/contributions/indexer.ts`, `apps/web/lib/governance/indexer.ts` - Confirmed existing patterns for Helius integration, treasury queries, webhook processing

### Secondary (MEDIUM confidence)
- [jupiter-cpi GitHub](https://github.com/jup-ag/jupiter-cpi) - Confirmed archived November 2025. CPI approach no longer maintained
- [Helius Webhook Transaction Types](https://www.helius.dev/docs/webhooks/transaction-types) - TRANSFER type covers SOL and token transfers. Source mapping confirmed
- [Circle USDC on Solana](https://developers.circle.com/stablecoins/quickstart-transfer-10-usdc-on-solana) - USDC mainnet mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, devnet: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- [Backpack - Solana Burn Address](https://learn.backpack.exchange/articles/solana-burn-address-explained) - SPL Token burn is preferred over burn addresses. Burn reduces circulating supply
- [SolSplits](https://solsplits.xyz/) - Exists but limited documentation, 1.5% fee on automated transactions, closed-source program
- [Streamflow SDK](https://github.com/streamflow-finance/js-sdk) - Token distribution protocol. Packages for streaming/vesting/airdrops. Not a direct fit for event-driven revenue splitting

### Tertiary (LOW confidence -- needs validation)
- SolSplits program ID and detailed technical architecture -- documentation at docs.solsplits.xyz returned only marketing content, no technical specs. Cannot assess stability for production use
- Jupiter API rate limits and pricing tiers -- not documented in public docs. Need to register and check dashboard
- Legal securities analysis for contribution-based revenue sharing -- multiple sources describe Howey Test applicability, but actual legal determination requires counsel. SEC guidance from 2025-2026 shows evolving stance but no clear safe harbor for DAO revenue sharing
- Squads v4 spending limits feature for automated revenue distribution -- mentioned in docs but exact configuration and limitations not fully verified

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - Core stack (Anchor 0.32.1, anchor-spl, Jupiter Swap API, Helius) is well-verified. Jupiter API endpoints and parameters confirmed from official docs. The jupiter-cpi archival is confirmed
- Architecture: MEDIUM - Revenue vault PDA approach is standard Anchor pattern. Contribution-weighted claims follow established escrow/claim patterns. The full end-to-end flow (webhook -> record -> split -> swap -> burn -> claim) has many moving parts. Each piece is proven individually, but the integration is novel to this project
- Pitfalls: MEDIUM-HIGH - Securities risk is the most critical finding and requires legal resolution. Technical pitfalls (score manipulation, dust, Jupiter failures, multisig bottleneck) are well-understood patterns with known mitigations
- Legal/regulatory: LOW - This is the weakest area. Prior decision requires legal counsel. Research identifies the risk but cannot provide legal advice. This is a potential blocker for production deployment

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days -- Jupiter API may change, SEC guidance may evolve)
