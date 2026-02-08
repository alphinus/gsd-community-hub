"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  explorerUrl,
  truncateAddress,
} from "@/lib/config/transparency-config";

// ---------------------------------------------------------------------------
// Types (matching API response shape from /api/revenue/claims)
// ---------------------------------------------------------------------------

interface RevenueClaimResponse {
  id: string;
  claimantWallet: string;
  revenueEventId: string;
  contributionScore: string;
  totalScore: string;
  amount: string;
  claimedAt: string;
  transactionSignature: string;
  revenueEvent: {
    eventIndex: number;
    token: string;
    totalAmount: string;
  };
}

interface ClaimsApiResponse {
  claims: RevenueClaimResponse[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(raw: string, token: string): string {
  const num = Number(raw);
  if (Number.isNaN(num) || num === 0) return "0";
  const divisor = token === "sol" ? 1e9 : 1e6;
  const decimals = token === "sol" ? 4 : 2;
  return (num / divisor).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function tokenLabel(token: string): string {
  return token === "sol" ? "SOL" : "USDC";
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scorePercentage(score: string, total: string): string {
  const s = Number(score);
  const t = Number(total);
  if (t === 0) return "0%";
  return ((s / t) * 100).toFixed(2) + "%";
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 animate-pulse rounded bg-[var(--color-gsd-border-subtle)]" />
        <div className="h-3 w-56 animate-pulse rounded bg-[var(--color-gsd-border-subtle)]" />
      </div>
      <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-gsd-border-subtle)]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wallet icon
// ---------------------------------------------------------------------------

function WalletIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-gsd-text-muted)]"
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ClaimPanel() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();

  const { data, isLoading, isError } = useQuery<ClaimsApiResponse>({
    queryKey: ["revenue-claims", wallet],
    queryFn: async () => {
      const res = await fetch(`/api/revenue/claims?wallet=${wallet}`);
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
    enabled: !!wallet,
    refetchInterval: 30_000,
  });

  const claims = data?.claims ?? [];

  // Calculate total claimed amount per token type
  const totalClaimed = claims.reduce(
    (acc, claim) => {
      const token = claim.revenueEvent.token;
      const amount = Number(claim.amount);
      acc[token] = (acc[token] ?? 0) + amount;
      return acc;
    },
    {} as Record<string, number>
  );

  // Not connected state
  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-6 py-12 text-center">
            <WalletIcon />
            <p className="mt-3 text-sm text-[var(--color-gsd-text-muted)]">
              Connect your wallet to view your revenue claims.
            </p>
            <p className="mt-1 text-xs text-[var(--color-gsd-text-muted)]">
              Revenue claims show your share of developer pool distributions
              based on your contribution score.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Claims</CardTitle>
          {claims.length > 0 && (
            <Badge variant="secondary">
              {claims.length} claim{claims.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Your revenue share claims based on contribution scores.
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary card */}
        {claims.length > 0 && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs font-medium text-emerald-400">
              Total Claimed
            </p>
            <div className="mt-1 flex flex-wrap gap-3">
              {Object.entries(totalClaimed).map(([token, rawAmount]) => {
                const divisor = token === "sol" ? 1e9 : 1e6;
                const decimals = token === "sol" ? 4 : 2;
                const formatted = (rawAmount / divisor).toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  }
                );
                return (
                  <span
                    key={token}
                    className="text-lg font-bold text-[var(--color-gsd-text)]"
                  >
                    {formatted}{" "}
                    <span className="text-sm font-normal text-[var(--color-gsd-text-muted)]">
                      {tokenLabel(token)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-[var(--color-gsd-border-subtle)]">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
            Unable to load claim history.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && claims.length === 0 && (
          <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No revenue claims yet.
            </p>
            <p className="mt-1 text-xs text-[var(--color-gsd-text-muted)]">
              Claims become available when revenue events are recorded and your
              contribution score is registered.
            </p>
          </div>
        )}

        {/* Claims list */}
        {claims.length > 0 && (
          <div className="divide-y divide-[var(--color-gsd-border-subtle)]">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                {/* Left: event context + amount */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-gsd-text)]">
                      Event #{claim.revenueEvent.eventIndex}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        claim.revenueEvent.token === "sol"
                          ? "bg-violet-500/15 text-violet-400"
                          : "bg-blue-500/15 text-blue-400"
                      }
                    >
                      {tokenLabel(claim.revenueEvent.token)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-lg font-bold tracking-tight text-emerald-400">
                    +{formatAmount(claim.amount, claim.revenueEvent.token)}{" "}
                    <span className="text-sm font-normal text-[var(--color-gsd-text-muted)]">
                      {tokenLabel(claim.revenueEvent.token)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-gsd-text-muted)]">
                    Score: {claim.contributionScore} / {claim.totalScore} (
                    {scorePercentage(
                      claim.contributionScore,
                      claim.totalScore
                    )}
                    )
                  </p>
                </div>

                {/* Right: date + explorer link */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-[var(--color-gsd-text-muted)]">
                    {relativeDate(claim.claimedAt)}
                  </p>
                  <a
                    href={explorerUrl(claim.transactionSignature, "tx")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-mono text-[10px] text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
                  >
                    {truncateAddress(claim.transactionSignature, 4)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
