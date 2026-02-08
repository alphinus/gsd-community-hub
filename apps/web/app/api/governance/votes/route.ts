import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/votes - Get paginated vote records
 *
 * Query params:
 *   - ideaId: Filter votes by idea (database ID)
 *   - wallet: Filter votes by voter wallet address
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20, max 50)
 *
 * At least one of ideaId or wallet must be provided.
 * BigInt weight serialized as string (project convention from 02-05).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get("ideaId");
    const wallet = searchParams.get("wallet");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    if (!ideaId && !wallet) {
      return NextResponse.json(
        { error: "Either ideaId or wallet query parameter is required" },
        { status: 400 }
      );
    }

    // Build where clause based on provided filters
    const where: Record<string, string> = {};
    if (ideaId) {
      where.ideaId = ideaId;
    }
    if (wallet) {
      where.voterWallet = wallet;
    }

    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        where,
        orderBy: { votedAt: "desc" },
        skip,
        take: limit,
        include: {
          idea: {
            select: {
              title: true,
              onChainAddress: true,
            },
          },
        },
      }),
      prisma.vote.count({ where }),
    ]);

    // Serialize BigInt weight as string (project convention from 02-05)
    const serializedVotes = votes.map((v) => ({
      ...v,
      weight: v.weight.toString(),
    }));

    return NextResponse.json(
      {
        votes: serializedVotes,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/governance/votes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
