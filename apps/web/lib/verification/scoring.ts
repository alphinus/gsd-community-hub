/**
 * Weighted score computation for verification reports.
 *
 * Implements the 60/40 code/workflow split formula:
 *   Combined = (codeQuality * 0.25 + taskFulfillment * 0.20 + testCoverage * 0.15)
 *            + (workflowDiscipline * 0.25 + planAdherence * 0.15)
 *
 * All input scores are clamped to 0-100 before weighting.
 * Output is a 0-100 integer.
 */

import { DEFAULT_WEIGHTS, DOMAIN_TAGS } from "./constants";

/** Category scores keyed by category name */
export interface CategoryScores {
  codeQuality: number;
  taskFulfillment: number;
  testCoverage: number;
  workflowDiscipline: number;
  planAdherence: number;
}

/** Optional custom weights (on-chain scale: 0-10000 total) */
export type Weights = typeof DEFAULT_WEIGHTS;

/** Clamp a value to the 0-100 range */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute the weighted verification score from category scores.
 *
 * Uses the 60/40 code/workflow split:
 *   Code Output (60%): codeQuality 25%, taskFulfillment 20%, testCoverage 15%
 *   Workflow Quality (40%): workflowDiscipline 25%, planAdherence 15%
 *
 * @param categories - Individual category scores (0-100 each)
 * @param weights - Optional custom weights (defaults to DEFAULT_WEIGHTS)
 * @returns Combined score as a 0-100 integer
 */
export function computeWeightedScore(
  categories: CategoryScores,
  weights: Weights = DEFAULT_WEIGHTS
): number {
  // Clamp all input scores to 0-100 before weighting
  const clamped: CategoryScores = {
    codeQuality: clamp(categories.codeQuality, 0, 100),
    taskFulfillment: clamp(categories.taskFulfillment, 0, 100),
    testCoverage: clamp(categories.testCoverage, 0, 100),
    workflowDiscipline: clamp(categories.workflowDiscipline, 0, 100),
    planAdherence: clamp(categories.planAdherence, 0, 100),
  };

  // Total weight for normalization (should be 10000)
  const totalWeight =
    weights.codeQuality +
    weights.taskFulfillment +
    weights.testCoverage +
    weights.workflowDiscipline +
    weights.planAdherence;

  // Weighted sum
  const weightedSum =
    clamped.codeQuality * weights.codeQuality +
    clamped.taskFulfillment * weights.taskFulfillment +
    clamped.testCoverage * weights.testCoverage +
    clamped.workflowDiscipline * weights.workflowDiscipline +
    clamped.planAdherence * weights.planAdherence;

  // Normalize to 0-100 and clamp
  const score = weightedSum / totalWeight;
  return clamp(Math.round(score), 0, 100);
}

/**
 * Convert a 0-100 float score to 0-10000 integer for on-chain storage.
 * Preserves two decimal places of precision.
 *
 * @param score - Score in 0-100 range
 * @returns Integer in 0-10000 range
 */
export function scaleToOnChain(score: number): number {
  return Math.round(clamp(score, 0, 100) * 100);
}

/**
 * Convert a 0-10000 on-chain integer back to 0-100 for display.
 *
 * @param score - On-chain score in 0-10000 range
 * @returns Float in 0-100 range
 */
export function scaleFromOnChain(score: number): number {
  return clamp(score, 0, 10000) / 100;
}

/**
 * Infer domain tags from a list of file paths.
 *
 * Maps file paths to domain tags using glob-like pattern matching
 * from the DOMAIN_TAGS constant. Returns unique sorted tags.
 *
 * @param fileList - Array of file paths from the code diff
 * @returns Sorted array of unique domain tag strings
 */
export function inferDomainTags(fileList: string[]): string[] {
  const tags = new Set<string>();

  for (const filePath of fileList) {
    for (const [pattern, tag] of Object.entries(DOMAIN_TAGS)) {
      if (matchGlobPattern(pattern, filePath)) {
        tags.add(tag);
      }
    }
  }

  return Array.from(tags).sort();
}

/**
 * Simple glob pattern matcher for domain tag inference.
 * Supports ** (any path segments) and * (any single segment).
 */
function matchGlobPattern(pattern: string, filePath: string): boolean {
  // Normalize: remove leading slashes
  const normalizedPath = filePath.replace(/^\/+/, "");

  // Convert glob pattern to regex
  const regexStr = pattern
    .replace(/\*\*/g, "<<GLOBSTAR>>")
    .replace(/\*/g, "[^/]*")
    .replace(/<<GLOBSTAR>>/g, ".*");

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(normalizedPath);
}
