/**
 * Reviewer assignment and eligibility logic.
 *
 * Handles selection of eligible peer reviewers based on domain expertise,
 * tier level, and anti-collusion rules. Also computes review rewards.
 */

import type { ReviewerTier, ReviewerProfileInfo } from "@gsd/types";
import { prisma } from "@/lib/db/prisma";
import {
  MIN_REVIEWERS,
  MAX_CONSECUTIVE_REVIEWS,
  TIER_REWARD_RATES,
} from "./constants";
import { determineTier } from "./consensus";

/**
 * Get eligible reviewers for a task, excluding the developer and
 * applying anti-collusion filters.
 *
 * Selection criteria:
 * 1. Exclude the developer's own wallet (self-review prevention)
 * 2. Exclude reviewers who reviewed this developer's last N submissions
 * 3. Prefer domain overlap with task domains
 * 4. Order by domain relevance, then tier (higher first), then quality score
 *
 * @param taskDomains Domain tags for the task being reviewed
 * @param developerWallet Wallet address of the contribution author
 * @returns Array of eligible reviewer profiles, ordered by preference
 */
export async function getEligibleReviewers(
  taskDomains: string[],
  developerWallet: string,
): Promise<ReviewerProfileInfo[]> {
  // Find recent reviews of this developer to check consecutive review limits
  const recentReviews = await prisma.peerReview.findMany({
    where: {
      verificationReport: {
        walletAddress: developerWallet,
      },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_CONSECUTIVE_REVIEWS * 10, // generous buffer
    select: {
      reviewerWallet: true,
    },
  });

  // Count consecutive reviews per reviewer for this developer
  const consecutiveCounts = new Map<string, number>();
  for (const review of recentReviews) {
    const current = consecutiveCounts.get(review.reviewerWallet) ?? 0;
    consecutiveCounts.set(review.reviewerWallet, current + 1);
  }

  // Wallets that have hit the consecutive review limit
  const excludedWallets = new Set<string>();
  excludedWallets.add(developerWallet); // self-review prevention
  for (const [wallet, count] of consecutiveCounts) {
    if (count >= MAX_CONSECUTIVE_REVIEWS) {
      excludedWallets.add(wallet);
    }
  }

  // Query all reviewer profiles except excluded wallets
  const profiles = await prisma.reviewerProfile.findMany({
    where: {
      walletAddress: {
        notIn: Array.from(excludedWallets),
      },
    },
    orderBy: [
      { tier: "desc" },
      { reviewQualityScore: "desc" },
    ],
  });

  // Score each profile by domain relevance and convert to ReviewerProfileInfo
  const scored = profiles.map((profile) => {
    const domainContributions =
      (profile.domainContributions as Record<string, number>) ?? {};
    const domainReviews =
      (profile.domainReviews as Record<string, number>) ?? {};

    // Domain relevance: count how many task domains the reviewer has expertise in
    let domainRelevance = 0;
    for (const domain of taskDomains) {
      if ((domainContributions[domain] ?? 0) > 0) {
        domainRelevance += 2;
      }
      if ((domainReviews[domain] ?? 0) > 0) {
        domainRelevance += 1;
      }
    }

    const info: ReviewerProfileInfo = {
      authority: profile.walletAddress,
      tier: profile.tier as ReviewerTier,
      totalReviews: profile.totalReviews,
      verifiedContributions: profile.verifiedContributions,
      qualityScore: Math.round(profile.reviewQualityScore * 10000),
      updatedAt: profile.updatedAt.toISOString(),
      domainReviews,
      domainContributions,
    };

    return { info, domainRelevance };
  });

  // Sort: domain relevance (desc), then tier (desc), then quality (desc)
  scored.sort((a, b) => {
    if (b.domainRelevance !== a.domainRelevance) {
      return b.domainRelevance - a.domainRelevance;
    }
    if (b.info.tier !== a.info.tier) {
      return b.info.tier - a.info.tier;
    }
    return b.info.qualityScore - a.info.qualityScore;
  });

  return scored.map((s) => s.info);
}

/**
 * Assign reviewers for a task with tier diversity.
 *
 * Selects `count` reviewers from the eligible pool, ensuring at least
 * one reviewer from a different tier than the others (anti-collusion).
 * If not enough eligible reviewers exist, returns as many as available.
 *
 * @param taskDomains Domain tags for the task
 * @param developerWallet Wallet address of the contribution author
 * @param count Number of reviewers to assign (default: MIN_REVIEWERS)
 * @returns Array of selected reviewer profiles
 */
export async function assignReviewers(
  taskDomains: string[],
  developerWallet: string,
  count: number = MIN_REVIEWERS,
): Promise<ReviewerProfileInfo[]> {
  const eligible = await getEligibleReviewers(taskDomains, developerWallet);

  if (eligible.length <= count) {
    return eligible;
  }

  // Select with tier diversity: ensure at least one reviewer from a different tier
  const selected: ReviewerProfileInfo[] = [];
  const tiers = new Set<ReviewerTier>();

  // First pass: take top candidates
  for (const reviewer of eligible) {
    if (selected.length >= count) break;
    selected.push(reviewer);
    tiers.add(reviewer.tier);
  }

  // Check tier diversity: if all same tier, try to swap one for a different tier
  if (tiers.size === 1 && selected.length >= 2) {
    const currentTier = selected[0].tier;

    // Find a reviewer with a different tier from the remaining eligible pool
    const differentTierReviewer = eligible.find(
      (r) =>
        r.tier !== currentTier &&
        !selected.some((s) => s.authority === r.authority),
    );

    if (differentTierReviewer) {
      // Replace the last selected reviewer with the different-tier one
      selected[selected.length - 1] = differentTierReviewer;
    }
  }

  return selected;
}

/**
 * Compute the contribution score credit a reviewer earns for reviewing.
 *
 * Reward rates by tier:
 * - Explorer (tier 1): 15% of original contribution score
 * - Builder (tier 2): 20% of original contribution score
 * - Architect (tier 3): 25% of original contribution score
 *
 * @param reviewerTier The reviewer's tier
 * @param originalContributionScore The score of the contribution being reviewed
 * @returns The review reward score (rounded to nearest integer)
 */
export function computeReviewReward(
  reviewerTier: ReviewerTier,
  originalContributionScore: number,
): number {
  return Math.round(originalContributionScore * TIER_REWARD_RATES[reviewerTier]);
}
