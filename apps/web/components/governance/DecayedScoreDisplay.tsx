"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { decayMultiplier, DECAY_HALF_LIFE_DAYS } from "@gsd/utils";

interface DecayedScoreDisplayProps {
  /** Pass wallet to fetch from API, or provide data directly */
  wallet?: string;
  originalScore?: string;
  decayedScore?: string;
  decayedTotal?: string;
}

interface DecayResponse {
  originalScore: string;
  decayedScore: string;
  decayedTotal: string;
  contributionCount: number;
}

function formatScore(scoreStr: string): string {
  try {
    const val = Number(BigInt(scoreStr));
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString();
  } catch {
    return "0";
  }
}

function decayPercentage(original: string, decayed: string): number {
  try {
    const o = Number(BigInt(original));
    const d = Number(BigInt(decayed));
    if (o === 0) return 0;
    return Math.round(((o - d) / o) * 100);
  } catch {
    return 0;
  }
}

function effectivePercent(original: string, decayed: string): number {
  try {
    const o = Number(BigInt(original));
    const d = Number(BigInt(decayed));
    if (o === 0) return 100;
    return Math.round((d / o) * 100);
  } catch {
    return 100;
  }
}

export function DecayedScoreDisplay({
  wallet,
  originalScore: originalProp,
  decayedScore: decayedProp,
  decayedTotal: decayedTotalProp,
}: DecayedScoreDisplayProps) {
  const [showProjections, setShowProjections] = useState(false);

  // Fetch from API if wallet provided and no direct data
  const { data, isLoading, isError } = useQuery<DecayResponse>({
    queryKey: ["decay-score", wallet],
    queryFn: async () => {
      const res = await fetch("/api/governance/decay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      if (!res.ok) throw new Error("Failed to fetch decay score");
      return res.json();
    },
    enabled: !!wallet && originalProp === undefined,
    staleTime: 60_000,
  });

  const originalScore = originalProp ?? data?.originalScore ?? "0";
  const decayedScore = decayedProp ?? data?.decayedScore ?? "0";
  const decayedTotal = decayedTotalProp ?? data?.decayedTotal ?? "0";

  if (isLoading) {
    return (
      <div className="animate-shimmer-cyan glass rounded-2xl p-4">
        <div className="mb-2 h-4 w-32 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-8 w-24 rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
        Unable to load decay score.
      </div>
    );
  }

  const decayPct = decayPercentage(originalScore, decayedScore);
  const effectivePct = effectivePercent(originalScore, decayedScore);

  // Projected scores at 30/60/90 days using decayMultiplier from @gsd/utils
  const projections = [30, 60, 90].map((days) => {
    const multiplier = decayMultiplier(days, DECAY_HALF_LIFE_DAYS);
    try {
      const currentDecayed = Number(BigInt(decayedTotal));
      const projectedTotal = Math.round(currentDecayed * multiplier);
      return {
        days,
        multiplier: Math.round(multiplier * 100),
        projectedTotal: projectedTotal.toLocaleString(),
      };
    } catch {
      return { days, multiplier: Math.round(multiplier * 100), projectedTotal: "0" };
    }
  });

  return (
    <div className="glass rounded-2xl p-4 transition-theme duration-200">
      <p className="mb-3 text-xs font-medium text-[var(--color-gsd-text-muted)]">
        Contribution Score (with {DECAY_HALF_LIFE_DAYS}-day decay)
      </p>

      {/* Score comparison */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            Base Score
          </span>
          <span className="text-lg font-semibold text-[var(--color-gsd-text)]">
            {formatScore(originalScore)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            Effective Score
          </span>
          <span className="text-lg font-bold gradient-text-cyan">
            {formatScore(decayedScore)}
          </span>
        </div>
      </div>

      {/* Decay bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--color-gsd-text-muted)]">
          <span>Effective: {effectivePct}%</span>
          <span>Decayed: {decayPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
          <div
            className="h-full rounded-full gradient-cyan transition-theme duration-200"
            style={{ width: `${effectivePct}%` }}
          />
        </div>
      </div>

      {/* Projections toggle */}
      <button
        onClick={() => setShowProjections(!showProjections)}
        className="mt-3 cursor-pointer text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline transition-theme duration-200"
      >
        {showProjections ? "Hide projections" : "Show 30/60/90 day projections"}
      </button>

      {showProjections && (
        <div className="mt-2 space-y-1">
          {projections.map((p) => (
            <div
              key={p.days}
              className="flex items-center justify-between text-xs text-[var(--color-gsd-text-muted)]"
            >
              <span>+{p.days} days</span>
              <span>
                ~{p.projectedTotal} ({p.multiplier}% of current)
              </span>
            </div>
          ))}
          <p className="mt-1 text-[10px] text-[var(--color-gsd-text-muted)]">
            Complete new verified tasks to maintain your effective score.
          </p>
        </div>
      )}
    </div>
  );
}
