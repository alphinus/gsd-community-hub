import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/rounds/:id/ideas - List paginated ideas for a round
 *
 * Query params:
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 10, max 50)
 *   - sort: "newest" (default) or "most_votes"
 *
 * Returns paginated ideas with vote counts.
 * BigInt fields (yesWeight, noWeight, abstainWeight) serialized as strings.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roundId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const sort = searchParams.get("sort") || "newest";
    const skip = (page - 1) * limit;

    // Verify round exists
    const roundExists = await prisma.ideaRound.findUnique({
      where: { id: roundId },
      select: { id: true },
    });

    if (!roundExists) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    const orderBy =
      sort === "most_votes"
        ? { voterCount: "desc" as const }
        : { submittedAt: "desc" as const };

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where: { roundId },
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { votes: true },
          },
        },
      }),
      prisma.idea.count({ where: { roundId } }),
    ]);

    // Serialize BigInt fields as strings (project convention from 02-05)
    const serializedIdeas = ideas.map((idea) => ({
      ...idea,
      yesWeight: idea.yesWeight.toString(),
      noWeight: idea.noWeight.toString(),
      abstainWeight: idea.abstainWeight.toString(),
    }));

    return NextResponse.json(
      {
        ideas: serializedIdeas,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/governance/rounds/[id]/ideas error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/governance/rounds/:id/ideas - Submit off-chain idea content
 *
 * Body:
 *   - onChainAddress: Base58-encoded PDA address (required for upsert)
 *   - title: Idea title
 *   - description: Idea description
 *   - authorWallet: Author's wallet address
 *   - contentHash: SHA-256 of off-chain content
 *   - ideaIndex: Sequential index within the round (for create)
 *
 * Upserts by onChainAddress: creates if new, updates title/description if exists.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roundId } = await params;
    const body = await request.json();
    const {
      onChainAddress,
      title,
      description,
      authorWallet,
      contentHash,
      ideaIndex,
    } = body;

    if (!onChainAddress) {
      return NextResponse.json(
        { error: "onChainAddress is required" },
        { status: 400 }
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 }
      );
    }

    // Verify round exists
    const round = await prisma.ideaRound.findUnique({
      where: { id: roundId },
      select: { id: true },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    const idea = await prisma.idea.upsert({
      where: { onChainAddress },
      update: {
        title,
        description,
        ...(contentHash ? { contentHash } : {}),
      },
      create: {
        ideaIndex: ideaIndex ?? 0,
        onChainAddress,
        roundId,
        authorWallet: authorWallet || "",
        title,
        description,
        contentHash: contentHash || "",
        status: "submitted",
        transactionSignature: `offchain-${Date.now()}`,
      },
    });

    // Serialize BigInt fields
    const serializedIdea = {
      ...idea,
      yesWeight: idea.yesWeight.toString(),
      noWeight: idea.noWeight.toString(),
      abstainWeight: idea.abstainWeight.toString(),
    };

    return NextResponse.json({ idea: serializedIdea }, { status: 200 });
  } catch (error) {
    console.error("POST /api/governance/rounds/[id]/ideas error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
