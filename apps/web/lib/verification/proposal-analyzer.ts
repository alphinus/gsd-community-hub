/**
 * AI proposal analyzer for governance ideas.
 *
 * Analyzes governance proposals against the actual codebase architecture
 * to produce feasibility scores, effort estimates, impact assessments,
 * and recommendations. Uses Claude Sonnet 4.5 with Zod structured outputs.
 *
 * The analyzer is codebase-aware: it receives a compact summary of the
 * project's architecture, state, instructions, and routes so the AI can
 * say "we already have X, this would require changing Y."
 *
 * Per research pitfall 7, analysis runs async and never blocks idea submission.
 * Failures are logged but do not throw.
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCodebaseSummary } from "./codebase-summary";
import { PROPOSAL_MODEL, MAX_PROPOSAL_TOKENS } from "./constants";

/**
 * Zod schema for structured proposal analysis output.
 * Defines the shape of Claude API responses via zodOutputFormat.
 */
export const ProposalAnalysisOutputSchema = z.object({
  /** Overall feasibility score (0-100). 90+ = trivially implementable */
  feasibilityScore: z.number(),
  /** Estimated development effort */
  estimatedEffort: z.enum(["small", "medium", "large", "epic"]),
  /** Impact assessment on existing architecture */
  impactAssessment: z.object({
    /** Areas of the codebase affected (e.g., "on-chain program", "frontend", "API") */
    affectedAreas: z.array(z.string()),
    /** Level of architectural impact */
    architecturalImpact: z.enum(["none", "minor", "moderate", "major"]),
    /** Whether this would introduce breaking changes */
    breakingChanges: z.boolean(),
    /** Overall risk level */
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
  }),
  /** Technical analysis of implementation requirements */
  technicalAnalysis: z.object({
    /** What already exists in the codebase that relates to this proposal */
    existingInfrastructure: z.string(),
    /** What new work needs to be built */
    requiredNewWork: z.string(),
    /** New external dependencies that would be needed */
    dependencies: z.array(z.string()),
    /** Potential blockers or obstacles */
    blockers: z.array(z.string()),
  }),
  /** Overall recommendation for the proposal */
  recommendation: z.enum(["approve", "needs_revision", "reject"]),
  /** Detailed reasoning behind the recommendation */
  reasoning: z.string(),
  /** Cost estimates for implementation */
  costEstimate: z.object({
    /** Estimated Solana on-chain transaction costs */
    onChainCosts: z.string(),
    /** Estimated infrastructure/API costs */
    infrastructureCosts: z.string(),
    /** Relative development complexity assessment */
    developmentComplexity: z.string(),
  }),
});

/** TypeScript type inferred from the proposal analysis schema */
export type ProposalAnalysisOutput = z.infer<
  typeof ProposalAnalysisOutputSchema
>;

/**
 * Analyze a governance proposal against the codebase.
 *
 * Calls Claude Sonnet 4.5 with the codebase summary as context and
 * the proposal title/description as input. Stores results in Prisma
 * IdeaAnalysis model.
 *
 * This function is designed to be called fire-and-forget (async, non-blocking).
 * It catches all errors internally and logs them rather than throwing,
 * ensuring idea submission is never blocked by analysis failure.
 *
 * @param input - Idea details (id, title, description)
 */
export async function analyzeProposal(input: {
  ideaId: string;
  title: string;
  description: string;
}): Promise<void> {
  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Get compact codebase summary for context
    const codebaseSummary = await getCodebaseSummary();

    // Build the analysis prompt
    const systemPrompt =
      "You are a technical analyst for the GSD Community Hub. Assess the feasibility of this governance proposal against the existing codebase architecture. Be realistic about effort and risks. Score conservatively -- a 90+ feasibility score means trivially implementable.";

    const userMessage = `## Governance Proposal

**Title:** ${input.title}

**Description:**
${input.description}

## Current Codebase Architecture

${codebaseSummary}

---

Analyze this proposal against the existing codebase. Assess feasibility, estimate effort, identify affected areas, and provide a recommendation.`;

    // Call Claude API with structured output
    const response = await client.messages.create({
      model: PROPOSAL_MODEL,
      max_tokens: MAX_PROPOSAL_TOKENS,
      temperature: 0, // Minimize variance for consistent scoring
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      output_config: {
        format: zodOutputFormat(ProposalAnalysisOutputSchema),
      },
    });

    // Extract structured JSON from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error(
        `Proposal analysis for idea ${input.ideaId}: Claude API returned no text content block`
      );
      return;
    }

    const analysis: ProposalAnalysisOutput = JSON.parse(textBlock.text);

    // Clamp feasibility score to 0-100
    const feasibilityScore = Math.max(
      0,
      Math.min(100, Math.round(analysis.feasibilityScore))
    );

    // Compute analysis hash via SHA-256 of canonical JSON
    const canonical = JSON.stringify(
      analysis,
      Object.keys(analysis).sort()
    );
    const encoded = new TextEncoder().encode(canonical);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const analysisHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Convert analysis to plain JSON-compatible object for Prisma Json field
    const analysisJsonValue = JSON.parse(JSON.stringify(analysis));

    // Upsert IdeaAnalysis record in Prisma
    await prisma.ideaAnalysis.upsert({
      where: { ideaId: input.ideaId },
      update: {
        feasibilityScore,
        estimatedEffort: analysis.estimatedEffort,
        riskLevel: analysis.impactAssessment.riskLevel,
        recommendation: analysis.recommendation,
        analysisJson: analysisJsonValue,
        analysisHash,
        modelUsed: PROPOSAL_MODEL,
      },
      create: {
        ideaId: input.ideaId,
        feasibilityScore,
        estimatedEffort: analysis.estimatedEffort,
        riskLevel: analysis.impactAssessment.riskLevel,
        recommendation: analysis.recommendation,
        analysisJson: analysisJsonValue,
        analysisHash,
        modelUsed: PROPOSAL_MODEL,
      },
    });
  } catch (error) {
    // Per research pitfall 7: log but do NOT throw
    // Idea submission must not be blocked by analysis failure
    console.error(
      `Proposal analysis failed for idea ${input.ideaId}:`,
      error
    );
  }
}
