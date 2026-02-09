import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { VerificationReport } from "@/components/verification/VerificationReport";
import { PeerReviewPanel } from "@/components/review/PeerReviewPanel";
import { ReviewConsensusProgress } from "@/components/review/ReviewConsensusProgress";
import { FallbackChoicePanel } from "@/components/review/FallbackChoicePanel";
import type {
  VerificationReportInfo,
  VerificationCategory,
  PeerReviewInfo,
  ReviewerTier,
  VerificationType,
  VerificationStatus,
} from "@gsd/types";
import { MIN_REVIEWERS, CONSENSUS_THRESHOLD } from "@/lib/review/constants";

interface VerificationReportPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: VerificationReportPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const report = await prisma.verificationReport.findUnique({
      where: { id },
      select: { overallScore: true, walletAddress: true },
    });

    if (!report) {
      return { title: "Report Not Found | GSD Community Hub" };
    }

    const displayScore = Math.round(report.overallScore / 100);
    const truncatedWallet = `${report.walletAddress.slice(0, 4)}...${report.walletAddress.slice(-4)}`;

    return {
      title: `Verification Report: ${displayScore}/100 for ${truncatedWallet} | GSD Community Hub`,
      description: `AI verification report scoring ${displayScore}/100 for contributor ${truncatedWallet}`,
    };
  } catch {
    return { title: "Verification Report | GSD Community Hub" };
  }
}

export default async function VerificationReportPage({
  params,
}: VerificationReportPageProps) {
  const { id } = await params;

  let dbReport;
  try {
    dbReport = await prisma.verificationReport.findUnique({
      where: { id },
      include: { peerReviews: true },
    });
  } catch {
    notFound();
  }

  if (!dbReport) {
    notFound();
  }

  // Parse reportJson to extract categories
  const reportJson = dbReport.reportJson as Record<string, unknown> | null;
  let categories: VerificationCategory[] = [];

  if (reportJson && typeof reportJson === "object") {
    const cats = reportJson.categories as
      | Record<string, unknown>
      | undefined;
    if (cats && typeof cats === "object") {
      categories = Object.values(cats).filter(
        (c): c is VerificationCategory =>
          typeof c === "object" && c !== null && "name" in c && "score" in c
      );
    }
  }

  // Build report info for component
  const report: VerificationReportInfo = {
    developer: dbReport.walletAddress,
    taskRef: dbReport.taskRef,
    verificationType: dbReport.verificationType as VerificationType,
    status: dbReport.status as VerificationStatus,
    score: dbReport.overallScore,
    confidence: dbReport.confidence,
    reportHash: dbReport.reportHash,
    verifiedAt: dbReport.createdAt.toISOString(),
    reviewerCount: dbReport.peerReviews.length,
    configVersion: dbReport.configVersion,
    onChainAddress: dbReport.onChainAddress,
    categories,
  };

  // Build peer review info for components
  const peerReviews: PeerReviewInfo[] = dbReport.peerReviews.map((pr) => ({
    reviewer: pr.reviewerWallet,
    verificationReport: dbReport.id,
    tier: pr.reviewerTier as ReviewerTier,
    weight: pr.reviewerWeight,
    score: pr.score,
    passed: pr.passed,
    reviewHash: pr.reviewHash,
    reviewedAt: pr.createdAt.toISOString(),
    onChainAddress: pr.onChainAddress,
    evidence: pr.evidenceJson as object | undefined,
  }));

  const isPending = dbReport.status === "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Full verification report */}
      <VerificationReport report={report} />

      {/* Peer review section for pending reports */}
      {isPending && (
        <div className="mt-6 space-y-6">
          {/* Consensus progress */}
          <ReviewConsensusProgress
            reviews={peerReviews}
            minReviewers={MIN_REVIEWERS}
            consensusThreshold={CONSENSUS_THRESHOLD}
          />

          {/* Peer review form */}
          <PeerReviewPanel verificationReportId={dbReport.id} />

          {/* Fallback choice is shown as a placeholder; real routing is client-side */}
        </div>
      )}

      {/* Show peer review results for completed reports that had reviews */}
      {!isPending && peerReviews.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
            Peer Reviews ({peerReviews.length})
          </h3>
          <ReviewConsensusProgress
            reviews={peerReviews}
            minReviewers={MIN_REVIEWERS}
            consensusThreshold={CONSENSUS_THRESHOLD}
          />
        </div>
      )}
    </div>
  );
}
