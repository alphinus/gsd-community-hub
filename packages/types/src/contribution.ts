/**
 * Contribution types for the GSD Community Hub.
 *
 * These mirror the on-chain ContributionLeaf schema and related
 * off-chain metadata for the contribution tracking system.
 */

/**
 * Core contribution data matching the on-chain ContributionLeaf fields.
 *
 * Field sizes match the Rust struct serialization:
 * - developer: 32 bytes (Pubkey)
 * - taskRef: 32 bytes (SHA-256 hash of task identifier)
 * - verificationScore: 2 bytes (u16, 0-10000 = 0.00%-100.00%)
 * - timestamp: 8 bytes (i64, unix timestamp)
 * - contentHash: 32 bytes (SHA-256 hash of contribution content)
 *
 * Total serialized: 106 bytes
 */
export interface ContributionData {
  /** Wallet public key of the developer (base58 string, 32 bytes on-chain) */
  developer: string;
  /** SHA-256 hash of the task identifier (hex string, 32 bytes on-chain) */
  taskRef: string;
  /** Verification score: 0-10000 representing 0.00%-100.00% */
  verificationScore: number;
  /** Unix timestamp in seconds when the contribution was recorded */
  timestamp: number;
  /** SHA-256 hash of off-chain contribution content (hex string, 32 bytes on-chain) */
  contentHash: string;
}

/**
 * Full contribution record including off-chain metadata.
 * Extends ContributionData with database fields.
 */
export interface ContributionRecord extends ContributionData {
  /** Unique database identifier */
  id: string;
  /** Human-readable task title or reference */
  taskTitle: string;
  /** Brief description of the contribution */
  description: string;
  /** Leaf hash from the Merkle tree (hex string) */
  leafHash: string;
  /** Index in the Merkle tree, if appended */
  leafIndex?: number;
  /** Solana transaction signature that recorded this on-chain */
  txSignature?: string;
  /** Database creation timestamp */
  createdAt: Date;
  /** Database update timestamp */
  updatedAt: Date;
}

/**
 * Contribution score summary for a developer.
 * Maps to the score fields in the on-chain DeveloperProfile account.
 */
export interface ContributionScore {
  /** Number of verified tasks completed */
  tasksCompleted: number;
  /** Sum of all verification scores (for average calculation) */
  totalVerificationScore: bigint;
  /** Days active since first contribution */
  timeActiveDays: number;
  /** Contribution score scaled by 1e6 for fixed-point precision */
  contributionScore: bigint;
  /** Unix timestamp of first contribution, 0 = none */
  firstContributionAt: number;
  /** Unix timestamp of most recent contribution */
  lastContributionAt: number;
  /** Score formula version */
  scoreVersion: number;
}
