import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ScoreBadge } from "@/components/contributions/score-badge";
import { ContributionList } from "@/components/contributions/contribution-list";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ProfileHeader profile={profile} />

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
    </div>
  );
}
