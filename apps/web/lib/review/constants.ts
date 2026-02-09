/**
 * Peer review system constants.
 *
 * Centralizes all configurable thresholds, tier weights, reward rates,
 * and anti-collusion parameters for the 3-tier peer review system.
 */

import type { ReviewerTier } from "@gsd/types";

/** Minimum number of reviewers required before consensus can be evaluated */
export const MIN_REVIEWERS = 3;

/** Consensus threshold: 70% of total weight must agree for consensus */
export const CONSENSUS_THRESHOLD = 0.7;

/** Review timeout in days from assignment */
export const REVIEW_TIMEOUT_DAYS = 7;

/** Tier weight multipliers: Explorer 1x, Builder 2x, Architect 3x */
export const TIER_WEIGHTS: Record<ReviewerTier, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
};

/** Tier display names */
export const TIER_NAMES: Record<ReviewerTier, string> = {
  1: "Explorer",
  2: "Builder",
  3: "Architect",
};

/**
 * Review contribution rate multipliers by tier.
 * Reviewers earn 15-25% of the original contribution score credit.
 */
export const TIER_REWARD_RATES: Record<ReviewerTier, number> = {
  1: 0.15,
  2: 0.2,
  3: 0.25,
};

/**
 * Tier promotion thresholds.
 * Requirements are cumulative (must meet all criteria for the tier).
 */
export const TIER_THRESHOLDS = {
  explorer: {
    minContributions: 1,
    minDomainContributions: 0,
  },
  builder: {
    minContributions: 10,
    minDomainContributions: 3,
  },
  architect: {
    minContributions: 50,
    minDomainContributions: 10,
  },
} as const;

/**
 * Anti-collusion: same reviewer cannot review same contributor
 * more than this many times consecutively.
 */
export const MAX_CONSECUTIVE_REVIEWS = 3;

/**
 * Confidence penalty applied to weighted score when reviewers disagree
 * (neither pass nor fail ratio meets consensus threshold).
 * 1000 = 10 points on the 0-10000 scale.
 */
export const CONFIDENCE_PENALTY = 1000;
