import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ScoreBadge } from "@/components/contributions/score-badge";
import { ContributionList } from "@/components/contributions/contribution-list";
import { VerificationHistory } from "@/components/verification/VerificationHistory";
import { VerificationScoreBadge } from "@/components/verification/VerificationScoreBadge";
import { calculateContributionScore } from "@gsd/utils";

interface ProfilePageProps {
  params: Promise<{ wallet: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { wallet } = await params;

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { displayName: true, bio: true },
  });

  if (!user?.displayName) {
    return { title: "Profile Not Found | GSD Community Hub" };
  }

  const description = user.bio
    ? user.bio.length > 160
      ? user.bio.slice(0, 157) + "..."
      : user.bio
    : `Developer profile on GSD Community Hub`;

  return {
    title: `${user.displayName} | GSD Community Hub`,
    description,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { wallet } = await params;

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: {
      walletAddress: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      githubUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      onChainPda: true,
      createdAt: true,
    },
  });

  if (!user || !user.displayName) {
    notFound();
  }

  // Serialize dates for client component
  const profile = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };

  // Fetch contribution data server-side for initial render
  let scoreData = {
    score: "0",
    tasksCompleted: 0,
    averageScore: 0,
    daysActive: 0,
  };

  let initialContributions = undefined;

  try {
    const [contributions, total, aggregation, firstContribution] =
      await Promise.all([
        prisma.contribution.findMany({
          where: { walletAddress: wallet },
          orderBy: { createdAt: "desc" },
          take: 10,
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
        prisma.contribution.aggregate({
          where: { walletAddress: wallet },
          _avg: { verificationScore: true },
          _sum: { verificationScore: true },
        }),
        prisma.contribution.findFirst({
          where: { walletAddress: wallet },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        }),
      ]);

    const avgScore = Math.round(aggregation._avg.verificationScore ?? 0);
    const totalVerificationScore = BigInt(
      aggregation._sum.verificationScore ?? 0
    );

    // Calculate days active
    let daysActive = 0;
    if (firstContribution) {
      const msActive =
        Date.now() - new Date(firstContribution.createdAt).getTime();
      daysActive = Math.max(1, Math.floor(msActive / 86_400_000));
    }

    // Calculate contribution score
    let score = 0n;
    if (total > 0) {
      score = calculateContributionScore({
        tasksCompleted: total,
        totalVerificationScore,
        timeActiveDays: daysActive,
      });
    }

    scoreData = {
      score: score.toString(),
      tasksCompleted: total,
      averageScore: avgScore,
      daysActive,
    };

    // Serialize contributions for client component
    initialContributions = {
      contributions: contributions.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page: 1,
      limit: 10,
      summary: {
        tasksCompleted: total,
        averageVerificationScore: avgScore,
      },
    };
  } catch (error) {
    // Graceful degradation: show profile without contributions
    console.error("Failed to load contribution data:", error);
  }

  // Fetch average verification score for profile header badge
  let avgVerificationScore: number | null = null;
  let verificationCount = 0;
  try {
    const [verAgg, verCount] = await Promise.all([
      prisma.verificationReport.aggregate({
        where: { walletAddress: wallet },
        _avg: { overallScore: true },
      }),
      prisma.verificationReport.count({
        where: { walletAddress: wallet },
      }),
    ]);
    verificationCount = verCount;
    if (verCount > 0 && verAgg._avg.overallScore != null) {
      avgVerificationScore = Math.round(verAgg._avg.overallScore);
    }
  } catch {
    // Graceful degradation: skip verification badge
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <div className="absolute inset-0 mesh-gradient -z-10" />

      <ProfileHeader profile={profile} />

      {/* Verification score in profile header area */}
      {avgVerificationScore != null && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            Avg Verification Score:
          </span>
          <VerificationScoreBadge score={avgVerificationScore} size="sm" />
        </div>
      )}

      {/* Contribution section */}
      <div className="mt-10 space-y-6">
        <ScoreBadge
          score={scoreData.score}
          tasksCompleted={scoreData.tasksCompleted}
          averageScore={scoreData.averageScore}
          daysActive={scoreData.daysActive}
        />

        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
            Contribution History
          </h2>
          <ContributionList
            walletAddress={wallet}
            initialData={initialContributions}
          />
        </div>
      </div>

      {/* Verification History section */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Verification History
        </h2>
        {verificationCount > 0 ? (
          <VerificationHistory walletAddress={wallet} />
        ) : (
          <div className="rounded-2xl glass-surface px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No AI verifications yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
