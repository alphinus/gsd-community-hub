import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/rounds - List paginated idea rounds
 *
 * Query params:
 *   - status: Filter by round status (open, voting, closed)
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 10, max 50)
 *
 * Returns paginated rounds with idea count, ordered by createdAt desc.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [rounds, total] = await Promise.all([
      prisma.ideaRound.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: { ideas: true },
          },
        },
      }),
      prisma.ideaRound.count({ where }),
    ]);

    return NextResponse.json(
      {
        rounds,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/governance/rounds error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/governance/rounds - Submit off-chain content for a round
 *
 * Body:
 *   - onChainAddress: Base58-encoded PDA address (required for upsert)
 *   - title: Round title
 *   - description: Round description
 *   - roundIndex: Sequential round index (used for create)
 *   - contentHash: SHA-256 of off-chain content
 *   - submissionStart: ISO date string
 *   - submissionEnd: ISO date string
 *   - votingEnd: ISO date string
 *   - quorumType: "small" | "treasury" | "parameter_change"
 *
 * Upserts by onChainAddress: creates if new, updates title/description if exists.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      onChainAddress,
      title,
      description,
      roundIndex,
      contentHash,
      submissionStart,
      submissionEnd,
      votingEnd,
      quorumType,
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

    const round = await prisma.ideaRound.upsert({
      where: { onChainAddress },
      update: {
        title,
        description,
        ...(contentHash ? { contentHash } : {}),
      },
      create: {
        roundIndex: roundIndex ?? 0,
        onChainAddress,
        title,
        description,
        contentHash: contentHash || "",
        status: "open",
        submissionStart: submissionStart
          ? new Date(submissionStart)
          : new Date(),
        submissionEnd: submissionEnd
          ? new Date(submissionEnd)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        votingEnd: votingEnd
          ? new Date(votingEnd)
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        quorumType: quorumType || "small",
      },
    });

    return NextResponse.json({ round }, { status: 200 });
  } catch (error) {
    console.error("POST /api/governance/rounds error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
