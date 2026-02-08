import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/contributions - Get recent contributions across all developers
 *
 * No authentication required. Returns a feed of recent contributions
 * across all developers, ordered by most recent first.
 * Includes contributor display name from the User relation.
 *
 * Query params:
 *   - page: page number (default 1)
 *   - limit: items per page (default 20, max 100)
 *
 * Response:
 *   {
 *     contributions: ContributionWithUser[],
 *     total: number,
 *     page: number,
 *     limit: number,
 *     totalPages: number,
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          walletAddress: true,
          taskRef: true,
          verificationScore: true,
          contentHash: true,
          transactionSignature: true,
          description: true,
          createdAt: true,
          user: {
            select: {
              displayName: true,
            },
          },
        },
      }),
      prisma.contribution.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        contributions,
        total,
        page,
        limit,
        totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/contributions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
