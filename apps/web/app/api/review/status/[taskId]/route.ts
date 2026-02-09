import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateConsensus } from "@/lib/review/consensus";
import type { ReviewSubmission } from "@/lib/review/consensus";
import { MIN_REVIEWERS, REVIEW_TIMEOUT_DAYS, TIER_NAMES } from "@/lib/review/constants";

/**
 * GET /api/review/status/[taskId]
 *
 * Public endpoint: check the peer review consensus status for a
 * verification report. The taskId param is the verificationReportId.
 *
 * Returns:
 * - Report status, review count, consensus state
 * - Truncated reviewer wallets (privacy)
 * - Review deadline
 * - No full evidence (only scores and pass/fail for public view)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId parameter is required" },
        { status: 400 },
      );
    }

    // Query verification report with peer reviews
    const report = await prisma.verificationReport.findUnique({
      where: { id: taskId },
      include: {
        peerReviews: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Verification report not found" },
        { status: 404 },
      );
    }

    // Calculate current consensus state
    const submissions: ReviewSubmission[] = report.peerReviews.map((r) => ({
      reviewerTier: r.reviewerTier as 1 | 2 | 3,
      score: r.score,
      passed: r.passed,
    }));

    const consensus = calculateConsensus(submissions);

    // Calculate review deadline (createdAt + REVIEW_TIMEOUT_DAYS)
    const deadline = new Date(report.createdAt);
    deadline.setDate(deadline.getDate() + REVIEW_TIMEOUT_DAYS);

    // Truncate wallet addresses for privacy (show first 4 + last 4)
    const truncateWallet = (wallet: string): string => {
      if (wallet.length <= 8) return wallet;
      return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
    };

    return NextResponse.json({
      status: report.status,
      reviewCount: report.peerReviews.length,
      minReviewers: MIN_REVIEWERS,
      consensus,
      reviewDeadline: deadline.toISOString(),
      reviews: report.peerReviews.map((r) => ({
        reviewerWallet: truncateWallet(r.reviewerWallet),
        tier: r.reviewerTier,
        tierName: TIER_NAMES[r.reviewerTier as 1 | 2 | 3],
        score: r.score,
        passed: r.passed,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/review/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
