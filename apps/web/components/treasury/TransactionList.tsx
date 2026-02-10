"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  explorerUrl,
  truncateAddress,
} from "@/lib/config/transparency-config";
import type { TreasuryData, TreasuryTransaction } from "@/lib/treasury/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000 - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatAmount(amount: number, token: string): string {
  if (token === "SOL") {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Flow icon (inflow/outflow arrows)
// ---------------------------------------------------------------------------

function FlowIcon({ type }: { type: "inflow" | "outflow" }) {
  if (type === "inflow") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-gsd-success)]"
      >
        <path d="M12 17V3" />
        <path d="m6 11 6 6 6-6" />
        <path d="M19 21H5" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-400"
    >
      <path d="M12 7v14" />
      <path d="m18 13-6-6-6 6" />
      <path d="M5 3h14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TransactionListProps {
  initialTransactions?: TreasuryTransaction[];
}

const PAGE_SIZE = 20;

export function TransactionList({
  initialTransactions,
}: TransactionListProps) {
  const { data, isLoading, isError } = useQuery<TreasuryData>({
    queryKey: ["treasury"],
    queryFn: async () => {
      const res = await fetch("/api/treasury");
      if (!res.ok) throw new Error("Failed to fetch treasury data");
      return res.json();
    },
    refetchInterval: 30_000,
    initialData: initialTransactions
      ? {
          balance: {
            solBalance: 0,
            gsdBalance: "0",
            lastUpdated: new Date().toISOString(),
          },
          transactions: initialTransactions,
          burnTotal: "0",
        }
      : undefined,
  });

  const transactions = data?.transactions ?? [];

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          {transactions.length > 0 && (
            <Badge variant="secondary">
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Treasury inflows and outflows. All transactions are verifiable
          on-chain.
        </p>
      </CardHeader>
      <CardContent>
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-gsd-accent)] border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
            Unable to load transaction history.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && transactions.length === 0 && (
          <div className="glass-surface rounded-2xl px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No treasury transactions yet.
            </p>
            <p className="mt-1 text-xs text-[var(--color-gsd-text-muted)]">
              Transactions will appear here once the treasury receives or sends
              funds.
            </p>
          </div>
        )}

        {/* Transaction list */}
        {transactions.length > 0 && (
          <div className="divide-y divide-[var(--color-gsd-border-subtle)]">
            {transactions.slice(0, PAGE_SIZE).map((tx, idx) => (
              <div
                key={`${tx.signature}-${idx}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* Direction icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-gsd-surface-raised)]">
                  <FlowIcon type={tx.type} />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        tx.type === "inflow"
                          ? "text-[var(--color-gsd-success)]"
                          : "text-red-400"
                      }`}
                    >
                      {tx.type === "inflow" ? "+" : "-"}
                      {formatAmount(tx.amount, tx.token)} {tx.token}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase"
                    >
                      {tx.type}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-[var(--color-gsd-text-muted)]">
                    {tx.description}
                  </p>
                </div>

                {/* Timestamp + explorer link */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-[var(--color-gsd-text-muted)]">
                    {relativeTime(tx.timestamp)}
                  </p>
                  <a
                    href={explorerUrl(tx.signature, "tx")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer font-mono text-[10px] text-[var(--color-gsd-accent)] underline-offset-4 transition-theme duration-200 hover:text-[var(--color-gsd-accent-hover)] hover:underline"
                  >
                    {truncateAddress(tx.signature, 4)}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more (if more than PAGE_SIZE) */}
        {transactions.length > PAGE_SIZE && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" size="sm" disabled>
              Showing first {PAGE_SIZE} transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
