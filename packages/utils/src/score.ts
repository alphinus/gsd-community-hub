/**
 * Contribution score calculation with BigInt precision.
 *
 * The score formula rewards developers based on:
 * - Number of tasks completed (volume)
 * - Average verification score (quality)
 * - Time active in days (longevity, with diminishing returns via sqrt)
 *
 * Formula:
 *   score = tasksCompleted * avgScore * sqrt(timeActiveDays)
 *         = tasksCompleted * (totalVerificationScore / tasksCompleted) * sqrt(timeActiveDays)
 *         = totalVerificationScore * sqrt(timeActiveDays)
 *
 * But we want tasks to matter independently (not cancel out), so the actual formula is:
 *   score = tasksCompleted * (totalVerificationScore / tasksCompleted) * sqrt(timeActiveDays * PRECISION)
 *
 * Simplified:
 *   score = totalVerificationScore * sqrt(timeActiveDays * PRECISION)
 *
 * Wait -- that makes tasksCompleted irrelevant if avgScore stays the same.
 * To reward both volume AND quality:
 *   score = sqrt(tasksCompleted * PRECISION) * totalVerificationScore * sqrt(timeActiveDays * PRECISION) / PRECISION
 *
 * This gives:
 * - sqrt scaling for tasks (diminishing returns on volume)
 * - linear scaling for total score (cumulative quality)
 * - sqrt scaling for time (longevity with diminishing returns)
 *
 * All arithmetic uses BigInt to prevent overflow for active developers.
 * The result is stored as u64 on-chain.
 */

/** Precision factor for fixed-point sqrt calculations (1e6) */
const PRECISION = 1_000_000n;

export interface ScoreInput {
  /** Number of verified tasks completed */
  tasksCompleted: number;
  /** Sum of all verification scores (each 0-10000) */
  totalVerificationScore: bigint;
  /** Days active since first contribution */
  timeActiveDays: number;
}

/**
 * Integer square root using Newton's method for BigInt values.
 *
 * Returns floor(sqrt(n)) for non-negative n.
 * Throws if n is negative.
 */
export function bigintSqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new Error("Cannot compute square root of negative number");
  }
  if (n === 0n) return 0n;
  if (n === 1n) return 1n;

  // Newton's method: x_{n+1} = (x_n + n / x_n) / 2
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/**
 * Calculate a developer's contribution score using BigInt arithmetic.
 *
 * Formula:
 *   score = sqrt(tasksCompleted * PRECISION) * totalVerificationScore * sqrt(timeActiveDays * PRECISION) / PRECISION
 *
 * Properties:
 * - Returns 0n if any input is zero
 * - Uses BigInt throughout to prevent overflow
 * - Result fits in u64 for on-chain storage
 * - Deterministic: same inputs always produce same output
 * - Monotonically increasing with all three inputs
 *
 * @returns Contribution score as BigInt (suitable for u64 on-chain storage)
 */
export function calculateContributionScore(input: ScoreInput): bigint {
  const tasks = BigInt(input.tasksCompleted);
  const totalScore = input.totalVerificationScore;
  const days = BigInt(input.timeActiveDays);

  // Any zero input produces zero score
  if (tasks === 0n || totalScore === 0n || days === 0n) {
    return 0n;
  }

  // sqrt(tasksCompleted * PRECISION) -- diminishing returns on volume
  const taskFactor = bigintSqrt(tasks * PRECISION);

  // sqrt(timeActiveDays * PRECISION) -- diminishing returns on longevity
  const timeFactor = bigintSqrt(days * PRECISION);

  // score = taskFactor * totalVerificationScore * timeFactor / PRECISION
  // Division by PRECISION normalizes the two sqrt(... * PRECISION) factors
  const score = (taskFactor * totalScore * timeFactor) / PRECISION;

  return score;
}
