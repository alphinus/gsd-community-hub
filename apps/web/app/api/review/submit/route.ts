import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { calculateConsensus, determineTier } from "@/lib/review/consensus";
import type { ReviewSubmission } from "@/lib/review/consensus";
import { TIER_WEIGHTS } from "@/lib/review/constants";

/**
 * POST /api/review/submit
 *
 * Submit a peer review for a pending verification report.
 * After submission, checks consensus and auto-finalizes if reached.
 *
 * Body: {
 *   verificationReportId: string,
 *   score: number (0-100),
 *   passed: boolean,
 *   evidence: { criterion: string, met: boolean, details: string }[]
 * }
 *
 * Validation:
 * - Report must exist and be "pending"
 * - Reviewer cannot review their own contribution (self-review prevention)
 * - Reviewer cannot submit duplicate reviews for same report
 * - Score must be 0-100 range
 * - Evidence must be non-empty (no rubber-stamping per pitfall 3)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewerWallet = session.publicKey;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { verificationReportId, score, passed, evidence } = body;

    // --- Validate input ---

    if (!verificationReportId || typeof verificationReportId !== "string") {
      return NextResponse.json(
        { error: "verificationReportId is required" },
        { status: 400 },
      );
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json(
        { error: "score must be a number between 0 and 100" },
        { status: 400 },
      );
    }

    if (typeof passed !== "boolean") {
      return NextResponse.json(
        { error: "passed must be a boolean" },
        { status: 400 },
      );
    }

    if (!Array.isArray(evidence) || evidence.length === 0) {
      return NextResponse.json(
        { error: "evidence array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Validate evidence entries
    for (const entry of evidence) {
      const e = entry as Record<string, unknown>;
      if (
        typeof e.criterion !== "string" ||
        typeof e.met !== "boolean" ||
        typeof e.details !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "Each evidence entry must have: criterion (string), met (boolean), details (string)",
          },
          { status: 400 },
        );
      }
    }

    // --- Verify report ---

    const report = await prisma.verificationReport.findUnique({
      where: { id: verificationReportId as string },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Verification report not found" },
        { status: 404 },
      );
    }

    if (report.status !== "pending") {
      return NextResponse.json(
        {
          error: `Verification report status is "${report.status}", must be "pending"`,
        },
        { status: 400 },
      );
    }

    // Self-review prevention
    if (reviewerWallet === report.walletAddress) {
      return NextResponse.json(
        { error: "You cannot review your own contribution" },
        { status: 403 },
      );
    }

    // Check for duplicate submission
    const existing = await prisma.peerReview.findUnique({
      where: {
        verificationReportId_reviewerWallet: {
          verificationReportId: verificationReportId as string,
          reviewerWallet,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a review for this report" },
        { status: 409 },
      );
    }

    // --- Get or create reviewer profile ---

    let reviewerProfile = await prisma.reviewerProfile.findUnique({
      where: { walletAddress: reviewerWallet },
    });

    if (!reviewerProfile) {
      reviewerProfile = await prisma.reviewerProfile.create({
        data: {
          walletAddress: reviewerWallet,
          tier: 1,
          totalReviews: 0,
          domainReviews: {},
          verifiedContributions: 0,
          domainContributions: {},
          reviewQualityScore: 1.0,
        },
      });
    }

    // Determine reviewer tier
    const reportData = report.reportJson as Record<string, unknown>;
    const domainTags: string[] = Array.isArray(reportData?.domainTags)
      ? (reportData.domainTags as string[])
      : [];

    // Get domain-specific contribution count for the first matching domain
    const domainContributions =
      (reviewerProfile.domainContributions as Record<string, number>) ?? {};
    const primaryDomainCount = domainTags.reduce(
      (max, d) => Math.max(max, domainContributions[d] ?? 0),
      0,
    );
    const reviewerTier = determineTier(
      reviewerProfile.verifiedContributions,
      primaryDomainCount,
    );
    const reviewerWeight = TIER_WEIGHTS[reviewerTier];

    // --- Compute review hash ---

    // Canonical JSON of evidence for hash computation
    const canonicalEvidence = JSON.stringify(evidence);
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(canonicalEvidence),
    );
    const reviewHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // --- Scale score from 0-100 to 0-10000 (basis points) ---

    const scaledScore = Math.round((score as number) * 100);

    // --- Create peer review record ---

    const peerReview = await prisma.peerReview.create({
      data: {
        verificationReportId: verificationReportId as string,
        reviewerWallet,
        reviewerTier,
        reviewerWeight,
        score: scaledScore,
        passed: passed as boolean,
        evidenceJson: JSON.parse(JSON.stringify(evidence)),
        reviewHash,
      },
    });

    // --- Update reviewer profile stats ---

    const domainReviews =
      (reviewerProfile.domainReviews as Record<string, number>) ?? {};
    for (const domain of domainTags) {
      domainReviews[domain] = (domainReviews[domain] ?? 0) + 1;
    }

    await prisma.reviewerProfile.update({
      where: { walletAddress: reviewerWallet },
      data: {
        totalReviews: reviewerProfile.totalReviews + 1,
        tier: reviewerTier,
        domainReviews: JSON.parse(JSON.stringify(domainReviews)),
      },
    });

    // --- Check consensus ---

    const allReviews = await prisma.peerReview.findMany({
      where: { verificationReportId: verificationReportId as string },
    });

    const submissions: ReviewSubmission[] = allReviews.map((r) => ({
      reviewerTier: r.reviewerTier as 1 | 2 | 3,
      score: r.score,
      passed: r.passed,
    }));

    const consensus = calculateConsensus(submissions);

    // If consensus reached, finalize the verification report
    if (consensus.hasConsensus) {
      await prisma.verificationReport.update({
        where: { id: verificationReportId as string },
        data: {
          status: "completed",
          overallScore: consensus.weightedScore,
          verificationType: "peer",
        },
      });
    }

    return NextResponse.json({
      review: {
        id: peerReview.id,
        tier: reviewerTier,
        weight: reviewerWeight,
        score: scaledScore,
      },
      consensus,
    });
  } catch (error) {
    console.error("POST /api/review/submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
