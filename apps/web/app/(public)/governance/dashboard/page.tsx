"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { VotingPowerDisplay } from "@/components/governance/VotingPowerDisplay";
import { QuadraticVoteDisplay } from "@/components/governance/QuadraticVoteDisplay";
import { HumanVerificationBadge } from "@/components/governance/HumanVerificationBadge";
import { DecayedScoreDisplay } from "@/components/governance/DecayedScoreDisplay";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-xl animate-shimmer-cyan" />
      <div className="h-24 rounded-2xl animate-shimmer-cyan" />
      <div className="h-48 rounded-2xl animate-shimmer-cyan" />
    </div>
  );
}

function VoteChoiceLabel({ vote }: { vote: string }) {
  const colorClass =
    vote === "yes"
      ? "text-[var(--color-gsd-success)]"
      : vote === "no"
        ? "text-[var(--color-gsd-error)]"
        : "text-[var(--color-gsd-text-muted)]";

  return (
    <span className={`font-normal ${colorClass}`}>
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
        <div className="rounded-2xl glass eluma-card px-6 py-16 text-center">
          <h1 className="text-2xl font-extralight gradient-text-cyan">
            Governance Dashboard
          </h1>
          <p className="mt-2 text-sm font-light text-[var(--color-gsd-text-muted)]">
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
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <div className="absolute inset-0 mesh-gradient -z-10" />

      <ScrollReveal>
        <span className="eluma-badge mb-3 inline-block">Your Activity</span>
        <h1 className="mb-6 text-3xl font-extralight gradient-text-cyan">
          Governance Dashboard
        </h1>
      </ScrollReveal>

      {/* Voting power and verification */}
      <ScrollReveal delay={1}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <VotingPowerDisplay wallet={wallet} />
          <HumanVerificationBadge wallet={wallet} />
        </div>
      </ScrollReveal>

      {/* Quadratic vote weight */}
      {depositData?.deposit && (
        <ScrollReveal delay={2}>
          <div className="mb-6">
            <QuadraticVoteDisplay
              depositedAmount={depositAmount}
              isQuadratic={true}
              delegatedAmount={
                BigInt(delegatedToMe) > 0n ? delegatedToMe : undefined
              }
            />
          </div>
        </ScrollReveal>
      )}

      {/* Quick links */}
      <ScrollReveal delay={2}>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { href: "/governance/deposit", title: "Deposit Tokens", sub: "Manage deposits" },
            { href: "/governance/delegate", title: "Delegate", sub: hasDelegation ? "Active" : "Manage" },
            { href: "/governance/rounds", title: "View Rounds", sub: "Browse proposals" },
            { href: "/governance/delegates", title: "Delegates", sub: "Directory" },
            { href: "/governance/analytics", title: "Analytics", sub: "Charts & data" },
          ].map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl glass-surface eluma-card p-4 text-center transition-theme duration-200 hover:glow-cyan cursor-pointer"
            >
              <p className="text-sm font-normal text-[var(--color-gsd-text)]">
                {link.title}
              </p>
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                {link.sub}
              </p>
            </Link>
          ))}
        </div>
      </ScrollReveal>

      {/* Decayed score */}
      <ScrollReveal delay={3}>
        <div className="mb-8">
          <span className="eluma-badge mb-2 inline-block">Metrics</span>
          <h2 className="mb-4 text-lg font-extralight text-[var(--color-gsd-text)]">
            Contribution Score
          </h2>
          <DecayedScoreDisplay wallet={wallet} />
        </div>
      </ScrollReveal>

      {/* Advanced Governance Summary */}
      <ScrollReveal delay={4}>
        <div className="mb-8 rounded-2xl glass eluma-card p-6">
          <span className="eluma-badge mb-2 inline-block">Advanced</span>
          <h2 className="mb-4 text-lg font-extralight text-[var(--color-gsd-text)]">
            Advanced Governance
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="eluma-stat rounded-xl p-3">
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                Quadratic Voting
              </p>
              <p className="text-sm font-normal text-[var(--color-gsd-accent)]">Enabled</p>
            </div>
            <div className="eluma-stat rounded-xl p-3">
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                Active Delegations
              </p>
              <p className="text-sm font-normal text-[var(--color-gsd-text)]">
                {analyticsData?.delegationStats?.totalActiveDelegations ?? 0}
              </p>
            </div>
            <div className="eluma-stat rounded-xl p-3">
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                Total Delegated
              </p>
              <p className="text-sm font-normal text-[var(--color-gsd-text)]">
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
              className="text-xs font-light text-[var(--color-gsd-accent)] underline-offset-4 hover:underline cursor-pointer transition-colors"
            >
              View delegate directory
            </Link>
            <Link
              href="/governance/delegate"
              className="text-xs font-light text-[var(--color-gsd-accent)] underline-offset-4 hover:underline cursor-pointer transition-colors"
            >
              Manage delegation
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Recent votes */}
      <ScrollReveal delay={5}>
        <div>
          <span className="eluma-badge mb-2 inline-block">History</span>
          <h2 className="mb-4 text-lg font-extralight text-[var(--color-gsd-text)]">
            Your Recent Votes
          </h2>

          {votesLoading ? (
            <DashboardSkeleton />
          ) : votesData && votesData.votes.length > 0 ? (
            <div className="space-y-2">
              {votesData.votes.map((vote) => (
                <div
                  key={vote.id}
                  className="flex items-center justify-between rounded-xl glass-surface eluma-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-normal text-[var(--color-gsd-text)]">
                      {vote.idea.title}
                    </p>
                    <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                      Weight: {vote.weight}
                    </p>
                  </div>
                  <div className="text-right">
                    <VoteChoiceLabel vote={vote.vote} />
                    <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                      {new Date(vote.votedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {votesData.total > 10 && (
                <p className="pt-2 text-center text-xs font-light text-[var(--color-gsd-text-muted)]">
                  Showing 10 of {votesData.total} votes
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl glass-surface eluma-card px-6 py-8 text-center">
              <p className="text-sm font-light text-[var(--color-gsd-text-muted)]">
                No votes cast yet
              </p>
              <Link
                href="/governance/rounds"
                className="mt-2 inline-block text-xs font-light text-[var(--color-gsd-accent)] underline-offset-4 hover:underline cursor-pointer transition-colors"
              >
                Browse active rounds to vote
              </Link>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
