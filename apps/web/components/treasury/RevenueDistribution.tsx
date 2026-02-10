"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  explorerUrl,
  truncateAddress,
} from "@/lib/config/transparency-config";

// ---------------------------------------------------------------------------
// Types (matching API response shape from /api/revenue/events)
// ---------------------------------------------------------------------------

interface RevenueEventResponse {
  id: string;
  eventIndex: number;
  token: string;
  totalAmount: string;
  developerPool: string;
  treasuryReserve: string;
  burnAmount: string;
  maintenanceAmount: string;
  status: string;
  originSignature: string;
  recordedAt: string;
  _count: { claims: number };
}

interface EventsApiResponse {
  events: RevenueEventResponse[];
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

function statusColor(status: string): "warning" | "default" | "success" {
  switch (status) {
    case "recorded":
      return "warning";
    case "distributing":
      return "default";
    case "completed":
      return "success";
    default:
      return "default";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "recorded":
      return "Recorded";
    case "distributing":
      return "Distributing";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-8 w-8 animate-shimmer-violet rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 animate-shimmer-violet rounded" />
        <div className="h-3 w-72 animate-shimmer-violet rounded" />
      </div>
      <div className="h-4 w-16 animate-shimmer-violet rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Split bar visualization
// ---------------------------------------------------------------------------

function SplitBar({ event }: { event: RevenueEventResponse }) {
  const total = Number(event.totalAmount);
  if (total === 0) return null;

  const dev = (Number(event.developerPool) / total) * 100;
  const treasury = (Number(event.treasuryReserve) / total) * 100;
  const burn = (Number(event.burnAmount) / total) * 100;
  const maint = (Number(event.maintenanceAmount) / total) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
        {dev > 0 && (
          <div
            className="h-full bg-[var(--color-gsd-accent)]"
            style={{ width: `${dev}%` }}
            title={`Developer ${dev.toFixed(0)}%`}
          />
        )}
        {treasury > 0 && (
          <div
            className="h-full bg-blue-500"
            style={{ width: `${treasury}%` }}
            title={`Treasury ${treasury.toFixed(0)}%`}
          />
        )}
        {burn > 0 && (
          <div
            className="h-full bg-orange-500"
            style={{ width: `${burn}%` }}
            title={`Burn ${burn.toFixed(0)}%`}
          />
        )}
        {maint > 0 && (
          <div
            className="h-full bg-[var(--color-gsd-accent-hover)]"
            style={{ width: `${maint}%` }}
            title={`Maintenance ${maint.toFixed(0)}%`}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--color-gsd-text-muted)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-gsd-accent)]" />
          Dev 60%: {formatAmount(event.developerPool, event.token)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Treasury 20%: {formatAmount(event.treasuryReserve, event.token)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          Burn 10%: {formatAmount(event.burnAmount, event.token)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-gsd-accent-hover)]" />
          Maint 10%: {formatAmount(event.maintenanceAmount, event.token)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 10;

export default function RevenueDistribution() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<EventsApiResponse>({
    queryKey: ["revenue-events", page],
    queryFn: async () => {
      const res = await fetch(
        `/api/revenue/events?page=${page}&limit=${PAGE_SIZE}`
      );
      if (!res.ok) throw new Error("Failed to fetch revenue events");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue Events</CardTitle>
          {total > 0 && (
            <Badge variant="secondary">
              {total} event{total !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          All revenue events with their 60/20/10/10 split breakdowns. Each event
          is traceable on-chain.
        </p>
      </CardHeader>
      <CardContent>
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
          <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
            Unable to load revenue events.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && events.length === 0 && (
          <div className="glass-surface rounded-2xl px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No revenue events yet.
            </p>
            <p className="mt-1 text-xs text-[var(--color-gsd-text-muted)]">
              Revenue events are recorded when the treasury receives income from
              the software. Each event splits funds: 60% to developers, 20% to
              treasury, 10% to burn, 10% to maintenance.
            </p>
          </div>
        )}

        {/* Event list */}
        {events.length > 0 && (
          <div className="divide-y divide-[var(--color-gsd-border-subtle)]">
            {events.map((event) => (
              <div key={event.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: index + token + amount */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-gsd-text)]">
                        #{event.eventIndex}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          event.token === "sol"
                            ? "bg-[var(--color-gsd-accent)]/15 text-[var(--color-gsd-accent-hover)]"
                            : "bg-blue-500/15 text-blue-400"
                        }
                      >
                        {tokenLabel(event.token)}
                      </Badge>
                      <Badge variant={statusColor(event.status)}>
                        {statusLabel(event.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-lg font-bold tracking-tight text-[var(--color-gsd-text)]">
                      {formatAmount(event.totalAmount, event.token)}{" "}
                      <span className="text-sm font-normal text-[var(--color-gsd-text-muted)]">
                        {tokenLabel(event.token)}
                      </span>
                    </p>
                    <SplitBar event={event} />
                  </div>

                  {/* Right: metadata */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[var(--color-gsd-text-muted)]">
                      {relativeDate(event.recordedAt)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-gsd-text-muted)]">
                      {event._count.claims} claim
                      {event._count.claims !== 1 ? "s" : ""}
                    </p>
                    <a
                      href={explorerUrl(event.originSignature, "tx")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block cursor-pointer font-mono text-[10px] text-[var(--color-gsd-accent)] underline-offset-4 transition-theme duration-200 hover:text-[var(--color-gsd-accent-hover)] hover:underline"
                    >
                      {truncateAddress(event.originSignature, 4)}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}

            >
              Previous
            </Button>
            <span className="text-xs text-[var(--color-gsd-text-muted)]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}

            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
