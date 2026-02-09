import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { computeVerificationReportHash } from "@gsd/utils";
import { verifyTask } from "@/lib/verification/engine";
import { scaleToOnChain } from "@/lib/verification/scoring";
import { CONFIDENCE_THRESHOLD } from "@/lib/verification/constants";

/**
 * POST /api/verification/submit
 *
 * Triggers AI verification for a task submission. Requires authentication.
 *
 * Request body:
 *   - taskRef: string (required) - Task reference identifier
 *   - planContent: string (required) - GSD plan file content
 *   - codeDiff: string (required) - Raw unified diff of code changes
 *   - testResults: string (required) - Raw test runner output
 *   - fileList: string[] (required) - List of changed file paths
 *   - commitMessages?: string[] (optional) - Commit messages for the task
 *
 * Response:
 *   200: { report: { id, overallScore, confidence, status, needsPeerReview, categories, summary, recommendations, domainTags } }
 *   400: { error: "Missing required fields", missing: [...] }
 *   401: { error: "Not authenticated" }
 *   500: { error: "Verification failed", details: string }
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const session = await auth();
  if (!session?.publicKey) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const walletAddress = session.publicKey;

  // Parse and validate request body
  let body: {
    taskRef?: string;
    planContent?: string;
    codeDiff?: string;
    testResults?: string;
    fileList?: string[];
    commitMessages?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate required fields
  const missing: string[] = [];
  if (!body.taskRef) missing.push("taskRef");
  if (!body.planContent) missing.push("planContent");
  if (!body.codeDiff) missing.push("codeDiff");
  if (!body.testResults) missing.push("testResults");
  if (!body.fileList || !Array.isArray(body.fileList) || body.fileList.length === 0)
    missing.push("fileList");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", missing },
      { status: 400 }
    );
  }

  try {
    // Call AI verification engine
    const aiReport = await verifyTask({
      taskRef: body.taskRef!,
      planContent: body.planContent!,
      codeDiff: body.codeDiff!,
      testResults: body.testResults!,
      fileList: body.fileList!,
      commitMessages: body.commitMessages,
    });

    // Build the full report JSON for storage
    const reportJson = JSON.parse(JSON.stringify(aiReport));

    // Compute deterministic hash of the report
    const reportHash = await computeVerificationReportHash(reportJson);

    // Convert scores to on-chain scale (0-10000 basis points)
    const overallScoreOnChain = scaleToOnChain(aiReport.overallScore);
    const confidenceOnChain = scaleToOnChain(aiReport.confidence);

    // Determine status: low confidence triggers peer review requirement
    const needsPeerReview = confidenceOnChain < CONFIDENCE_THRESHOLD;
    const status = needsPeerReview ? "pending" : "completed";

    // Store in Prisma
    const record = await prisma.verificationReport.create({
      data: {
        walletAddress,
        taskRef: body.taskRef!,
        verificationType: "ai",
        overallScore: overallScoreOnChain,
        confidence: confidenceOnChain,
        reportJson,
        reportHash,
        // TODO: on-chain recording will be wired when the server has signing
        // capability. For now, store off-chain and mark onChainAddress as null.
        // The on-chain recording can be triggered separately.
        onChainAddress: null,
        transactionSignature: null,
        status,
      },
    });

    // Build response
    const response: Record<string, unknown> = {
      report: {
        id: record.id,
        overallScore: aiReport.overallScore,
        confidence: aiReport.confidence,
        status,
        categories: aiReport.categories,
        summary: aiReport.summary,
        recommendations: aiReport.recommendations,
        domainTags: aiReport.domainTags,
      },
    };

    // If low confidence, include peer review fallback info
    if (needsPeerReview) {
      (response.report as Record<string, unknown>).needsPeerReview = true;
      (response.report as Record<string, unknown>).fallbackOptions = [
        "peer_review",
        "resubmit",
      ];
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/verification/submit error:", message);
    return NextResponse.json(
      { error: "Verification failed", details: message },
      { status: 500 }
    );
  }
}
