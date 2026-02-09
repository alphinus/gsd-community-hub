/**
 * Core AI verification engine using Claude API.
 *
 * Verifies task submissions by analyzing code diffs, test results, and
 * GSD workflow artifacts. Produces structured verification reports with
 * scored categories using Claude's structured outputs (Zod schemas).
 *
 * The engine:
 * 1. Prepares context via code-analyzer and workflow-analyzer
 * 2. Calls Claude Sonnet 4.5 with structured output schema
 * 3. Post-processes: clamps scores, recomputes weighted total, infers domain tags
 * 4. Returns the authoritative verification report
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { VerificationReportOutputSchema } from "./schemas";
import type { VerificationReportOutput } from "./schemas";
import { analyzeCodeDiff, extractFileContext } from "./code-analyzer";
import { analyzeWorkflow } from "./workflow-analyzer";
import type { WorkflowContext } from "./workflow-analyzer";
import { computeWeightedScore, inferDomainTags } from "./scoring";
import { VERIFICATION_MODEL, MAX_VERIFICATION_TOKENS } from "./constants";

export interface VerifyTaskInput {
  /** Task reference identifier (e.g., "05-02-task-1") */
  taskRef: string;
  /** GSD plan file content */
  planContent: string;
  /** Raw unified diff of code changes */
  codeDiff: string;
  /** Raw test runner output */
  testResults: string;
  /** List of changed file paths */
  fileList: string[];
  /** Commit messages for the task (optional) */
  commitMessages?: string[];
}

/**
 * Verify a task submission using AI analysis.
 *
 * Sends code diffs, plan content, test results, and workflow artifacts
 * to Claude Sonnet 4.5 for structured verification. The AI scores 5
 * categories (codeQuality, taskFulfillment, testCoverage, workflowDiscipline,
 * planAdherence). The overall score is recomputed server-side using the
 * weighted formula (not trusting the AI's self-reported overall).
 *
 * @param input - Task verification context
 * @returns Processed verification report with authoritative scores
 * @throws Error if Anthropic API call fails
 */
export async function verifyTask(
  input: VerifyTaskInput
): Promise<VerificationReportOutput> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Prepare code analysis (truncate large diffs)
  const codeAnalysis = analyzeCodeDiff(input.codeDiff);

  // Prepare workflow analysis
  const workflowContext: WorkflowContext = {
    planContent: input.planContent,
    testResults: input.testResults,
    commitMessages: input.commitMessages,
  };
  const workflowAnalysis = analyzeWorkflow(workflowContext);

  // Prepare file context descriptions
  const fileContext = extractFileContext(input.fileList);

  // Build the verification prompt
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage({
    taskRef: input.taskRef,
    planContent: input.planContent,
    codeDiff: codeAnalysis.truncatedDiff,
    testResults: input.testResults,
    fileContext,
    workflowSummary: workflowAnalysis.workflowSummary,
    diffStats: {
      fileCount: codeAnalysis.fileCount,
      linesAdded: codeAnalysis.linesAdded,
      linesRemoved: codeAnalysis.linesRemoved,
    },
  });

  // Call Claude API with structured output
  const response = await client.messages.create({
    model: VERIFICATION_MODEL,
    max_tokens: MAX_VERIFICATION_TOKENS,
    temperature: 0, // Minimize variance per research pitfall 2
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    output_config: {
      format: zodOutputFormat(VerificationReportOutputSchema),
    },
  });

  // Extract structured JSON from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(
      "Verification engine: Claude API returned no text content block"
    );
  }

  const rawReport: VerificationReportOutput = JSON.parse(textBlock.text);

  // Post-process: clamp all scores to 0-100
  const processed = postProcessReport(rawReport, input.fileList);

  return processed;
}

/**
 * Build the system prompt for the verification AI.
 */
function buildSystemPrompt(): string {
  return `You are a code verification AI for the GSD Community Hub, a Web3 platform where every contribution is cryptographically verified and recorded on-chain.

Your job is to analyze submitted work and produce a structured verification report scoring 5 categories:

## Scoring Categories

### Code Output (60% of total weight)
1. **Code Quality** (25%): Code style, patterns, error handling, security, type safety, readability
2. **Task Fulfillment** (20%): Does the code implement what the plan specified? Are all requirements met?
3. **Test Coverage** (15%): Are tests present, passing, and meaningful? Do they cover edge cases?

### Workflow Quality (40% of total weight)
4. **Workflow Discipline** (25%): Was the GSD process followed? Plan created, tasks executed atomically, commits structured?
5. **Plan Adherence** (15%): Does the implementation match the plan's specifications? Were deviations justified?

## Scoring Rules
- Each category scores 0-100
- Be strict but fair -- evidence must cite specific files, patterns, or code
- Confidence reflects how certain you are in your assessment (0-100)
- Confidence below 60 means the submission needs human review (insufficient context or ambiguous quality)
- Domain tags should reflect which areas of the codebase were touched (e.g., "on-chain", "frontend", "api", "testing", "backend", "shared")
- Recommendations should be actionable and specific

## Important
- Score each category independently
- Provide concrete evidence for each finding
- Do NOT inflate scores -- missing tests = low testCoverage, no plan = low workflowDiscipline
- If code diff is truncated, note this in your confidence assessment`;
}

/**
 * Build the user message with all verification context.
 */
function buildUserMessage(ctx: {
  taskRef: string;
  planContent: string;
  codeDiff: string;
  testResults: string;
  fileContext: string;
  workflowSummary: string;
  diffStats: { fileCount: number; linesAdded: number; linesRemoved: number };
}): string {
  return `## Task Reference
${ctx.taskRef}

## GSD Plan
${ctx.planContent || "No plan file provided."}

## Code Diff (${ctx.diffStats.fileCount} files, +${ctx.diffStats.linesAdded}/-${ctx.diffStats.linesRemoved} lines)
\`\`\`diff
${ctx.codeDiff || "No code diff provided."}
\`\`\`

## Test Results
\`\`\`
${ctx.testResults || "No test results provided."}
\`\`\`

## Files Changed
${ctx.fileContext}

## Workflow Analysis
${ctx.workflowSummary}

---

Verify this submission and produce a detailed verification report. Score all 5 categories with evidence-based findings.`;
}

/**
 * Post-process the AI-generated report:
 * 1. Clamp all category scores to 0-100
 * 2. Recompute the authoritative overall score via weighted formula
 * 3. Infer domain tags if the AI missed any
 * 4. Clamp confidence to 0-100
 */
function postProcessReport(
  report: VerificationReportOutput,
  fileList: string[]
): VerificationReportOutput {
  // Clamp category scores
  const clampScore = (score: number): number =>
    Math.max(0, Math.min(100, Math.round(score)));

  const categories = {
    codeQuality: {
      ...report.categories.codeQuality,
      score: clampScore(report.categories.codeQuality.score),
    },
    taskFulfillment: {
      ...report.categories.taskFulfillment,
      score: clampScore(report.categories.taskFulfillment.score),
    },
    testCoverage: {
      ...report.categories.testCoverage,
      score: clampScore(report.categories.testCoverage.score),
    },
    workflowDiscipline: {
      ...report.categories.workflowDiscipline,
      score: clampScore(report.categories.workflowDiscipline.score),
    },
    planAdherence: {
      ...report.categories.planAdherence,
      score: clampScore(report.categories.planAdherence.score),
    },
  };

  // Recompute authoritative overall score (don't trust AI self-report)
  const overallScore = computeWeightedScore({
    codeQuality: categories.codeQuality.score,
    taskFulfillment: categories.taskFulfillment.score,
    testCoverage: categories.testCoverage.score,
    workflowDiscipline: categories.workflowDiscipline.score,
    planAdherence: categories.planAdherence.score,
  });

  // Merge AI domain tags with inferred tags
  const inferredTags = inferDomainTags(fileList);
  const aiTags = report.domainTags || [];
  const allTags = Array.from(new Set([...aiTags, ...inferredTags])).sort();

  // Clamp confidence
  const confidence = clampScore(report.confidence);

  return {
    ...report,
    overallScore,
    confidence,
    categories,
    domainTags: allTags,
  };
}
