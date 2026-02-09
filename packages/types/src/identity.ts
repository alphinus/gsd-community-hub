/**
 * Identity verification and delegation types for advanced governance.
 *
 * These types support Phase 6 features: Civic Pass human verification
 * (sybil resistance for quadratic voting) and vote delegation.
 *
 * BigInt fields (delegated amounts) are serialized as strings per
 * project convention (JSON cannot serialize BigInt).
 */

// --- Human verification (Civic Pass) ---

/** Status of a wallet's human verification via Civic Pass */
export type HumanVerificationStatus = "pending" | "verified" | "expired";

/** Human verification info combining on-chain gatekeeper data with off-chain metadata */
export interface HumanVerificationInfo {
  /** Base58-encoded wallet address */
  walletAddress: string;
  /** Base58-encoded Civic gatekeeper network public key */
  gatekeeperNetwork: string;
  /** Whether the wallet is currently verified */
  verified: boolean;
  /** ISO timestamp when verification was confirmed, null if pending */
  verifiedAt: string | null;
  /** ISO timestamp when verification expires, null if no expiry */
  expiresAt: string | null;
}

// --- Vote delegation ---

/** Delegation record combining on-chain DelegationRecord with off-chain metadata */
export interface DelegationInfo {
  /** Database ID (cuid) */
  id: string;
  /** Base58-encoded delegator wallet address */
  delegatorWallet: string;
  /** Base58-encoded delegate wallet address */
  delegateWallet: string;
  /** Amount of voting power delegated (string-serialized BigInt) */
  delegatedAmount: string;
  /** Whether the delegation is currently active */
  isActive: boolean;
  /** Round index from which this delegation takes effect */
  effectiveFromRound: number;
  /** ISO timestamp when delegation was created */
  delegatedAt: string;
}

/** Aggregate delegation statistics for governance dashboard */
export interface DelegationStats {
  /** Total number of active delegations */
  totalDelegations: number;
  /** Total tokens delegated across all delegations (string-serialized BigInt) */
  totalDelegatedTokens: string;
  /** Top delegates ranked by delegator count */
  topDelegates: Array<{
    /** Base58-encoded delegate wallet address */
    wallet: string;
    /** Number of wallets delegating to this delegate */
    delegatorCount: number;
    /** Total tokens delegated to this delegate (string-serialized BigInt) */
    totalDelegated: string;
  }>;
}
