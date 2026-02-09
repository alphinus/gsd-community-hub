"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { VotingPowerDisplay } from "@/components/governance/VotingPowerDisplay";
import { QuadraticVoteDisplay } from "@/components/governance/QuadraticVoteDisplay";
import { HumanVerificationBadge } from "@/components/governance/HumanVerificationBadge";
import { DecayedScoreDisplay } from "@/components/governance/DecayedScoreDisplay";

interface VoteEntry {
  id: string;
  vote: string;
  weight: string;
  votedAt: string;
  idea: {
    title: string;
    onChainAddress: string;
  };
}

interface VotesResponse {
  votes: VoteEntry[];
  total: number;
  page: number;
  limit: number;
}

interface DepositInfo {
  walletAddress: string;
  depositedAmount: string;
  depositTimestamp: string;
  eligibleAt: string;
  activeVotes: number;
}

interface DelegationResponse {
  delegations: Array<{
    delegatorWallet: string;
    delegateWallet: string;
    delegatedAmount: string;
    isActive: boolean;
  }>;
  stats: {
    asDelegator: { delegateWallet: string; delegatedAmount: string } | null;
    asDelegate: {
      delegatorCount: number;
      totalDelegated: string;
    };
  };
}

interface AnalyticsResponse {
  delegationStats: {
    totalActiveDelegations: number;
    totalDelegatedTokens: string;
    topDelegates: Array<{ wallet: string; delegatorCount: number }>;
  };
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-[var(--color-gsd-surface-raised)]" />
      <div className="h-24 rounded-lg bg-[var(--color-gsd-surface-raised)]" />
      <div className="h-48 rounded-lg bg-[var(--color-gsd-surface-raised)]" />
    </div>
  );
}

function VoteChoiceLabel({ vote }: { vote: string }) {
  const colorClass =
    vote === "yes"
      ? "text-emerald-500"
      : vote === "no"
        ? "text-red-500"
        : "text-gray-400";

  return (
    <span className={`font-medium ${colorClass}`}>
      {vote.charAt(0).toUpperCase() + vote.slice(1)}
    </span>
  );
}

export default function GovernanceDashboard() {
  const { data: session } = useSession();
  const wallet = session?.publicKey;

  const { data: votesData, isLoading: votesLoading } =
    useQuery<VotesResponse>({
      queryKey: ["my-votes", wallet],
      queryFn: async () => {
        const res = await fetch(
          `/api/governance/votes?wallet=${wallet}&limit=10`
        );
        if (!res.ok) throw new Error("Failed to fetch votes");
        return res.json();
      },
      enabled: !!wallet,
      staleTime: 30_000,
    });

  // Fetch deposit info for quadratic display
  const { data: depositData } = useQuery<{
    deposit: DepositInfo | null;
    isEligible: boolean;
  }>({
    queryKey: ["deposit", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/governance/deposit?wallet=${wallet}`);
      if (!res.ok) throw new Error("Failed to fetch deposit");
      return res.json();
    },
    enabled: !!wallet,
    staleTime: 30_000,
  });

  // Fetch delegation info
  const { data: delegationData } = useQuery<DelegationResponse>({
    queryKey: ["delegation", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/governance/delegate?wallet=${wallet}`);
      if (!res.ok) throw new Error("Failed to fetch delegation");
      return res.json();
    },
    enabled: !!wallet,
    staleTime: 30_000,
  });

  // Fetch analytics for delegation summary
  const { data: analyticsData } = useQuery<AnalyticsResponse>({
    queryKey: ["governance-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/governance/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!wallet,
    staleTime: 60_000,
  });

  if (!wallet) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-gsd-text)]">
            Governance Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--color-gsd-text-muted)]">
            Connect your wallet to view your governance activity.
          </p>
        </div>
      </div>
    );
  }

  const depositAmount = depositData?.deposit?.depositedAmount ?? "0";
  const delegatedToMe = delegationData?.stats?.asDelegate?.totalDelegated ?? "0";
  const hasDelegation = !!delegationData?.stats?.asDelegator;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-gsd-text)]">
        Governance Dashboard
      </h1>

      {/* Voting power and verification */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <VotingPowerDisplay wallet={wallet} />
        <HumanVerificationBadge wallet={wallet} />
      </div>

      {/* Quadratic vote weight */}
      {depositData?.deposit && (
        <div className="mb-6">
          <QuadraticVoteDisplay
            depositedAmount={depositAmount}
            isQuadratic={true}
            delegatedAmount={
              BigInt(delegatedToMe) > 0n ? delegatedToMe : undefined
            }
          />
        </div>
      )}

      {/* Quick links */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/governance/deposit"
          className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4 text-center transition-colors hover:border-[var(--color-gsd-accent)]/50"
        >
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            Deposit Tokens
          </p>
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Manage deposits
          </p>
        </Link>
        <Link
          href="/governance/delegate"
          className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4 text-center transition-colors hover:border-[var(--color-gsd-accent)]/50"
        >
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            Delegate
          </p>
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            {hasDelegation ? "Active" : "Manage"}
          </p>
        </Link>
        <Link
          href="/governance/rounds"
          className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4 text-center transition-colors hover:border-[var(--color-gsd-accent)]/50"
        >
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            View Rounds
          </p>
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Browse proposals
          </p>
        </Link>
        <Link
          href="/governance/delegates"
          className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4 text-center transition-colors hover:border-[var(--color-gsd-accent)]/50"
        >
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            Delegates
          </p>
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Directory
          </p>
        </Link>
      </div>

      {/* Decayed score */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Contribution Score
        </h2>
        <DecayedScoreDisplay wallet={wallet} />
      </div>

      {/* Advanced Governance Summary */}
      <div className="mb-8 rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Advanced Governance
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Quadratic Voting
            </p>
            <p className="text-sm font-semibold text-emerald-500">Enabled</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Active Delegations
            </p>
            <p className="text-sm font-semibold text-[var(--color-gsd-text)]">
              {analyticsData?.delegationStats?.totalActiveDelegations ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Total Delegated
            </p>
            <p className="text-sm font-semibold text-[var(--color-gsd-text)]">
              {(
                Number(
                  BigInt(
                    analyticsData?.delegationStats?.totalDelegatedTokens ?? "0"
                  )
                ) / 1e9
              ).toFixed(2)}{" "}
              $GSD
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/governance/delegates"
            className="text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
          >
            View delegate directory
          </Link>
          <Link
            href="/governance/delegate"
            className="text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
          >
            Manage delegation
          </Link>
        </div>
      </div>

      {/* Recent votes */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Your Recent Votes
        </h2>

        {votesLoading ? (
          <DashboardSkeleton />
        ) : votesData && votesData.votes.length > 0 ? (
          <div className="space-y-2">
            {votesData.votes.map((vote) => (
              <div
                key={vote.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-gsd-text)]">
                    {vote.idea.title}
                  </p>
                  <p className="text-xs text-[var(--color-gsd-text-muted)]">
                    Weight: {vote.weight}
                  </p>
                </div>
                <div className="text-right">
                  <VoteChoiceLabel vote={vote.vote} />
                  <p className="text-xs text-[var(--color-gsd-text-muted)]">
                    {new Date(vote.votedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {votesData.total > 10 && (
              <p className="pt-2 text-center text-xs text-[var(--color-gsd-text-muted)]">
                Showing 10 of {votesData.total} votes
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-6 py-8 text-center">
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No votes cast yet
            </p>
            <Link
              href="/governance/rounds"
              className="mt-2 inline-block text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
            >
              Browse active rounds to vote
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
