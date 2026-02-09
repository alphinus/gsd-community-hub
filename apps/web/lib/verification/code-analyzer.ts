/**
 * Code diff parsing and context extraction.
 *
 * Analyzes git diffs to extract meaningful context for the AI verification
 * engine without sending the entire codebase. Truncates large diffs to
 * prevent token overflow (MAX_CODE_DIFF_CHARS = 50KB).
 */

import { MAX_CODE_DIFF_CHARS } from "./constants";

export interface DiffAnalysis {
  /** Truncated diff content safe for AI input */
  truncatedDiff: string;
  /** Number of files changed in the diff */
  fileCount: number;
  /** Total lines added */
  linesAdded: number;
  /** Total lines removed */
  linesRemoved: number;
}

export interface DiffStats {
  /** List of file paths from diff headers */
  files: string[];
  /** Total lines added */
  additions: number;
  /** Total lines removed */
  deletions: number;
}

/**
 * Analyze a code diff: parse stats and truncate if necessary.
 *
 * If the diff exceeds MAX_CODE_DIFF_CHARS, it is truncated with a
 * message indicating how many characters were omitted. This prevents
 * token overflow when sending the diff to the Claude API.
 *
 * @param codeDiff - Raw unified diff string
 * @returns Analysis with truncated diff and stats
 */
export function analyzeCodeDiff(codeDiff: string): DiffAnalysis {
  const stats = parseDiffStats(codeDiff);

  let truncatedDiff = codeDiff;
  if (codeDiff.length > MAX_CODE_DIFF_CHARS) {
    const remaining = codeDiff.length - MAX_CODE_DIFF_CHARS;
    truncatedDiff =
      codeDiff.slice(0, MAX_CODE_DIFF_CHARS) +
      `\n... [truncated, ${remaining} chars remaining]`;
  }

  return {
    truncatedDiff,
    fileCount: stats.files.length,
    linesAdded: stats.additions,
    linesRemoved: stats.deletions,
  };
}

/**
 * Extract file context descriptions from a list of file paths.
 *
 * Maps file paths to human-readable purpose descriptions based on
 * directory patterns. Returns a compact summary string for Claude
 * context, not the actual file contents.
 *
 * @param fileList - Array of file paths
 * @returns Compact summary string describing file purposes
 */
export function extractFileContext(fileList: string[]): string {
  if (fileList.length === 0) {
    return "No files provided.";
  }

  const descriptions = fileList.map((filePath) => {
    const purpose = inferFilePurpose(filePath);
    return `- ${filePath}: ${purpose}`;
  });

  return descriptions.join("\n");
}

/**
 * Parse unified diff format to extract file list and line stats.
 *
 * Handles standard unified diff format with:
 * - `diff --git a/path b/path` headers
 * - `+++ b/path` headers (fallback)
 * - `+` lines (additions)
 * - `-` lines (deletions)
 *
 * @param diff - Raw unified diff string
 * @returns Parsed diff statistics
 */
export function parseDiffStats(diff: string): DiffStats {
  const files: string[] = [];
  let additions = 0;
  let deletions = 0;

  const lines = diff.split("\n");

  for (const line of lines) {
    // Match diff headers: "diff --git a/path b/path"
    const diffHeaderMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (diffHeaderMatch) {
      const filePath = diffHeaderMatch[2];
      if (!files.includes(filePath)) {
        files.push(filePath);
      }
      continue;
    }

    // Fallback: "+++ b/path" header (for diffs without git prefix)
    if (files.length === 0) {
      const plusHeaderMatch = line.match(/^\+\+\+ b\/(.+)$/);
      if (plusHeaderMatch) {
        const filePath = plusHeaderMatch[1];
        if (!files.includes(filePath)) {
          files.push(filePath);
        }
        continue;
      }
    }

    // Count additions (lines starting with + but not +++ header)
    if (line.startsWith("+") && !line.startsWith("+++")) {
      additions++;
      continue;
    }

    // Count deletions (lines starting with - but not --- header)
    if (line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }
  }

  return { files, additions, deletions };
}

/**
 * Infer the purpose of a file from its path.
 * Used for building compact context summaries.
 */
function inferFilePurpose(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");

  // Solana programs
  if (normalized.includes("programs/") && normalized.endsWith(".rs")) {
    return "Solana program (on-chain logic)";
  }

  // React components
  if (normalized.includes("components/") && normalized.endsWith(".tsx")) {
    return "React UI component";
  }

  // API routes
  if (normalized.includes("app/api/") && normalized.includes("route.ts")) {
    return "Next.js API route handler";
  }

  // Pages
  if (normalized.includes("app/") && normalized.endsWith("page.tsx")) {
    return "Next.js page component";
  }

  // Layout
  if (normalized.endsWith("layout.tsx")) {
    return "Next.js layout component";
  }

  // Library code
  if (normalized.includes("lib/")) {
    if (normalized.includes("verification/")) return "Verification engine logic";
    if (normalized.includes("contributions/")) return "Contribution processing";
    if (normalized.includes("governance/")) return "Governance logic";
    if (normalized.includes("revenue/")) return "Revenue distribution logic";
    if (normalized.includes("auth/")) return "Authentication logic";
    return "Server-side library code";
  }

  // Package code
  if (normalized.includes("packages/types/")) return "Shared type definitions";
  if (normalized.includes("packages/utils/")) return "Shared utility functions";

  // Tests
  if (normalized.includes("tests/") || normalized.includes(".test.")) {
    return "Test file";
  }

  // Config files
  if (normalized.endsWith(".json") || normalized.endsWith(".config.ts")) {
    return "Configuration file";
  }

  // Prisma
  if (normalized.includes("prisma/")) return "Database schema/migration";

  return "Project file";
}
