# Phase 2: Contribution Tracking - Research

**Researched:** 2026-02-08
**Domain:** Solana State Compression (Merkle trees), on-chain contribution scoring, Helius webhook sync, off-chain data integrity verification
**Confidence:** MEDIUM-HIGH

## Summary

Phase 2 records developer contributions on-chain using Solana State Compression (concurrent Merkle trees), calculates contribution scores using a defined formula, stores those scores in each developer's PDA, and syncs on-chain events to the off-chain database via Helius webhooks. This is the most technically complex phase so far because it introduces three new integration surfaces: (1) the SPL Account Compression on-chain program for Merkle tree operations, (2) the Helius webhook infrastructure for real-time event sync, and (3) a PDA schema migration to add contribution score fields to the existing `DeveloperProfile`.

The primary technical challenge is an **Anchor version incompatibility**: the `spl-account-compression` Rust crate v1.0.0 depends on `anchor-lang ^0.31`, which is incompatible with the project's `anchor-lang 0.32.1`. The crate is also marked "minimal maintenance." The recommended approach is to use **raw CPI** (`solana_program::invoke`/`invoke_signed`) to call the deployed SPL Account Compression on-chain program directly, bypassing the crate dependency entirely. The on-chain program is already deployed at `cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK` on both devnet and mainnet -- we only need the TypeScript SDK (`@solana/spl-account-compression` v0.4.1) client-side for tree creation and proof operations, and that SDK is compatible with `@solana/web3.js v1`.

For Helius webhooks, the REST API approach (direct HTTP calls) is recommended over the Helius SDK v2.x, because the SDK v2.x depends on `@solana/kit` (web3.js v2) which conflicts with the project's Anchor-mandated `@solana/web3.js v1`. Webhook creation and management only requires simple HTTP POST calls to the Helius API.

The contribution scoring formula `sqrt(tasks_completed * verification_score * time_active)` is a straightforward mathematical operation. The key architectural decision is performing score calculation off-chain (server-side) with on-chain storage and verification, because floating-point math on Solana requires fixed-point arithmetic and the score only needs to be updated when contributions change, not on every read.

**Primary recommendation:** Use raw CPI for on-chain Merkle tree operations (bypassing the spl-account-compression crate), `@solana/spl-account-compression` v0.4.1 TypeScript SDK for client-side tree interactions, direct Helius REST API for webhook management, Anchor `realloc` constraint to expand the existing DeveloperProfile PDA with contribution score fields, and a custom off-chain indexer that listens to Helius webhooks to reconstruct contribution data from noop program logs.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| spl-account-compression (on-chain program) | deployed | Concurrent Merkle tree operations | The SPL standard for state compression on Solana. Program ID: `cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK` |
| spl-noop (on-chain program) | deployed | Log leaf data for off-chain indexing | Circumvents Solana log truncation. Program ID: `noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV` |
| @solana/spl-account-compression | 0.4.1 | TypeScript client for tree creation, proofs | Official SPL SDK. Compatible with @solana/web3.js v1 |
| anchor-lang | 0.32.1 | Solana program framework (existing) | Already in use. Raw CPI to compression program avoids version conflict |
| Helius REST API | v0 | Webhook creation and management | Direct HTTP avoids SDK version conflicts with web3.js v1 |
| Prisma | 7.x | Off-chain database (existing) | Already in use. Add Contribution model for off-chain cache |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @solana/spl-account-compression (TS) | 0.4.1 | createAllocTreeIx, getConcurrentMerkleTreeAccountSize | Tree initialization, account size calculation, proof deserialization |
| spl-concurrent-merkle-tree | 0.3.0 | Rust Merkle tree primitives (no Anchor dep) | If raw CPI needs tree structure helpers in Rust |
| spl-noop (Rust crate) | 0.2.0 | CPI to noop program for logging | Emit contribution data for indexers. Minimal dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw CPI to spl-account-compression | spl-account-compression Rust crate | Crate requires anchor-lang ^0.31, incompatible with 0.32.1. Raw CPI is more code but avoids dependency conflict |
| Helius REST API | helius-sdk v2.x npm | SDK v2.x uses @solana/kit (web3.js v2), conflicts with Anchor's web3.js v1 requirement. REST API is trivial |
| SPL State Compression | ZK Compression (Light Protocol) | ZK Compression is newer, more efficient, but adds significant complexity and is still maturing. SPL compression is battle-tested |
| Off-chain score calculation | On-chain score calculation | Solana has no native floating-point. On-chain sqrt requires fixed-point math library. Calculate off-chain, store result on-chain, verify via content hash |
| Custom indexer via webhooks | Helius DAS API (getAsset) | DAS API is designed for NFT assets, not custom compressed data. Custom indexer via noop logs is the standard pattern for generalized state compression |

**Installation:**
```bash
# TypeScript SDK (in apps/web/)
pnpm add @solana/spl-account-compression@0.4.1

# No new Rust crates needed -- use raw CPI via solana_program (already available through anchor-lang)
# The spl-noop crate v0.2.0 can optionally be added for type-safe noop CPI:
# In programs/gsd-hub/Cargo.toml:
# spl-noop = { version = "0.2.0", features = ["no-entrypoint"] }
```

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)
```
gsd-community-hub/
  programs/gsd-hub/src/
    state/
      developer.rs          # MODIFY: add contribution_score, tasks_completed, etc.
      contribution.rs        # NEW: contribution leaf data schema
      merkle_tree.rs         # NEW: tree config account (authority, tree address)
      mod.rs                 # MODIFY: export new state modules
    instructions/
      init_contribution_tree.rs  # NEW: initialize Merkle tree for contributions
      record_contribution.rs     # NEW: append leaf via CPI to compression program
      update_score.rs            # NEW: update contribution score in DeveloperProfile
      mod.rs                     # MODIFY: export new instructions
    cpi/
      compression.rs         # NEW: raw CPI helpers for spl-account-compression
      noop.rs                # NEW: raw CPI helpers for spl-noop
      mod.rs
    errors.rs                # MODIFY: add contribution-related errors
    lib.rs                   # MODIFY: add new instruction entry points
  apps/web/
    app/
      api/
        webhooks/
          helius/
            route.ts         # NEW: Helius webhook receiver endpoint
        contributions/
          route.ts           # NEW: contribution CRUD API
          [wallet]/
            route.ts         # NEW: get contributions by wallet
    components/
      contributions/
        contribution-list.tsx    # NEW: contribution history display
        contribution-card.tsx    # NEW: single contribution display
        score-badge.tsx          # NEW: contribution score display
    lib/
      contributions/
        score.ts             # NEW: score calculation (shared formula)
        indexer.ts           # NEW: webhook payload processing
        tree.ts              # NEW: Merkle tree client helpers
    prisma/
      schema.prisma          # MODIFY: add Contribution model
  packages/
    types/src/
      contribution.ts        # NEW: contribution domain types
    utils/src/
      contribution-hash.ts   # NEW: SHA-256 hashing for contribution data
  scripts/
    setup-helius-webhook.ts  # NEW: script to create/configure Helius webhook
```

### Pattern 1: Raw CPI to SPL Account Compression
**What:** Call the deployed spl-account-compression program via raw `invoke`/`invoke_signed` without importing the Rust crate, avoiding anchor-lang version conflicts.
**When to use:** Every Merkle tree operation (init, append, replace, verify) from the gsd-hub program.
**Confidence:** HIGH -- raw CPI is a well-documented Solana pattern, and the instruction format for spl-account-compression is stable.

```rust
// programs/gsd-hub/src/cpi/compression.rs
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
};

/// SPL Account Compression Program ID
pub const ACCOUNT_COMPRESSION_PROGRAM_ID: Pubkey =
    solana_program::pubkey!("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");

/// SPL Noop Program ID
pub const NOOP_PROGRAM_ID: Pubkey =
    solana_program::pubkey!("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV");

/// Append a leaf to a concurrent Merkle tree via raw CPI.
/// Instruction discriminator for "append" = hash("global:append")[..8]
pub fn append_leaf<'info>(
    merkle_tree: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    noop_program: &AccountInfo<'info>,
    compression_program: &AccountInfo<'info>,
    leaf: [u8; 32],
) -> Result<()> {
    // Instruction data: 8-byte discriminator + 32-byte leaf
    let mut data = Vec::with_capacity(40);
    // Anchor discriminator for "append" instruction
    data.extend_from_slice(&anchor_lang::solana_program::hash::hash(
        b"global:append"
    ).to_bytes()[..8]);
    data.extend_from_slice(&leaf);

    let accounts = vec![
        AccountMeta::new(*merkle_tree.key, false),
        AccountMeta::new_readonly(*authority.key, true),
        AccountMeta::new_readonly(*noop_program.key, false),
    ];

    let ix = Instruction {
        program_id: ACCOUNT_COMPRESSION_PROGRAM_ID,
        accounts,
        data,
    };

    invoke(
        &ix,
        &[
            merkle_tree.clone(),
            authority.clone(),
            noop_program.clone(),
            compression_program.clone(),
        ],
    )?;

    Ok(())
}
```

**Important caveat:** The exact instruction discriminator format must be verified against the deployed program's IDL. The `spl-account-compression` program may use Anchor's standard discriminator format or a custom one. Verify by fetching the program's IDL from chain or from the TypeScript SDK source. This is flagged as an open question.

### Pattern 2: Contribution Leaf Schema
**What:** Each contribution is hashed into a 32-byte leaf and appended to the Merkle tree. The full contribution data is emitted via noop CPI for off-chain indexing.
**When to use:** Every time a contribution is recorded.

```rust
// programs/gsd-hub/src/state/contribution.rs
use anchor_lang::prelude::*;

/// Data stored in each Merkle tree leaf (hashed to 32 bytes)
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ContributionLeaf {
    /// Developer wallet who made the contribution
    pub developer: Pubkey,       // 32 bytes
    /// Task reference (e.g., hash of task ID or external reference)
    pub task_ref: [u8; 32],      // 32 bytes
    /// Verification score (0-10000, representing 0.00-100.00%)
    pub verification_score: u16, // 2 bytes
    /// Unix timestamp of contribution
    pub timestamp: i64,          // 8 bytes
    /// SHA-256 hash of off-chain contribution content
    pub content_hash: [u8; 32],  // 32 bytes
}
// Total serialized: 106 bytes (hashed to 32-byte leaf via SHA-256)
```

```typescript
// packages/utils/src/contribution-hash.ts
export interface ContributionData {
  developer: string;      // wallet address
  taskRef: string;        // task identifier
  verificationScore: number; // 0-10000
  timestamp: number;      // unix timestamp
  contentHash: string;    // hex-encoded SHA-256 of off-chain content
}

export async function computeContributionLeafHash(
  contribution: ContributionData
): Promise<Uint8Array> {
  // Canonical serialization matching on-chain format
  const buffer = new ArrayBuffer(106);
  const view = new DataView(buffer);
  // ... serialize fields in exact on-chain order
  const hashBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(buffer));
  return new Uint8Array(hashBuffer);
}
```

### Pattern 3: DeveloperProfile PDA Extension via Realloc
**What:** Extend the existing DeveloperProfile PDA (89 bytes) to include contribution score fields using Anchor's `realloc` constraint.
**When to use:** When updating a developer's contribution score after new contributions are recorded.

```rust
// Extended DeveloperProfile (existing + new fields)
#[account]
#[derive(InitSpace)]
pub struct DeveloperProfile {
    // --- Existing fields (Phase 1) ---
    pub authority: Pubkey,          // 32 bytes
    pub bump: u8,                   // 1 byte
    pub created_at: i64,            // 8 bytes
    pub updated_at: i64,            // 8 bytes
    pub profile_hash: [u8; 32],     // 32 bytes
    // --- New fields (Phase 2) ---
    pub tasks_completed: u32,       // 4 bytes
    pub total_verification_score: u64, // 8 bytes (sum of all scores for avg calc)
    pub time_active_days: u32,      // 4 bytes (days since first contribution)
    pub contribution_score: u64,    // 8 bytes (scaled by 1e6 for fixed-point)
    pub first_contribution_at: i64, // 8 bytes (unix timestamp, 0 = no contributions)
    pub last_contribution_at: i64,  // 8 bytes (unix timestamp)
    pub score_version: u8,          // 1 byte (for future formula changes)
}
// Old size: 8 + 32 + 1 + 8 + 8 + 32 = 89 bytes
// New size: 89 + 4 + 8 + 4 + 8 + 8 + 8 + 1 = 130 bytes

// Instruction to update score with realloc
#[derive(Accounts)]
pub struct UpdateContributionScore<'info> {
    #[account(
        mut,
        seeds = [b"developer", authority.key().as_ref()],
        bump = developer_profile.bump,
        has_one = authority,
        realloc = 8 + 130, // new total with discriminator
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

**Critical note on realloc:** When adding fields to an existing account, the new fields must be appended at the end of the struct (never reorder existing fields). Zero-initialized new bytes will default to 0 for numeric types, which is correct for "no contributions yet." The `realloc::zero = false` is appropriate here because we are only adding bytes at the end and want to preserve existing data.

### Pattern 4: Helius Webhook Receiver (Next.js API Route)
**What:** A Next.js API route that receives enhanced transaction webhooks from Helius, parses contribution events, and syncs to PostgreSQL.
**When to use:** Real-time sync of on-chain contribution events to the off-chain database.

```typescript
// apps/web/app/api/webhooks/helius/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Verify webhook authenticity via auth header
const WEBHOOK_AUTH = process.env.HELIUS_WEBHOOK_AUTH!;

export async function POST(req: NextRequest) {
  // Verify auth header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== WEBHOOK_AUTH) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();

  // payload is an array of enhanced transactions
  for (const tx of payload) {
    // Check if this transaction involves our program
    if (!tx.accountData?.some((a: any) =>
      a.account === process.env.NEXT_PUBLIC_PROGRAM_ID
    )) continue;

    // Parse contribution data from transaction
    // Enhanced webhooks include parsed instruction data
    await processContributionEvent(tx);
  }

  return NextResponse.json({ received: true });
}

async function processContributionEvent(tx: any) {
  // Extract contribution data from the transaction
  // Store in PostgreSQL via Prisma
  // Update contribution history cache
}
```

### Pattern 5: Off-Chain Score Calculation
**What:** Calculate contribution score server-side using the formula `sqrt(tasks_completed * verification_score * time_active)`, then submit the result on-chain as a scaled integer.
**When to use:** After recording a new contribution, recalculate and update the developer's on-chain score.

```typescript
// packages/utils/src/score.ts (or lib/contributions/score.ts)

/**
 * Calculate contribution score using the defined formula.
 * Score = sqrt(tasks_completed * avg_verification_score * time_active_days)
 *
 * All inputs are integers. Output is scaled by 1e6 for fixed-point storage.
 * verification_score is 0-10000 (representing 0-100.00%)
 */
export function calculateContributionScore(
  tasksCompleted: number,
  totalVerificationScore: number, // sum of all verification scores
  timeActiveDays: number,
): bigint {
  if (tasksCompleted === 0 || timeActiveDays === 0) return 0n;

  // Average verification score (0-10000 scale)
  const avgScore = totalVerificationScore / tasksCompleted;

  // Raw product (may overflow standard number for very active devs)
  const product = tasksCompleted * avgScore * timeActiveDays;

  // sqrt with scaling: multiply by 1e12 before sqrt to get 1e6 precision
  const scaled = BigInt(Math.round(product * 1e12));
  const score = sqrt(scaled); // integer sqrt of BigInt

  return score;
}

// Integer square root (Newton's method for BigInt)
function sqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("negative");
  if (n === 0n) return 0n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}
```

### Anti-Patterns to Avoid
- **Importing spl-account-compression Rust crate with anchor-lang 0.32.1:** Version conflict. Use raw CPI instead.
- **Using helius-sdk v2.x with @solana/web3.js v1 project:** SDK v2 uses @solana/kit. Use direct HTTP REST API calls.
- **Storing full contribution content on-chain:** Store SHA-256 hash on-chain, full content in PostgreSQL.
- **Computing sqrt on-chain in Solana program:** No native floating-point. Calculate off-chain, store fixed-point result on-chain.
- **Relying solely on Helius DAS API for custom compressed data:** DAS is designed for NFT assets (Bubblegum standard). Custom compressed data requires a custom indexer via noop logs.
- **Reordering fields in the DeveloperProfile struct:** Breaks deserialization of existing accounts. Always append new fields at the end.
- **Using the Helius SDK's createWebhook for devnet:** Must use `enhancedDevnet` or `rawDevnet` webhook types, not the mainnet types.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrent Merkle trees | Custom Merkle tree implementation | SPL Account Compression on-chain program via CPI | Battle-tested, handles concurrent writes, changelog buffer for proof fast-forwarding |
| Tree account sizing | Manual byte calculations | `getConcurrentMerkleTreeAccountSize()` from @solana/spl-account-compression | Complex function of depth, buffer, and canopy. Off-by-one = broken tree |
| Leaf data logging for indexers | Custom log parsing | spl-noop CPI + `wrap_application_data_v1` pattern | Standard pattern for indexer consumption. Avoids Solana log truncation |
| Webhook creation/management | Custom webhook infra | Helius REST API (POST /v0/webhooks) | Managed infrastructure, transaction type filtering, auth headers, retry logic |
| SHA-256 hashing on-chain | Custom hash implementation | `anchor_lang::solana_program::hash::hash()` | Already available via solana_program crate included by Anchor |
| Integer square root | Custom implementation | Well-known Newton's method for BigInt | Simple algorithm, but must be correct. Use tested implementation |

**Key insight:** The complexity in this phase is in the integration glue (CPI wiring, webhook processing, indexer logic) rather than algorithmic novelty. Every building block exists as deployed programs or established libraries -- the work is connecting them correctly.

## Common Pitfalls

### Pitfall 1: Anchor Version Conflict with spl-account-compression Crate
**What goes wrong:** Adding `spl-account-compression = "1.0.0"` to Cargo.toml causes compile failure because it requires `anchor-lang ^0.31` while the project uses `anchor-lang 0.32.1`.
**Why it happens:** The spl-account-compression crate is marked "minimal maintenance" and has not been updated for anchor-lang 0.32.
**How to avoid:** Do NOT import the spl-account-compression Rust crate. Use raw CPI (`solana_program::invoke`) to call the deployed program. The instruction format is stable and well-documented.
**Warning signs:** Cargo dependency resolution errors mentioning anchor-lang version conflicts.

### Pitfall 2: Helius SDK v2.x / @solana/kit Dependency Conflict
**What goes wrong:** Installing `helius-sdk@latest` (v2.x) pulls in `@solana/kit` which conflicts with `@solana/web3.js v1` used by `@coral-xyz/anchor 0.32.1`.
**Why it happens:** Helius SDK v2.0+ was rewritten to use @solana/kit (web3.js v2) under the hood. The Helius team recommends v2.x going forward.
**How to avoid:** For webhook management only, use direct HTTP REST API calls to `https://api-mainnet.helius-rpc.com/v0/webhooks`. No SDK needed. For the Helius RPC endpoint itself, it works with any web3.js version (it is just an HTTP endpoint).
**Warning signs:** TypeScript type conflicts, duplicate PublicKey class errors, "Cannot find module @solana/kit" errors.

### Pitfall 3: DeveloperProfile PDA Realloc Breaking Existing Accounts
**What goes wrong:** Adding new fields to DeveloperProfile breaks deserialization of accounts created in Phase 1 (89 bytes) because the new struct expects 130 bytes.
**Why it happens:** Anchor attempts to deserialize the full struct including new fields from an account that was allocated with the old, smaller size.
**How to avoid:** Use the `realloc` constraint on the instruction that first accesses the upgraded profile. New fields must be appended at the end of the struct (never reorder). The realloc constraint handles rent adjustment automatically. Consider having a dedicated `migrate_profile` instruction, or applying realloc on every score update.
**Warning signs:** "Account data too small" errors when accessing Phase 1 profiles with Phase 2 code.

### Pitfall 4: Merkle Tree Sizing Under/Over Estimation
**What goes wrong:** Tree created with too-small depth runs out of leaves. Tree created with too-large depth wastes SOL on rent (cost scales exponentially with depth).
**Why it happens:** Depth determines capacity (2^depth leaves). Buffer size determines concurrent write throughput. Canopy depth determines proof size requirements.
**How to avoid:** Use the sizing table below. For a community platform expecting up to ~65K contributions initially: depth=16 (65,536 leaves), bufferSize=64, canopyDepth=6. Calculate cost via `getConcurrentMerkleTreeAccountSize()` before deploying. Trees CAN be replaced (create new tree, re-append historical data) but this is expensive.
**Warning signs:** "Merkle tree is full" errors, unexpectedly high tree creation costs.

### Pitfall 5: Custom Compressed Data Indexing (Not Using DAS API)
**What goes wrong:** Developer tries to use Helius DAS API (getAsset, getAssetsByOwner) to read custom compressed data. DAS returns nothing because it only indexes Bubblegum-standard compressed NFTs.
**Why it happens:** DAS API was built for the Metaplex Bubblegum compressed NFT standard, not generalized state compression.
**How to avoid:** Build a custom indexer that processes noop program logs from Helius webhooks. When a contribution is appended, the full contribution data is emitted via spl-noop CPI. The webhook receives the transaction, which contains the noop log data. Parse and store in PostgreSQL.
**Warning signs:** DAS API calls returning empty results for compressed contribution data.

### Pitfall 6: Webhook Idempotency and Duplicate Events
**What goes wrong:** Helius may retry webhook deliveries if the server doesn't respond quickly, leading to duplicate contribution records in the database.
**Why it happens:** Helius documentation states: "Helius may retry webhook deliveries if your server does not respond successfully, and you might receive duplicate events."
**How to avoid:** Store the transaction signature as a unique key. Before processing a webhook event, check if the transaction signature already exists in the database. Use a database unique constraint on the transaction signature column.
**Warning signs:** Duplicate contribution entries, inflated contribution counts.

### Pitfall 7: Score Calculation Precision and Overflow
**What goes wrong:** The contribution score formula `sqrt(tasks_completed * verification_score * time_active)` overflows JavaScript's Number type for very active developers, or produces different results on different platforms due to floating-point arithmetic.
**Why it happens:** JavaScript Number has 53 bits of integer precision. A developer with 10,000 tasks, perfect score (10000), and 365 days: 10000 * 10000 * 365 = 36,500,000,000 which fits in Number but multiplied by 1e12 for scaling exceeds safe integer range.
**How to avoid:** Use BigInt for all intermediate calculations. Store the score as a u64 on-chain (8 bytes, max ~1.8e19). The scaling factor of 1e6 provides 6 decimal places of precision, which is more than sufficient.
**Warning signs:** Inconsistent scores between client and server, NaN or Infinity values.

## Code Examples

### Merkle Tree Initialization (TypeScript Client)
```typescript
// scripts/init-contribution-tree.ts or lib/contributions/tree.ts
import {
  getConcurrentMerkleTreeAccountSize,
  createAllocTreeIx,
  createInitEmptyMerkleTreeIx,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { Keypair, Connection, Transaction, SystemProgram } from "@solana/web3.js";

// Sizing for ~65K contributions
const MAX_DEPTH = 16;          // 2^16 = 65,536 leaves
const MAX_BUFFER_SIZE = 64;    // concurrent writes supported
const CANOPY_DEPTH = 10;       // maxDepth - canopyDepth = 6 (< 10 for composability)

async function createContributionTree(
  connection: Connection,
  payer: Keypair,
): Promise<Keypair> {
  const treeKeypair = Keypair.generate();

  // Calculate space and rent
  const space = getConcurrentMerkleTreeAccountSize(
    MAX_DEPTH,
    MAX_BUFFER_SIZE,
    CANOPY_DEPTH,
  );
  const rent = await connection.getMinimumBalanceForRentExemption(space);

  // Create allocate instruction
  const allocIx = await createAllocTreeIx(
    connection,
    treeKeypair.publicKey,
    payer.publicKey,
    { maxDepth: MAX_DEPTH, maxBufferSize: MAX_BUFFER_SIZE },
    CANOPY_DEPTH,
  );

  // Create init instruction (authority = our program's PDA or multisig)
  const initIx = createInitEmptyMerkleTreeIx(
    treeKeypair.publicKey,
    payer.publicKey, // authority (should be program PDA in production)
    MAX_DEPTH,
    MAX_BUFFER_SIZE,
  );

  const tx = new Transaction().add(allocIx, initIx);
  await connection.sendTransaction(tx, [payer, treeKeypair]);

  return treeKeypair;
}
```

### Helius Webhook Setup (Script)
```typescript
// scripts/setup-helius-webhook.ts
const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID!;
const WEBHOOK_URL = process.env.WEBHOOK_URL!; // e.g., https://your-app.vercel.app/api/webhooks/helius
const WEBHOOK_AUTH = process.env.HELIUS_WEBHOOK_AUTH!; // secret for verifying webhook calls

async function setupWebhook() {
  const response = await fetch(
    `https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookURL: WEBHOOK_URL,
        transactionTypes: ["ANY"], // catch all program transactions
        accountAddresses: [PROGRAM_ID], // monitor our program
        webhookType: "enhancedDevnet", // use "enhanced" for mainnet
        authHeader: WEBHOOK_AUTH,
      }),
    }
  );

  const webhook = await response.json();
  console.log("Webhook created:", webhook.webhookID);
}

setupWebhook();
```

### Prisma Schema Extension
```prisma
// Addition to apps/web/prisma/schema.prisma

model Contribution {
  id                   String   @id @default(cuid())
  walletAddress        String
  taskRef              String   // task identifier
  verificationScore    Int      // 0-10000
  contentHash          String   // SHA-256 hex of off-chain content
  leafHash             String   // SHA-256 hex of on-chain Merkle leaf
  leafIndex            Int      // position in Merkle tree
  treeAddress          String   // Merkle tree public key
  transactionSignature String   @unique // on-chain tx sig (idempotency key)
  description          String?  // off-chain contribution description
  createdAt            DateTime @default(now())

  user                 User     @relation(fields: [walletAddress], references: [walletAddress])

  @@index([walletAddress])
  @@index([treeAddress, leafIndex])
  @@index([transactionSignature])
}

// Add relation to existing User model:
// contributions Contribution[]
```

### Contribution Score Verification (Client-Side)
```typescript
// Verify that on-chain score matches calculated score
import { PublicKey, Connection } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

async function verifyContributionScore(
  program: Program,
  walletAddress: string,
): Promise<{ valid: boolean; onChainScore: bigint; calculatedScore: bigint }> {
  const wallet = new PublicKey(walletAddress);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("developer"), wallet.toBuffer()],
    program.programId,
  );

  const account = await program.account.developerProfile.fetch(pda);
  const onChainScore = BigInt(account.contributionScore.toString());

  const calculatedScore = calculateContributionScore(
    account.tasksCompleted,
    Number(account.totalVerificationScore),
    account.timeActiveDays,
  );

  return {
    valid: onChainScore === calculatedScore,
    onChainScore,
    calculatedScore,
  };
}
```

## Merkle Tree Sizing Reference

| Depth | Max Leaves | Buffer | Canopy | Est. Cost (SOL) | Use Case |
|-------|-----------|--------|--------|-----------------|----------|
| 14 | 16,384 | 64 | 8 | ~0.4 | Small community (<16K contributions) |
| 16 | 65,536 | 64 | 10 | ~1.5 | Medium community (<65K contributions) |
| 20 | 1,048,576 | 256 | 14 | ~12 | Large community (<1M contributions) |
| 24 | 16,777,216 | 512 | 18 | ~90 | Very large (<16M contributions) |
| 30 | 1,073,741,824 | 2048 | 24 | ~7,500+ | Maximum (1B contributions) |

**Recommendation for GSD:** Start with depth=16 (65K leaves). This provides room for initial growth at reasonable cost (~1.5 SOL). When the tree fills, create a new tree and update the tree config PDA. The off-chain indexer tracks contributions across multiple trees.

**Canopy depth guidance:** `maxDepth - canopyDepth <= 10` for composability. Higher canopy = larger account but smaller proofs (cheaper transactions). For depth=16 with canopy=10, proof size = 6 hashes (192 bytes).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual PDAs per contribution | State Compression (Merkle trees) | 2023 (SPL Account Compression) | 1000x+ cost reduction for storing many records |
| SPL State Compression alone | ZK Compression (Light Protocol) | 2024 | Further cost reduction with ZK proofs. But more complex, still maturing |
| spl-account-compression Rust crate | Raw CPI or wait for update | 2025 (crate stalled at anchor-lang ^0.31) | Must use raw CPI with anchor-lang 0.32+ projects |
| Helius SDK v1 (web3.js v1) | Helius SDK v2 (@solana/kit) | 2026 (SDK rewrite) | v2 incompatible with Anchor's web3.js v1 requirement. Use REST API |
| Custom event indexing | Helius webhooks + noop logs | 2023+ | Standard pattern for compressed state indexing |
| Floating-point on-chain | Fixed-point integers (u64 scaled) | Always on Solana | Solana BPF has no floating-point. All math must use integer arithmetic |

**Deprecated/outdated:**
- `spl-account-compression` Rust crate with anchor-lang 0.32+ projects -- use raw CPI
- `helius-sdk v1.x` -- maintenance mode, team recommends v2.x
- `helius-sdk v2.x` with Anchor 0.32 projects -- use REST API instead to avoid @solana/kit conflict
- Storing each contribution as an individual PDA -- prohibitively expensive at scale (~0.002 SOL per PDA vs pennies per leaf)

## Open Questions

1. **SPL Account Compression instruction discriminator format**
   - What we know: The program is Anchor-based (uses anchor-lang ^0.31). Anchor programs use 8-byte discriminators derived from `hash("global:<instruction_name>")`.
   - What's unclear: Whether the deployed program's instruction discriminators match standard Anchor format, or if there are any modifications. The instruction names (append, init, replace_leaf, verify_leaf) are known but the exact serialization must be confirmed.
   - Recommendation: Before implementing raw CPI, fetch the program's IDL from chain (`anchor idl fetch cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK --provider.cluster devnet`) or examine the TypeScript SDK's instruction builders to confirm exact byte layout.

2. **Merkle tree authority model**
   - What we know: The tree has an "authority" account that must sign append/replace operations. For GSD, this should be a PDA controlled by the gsd-hub program so that only the program can add contributions.
   - What's unclear: Whether a PDA can be the tree authority (requires `invoke_signed` for CPI), or if there are restrictions.
   - Recommendation: Test on devnet with a program-owned PDA as tree authority. This is the standard pattern for program-controlled trees but should be verified early.

3. **Helius webhook reliability for <3-second sync target**
   - What we know: Helius documentation claims low-latency delivery. Raw webhooks are faster than enhanced (no parsing overhead). Webhooks may be retried and duplicated.
   - What's unclear: Actual p95 latency from on-chain transaction confirmation to webhook delivery. Whether the free tier (1 webhook) is sufficient for development.
   - Recommendation: Implement a fallback polling mechanism that runs every 30 seconds to catch any missed webhooks. Use the transaction signature as an idempotency key. Measure actual latency in development.

4. **Migration path for existing Phase 1 DeveloperProfile accounts**
   - What we know: Existing accounts are 89 bytes. New schema needs 130 bytes. Anchor's `realloc` constraint can resize accounts.
   - What's unclear: Whether a bulk migration is needed or if lazy migration (realloc on first access) is sufficient. Whether the program upgrade (adding new instructions) requires redeployment via multisig.
   - Recommendation: Use lazy migration -- each developer's profile is reallocated on their first score update. No bulk migration script needed. The program upgrade itself goes through the established Squads multisig process.

5. **Who can record contributions and what prevents gaming?**
   - What we know: The requirements specify that contributions are recorded on-chain with task reference and verification score. Phase 5 introduces AI-powered verification.
   - What's unclear: For Phase 2, who has the authority to record a contribution? Options: (a) multisig only, (b) designated "verifier" role, (c) any developer self-reports, (d) program authority (admin).
   - Recommendation: Use a designated authority model -- a "contribution authority" PDA or keypair (controlled by the core team initially, multisig later) is the only account that can call `record_contribution`. Self-reporting opens gaming risks. This can be evolved in Phase 5 when AI verification is added.

## Sources

### Primary (HIGH confidence)
- [SPL Account Compression Program Docs](https://spl.solana.com/account-compression/) - Program overview, CPI interface
- [spl-account-compression Rust crate docs](https://docs.rs/spl-account-compression/latest/spl_account_compression/) - API reference, version 1.0.0, anchor-lang ^0.31 dependency confirmed
- [spl-account-compression on lib.rs](https://lib.rs/crates/spl-account-compression) - Version history, "minimal maintenance" status confirmed
- [SPL Account Compression TS SDK constants](https://github.com/solana-labs/solana-program-library/blob/master/account-compression/sdk/src/constants/index.ts) - Program IDs confirmed: compression=cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK, noop=noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV
- [Helius Webhooks Docs](https://www.helius.dev/docs/webhooks) - Webhook types, setup, delivery guarantees
- [Helius Create Webhook API](https://www.helius.dev/docs/api-reference/webhooks/create-webhook) - REST API spec: POST /v0/webhooks, all parameters
- [Anchor Account Constraints](https://www.anchor-lang.com/docs/references/account-constraints) - realloc constraint syntax and behavior

### Secondary (MEDIUM confidence)
- [Helius Blog: All About Compression](https://www.helius.dev/blog/all-you-need-to-know-about-compression-on-solana) - Merkle tree sizing, cost calculations, canopy depth guidance
- [Helius SDK GitHub](https://github.com/helius-labs/helius-sdk) - v2.1.0 confirmed, @solana/kit dependency confirmed, webhook methods documented
- [anchor-spl Cargo.toml](https://docs.rs/crate/anchor-spl/latest/source/Cargo.toml) - Confirmed no spl-account-compression dependency in anchor-spl 0.32.1
- [Solana State Compression Docs](https://solana.com/docs/advanced/state-compression) - Conceptual overview
- [Generalized State Compression Course](https://solana.com/developers/courses/state-compression/generalized-state-compression) - Custom data compression patterns

### Tertiary (LOW confidence -- needs validation)
- Raw CPI instruction discriminator format for spl-account-compression -- assumed standard Anchor format, needs verification against deployed IDL
- Merkle tree cost estimates in the sizing table -- derived from general formulas, exact costs depend on current rent rates
- PDA-as-tree-authority pattern -- logical but not explicitly confirmed in documentation for spl-account-compression specifically
- Helius webhook latency (<3 seconds) -- claimed but not formally SLA'd, actual performance needs measurement

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH -- core libraries identified, but version incompatibilities (spl-account-compression crate with anchor 0.32, helius-sdk v2 with web3.js v1) require workarounds that are well-understood but add implementation complexity
- Architecture: MEDIUM-HIGH -- patterns are established (raw CPI, webhook indexing, PDA realloc), but custom compressed data indexing is less documented than the NFT path
- Pitfalls: HIGH -- version conflicts, DAS API limitations, realloc migration, and idempotency issues are well-documented and clearly avoidable
- Integration complexity: MEDIUM -- three new integration surfaces (on-chain compression, webhooks, PDA migration) each have known patterns but the combination requires careful orchestration

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days -- SPL libraries are stable/"minimal maintenance", Helius API is stable)
