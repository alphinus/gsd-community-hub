import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/contributions/[wallet] - Get paginated contributions for a wallet
 *
 * No authentication required. Returns paginated contribution history
 * for a specific developer wallet address, ordered by most recent first.
 *
 * Query params:
 *   - page: page number (default 1)
 *   - limit: items per page (default 20, max 100)
 *
 * Response:
 *   {
 *     contributions: Contribution[],
 *     total: number,
 *     page: number,
 *     limit: number,
 *     summary: { tasksCompleted, averageVerificationScore }
 *   }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    // Validate wallet address format (base58, 32-44 chars)
    if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: { walletAddress: wallet },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          taskRef: true,
          verificationScore: true,
          contentHash: true,
          leafHash: true,
          leafIndex: true,
          treeAddress: true,
          transactionSignature: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.contribution.count({
        where: { walletAddress: wallet },
      }),
    ]);

    // Compute summary stats
    let averageVerificationScore = 0;
    if (total > 0) {
      const aggregate = await prisma.contribution.aggregate({
        where: { walletAddress: wallet },
        _avg: { verificationScore: true },
      });
      averageVerificationScore = Math.round(
        aggregate._avg.verificationScore ?? 0
      );
    }

    return NextResponse.json(
      {
        contributions,
        total,
        page,
        limit,
        summary: {
          tasksCompleted: total,
          averageVerificationScore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/contributions/[wallet] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
