"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DelegateCard } from "@/components/governance/DelegateCard";

type SortField = "delegatorCount" | "totalDelegated";

interface TopDelegate {
  wallet: string;
  delegatorCount: number;
}

interface AnalyticsResponse {
  delegationStats: {
    totalActiveDelegations: number;
    totalDelegatedTokens: string;
    topDelegates: TopDelegate[];
  };
}

function DirectorySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer-violet glass rounded-2xl p-6"
        >
          <div className="mb-3 h-4 w-28 rounded bg-[var(--color-gsd-surface-raised)]" />
          <div className="h-6 w-20 rounded bg-[var(--color-gsd-surface-raised)]" />
        </div>
      ))}
    </div>
  );
}

export function DelegateDirectory() {
  const [sortBy, setSortBy] = useState<SortField>("delegatorCount");

  const { data, isLoading, isError } = useQuery<AnalyticsResponse>({
    queryKey: ["governance-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/governance/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) return <DirectorySkeleton />;

  if (isError) {
    return (
      <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
        Unable to load delegate directory.
      </div>
    );
  }

  const topDelegates = data?.delegationStats?.topDelegates ?? [];

  if (topDelegates.length === 0) {
    return (
      <div className="glass rounded-2xl px-6 py-12 text-center">
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          No active delegates yet. Be the first to receive delegation.
        </p>
      </div>
    );
  }

  const sorted = [...topDelegates].sort((a, b) => {
    if (sortBy === "delegatorCount") {
      return b.delegatorCount - a.delegatorCount;
    }
    // Sort by delegator count as proxy for total delegated when we only have count
    return b.delegatorCount - a.delegatorCount;
  });

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-gsd-text-muted)]">
          Sort by:
        </span>
        <button
          onClick={() => setSortBy("delegatorCount")}
          className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-medium transition-theme duration-200 ${
            sortBy === "delegatorCount"
              ? "bg-[var(--color-gsd-accent)] text-[var(--color-gsd-bg)]"
              : "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text-muted)] hover:text-[var(--color-gsd-text)]"
          }`}
        >
          Delegator Count
        </button>
        <button
          onClick={() => setSortBy("totalDelegated")}
          className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-medium transition-theme duration-200 ${
            sortBy === "totalDelegated"
              ? "bg-[var(--color-gsd-accent)] text-[var(--color-gsd-bg)]"
              : "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text-muted)] hover:text-[var(--color-gsd-text)]"
          }`}
        >
          Total Delegated
        </button>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-gsd-text-muted)]">
        <span>
          {data?.delegationStats.totalActiveDelegations ?? 0} active delegations
        </span>
        <span>
          {(
            Number(BigInt(data?.delegationStats.totalDelegatedTokens ?? "0")) /
            1e9
          ).toFixed(2)}{" "}
          $GSD delegated
        </span>
      </div>

      {/* Delegate grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((d) => (
          <DelegateCard
            key={d.wallet}
            delegate={d.wallet}
            delegatorCount={d.delegatorCount}
            totalDelegated="0"
            isVerified={false}
          />
        ))}
      </div>
    </div>
  );
}
