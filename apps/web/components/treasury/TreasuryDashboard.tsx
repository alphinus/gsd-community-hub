"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { TreasuryData, TreasuryBalance } from "@/lib/treasury/client";

// ---------------------------------------------------------------------------
// Revenue summary type (from /api/revenue/summary)
// ---------------------------------------------------------------------------

interface RevenueSummaryResponse {
  totalRevenue: string;
  totalDistributed: string;
  totalBurnAllocated: string;
  totalGsdBurned: string;
  eventCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSol(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function formatGsd(value: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

/** Format BigInt string amount: divide by 1e9 for SOL-scale amounts */
function formatBigAmount(raw: string): string {
  const num = Number(raw);
  if (Number.isNaN(num) || num === 0) return "0";
  return (num / 1e9).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 1000
  );
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

// ---------------------------------------------------------------------------
// Skeleton card (loading state)
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <div className="h-4 w-24 animate-shimmer-cyan rounded-xl" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 animate-shimmer-cyan rounded-xl" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Balance card
// ---------------------------------------------------------------------------

function BalanceCard({
  label,
  value,
  unit,
  icon,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  note?: string;
}) {
  return (
    <Card className="glass glow-cyan">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm font-medium text-[var(--color-gsd-text-muted)]">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="gradient-text-aurora text-3xl font-bold tracking-tight">
            {value}
          </span>
          <span className="text-sm text-[var(--color-gsd-text-muted)]">
            {unit}
          </span>
        </div>
        {note && (
          <p className="mt-2 text-xs text-[var(--color-gsd-text-muted)]">
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Stat card (smaller, for revenue summary section)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="glass-surface rounded-2xl px-4 py-3">
      <p className="text-xs font-medium text-[var(--color-gsd-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[var(--color-gsd-text)]">
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-[var(--color-gsd-text-muted)]">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SOL icon (inline SVG)
// ---------------------------------------------------------------------------

function SolIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="gradient-text-cyan text-[var(--color-gsd-accent)]"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function TokenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-gsd-gold)]"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-orange-400"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.5-2.26 1.5-3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TreasuryDashboardProps {
  initialBalance?: TreasuryBalance;
}

export function TreasuryDashboard({ initialBalance }: TreasuryDashboardProps) {
  // Existing treasury balance/transactions fetch
  const { data, isLoading, isError } = useQuery<TreasuryData>({
    queryKey: ["treasury"],
    queryFn: async () => {
      const res = await fetch("/api/treasury");
      if (!res.ok) throw new Error("Failed to fetch treasury data");
      return res.json();
    },
    refetchInterval: 30_000,
    initialData: initialBalance
      ? {
          balance: initialBalance,
          transactions: [],
          burnTotal: "0",
        }
      : undefined,
  });

  // Revenue summary fetch (real burn totals + revenue stats)
  const { data: revenueSummary } = useQuery<RevenueSummaryResponse>({
    queryKey: ["revenue-summary"],
    queryFn: async () => {
      const res = await fetch("/api/revenue/summary");
      if (!res.ok) throw new Error("Failed to fetch revenue summary");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-surface rounded-2xl border border-[var(--color-gsd-error)]/30 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
        Unable to load treasury data. Please try again later.
      </div>
    );
  }

  const balance = data?.balance;
  // Use real burn total from revenue summary; fall back to treasury data, then "0"
  const totalGsdBurned = revenueSummary?.totalGsdBurned ?? data?.burnTotal ?? "0";

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceCard
          label="SOL Balance"
          value={formatSol(balance?.solBalance ?? 0)}
          unit="SOL"
          icon={<SolIcon />}
        />
        <BalanceCard
          label="$GSD Balance"
          value={formatGsd(balance?.gsdBalance ?? "0")}
          unit="$GSD"
          icon={<TokenIcon />}
        />
        <BalanceCard
          label="Total Burned"
          value={formatBigAmount(totalGsdBurned)}
          unit="$GSD burned"
          icon={<FireIcon />}
        />
      </div>

      {/* Revenue Summary section */}
      {revenueSummary && revenueSummary.eventCount > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-gsd-accent)]">
            Revenue Summary
          </h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={formatBigAmount(revenueSummary.totalRevenue)}
            />
            <StatCard
              label="Distributed"
              value={formatBigAmount(revenueSummary.totalDistributed)}
            />
            <StatCard
              label="$GSD Burned"
              value={formatBigAmount(revenueSummary.totalGsdBurned)}
              unit="$GSD"
            />
            <StatCard
              label="Revenue Events"
              value={String(revenueSummary.eventCount)}
            />
          </div>
        </div>
      )}

      {balance?.lastUpdated && (
        <p className="text-xs text-[var(--color-gsd-text-muted)]">
          Last updated: {timeAgo(balance.lastUpdated)}
        </p>
      )}

      {data?.warning && (
        <p className="text-xs text-yellow-400/80">{data.warning}</p>
      )}
    </div>
  );
}
