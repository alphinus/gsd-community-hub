/**
 * GSD workflow artifact analysis.
 *
 * Examines GSD workflow artifacts (plan files, summaries, test results,
 * commit messages) to assess process compliance. This analysis feeds
 * into the workflowDiscipline and planAdherence categories of the
 * verification score.
 */

export interface WorkflowContext {
  /** Content of the GSD plan file (if available) */
  planContent?: string;
  /** Content of the GSD summary file (if available) */
  summaryContent?: string;
  /** Raw test output (stdout/stderr from test runner) */
  testResults?: string;
  /** List of commit messages for the task */
  commitMessages?: string[];
}

export interface WorkflowAnalysis {
  /** Human-readable workflow summary for Claude context */
  workflowSummary: string;
  /** Whether a GSD plan file was provided */
  planPresent: boolean;
  /** Whether test results were provided */
  testsPresent: boolean;
  /** Whether tests appear to pass (parsed from test output) */
  testsPass: boolean;
  /** Number of commit messages provided */
  commitCount: number;
}

/**
 * Analyze GSD workflow artifacts for verification context.
 *
 * Examines plan files, summaries, test results, and commit messages
 * to build a workflow compliance summary. This summary is included
 * in the AI verification prompt so Claude can score workflowDiscipline
 * and planAdherence categories.
 *
 * @param context - Workflow artifacts to analyze
 * @returns Structured workflow analysis
 */
export function analyzeWorkflow(context: WorkflowContext): WorkflowAnalysis {
  const planPresent = Boolean(
    context.planContent && context.planContent.trim().length > 0
  );
  const testsPresent = Boolean(
    context.testResults && context.testResults.trim().length > 0
  );
  const testsPass = testsPresent ? parseTestStatus(context.testResults!) : false;
  const commitCount = context.commitMessages?.length ?? 0;

  const summaryParts: string[] = [];

  // Plan analysis
  if (planPresent) {
    summaryParts.push("GSD Plan: Present and provided for review.");
    const planStats = analyzePlanContent(context.planContent!);
    if (planStats) {
      summaryParts.push(`  ${planStats}`);
    }
  } else {
    summaryParts.push(
      "GSD Plan: No GSD plan file found. This affects workflow discipline score."
    );
  }

  // Summary analysis
  if (context.summaryContent && context.summaryContent.trim().length > 0) {
    summaryParts.push("GSD Summary: Execution summary provided.");
  } else {
    summaryParts.push("GSD Summary: No execution summary provided.");
  }

  // Test analysis
  if (testsPresent) {
    if (testsPass) {
      summaryParts.push("Tests: Present and passing.");
    } else {
      summaryParts.push("Tests: Present but some failures detected.");
    }
  } else {
    summaryParts.push("Tests: No test results provided.");
  }

  // Commit analysis
  if (commitCount > 0) {
    summaryParts.push(
      `Commits: ${commitCount} commit(s) provided.`
    );
    const commitQuality = analyzeCommitMessages(context.commitMessages!);
    if (commitQuality) {
      summaryParts.push(`  ${commitQuality}`);
    }
  } else {
    summaryParts.push("Commits: No commit messages provided.");
  }

  return {
    workflowSummary: summaryParts.join("\n"),
    planPresent,
    testsPresent,
    testsPass,
    commitCount,
  };
}

/**
 * Parse test output to determine pass/fail status.
 *
 * Looks for common test runner output patterns:
 * - "passing" / "passed" (success indicators)
 * - "failing" / "failed" / "error" / "FAIL" (failure indicators)
 *
 * @param testResults - Raw test output string
 * @returns true if tests appear to pass, false otherwise
 */
function parseTestStatus(testResults: string): boolean {
  const lower = testResults.toLowerCase();

  // Check for failure indicators first (higher priority)
  const failurePatterns = [
    /\d+\s+failing/,
    /\d+\s+failed/,
    /tests?\s+failed/,
    /test\s+suites?\s+failed/,
    /\bfail\b/,
    /\berror\b.*test/,
    /assertion\s+error/,
  ];

  for (const pattern of failurePatterns) {
    if (pattern.test(lower)) {
      return false;
    }
  }

  // Check for success indicators
  const successPatterns = [
    /\d+\s+passing/,
    /\d+\s+passed/,
    /tests?\s+passed/,
    /all\s+tests?\s+pass/,
    /test\s+suites?:.*passed/,
  ];

  for (const pattern of successPatterns) {
    if (pattern.test(lower)) {
      return true;
    }
  }

  // If no clear indicators, default to false (uncertain)
  return false;
}

/**
 * Analyze plan content to extract summary statistics.
 */
function analyzePlanContent(planContent: string): string | null {
  const taskMatches = planContent.match(/<task\s/g);
  const taskCount = taskMatches?.length ?? 0;

  const hasObjective = planContent.includes("<objective>");
  const hasVerification = planContent.includes("<verification>");

  const parts: string[] = [];
  if (taskCount > 0) {
    parts.push(`${taskCount} task(s) defined`);
  }
  if (hasObjective) {
    parts.push("objective specified");
  }
  if (hasVerification) {
    parts.push("verification criteria present");
  }

  return parts.length > 0 ? `Plan details: ${parts.join(", ")}.` : null;
}

/**
 * Analyze commit messages for quality indicators.
 */
function analyzeCommitMessages(messages: string[]): string | null {
  if (messages.length === 0) return null;

  // Check for conventional commit format (type(scope): message)
  const conventionalPattern = /^(feat|fix|test|refactor|chore|docs)\(/;
  const conventionalCount = messages.filter((m) =>
    conventionalPattern.test(m)
  ).length;

  const parts: string[] = [];

  if (conventionalCount === messages.length) {
    parts.push("All commits follow conventional format.");
  } else if (conventionalCount > 0) {
    parts.push(
      `${conventionalCount}/${messages.length} commits follow conventional format.`
    );
  } else {
    parts.push("Commits do not follow conventional format.");
  }

  // Check for atomic commits (multiple small commits vs one big one)
  if (messages.length >= 3) {
    parts.push("Multiple atomic commits suggest disciplined workflow.");
  } else if (messages.length === 1) {
    parts.push("Single commit may indicate non-atomic workflow.");
  }

  return parts.join(" ");
}
