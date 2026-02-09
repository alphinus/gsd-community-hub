/**
 * Verification types for the GSD Community Hub.
 *
 * These mirror the on-chain verification state structs and enums
 * defined in programs/gsd-hub/src/state/. TypeScript string unions
 * correspond to Rust enums (lowercase per 03-02 convention), and
 * interfaces correspond to account structs with off-chain metadata
 * extensions.
 */

// --- Enums (matching on-chain Rust enums) ---

/** Matches on-chain VerificationType enum (verification_report.rs) */
export type VerificationType = "ai" | "peer";

/** Matches on-chain VerificationStatus enum (verification_report.rs) */
export type VerificationStatus = "pending" | "completed" | "disputed";

// --- Off-chain report detail types ---

/** A single finding within a verification category */
export interface VerificationFinding {
  /** The criterion being evaluated */
  criterion: string;
  /** Whether the criterion was met */
  met: boolean;
  /** Evidence supporting the finding */
  evidence: string;
  /** Weight of this finding (0-1) */
  weight: number;
}

/** A category of verification (e.g. code quality, test coverage) */
export interface VerificationCategory {
  /** Category name */
  name: string;
  /** Score achieved in this category */
  score: number;
  /** Maximum possible score for this category */
  maxScore: number;
  /** Individual findings within this category */
  findings: VerificationFinding[];
}

// --- Account interfaces (on-chain struct + off-chain metadata) ---

/**
 * Verification report combining on-chain VerificationReport account data
 * with off-chain report details stored in the database.
 */
export interface VerificationReportInfo {
  /** Base58-encoded developer wallet address */
  developer: string;
  /** Hex-encoded SHA-256 hash of task reference */
  taskRef: string;
  /** Type of verification performed */
  verificationType: VerificationType;
  /** Current status of the verification */
  status: VerificationStatus;
  /** Overall score 0-10000 (maps to 0.00%-100.00%) */
  score: number;
  /** AI confidence level 0-10000 */
  confidence: number;
  /** Hex-encoded SHA-256 of full off-chain report JSON */
  reportHash: string;
  /** ISO date string of when verification was performed */
  verifiedAt: string;
  /** Number of peer reviewers (0 for AI verification) */
  reviewerCount: number;
  /** Config version at time of verification */
  configVersion: number;
  /** Base58-encoded on-chain PDA address (null if not yet on-chain) */
  onChainAddress: string | null;
  /** Off-chain report categories with detailed findings */
  categories?: VerificationCategory[];
}

/**
 * Verification configuration mirroring on-chain VerificationConfig singleton.
 * Public keys are Base58-encoded strings.
 */
export interface VerificationConfigInfo {
  /** Base58-encoded admin authority public key */
  admin: string;
  /** Config version for report versioning */
  version: number;
  /** Confidence threshold below which triggers peer review (0-10000) */
  confidenceThreshold: number;
  /** Code quality weight in basis points */
  codeQualityWeight: number;
  /** Task fulfillment weight in basis points */
  taskFulfillmentWeight: number;
  /** Test coverage weight in basis points */
  testCoverageWeight: number;
  /** Workflow discipline weight in basis points */
  workflowDisciplineWeight: number;
  /** Plan adherence weight in basis points */
  planAdherenceWeight: number;
  /** Minimum number of peer reviewers required */
  minReviewers: number;
  /** Consensus threshold in basis points */
  consensusThresholdBps: number;
  /** Review timeout in days */
  reviewTimeoutDays: number;
}

/**
 * Input for submitting work for AI verification.
 * Contains the task reference and supporting evidence.
 */
export interface VerificationSubmitInput {
  /** Task identifier string (e.g. "05-01-task-3") */
  taskRef: string;
  /** Full plan content for context */
  planContent: string;
  /** Git diff of code changes */
  codeDiff: string;
  /** Test execution results */
  testResults: string;
  /** List of files created/modified */
  fileList: string[];
}
