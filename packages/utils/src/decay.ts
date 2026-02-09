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

import { calculateContributionScore, type ScoreInput } from "./score.js";

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
  throw new Error("Not implemented");
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
  throw new Error("Not implemented");
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
  throw new Error("Not implemented");
}
