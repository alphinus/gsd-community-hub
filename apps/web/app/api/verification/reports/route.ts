import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/verification/reports
 *
 * Returns paginated verification reports. Public endpoint -- all verification
 * data is publicly auditable (per user decision).
 *
 * Query params:
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20, max 100)
 *   - wallet: Optional filter by walletAddress
 *   - status: Optional filter by status (completed, pending)
 *   - type: Optional filter by verificationType (ai, peer)
 *
 * Response:
 *   200: { reports: [...], total: N, page: N, limit: N }
 *   200 (degraded): { reports: [], total: 0, page: 1, limit: 20 } on database error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Record<string, string> = {};
    if (wallet) where.walletAddress = wallet;
    if (status) where.status = status;
    if (type) where.verificationType = type;

    const [reports, total] = await Promise.all([
      prisma.verificationReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          taskRef: true,
          verificationType: true,
          overallScore: true,
          confidence: true,
          reportHash: true,
          onChainAddress: true,
          status: true,
          createdAt: true,
          _count: {
            select: { peerReviews: true },
          },
        },
      }),
      prisma.verificationReport.count({ where }),
    ]);

    // Serialize reports for JSON transport
    const serializedReports = reports.map((report) => ({
      id: report.id,
      walletAddress: report.walletAddress,
      taskRef: report.taskRef,
      verificationType: report.verificationType,
      overallScore: report.overallScore,
      confidence: report.confidence,
      reportHash: report.reportHash,
      onChainAddress: report.onChainAddress,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      peerReviewCount: report._count.peerReviews,
    }));

    return NextResponse.json(
      {
        reports: serializedReports,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/verification/reports error:", error);
    // Graceful degradation on database error
    return NextResponse.json(
      {
        reports: [],
        total: 0,
        page: 1,
        limit: 20,
      },
      { status: 200 }
    );
  }
}
