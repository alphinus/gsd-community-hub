"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { VotingPowerDisplay } from "@/components/governance/VotingPowerDisplay";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-gsd-text)]">
        Governance Dashboard
      </h1>

      {/* Voting power */}
      <div className="mb-6">
        <VotingPowerDisplay wallet={wallet} />
      </div>

      {/* Quick links */}
      <div className="mb-8 grid grid-cols-3 gap-3">
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
          href="/governance"
          className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4 text-center transition-colors hover:border-[var(--color-gsd-accent)]/50"
        >
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            Overview
          </p>
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            How it works
          </p>
        </Link>
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
