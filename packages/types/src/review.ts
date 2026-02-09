/**
 * Peer review types for the GSD Community Hub.
 *
 * These mirror the on-chain peer review and reviewer profile state structs
 * defined in programs/gsd-hub/src/state/. Number literal unions correspond
 * to Rust u8 tier values.
 */

// --- Enums and constants ---

/** Reviewer tier matching on-chain u8 values (1=Explorer, 2=Builder, 3=Architect) */
export type ReviewerTier = 1 | 2 | 3;

/** Lowercase tier names for display */
export type ReviewerTierName = "explorer" | "builder" | "architect";

/** Map tier numbers to display names */
export const TIER_NAMES: Record<ReviewerTier, string> = {
  1: "Explorer",
  2: "Builder",
  3: "Architect",
};

/** Map tier numbers to weight multipliers */
export const TIER_WEIGHTS: Record<ReviewerTier, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
};

/** Map tier numbers to reward rates (per research: 15-25% of code contribution rate) */
export const TIER_REWARD_RATES: Record<ReviewerTier, number> = {
  1: 0.15,
  2: 0.2,
  3: 0.25,
};

// --- Account interfaces (on-chain struct + off-chain metadata) ---

/**
 * Peer review combining on-chain PeerReview account data
 * with off-chain review evidence stored in the database.
 */
export interface PeerReviewInfo {
  /** Base58-encoded reviewer wallet address */
  reviewer: string;
  /** Base58-encoded verification report PDA address */
  verificationReport: string;
  /** Reviewer's tier at time of review */
  tier: ReviewerTier;
  /** Tier weight in basis points (1000, 2000, 3000) */
  weight: number;
  /** Review score 0-10000 */
  score: number;
  /** Reviewer's pass/fail verdict */
  passed: boolean;
  /** Hex-encoded SHA-256 of full off-chain review evidence */
  reviewHash: string;
  /** ISO date string of when review was submitted */
  reviewedAt: string;
  /** Base58-encoded on-chain PDA address (null if not yet on-chain) */
  onChainAddress: string | null;
  /** Off-chain review evidence details */
  evidence?: object;
}

/**
 * Reviewer profile combining on-chain ReviewerProfile account data
 * with off-chain domain statistics stored in the database.
 */
export interface ReviewerProfileInfo {
  /** Base58-encoded reviewer authority wallet */
  authority: string;
  /** Current reviewer tier */
  tier: ReviewerTier;
  /** Total number of reviews submitted */
  totalReviews: number;
  /** Total verified contributions */
  verifiedContributions: number;
  /** Review quality score 0-10000 */
  qualityScore: number;
  /** ISO date string of last profile update */
  updatedAt: string;
  /** Domain-specific review counts (off-chain, from Prisma JSON) */
  domainReviews?: Record<string, number>;
  /** Domain-specific contribution counts (off-chain, from Prisma JSON) */
  domainContributions?: Record<string, number>;
}

/**
 * Input for submitting a peer review.
 */
export interface ReviewSubmission {
  /** Review score 0-10000 */
  score: number;
  /** Pass/fail verdict */
  passed: boolean;
  /** Structured evidence supporting the review */
  evidenceJson: object;
}

/**
 * Result of peer review consensus calculation.
 */
export interface ConsensusResult {
  /** Whether consensus threshold was reached */
  hasConsensus: boolean;
  /** Whether the consensus result is pass */
  passed: boolean;
  /** Weighted average score */
  weightedScore: number;
  /** Total weight of all reviews */
  totalWeight: number;
  /** Ratio of agreeing reviewers by weight */
  agreementRatio: number;
}
