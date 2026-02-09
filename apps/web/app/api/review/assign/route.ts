import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { assignReviewers } from "@/lib/review/assignment";
import { REVIEW_TIMEOUT_DAYS, TIER_NAMES } from "@/lib/review/constants";

/**
 * POST /api/review/assign
 *
 * Request peer review assignment for a pending verification report.
 * Suggests eligible reviewers based on domain expertise, tier, and quality.
 *
 * Body: { verificationReportId: string }
 * Returns: { reviewers: [...], reviewDeadline: ISO string }
 *
 * NOTE: Assignment is informational -- it suggests reviewers. Any eligible
 * reviewer can submit a review (permissionless but tracked).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { verificationReportId } = body;

    if (!verificationReportId || typeof verificationReportId !== "string") {
      return NextResponse.json(
        { error: "verificationReportId is required" },
        { status: 400 },
      );
    }

    // Validate the verification report exists and is pending
    const report = await prisma.verificationReport.findUnique({
      where: { id: verificationReportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Verification report not found" },
        { status: 404 },
      );
    }

    if (report.status !== "pending") {
      return NextResponse.json(
        { error: `Verification report status is "${report.status}", must be "pending"` },
        { status: 400 },
      );
    }

    // Extract domain tags from report JSON
    const reportData = report.reportJson as Record<string, unknown>;
    const domainTags: string[] = Array.isArray(reportData?.domainTags)
      ? (reportData.domainTags as string[])
      : [];

    // Get suggested reviewers
    const reviewers = await assignReviewers(
      domainTags,
      report.walletAddress,
    );

    if (reviewers.length === 0) {
      return NextResponse.json({
        reviewers: [],
        message:
          "No eligible reviewers available. You can re-submit with more context for another AI attempt.",
      });
    }

    // Calculate review deadline
    const reviewDeadline = new Date();
    reviewDeadline.setDate(reviewDeadline.getDate() + REVIEW_TIMEOUT_DAYS);

    return NextResponse.json({
      reviewers: reviewers.map((r) => ({
        wallet: r.authority,
        tier: r.tier,
        tierName: TIER_NAMES[r.tier],
        domainExpertise: r.domainContributions ?? {},
      })),
      reviewDeadline: reviewDeadline.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/review/assign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
