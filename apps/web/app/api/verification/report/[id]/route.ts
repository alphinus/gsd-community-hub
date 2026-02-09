import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/verification/report/[id]
 *
 * Returns a single verification report by ID. Public endpoint -- every
 * verification report is publicly auditable (per user decision).
 *
 * Includes the full reportJson, peerReviews, and reportHash for
 * on-chain verification.
 *
 * Response:
 *   200: { report: { id, walletAddress, taskRef, verificationType, overallScore,
 *          confidence, reportJson, reportHash, onChainAddress, status, createdAt,
 *          peerReviews: [...] } }
 *   404: { error: "Report not found" }
 *   200 (degraded): { error: "unavailable" } on database error
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const report = await prisma.verificationReport.findUnique({
      where: { id },
      include: {
        peerReviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        report: {
          id: report.id,
          walletAddress: report.walletAddress,
          taskRef: report.taskRef,
          verificationType: report.verificationType,
          overallScore: report.overallScore,
          confidence: report.confidence,
          reportJson: report.reportJson,
          reportHash: report.reportHash,
          onChainAddress: report.onChainAddress,
          transactionSignature: report.transactionSignature,
          status: report.status,
          configVersion: report.configVersion,
          createdAt: report.createdAt.toISOString(),
          peerReviews: report.peerReviews.map((pr) => ({
            id: pr.id,
            reviewerWallet: pr.reviewerWallet,
            reviewerTier: pr.reviewerTier,
            reviewerWeight: pr.reviewerWeight,
            score: pr.score,
            passed: pr.passed,
            evidenceJson: pr.evidenceJson,
            reviewHash: pr.reviewHash,
            onChainAddress: pr.onChainAddress,
            transactionSignature: pr.transactionSignature,
            createdAt: pr.createdAt.toISOString(),
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/verification/report/[id] error:", error);
    // Graceful degradation on database error
    return NextResponse.json({ error: "unavailable" }, { status: 200 });
  }
}
