"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  explorerUrl,
  truncateAddress,
} from "@/lib/config/transparency-config";

// ---------------------------------------------------------------------------
// Types (matching API response shape from /api/revenue/burns)
// ---------------------------------------------------------------------------

interface BurnEventResponse {
  eventIndex: number;
  token: string;
  burnAmount: string;
  burnSignature: string | null;
  gsdBurned: string;
  originSignature: string;
  recordedAt: string;
}

interface BurnsApiResponse {
  burns: BurnEventResponse[];
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

/** Format $GSD burned amount (9 decimals like SOL for SPL token) */
function formatGsd(raw: string): string {
  const num = Number(raw);
  if (Number.isNaN(num) || num === 0) return "0";
  return (num / 1e9).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function FireIcon({ className }: { className?: string }) {
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
      className={className ?? "text-orange-400"}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.5-2.26 1.5-3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--color-gsd-text-muted)]"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-8 w-8 animate-shimmer-violet rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 animate-shimmer-violet rounded" />
        <div className="h-3 w-64 animate-shimmer-violet rounded" />
      </div>
      <div className="h-4 w-20 animate-shimmer-violet rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BurnHistory() {
  const { data, isLoading, isError } = useQuery<BurnsApiResponse>({
    queryKey: ["revenue-burns"],
    queryFn: async () => {
      const res = await fetch("/api/revenue/burns?limit=50");
      if (!res.ok) throw new Error("Failed to fetch burn history");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const burns = data?.burns ?? [];
  const total = data?.total ?? 0;

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FireIcon className="text-orange-400" />
            <CardTitle>Burn History</CardTitle>
          </div>
          {total > 0 && (
            <Badge variant="secondary">
              {total} burn{total !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Every $GSD burn with full traceability back to the originating revenue
          event.
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
            Unable to load burn history.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && burns.length === 0 && (
          <div className="glass-surface rounded-2xl px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-400/10">
              <FireIcon className="text-orange-400" />
            </div>
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No burns recorded yet.
            </p>
            <p className="mt-1 text-xs text-[var(--color-gsd-text-muted)]">
              Burns are triggered automatically when revenue events are
              processed. 10% of each revenue event is used to buy and burn $GSD
              tokens.
            </p>
          </div>
        )}

        {/* Burn list */}
        {burns.length > 0 && (
          <div className="divide-y divide-[var(--color-gsd-border-subtle)]">
            {burns.map((burn, idx) => (
              <div
                key={`${burn.eventIndex}-${idx}`}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: event ref + conversion */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        Event #{burn.eventIndex}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          burn.token === "sol"
                            ? "bg-[var(--color-gsd-accent)]/15 text-[var(--color-gsd-accent-hover)]"
                            : "bg-blue-500/15 text-blue-400"
                        }
                      >
                        {tokenLabel(burn.token)}
                      </Badge>
                    </div>

                    {/* Conversion visualization */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-gsd-text)]">
                        {formatAmount(burn.burnAmount, burn.token)}{" "}
                        {tokenLabel(burn.token)}
                      </span>
                      <ArrowRightIcon />
                      <span className="text-sm font-bold text-orange-400">
                        {formatGsd(burn.gsdBurned)} $GSD
                      </span>
                      <FireIcon className="text-red-500" />
                    </div>

                    {/* Explorer links */}
                    <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                      {burn.burnSignature && (
                        <a
                          href={explorerUrl(burn.burnSignature, "tx")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer font-mono text-orange-400/80 underline-offset-4 transition-theme duration-200 hover:underline"
                        >
                          Burn tx: {truncateAddress(burn.burnSignature, 4)}
                        </a>
                      )}
                      <a
                        href={explorerUrl(burn.originSignature, "tx")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer font-mono text-[var(--color-gsd-accent)] underline-offset-4 transition-theme duration-200 hover:text-[var(--color-gsd-accent-hover)] hover:underline"
                      >
                        Origin tx: {truncateAddress(burn.originSignature, 4)}
                      </a>
                    </div>
                  </div>

                  {/* Right: date */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[var(--color-gsd-text-muted)]">
                      {relativeDate(burn.recordedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
