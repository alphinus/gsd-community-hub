import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/rounds/:id - Get a single idea round with nested ideas
 *
 * Returns the round with all its ideas and aggregate vote data.
 * BigInt fields (yesWeight, noWeight, abstainWeight) serialized as strings.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const round = await prisma.ideaRound.findUnique({
      where: { id },
      include: {
        ideas: {
          orderBy: { submittedAt: "desc" },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    // Serialize BigInt fields on ideas as strings (project convention from 02-05)
    const serializedRound = {
      ...round,
      ideas: round.ideas.map((idea) => ({
        ...idea,
        yesWeight: idea.yesWeight.toString(),
        noWeight: idea.noWeight.toString(),
        abstainWeight: idea.abstainWeight.toString(),
      })),
    };

    return NextResponse.json({ round: serializedRound }, { status: 200 });
  } catch (error) {
    console.error("GET /api/governance/rounds/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
