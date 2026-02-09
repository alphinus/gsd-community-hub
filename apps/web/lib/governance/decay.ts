import { prisma } from "@/lib/db/prisma";
import {
  calculateDecayedScore,
  calculateContributionScore,
  DECAY_HALF_LIFE_DAYS,
} from "@gsd/utils";
import type { DecayContribution } from "@gsd/utils";

/**
 * Result of computing decayed score for a developer.
 */
export interface DecayedScoreResult {
  /** Score without decay applied */
  originalScore: string;
  /** Score with decay applied */
  decayedScore: string;
  /** Total decayed verification score (sum of individual decayed scores) */
  decayedTotal: string;
  /** Number of contributions considered */
  contributionCount: number;
}

/**
 * Compute the decayed contribution score for a developer.
 *
 * Pipeline:
 * 1. Fetch all contributions for the developer from Prisma (with createdAt)
 * 2. For each contribution, compute ageDays from createdAt
 * 3. Map to { verificationScore, ageDays } for the shared decay utility
 * 4. Call calculateDecayedScore() from @gsd/utils for the decayed total
 * 5. Recompute contribution score using decayed total via calculateContributionScore()
 * 6. Return original vs decayed scores for comparison
 *
 * BigInt scores serialized as strings (project convention from 02-05).
 *
 * @param wallet - Developer's wallet address
 * @param halfLifeDays - Decay half-life in days (default from GovernanceConfig or 180)
 * @returns Original and decayed scores with contribution count
 */
export async function computeDecayedScoreForDeveloper(
  wallet: string,
  halfLifeDays: number = DECAY_HALF_LIFE_DAYS
): Promise<DecayedScoreResult> {
  // Fetch all contributions for this developer
  const contributions = await prisma.contribution.findMany({
    where: { walletAddress: wallet },
    select: {
      verificationScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (contributions.length === 0) {
    return {
      originalScore: "0",
      decayedScore: "0",
      decayedTotal: "0",
      contributionCount: 0,
    };
  }

  const now = Date.now();

  // Map contributions to DecayContribution format
  const decayContributions: DecayContribution[] = contributions.map((c) => ({
    verificationScore: c.verificationScore,
    ageDays: Math.floor((now - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  // Compute original total (no decay)
  const originalTotal = BigInt(
    contributions.reduce((sum, c) => sum + c.verificationScore, 0)
  );

  // Compute decayed total using shared utility
  const decayedTotal = calculateDecayedScore(decayContributions, halfLifeDays);

  // Determine time active (days since first contribution)
  const firstContribution = contributions[0].createdAt;
  const timeActiveDays = Math.max(
    1,
    Math.floor((now - firstContribution.getTime()) / (1000 * 60 * 60 * 24))
  );

  const tasksCompleted = contributions.length;

  // Compute original score (no decay)
  const originalScore = calculateContributionScore({
    tasksCompleted,
    totalVerificationScore: originalTotal,
    timeActiveDays,
  });

  // Compute decayed score
  const decayedScore = calculateContributionScore({
    tasksCompleted,
    totalVerificationScore: decayedTotal,
    timeActiveDays,
  });

  return {
    originalScore: originalScore.toString(),
    decayedScore: decayedScore.toString(),
    decayedTotal: decayedTotal.toString(),
    contributionCount: contributions.length,
  };
}
