/**
 * Retroactive migration system for re-evaluating existing Phase 2-4
 * contributions through AI verification.
 *
 * Processes contributions in rate-limited batches to avoid overwhelming
 * the Claude API or Solana network. Contributions without recoverable
 * artifacts (plan, diff, tests) are tagged as "legacy" with their
 * original scores preserved. Contributions with some artifacts get
 * full AI verification.
 *
 * NOTE: v1 migration runs in-memory on the app server. For production
 * scale, this should become a proper job queue (BullMQ, etc.). The
 * in-memory approach works for the expected ~100-500 contributions
 * from Phase 2-4.
 */

import { prisma } from "@/lib/db/prisma";
import { verifyTask } from "./engine";
import { scaleToOnChain } from "./scoring";
import { computeVerificationReportHash } from "@gsd/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationStatus {
  totalContributions: number;
  processed: number;
  pending: number;
  failed: number;
  legacyTagged: number;
  inProgress: boolean;
  startedAt?: string;
  lastProcessedAt?: string;
  estimatedCompletionHours?: number;
}

// ---------------------------------------------------------------------------
// Module-level state (resets on server restart)
// ---------------------------------------------------------------------------

let migrationState: MigrationStatus = {
  totalContributions: 0,
  processed: 0,
  pending: 0,
  failed: 0,
  legacyTagged: 0,
  inProgress: false,
};

// ---------------------------------------------------------------------------
// Core migration
// ---------------------------------------------------------------------------

/**
 * Run retroactive migration on all contributions that do not yet have
 * an associated VerificationReport.
 *
 * @param batchSize - Number of contributions per batch (default 15, middle of 10-20/hr range)
 * @param delayMs - Milliseconds between batches (default 240000 = 4 min => ~15/hr)
 */
export async function runRetroactiveMigration(
  batchSize = 15,
  delayMs = 240_000
): Promise<void> {
  // Prevent concurrent runs
  if (migrationState.inProgress) {
    console.warn("[Migration] Already in progress, skipping duplicate start");
    return;
  }

  migrationState = {
    totalContributions: 0,
    processed: 0,
    pending: 0,
    failed: 0,
    legacyTagged: 0,
    inProgress: true,
    startedAt: new Date().toISOString(),
  };

  try {
    // Find all contributions that do NOT have an associated VerificationReport.
    // LEFT JOIN logic: contribution exists but no VerificationReport with same
    // taskRef + walletAddress combination.
    const unverifiedContributions = await prisma.contribution.findMany({
      where: {
        NOT: {
          taskRef: {
            in: (
              await prisma.verificationReport.findMany({
                select: { taskRef: true, walletAddress: true },
              })
            )
              // Build a list of "taskRef:walletAddress" keys that already have reports
              .map((r) => r.taskRef),
          },
        },
      },
    });

    // More precise filter: exclude contributions where BOTH taskRef AND wallet match
    const existingReports = await prisma.verificationReport.findMany({
      select: { taskRef: true, walletAddress: true },
    });
    const existingKeys = new Set(
      existingReports.map((r) => `${r.taskRef}::${r.walletAddress}`)
    );

    const contributions = unverifiedContributions.filter(
      (c) => !existingKeys.has(`${c.taskRef}::${c.walletAddress}`)
    );

    migrationState.totalContributions = contributions.length;
    migrationState.pending = contributions.length;

    console.log(
      `[Migration] Starting retroactive migration of ${contributions.length} contributions`
    );

    // Process in batches
    for (let i = 0; i < contributions.length; i += batchSize) {
      // Check for cancellation before each batch
      if (!migrationState.inProgress) {
        console.log("[Migration] Cancelled by admin, stopping");
        break;
      }

      const batch = contributions.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(contributions.length / batchSize);

      console.log(
        `[Migration] Processing batch ${batchNum}/${totalBatches} (${batch.length} contributions)`
      );

      for (const contribution of batch) {
        // Check for cancellation between individual items too
        if (!migrationState.inProgress) break;

        try {
          await processContribution(contribution);
          migrationState.processed++;
          migrationState.pending--;
        } catch (error) {
          console.error(
            `[Migration] Error processing contribution ${contribution.id}:`,
            error instanceof Error ? error.message : error
          );
          migrationState.failed++;
          migrationState.pending--;
        }

        migrationState.lastProcessedAt = new Date().toISOString();
      }

      // Log progress after each batch
      console.log(
        `[Migration] Progress: ${migrationState.processed}/${migrationState.totalContributions} processed, ` +
          `${migrationState.legacyTagged} legacy, ${migrationState.failed} failed`
      );

      // Rate-limit: wait between batches (skip on last batch)
      if (i + batchSize < contributions.length && migrationState.inProgress) {
        console.log(
          `[Migration] Rate limit: waiting ${delayMs / 1000}s before next batch`
        );
        await sleep(delayMs);
      }
    }
  } catch (error) {
    console.error("[Migration] Fatal error:", error);
  } finally {
    migrationState.inProgress = false;
    console.log(
      `[Migration] Complete. Processed: ${migrationState.processed}, ` +
        `Legacy: ${migrationState.legacyTagged}, Failed: ${migrationState.failed}`
    );
  }
}

// ---------------------------------------------------------------------------
// Per-contribution processing
// ---------------------------------------------------------------------------

interface ContributionRecord {
  id: string;
  walletAddress: string;
  taskRef: string;
  verificationScore: number;
  contentHash: string;
  description: string | null;
  transactionSignature: string;
}

/**
 * Process a single contribution for retroactive verification.
 *
 * If the contribution has NO recoverable artifacts (no plan, no diff, no tests),
 * it is tagged as "legacy" with the original score preserved.
 *
 * If the contribution HAS some artifacts, it gets full AI verification.
 */
async function processContribution(
  contribution: ContributionRecord
): Promise<void> {
  // Attempt to reconstruct verification inputs from contribution data
  const taskRef = contribution.taskRef;
  const planContent = "Legacy contribution -- no plan artifact available";
  const codeDiff = "Legacy contribution -- no code diff available";
  const testResults = "Legacy contribution -- no test results available";
  const fileList: string[] = [];

  // Check if this contribution has ANY recoverable artifacts.
  // For Phase 2-4 contributions, there are no stored plan files, diffs, or
  // test results in the database -- only the contribution record itself.
  // Therefore, all pre-existing contributions are classified as "legacy".
  const hasRecoverableArtifacts = false;

  if (!hasRecoverableArtifacts) {
    // Legacy path: preserve original score with "legacy" verification type
    const reportJson = {
      type: "legacy",
      reason: "Pre-AI contribution without recoverable artifacts",
      originalScore: contribution.verificationScore,
    };

    const reportHash = await computeVerificationReportHash(
      JSON.parse(JSON.stringify(reportJson))
    );

    await prisma.verificationReport.create({
      data: {
        walletAddress: contribution.walletAddress,
        taskRef,
        verificationType: "legacy",
        overallScore: contribution.verificationScore, // Preserve original (already 0-10000 scale)
        confidence: 0, // No AI assessment
        reportJson: JSON.parse(JSON.stringify(reportJson)),
        reportHash,
        onChainAddress: null,
        transactionSignature: null,
        status: "completed",
      },
    });

    migrationState.legacyTagged++;
  } else {
    // AI verification path: contribution has some artifacts
    const aiReport = await verifyTask({
      taskRef,
      planContent,
      codeDiff,
      testResults,
      fileList,
    });

    const reportJson = JSON.parse(JSON.stringify(aiReport));
    const reportHash = await computeVerificationReportHash(reportJson);
    const overallScoreOnChain = scaleToOnChain(aiReport.overallScore);
    const confidenceOnChain = scaleToOnChain(aiReport.confidence);

    await prisma.verificationReport.create({
      data: {
        walletAddress: contribution.walletAddress,
        taskRef,
        verificationType: "ai",
        overallScore: overallScoreOnChain,
        confidence: confidenceOnChain,
        reportJson,
        reportHash,
        onChainAddress: null,
        transactionSignature: null,
        status: "completed",
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Status and control
// ---------------------------------------------------------------------------

/**
 * Get the current migration status, including estimated completion time.
 */
export function getMigrationStatus(): MigrationStatus {
  const status = { ...migrationState };

  // Calculate estimated completion hours from remaining items and current rate
  if (status.inProgress && status.processed > 0 && status.startedAt) {
    const elapsedMs =
      Date.now() - new Date(status.startedAt).getTime();
    const ratePerMs = status.processed / elapsedMs;
    const remainingItems = status.pending;

    if (ratePerMs > 0) {
      const remainingMs = remainingItems / ratePerMs;
      status.estimatedCompletionHours =
        Math.round((remainingMs / (1000 * 60 * 60)) * 10) / 10;
    }
  }

  return status;
}

/**
 * Cancel the in-progress migration. The next batch check will stop processing.
 */
export function cancelMigration(): void {
  migrationState.inProgress = false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
