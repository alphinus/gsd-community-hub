/**
 * Reputation decay computation for contribution scores.
 *
 * Uses exponential half-life decay: each contribution's verification score
 * is multiplied by 2^(-age/halfLife), producing a decayed total that feeds
 * into the existing contribution score formula.
 *
 * Purpose: Incentivize sustained participation by making old contributions
 * count less over time. This affects revenue share proportions, so
 * correctness is critical.
 */

import { calculateContributionScore, type ScoreInput } from "./score";

/** Default half-life in days: contributions lose half their weight every 180 days */
export const DECAY_HALF_LIFE_DAYS = 180;

/** A contribution with its verification score and age for decay calculation */
export interface DecayContribution {
  verificationScore: number;
  ageDays: number;
}

/**
 * Compute the decay multiplier for a contribution of a given age.
 *
 * Formula: 2^(-ageDays / halfLifeDays)
 *
 * @param ageDays - Age of the contribution in days
 * @param halfLifeDays - Half-life in days (default: 180)
 * @returns Multiplier between 0 and 1
 */
export function decayMultiplier(
  ageDays: number,
  halfLifeDays: number = DECAY_HALF_LIFE_DAYS
): number {
  // Edge cases: negative age treated as 0 (no decay), zero half-life treated as no decay
  if (ageDays <= 0 || halfLifeDays <= 0) {
    return 1.0;
  }
  return Math.pow(2, -ageDays / halfLifeDays);
}

/**
 * Calculate the total decayed verification score for a set of contributions.
 *
 * Each contribution's verification score is weighted by its age-based decay
 * multiplier, then summed and rounded to a BigInt.
 *
 * @param contributions - Array of contributions with scores and ages
 * @param halfLifeDays - Half-life in days (default: 180)
 * @returns Decayed total verification score as BigInt
 */
export function calculateDecayedScore(
  contributions: DecayContribution[],
  halfLifeDays: number = DECAY_HALF_LIFE_DAYS
): bigint {
  if (contributions.length === 0) {
    return 0n;
  }

  let total = 0;
  for (const c of contributions) {
    total += c.verificationScore * decayMultiplier(c.ageDays, halfLifeDays);
  }

  // Round to nearest integer, convert to BigInt
  return BigInt(Math.round(total));
}

/** Input for contribution score with decay, extending ScoreInput */
export type DecayScoreInput = ScoreInput & {
  contributions: DecayContribution[];
};

/**
 * Calculate contribution score using decayed verification totals.
 *
 * Computes the decayed total verification score from the contributions array,
 * then feeds it into calculateContributionScore with the modified total.
 *
 * @param input - Score input with contributions array for decay
 * @param halfLifeDays - Half-life in days (default: 180)
 * @returns Contribution score as BigInt, lower than non-decayed for old contributions
 */
export function calculateContributionScoreWithDecay(
  input: DecayScoreInput,
  halfLifeDays: number = DECAY_HALF_LIFE_DAYS
): bigint {
  // Compute decayed total verification score from individual contributions
  const decayedTotal = calculateDecayedScore(input.contributions, halfLifeDays);

  // Feed the decayed total into the existing contribution score formula
  return calculateContributionScore({
    tasksCompleted: input.tasksCompleted,
    totalVerificationScore: decayedTotal,
    timeActiveDays: input.timeActiveDays,
  });
}
