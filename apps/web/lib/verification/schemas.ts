/**
 * Zod schemas for AI verification structured output.
 *
 * These schemas define the shape of Claude API responses when using
 * structured outputs via zodOutputFormat. The AI is constrained to
 * return JSON matching these schemas exactly.
 */

import { z } from "zod";

/** Individual finding within a verification category */
export const FindingSchema = z.object({
  /** What was evaluated (e.g., "Error handling in API routes") */
  criterion: z.string(),
  /** Whether the criterion was met */
  met: z.boolean(),
  /** Specific evidence citing files, line ranges, or patterns */
  evidence: z.string(),
  /** Relative weight of this finding within its category (0-1) */
  weight: z.number(),
});

/** A scored verification category with supporting findings */
export const CategorySchema = z.object({
  /** Category name (e.g., "Code Quality") */
  name: z.string(),
  /** Score for this category (0-100) */
  score: z.number(),
  /** Maximum possible score (always 100) */
  maxScore: z.number().default(100),
  /** Individual findings that support the score */
  findings: z.array(FindingSchema),
});

/**
 * Full verification report output schema.
 *
 * Used with zodOutputFormat to constrain Claude API responses.
 * The overallScore returned by the AI is informational only --
 * the authoritative score is recomputed server-side via computeWeightedScore.
 */
export const VerificationReportOutputSchema = z.object({
  /** AI-reported overall score (0-100). Recomputed server-side. */
  overallScore: z.number(),
  /** AI confidence in the verification (0-100). Below 60 = needs human review. */
  confidence: z.number(),
  /** Scored categories matching the 60/40 code/workflow split */
  categories: z.object({
    codeQuality: CategorySchema,
    taskFulfillment: CategorySchema,
    testCoverage: CategorySchema,
    workflowDiscipline: CategorySchema,
    planAdherence: CategorySchema,
  }),
  /** List of files that were analyzed */
  filesAnalyzed: z.array(z.string()),
  /** Human-readable summary of the verification */
  summary: z.string(),
  /** Actionable recommendations for improvement */
  recommendations: z.array(z.string()),
  /** Domain tags inferred from file paths (e.g., "on-chain", "frontend") */
  domainTags: z.array(z.string()),
});

/** TypeScript type inferred from the verification report schema */
export type VerificationReportOutput = z.infer<
  typeof VerificationReportOutputSchema
>;

/** TypeScript type for an individual finding */
export type Finding = z.infer<typeof FindingSchema>;

/** TypeScript type for a scored category */
export type Category = z.infer<typeof CategorySchema>;
