import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/directory - List all developer profiles (public)
 *
 * No authentication required. Returns paginated list of developers
 * who have created profiles (displayName is not null).
 *
 * Query params:
 *   - page: page number (default 1)
 *   - limit: items per page (default 20, max 100)
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

    const [developers, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          displayName: { not: null },
        },
        select: {
          walletAddress: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          onChainPda: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: {
          displayName: { not: null },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        developers,
        total,
        page,
        totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/directory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
