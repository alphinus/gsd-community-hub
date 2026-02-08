/**
 * Revenue types for the GSD Community Hub.
 *
 * These mirror the on-chain revenue state structs and enums
 * defined in programs/gsd-hub/src/state/. TypeScript string unions
 * correspond to Rust enums, and interfaces correspond to account
 * structs with off-chain metadata extensions.
 *
 * BigInt fields (amounts, scores) are serialized as strings per
 * project convention (JSON cannot serialize BigInt).
 */

// --- Enums (matching on-chain Rust enums) ---

/** Matches on-chain RevenueStatus enum (revenue_event.rs) */
export type RevenueStatus = "recorded" | "distributing" | "completed";

/** Matches on-chain RevenueToken enum (revenue_event.rs) */
export type RevenueToken = "sol" | "usdc";

// --- Account interfaces (on-chain struct + off-chain metadata) ---

/**
 * Revenue event combining on-chain RevenueEvent account data
 * with off-chain metadata stored in the database.
 *
 * Amounts are string-serialized BigInt per project convention.
 */
export interface RevenueEventInfo {
  /** Sequential event index matching on-chain event_index (u32) */
  eventIndex: number;
  /** Token type for this revenue event */
  token: RevenueToken;
  /** Total revenue amount received (string-serialized u64) */
  totalAmount: string;
  /** Amount allocated to developer pool (string-serialized u64) */
  developerPool: string;
  /** Amount allocated to treasury reserve (string-serialized u64) */
  treasuryReserve: string;
  /** Amount allocated for $GSD burn (string-serialized u64) */
  burnAmount: string;
  /** Amount allocated to maintenance (string-serialized u64) */
  maintenanceAmount: string;
  /** Current status matching on-chain RevenueStatus */
  status: RevenueStatus;
  /** Base58-encoded signature of originating revenue transaction */
  originSignature: string;
  /** Total contribution score snapshotted at recording time (string-serialized u64) */
  totalContributionScore: string;
  /** How much of developer_pool has been claimed (string-serialized u64) */
  claimedAmount: string;
  /** Base58-encoded burn transaction signature, null until burn executes */
  burnSignature: string | null;
  /** Actual $GSD tokens burned (string-serialized u64) */
  gsdBurned: string;
  /** ISO date string of when event was recorded */
  recordedAt: string;
  /** Base58-encoded on-chain PDA address */
  onChainAddress: string;
}

/**
 * Revenue claim matching on-chain RevenueClaim account.
 * Amounts and scores are string-serialized BigInt.
 */
export interface RevenueClaimInfo {
  /** Base58-encoded wallet of the claimant */
  claimantWallet: string;
  /** Database ID of the revenue event */
  revenueEventId: string;
  /** Contributor's score at claim time (string-serialized u64) */
  contributionScore: string;
  /** Total contribution score from event snapshot (string-serialized u64) */
  totalScore: string;
  /** Amount claimed (string-serialized u64) */
  amount: string;
  /** ISO date string of when claim was made */
  claimedAt: string;
  /** Base58-encoded transaction signature */
  transactionSignature: string;
}

/**
 * Revenue configuration matching on-chain RevenueConfig singleton.
 * Public keys are Base58-encoded strings. Amounts are string-serialized BigInt.
 */
export interface RevenueConfigInfo {
  /** Base58-encoded admin authority public key */
  admin: string;
  /** Developer pool basis points (e.g. 6000 = 60%) */
  developerBps: number;
  /** Treasury reserve basis points (e.g. 2000 = 20%) */
  treasuryBps: number;
  /** Burn basis points (e.g. 1000 = 10%) */
  burnBps: number;
  /** Maintenance basis points (e.g. 1000 = 10%) */
  maintenanceBps: number;
  /** Base58-encoded treasury wallet address */
  treasuryAddress: string;
  /** Base58-encoded maintenance wallet address */
  maintenanceAddress: string;
  /** Base58-encoded $GSD token mint */
  gsdMint: string;
  /** Base58-encoded USDC mint address */
  usdcMint: string;
  /** Total revenue events recorded */
  eventCount: number;
  /** Minimum amount to trigger distribution (string-serialized u64) */
  minRevenueThreshold: string;
}

/**
 * Aggregate revenue summary for dashboard display.
 * All amounts are string-serialized BigInt.
 */
export interface RevenueSummary {
  /** Total revenue received across all events (string-serialized) */
  totalRevenue: string;
  /** Total amount distributed to developers (string-serialized) */
  totalDistributed: string;
  /** Total amount sent to burn (string-serialized) */
  totalBurned: string;
  /** Total $GSD tokens actually burned (string-serialized) */
  totalGsdBurned: string;
  /** Number of revenue events */
  eventCount: number;
}
