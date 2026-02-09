/**
 * Verification engine constants.
 *
 * Centralizes all configurable thresholds, weights, model selections,
 * and domain tag mappings for the AI verification system.
 */

/** Cost-effective model for task verification */
export const VERIFICATION_MODEL = "claude-sonnet-4-5";

/** Model for AI proposal analysis */
export const PROPOSAL_MODEL = "claude-sonnet-4-5";

/** Maximum code diff size in characters (50KB) to prevent token overflow */
export const MAX_CODE_DIFF_CHARS = 50_000;

/** Maximum tokens for verification response */
export const MAX_VERIFICATION_TOKENS = 4096;

/** Maximum tokens for proposal analysis response */
export const MAX_PROPOSAL_TOKENS = 4096;

/**
 * Confidence threshold (on-chain scale 0-10000).
 * Below this value triggers peer review fallback.
 * 6000 = 60%
 */
export const CONFIDENCE_THRESHOLD = 6000;

/**
 * Default category weights for the verification score formula.
 * Values are on-chain scale (0-10000 total = 100%).
 *
 * Code Output Weight: 60%
 *   - codeQuality: 25%
 *   - taskFulfillment: 20%
 *   - testCoverage: 15%
 *
 * Workflow Quality Weight: 40%
 *   - workflowDiscipline: 25%
 *   - planAdherence: 15%
 */
export const DEFAULT_WEIGHTS = {
  codeQuality: 2500,
  taskFulfillment: 2000,
  testCoverage: 1500,
  workflowDiscipline: 2500,
  planAdherence: 1500,
} as const;

/**
 * Maps file path glob patterns to domain tags.
 * Used for AI-inferred domain tagging of contributions.
 */
export const DOMAIN_TAGS: Record<string, string> = {
  "programs/**/*.rs": "on-chain",
  "components/**/*.tsx": "frontend",
  "app/api/**": "api",
  "tests/**": "testing",
  "lib/**": "backend",
  "packages/**": "shared",
};

/**
 * Tier thresholds for the 3-tier peer review system.
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
