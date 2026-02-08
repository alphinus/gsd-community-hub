"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface DepositInfo {
  walletAddress: string;
  depositedAmount: string;
  depositTimestamp: string;
  eligibleAt: string;
  activeVotes: number;
}

interface VotingPowerDisplayProps {
  wallet: string;
}

function VotingPowerSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
      <div className="mb-2 h-4 w-24 rounded bg-[var(--color-gsd-surface-raised)]" />
      <div className="h-8 w-16 rounded bg-[var(--color-gsd-surface-raised)]" />
    </div>
  );
}

export function VotingPowerDisplay({ wallet }: VotingPowerDisplayProps) {
  const { data, isLoading, isError } = useQuery<{
    deposit: DepositInfo | null;
    isEligible: boolean;
  }>({
    queryKey: ["deposit", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/governance/deposit?wallet=${wallet}`);
      if (!res.ok) throw new Error("Failed to fetch deposit");
      return res.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) return <VotingPowerSkeleton />;

  if (isError) {
    return (
      <div className="rounded-lg border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
        Unable to load voting power.
      </div>
    );
  }

  const deposit = data?.deposit;
  const isEligible = data?.isEligible ?? false;

  if (!deposit) {
    return (
      <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
        <p className="mb-2 text-xs font-medium text-[var(--color-gsd-text-muted)]">
          Voting Power
        </p>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          No tokens deposited
        </p>
        <Link
          href="/governance/deposit"
          className="mt-2 inline-block text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
        >
          Deposit tokens to vote
        </Link>
      </div>
    );
  }

  const formattedAmount = (
    Number(BigInt(deposit.depositedAmount)) / 1e9
  ).toFixed(2);

  return (
    <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
      <p className="mb-1 text-xs font-medium text-[var(--color-gsd-text-muted)]">
        Voting Power
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
          {formattedAmount}
        </span>
        <span className="text-xs text-[var(--color-gsd-text-muted)]">$GSD</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-gsd-text-muted)]">
        <span
          className={
            isEligible
              ? "text-emerald-500"
              : "text-amber-500"
          }
        >
          {isEligible ? "Eligible" : "Timelock active"}
        </span>
        <span>{deposit.activeVotes} active votes</span>
      </div>
    </div>
  );
}
