import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getActiveDelegations } from "@/lib/governance/delegation";

/**
 * Compute the Gini coefficient for a set of amounts.
 *
 * The Gini coefficient measures inequality in a distribution.
 * 0 = perfect equality, 1 = perfect inequality.
 *
 * Formula: G = (2 * sum(i * x_i)) / (n * sum(x_i)) - (n + 1) / n
 * where x_i is sorted ascending by value.
 *
 * @param amounts - Array of numeric amounts
 * @returns Gini coefficient between 0 and 1
 */
function computeGini(amounts: number[]): number {
  if (amounts.length === 0) return 0;
  const sorted = [...amounts].sort((a, b) => a - b);
  const n = sorted.length;
  const totalSum = sorted.reduce((acc, x) => acc + x, 0);
  if (totalSum === 0) return 0;
  const weightedSum = sorted.reduce((acc, x, i) => acc + (i + 1) * x, 0);
  return (2 * weightedSum) / (n * totalSum) - (n + 1) / n;
}

/**
 * GET /api/governance/analytics - Governance analytics dashboard data
 *
 * Returns comprehensive governance metrics:
 *   - turnoutByRound: Voter participation per closed round
 *   - powerDistribution: Gini coefficient and top-10 deposit concentration
 *   - delegationStats: Active delegation counts and top delegates
 *   - participationTrends: 30/60/90 day rolling averages of voter turnout
 *
 * Public endpoint. Cached for 5 minutes (expensive aggregate queries).
 */
export async function GET() {
  try {
    // --- Turnout by round ---
    // For each closed round, count distinct voters vs total depositors
    const closedRounds = await prisma.ideaRound.findMany({
      where: { status: "closed" },
      select: {
        id: true,
        roundIndex: true,
        title: true,
        onChainAddress: true,
        votingEnd: true,
      },
      orderBy: { roundIndex: "asc" },
    });

    const totalDepositors = await prisma.voteDeposit.count({
      where: { depositedAmount: { gt: 0 } },
    });

    const turnoutByRound = await Promise.all(
      closedRounds.map(async (round) => {
        // Count distinct voters in this round's ideas
        const ideas = await prisma.idea.findMany({
          where: { roundId: round.id },
          select: { id: true },
        });

        const ideaIds = ideas.map((i) => i.id);

        let distinctVoters = 0;
        if (ideaIds.length > 0) {
          const voters = await prisma.vote.groupBy({
            by: ["voterWallet"],
            where: { ideaId: { in: ideaIds } },
          });
          distinctVoters = voters.length;
        }

        return {
          roundIndex: round.roundIndex,
          title: round.title,
          onChainAddress: round.onChainAddress,
          votingEnd: round.votingEnd,
          distinctVoters,
          totalDepositors,
          turnoutRate:
            totalDepositors > 0 ? distinctVoters / totalDepositors : 0,
        };
      })
    );

    // --- Power distribution ---
    // Query all VoteDeposit amounts, compute Gini and top-10 concentration
    const allDeposits = await prisma.voteDeposit.findMany({
      where: { depositedAmount: { gt: 0 } },
      select: { depositedAmount: true, walletAddress: true },
      orderBy: { depositedAmount: "desc" },
    });

    const depositAmounts = allDeposits.map((d) =>
      Number(d.depositedAmount)
    );
    const totalDeposited = depositAmounts.reduce((a, b) => a + b, 0);

    const giniCoefficient = computeGini(depositAmounts);

    // Top-10 concentration
    const top10Amount = depositAmounts.slice(0, 10).reduce((a, b) => a + b, 0);
    const top10Concentration =
      totalDeposited > 0 ? top10Amount / totalDeposited : 0;

    const powerDistribution = {
      giniCoefficient: Math.round(giniCoefficient * 10000) / 10000,
      top10Concentration: Math.round(top10Concentration * 10000) / 10000,
      totalDepositors: allDeposits.length,
      totalDeposited: totalDeposited.toString(),
      top10Wallets: allDeposits.slice(0, 10).map((d) => ({
        wallet: d.walletAddress,
        amount: d.depositedAmount.toString(),
      })),
    };

    // --- Delegation stats ---
    const activeDelegations = await getActiveDelegations();

    const totalDelegatedTokens = activeDelegations.reduce(
      (sum, d) => sum + BigInt(d.delegatedAmount),
      BigInt(0)
    );

    // Top 5 delegates by delegator count
    const delegateCounts = new Map<string, number>();
    for (const d of activeDelegations) {
      delegateCounts.set(
        d.delegateWallet,
        (delegateCounts.get(d.delegateWallet) ?? 0) + 1
      );
    }

    const topDelegates = [...delegateCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([wallet, count]) => ({ wallet, delegatorCount: count }));

    const delegationStats = {
      totalActiveDelegations: activeDelegations.length,
      totalDelegatedTokens: totalDelegatedTokens.toString(),
      topDelegates,
    };

    // --- Participation trends ---
    // 30/60/90 day rolling averages of voter turnout using Vote.votedAt timestamps
    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const day90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [voters30, voters60, voters90] = await Promise.all([
      prisma.vote.groupBy({
        by: ["voterWallet"],
        where: { votedAt: { gte: day30 } },
      }),
      prisma.vote.groupBy({
        by: ["voterWallet"],
        where: { votedAt: { gte: day60 } },
      }),
      prisma.vote.groupBy({
        by: ["voterWallet"],
        where: { votedAt: { gte: day90 } },
      }),
    ]);

    const participationTrends = {
      last30Days: {
        distinctVoters: voters30.length,
        turnoutRate:
          totalDepositors > 0 ? voters30.length / totalDepositors : 0,
      },
      last60Days: {
        distinctVoters: voters60.length,
        turnoutRate:
          totalDepositors > 0 ? voters60.length / totalDepositors : 0,
      },
      last90Days: {
        distinctVoters: voters90.length,
        turnoutRate:
          totalDepositors > 0 ? voters90.length / totalDepositors : 0,
      },
    };

    const response = NextResponse.json(
      {
        turnoutByRound,
        powerDistribution,
        delegationStats,
        participationTrends,
      },
      { status: 200 }
    );

    // Cache for 5 minutes -- analytics are expensive aggregate queries
    response.headers.set("Cache-Control", "public, max-age=300");

    return response;
  } catch (error) {
    console.error("GET /api/governance/analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
