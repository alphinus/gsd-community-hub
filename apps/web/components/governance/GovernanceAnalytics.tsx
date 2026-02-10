"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ParticipationChart } from "@/components/governance/ParticipationChart";
import { VotingPowerDistribution } from "@/components/governance/VotingPowerDistribution";

interface TurnoutByRound {
  roundIndex: number;
  title: string;
  distinctVoters: number;
  totalDepositors: number;
  turnoutRate: number;
}

interface ParticipationTrend {
  distinctVoters: number;
  turnoutRate: number;
}

interface PowerDistribution {
  giniCoefficient: number;
  top10Concentration: number;
  totalDepositors: number;
  totalDeposited: string;
  top10Wallets: Array<{ wallet: string; amount: string }>;
}

interface DelegationStats {
  totalActiveDelegations: number;
  totalDelegatedTokens: string;
  topDelegates: Array<{ wallet: string; delegatorCount: number }>;
}

interface AnalyticsResponse {
  turnoutByRound: TurnoutByRound[];
  powerDistribution: PowerDistribution;
  delegationStats: DelegationStats;
  participationTrends: {
    last30Days: ParticipationTrend;
    last60Days: ParticipationTrend;
    last90Days: ParticipationTrend;
  };
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-shimmer-violet space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-[var(--color-gsd-surface-raised)]"
          />
        ))}
      </div>
      <div className="h-[350px] rounded-2xl bg-[var(--color-gsd-surface-raised)]" />
      <div className="h-[300px] rounded-2xl bg-[var(--color-gsd-surface-raised)]" />
      <p className="text-center text-sm text-[var(--color-gsd-text-muted)]">
        Loading analytics...
      </p>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function GovernanceAnalytics() {
  const { data, isLoading, isError } = useQuery<AnalyticsResponse>({
    queryKey: ["governance-analytics-full"],
    queryFn: async () => {
      const res = await fetch("/api/governance/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes matching API cache
  });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-6 py-8 text-center">
        <p className="text-sm text-[var(--color-gsd-error)]">
          Failed to load analytics. Please try again.
        </p>
      </div>
    );
  }

  const totalRounds = data.turnoutByRound.length;
  const avgTurnout =
    totalRounds > 0
      ? Math.round(
          (data.turnoutByRound.reduce((sum, r) => sum + r.turnoutRate, 0) /
            totalRounds) *
            100
        )
      : 0;
  const delegatedTokensFormatted = (
    Number(BigInt(data.delegationStats.totalDelegatedTokens || "0")) / 1e9
  ).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Total Rounds
          </p>
          <p className="text-2xl font-bold text-[var(--color-gsd-text)]">
            {totalRounds}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Avg Turnout
          </p>
          <p className="text-2xl font-bold text-[var(--color-gsd-accent)]">{avgTurnout}%</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Active Voters
          </p>
          <p className="text-2xl font-bold text-[var(--color-gsd-text)]">
            {data.powerDistribution.totalDepositors}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Delegated Tokens
          </p>
          <p className="text-2xl font-bold gradient-text-violet">
            {delegatedTokensFormatted}
          </p>
          <p className="text-xs text-[var(--color-gsd-text-muted)]">$GSD</p>
        </div>
      </div>

      {/* Participation Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Participation
        </h2>
        <ParticipationChart
          turnoutByRound={data.turnoutByRound}
          participationTrends={data.participationTrends}
        />
      </div>

      {/* Voting Power Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Voting Power
        </h2>
        <VotingPowerDistribution
          powerDistribution={data.powerDistribution}
        />
      </div>

      {/* Delegation Network Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Delegation Network
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Active Delegations
            </p>
            <p className="text-2xl font-bold text-[var(--color-gsd-text)]">
              {data.delegationStats.totalActiveDelegations}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Total Delegated
            </p>
            <p className="text-2xl font-bold gradient-text-violet">
              {delegatedTokensFormatted} $GSD
            </p>
          </div>
        </div>

        {/* Top delegates */}
        {data.delegationStats.topDelegates.length > 0 && (
          <div className="mt-4 glass rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
              Top Delegates
            </h3>
            <div className="space-y-2">
              {data.delegationStats.topDelegates.map((delegate, index) => (
                <Link
                  key={delegate.wallet}
                  href={`/profile/${delegate.wallet}`}
                  className="flex items-center justify-between rounded-2xl bg-[var(--color-gsd-bg)] px-3 py-2 cursor-pointer transition-theme duration-200 hover:bg-[var(--color-gsd-surface-raised)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/15 text-xs font-bold text-[var(--color-gsd-accent)]">
                      {index + 1}
                    </span>
                    <span className="font-mono text-sm text-[var(--color-gsd-text)]">
                      {truncateAddress(delegate.wallet)}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--color-gsd-text-muted)]">
                    {delegate.delegatorCount}{" "}
                    {delegate.delegatorCount === 1
                      ? "delegator"
                      : "delegators"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
