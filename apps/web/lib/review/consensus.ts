/**
 * Peer review consensus calculation.
 *
 * Implements tier-weighted consensus for the 3-tier peer review system.
 * Consensus requires 70% of total weight to agree on pass or fail.
 * Reviewers: Explorer (1x), Builder (2x), Architect (3x).
 */

import type { ReviewerTier, ConsensusResult } from "@gsd/types";
import {
  MIN_REVIEWERS,
  CONSENSUS_THRESHOLD,
  CONFIDENCE_PENALTY,
  TIER_WEIGHTS,
  TIER_THRESHOLDS,
} from "./constants";

/**
 * Input for a single review submission in consensus calculation.
 */
export interface ReviewSubmission {
  /** Reviewer's tier: 1 (Explorer), 2 (Builder), 3 (Architect) */
  reviewerTier: ReviewerTier;
  /** Score 0-10000 */
  score: number;
  /** Whether the reviewer considers the contribution passing */
  passed: boolean;
}

/**
 * Calculate tier-weighted consensus from a set of peer reviews.
 *
 * - Requires at least MIN_REVIEWERS (3) submissions
 * - Each reviewer's vote is weighted by tier (1x, 2x, 3x)
 * - Consensus reached when 70%+ of total weight agrees on pass/fail
 * - Disagreement applies a confidence penalty to the weighted score
 *
 * @param reviews Array of review submissions
 * @returns ConsensusResult with pass/fail, weighted score, and agreement ratio
 */
export function calculateConsensus(reviews: ReviewSubmission[]): ConsensusResult {
  // Not enough reviewers -- cannot reach consensus
  if (reviews.length < MIN_REVIEWERS) {
    return {
      hasConsensus: false,
      passed: false,
      weightedScore: 0,
      totalWeight: 0,
      agreementRatio: 0,
    };
  }

  let totalWeight = 0;
  let weightedScoreSum = 0;
  let passWeight = 0;
  let failWeight = 0;

  for (const review of reviews) {
    const weight = TIER_WEIGHTS[review.reviewerTier];
    totalWeight += weight;
    weightedScoreSum += review.score * weight;

    if (review.passed) {
      passWeight += weight;
    } else {
      failWeight += weight;
    }
  }

  const passRatio = passWeight / totalWeight;
  const failRatio = failWeight / totalWeight;

  const hasConsensus =
    passRatio >= CONSENSUS_THRESHOLD || failRatio >= CONSENSUS_THRESHOLD;
  const passed = passRatio >= CONSENSUS_THRESHOLD;

  let weightedScore = Math.round(weightedScoreSum / totalWeight);

  // Apply confidence penalty when reviewers disagree (no consensus despite enough reviewers)
  if (!hasConsensus) {
    weightedScore = Math.max(0, weightedScore - CONFIDENCE_PENALTY);
  }

  return {
    hasConsensus,
    passed,
    weightedScore,
    totalWeight,
    agreementRatio: hasConsensus ? Math.max(passRatio, failRatio) : Math.max(passRatio, failRatio),
  };
}

/**
 * Determine a reviewer's tier based on verified contribution counts.
 *
 * Returns the highest tier whose thresholds are met.
 * Defaults to Explorer (1) if no thresholds are met.
 *
 * @param verifiedContributions Total verified contributions across all domains
 * @param domainContributions Contributions in the relevant domain
 * @returns Tier number: 1 (Explorer), 2 (Builder), or 3 (Architect)
 */
export function determineTier(
  verifiedContributions: number,
  domainContributions: number,
): ReviewerTier {
  if (
    verifiedContributions >= TIER_THRESHOLDS.architect.minContributions &&
    domainContributions >= TIER_THRESHOLDS.architect.minDomainContributions
  ) {
    return 3;
  }

  if (
    verifiedContributions >= TIER_THRESHOLDS.builder.minContributions &&
    domainContributions >= TIER_THRESHOLDS.builder.minDomainContributions
  ) {
    return 2;
  }

  return 1;
}
