import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/ideas/:id/analysis - Retrieve AI analysis for an idea
 *
 * Returns the AI feasibility analysis for a governance idea.
 * If analysis is not yet complete, returns { status: "pending" }.
 * If the database is unavailable, returns { status: "unavailable" }.
 *
 * Response includes Cache-Control: no-store since analysis may be
 * pending or updating (clients may poll for results).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ideaId } = await params;

    if (!ideaId) {
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 }
      );
    }

    // Check that the idea exists
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true },
    });

    if (!idea) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    // Retrieve analysis if it exists
    const analysis = await prisma.ideaAnalysis.findUnique({
      where: { ideaId },
    });

    if (!analysis) {
      // Analysis not yet available (still running or never triggered)
      return NextResponse.json(
        { status: "pending" },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // Analysis found -- return full results
    const analysisJson = analysis.analysisJson as Record<string, unknown>;

    return NextResponse.json(
      {
        status: "completed",
        analysis: {
          feasibilityScore: analysis.feasibilityScore,
          estimatedEffort: analysis.estimatedEffort,
          riskLevel: analysis.riskLevel,
          recommendation: analysis.recommendation,
          reasoning: (analysisJson as { reasoning?: string }).reasoning ?? "",
          impactAssessment:
            (analysisJson as { impactAssessment?: unknown }).impactAssessment ??
            null,
          technicalAnalysis:
            (analysisJson as { technicalAnalysis?: unknown })
              .technicalAnalysis ?? null,
          costEstimate:
            (analysisJson as { costEstimate?: unknown }).costEstimate ?? null,
          analysisHash: analysis.analysisHash,
          modelUsed: analysis.modelUsed,
          createdAt: analysis.createdAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("GET /api/governance/ideas/[id]/analysis error:", error);

    // Graceful degradation: if database unavailable, return unavailable status
    return NextResponse.json(
      { status: "unavailable" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
