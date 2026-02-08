"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { TreasuryData, TreasuryBalance } from "@/lib/treasury/client";

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
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-gsd-border-subtle)]" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 animate-pulse rounded bg-[var(--color-gsd-border-subtle)]" />
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
    <Card>
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
          <span className="text-3xl font-bold tracking-tight text-[var(--color-gsd-text)]">
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
      className="text-[var(--color-gsd-accent)]"
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
      className="text-emerald-400"
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

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
        Unable to load treasury data. Please try again later.
      </div>
    );
  }

  const balance = data?.balance;
  const burnTotal = data?.burnTotal ?? "0";

  return (
    <div className="space-y-3">
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
          value={formatGsd(burnTotal)}
          unit="$GSD"
          icon={<FireIcon />}
          note="Coming in Phase 4"
        />
      </div>

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
