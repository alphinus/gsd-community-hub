"use client";

/**
 * Paginated verification history list.
 *
 * Uses TanStack Query for data fetching with loading skeletons
 * following the ContributionList pattern. Each card links to
 * the full verification report page.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerificationScoreBadge } from "./VerificationScoreBadge";

interface VerificationReportSummary {
  id: string;
  walletAddress: string;
  taskRef: string;
  verificationType: string;
  overallScore: number;
  confidence: number;
  status: string;
  createdAt: string;
}

interface VerificationReportsResponse {
  reports: VerificationReportSummary[];
  total: number;
  page: number;
  limit: number;
}

interface VerificationHistoryProps {
  /** Optional wallet address to filter by */
  walletAddress?: string;
}

const PAGE_SIZE = 10;

function VerificationSkeleton() {
  return (
    <div className="animate-shimmer-cyan glass rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-4 w-40 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-5 w-16 rounded-full bg-[var(--color-gsd-surface-raised)]" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-20 rounded-full bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-3 w-16 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-3 w-12 rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
    </div>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function VerificationHistory({
  walletAddress,
}: VerificationHistoryProps) {
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (walletAddress) queryParams.set("wallet", walletAddress);

  const { data, isLoading, isError } = useQuery<VerificationReportsResponse>({
    queryKey: ["verifications", walletAddress, page],
    queryFn: async () => {
      const res = await fetch(`/api/verification/reports?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch verification reports");
      return res.json();
    },
    staleTime: 30_000,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasMore = page < totalPages;

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <VerificationSkeleton />
          <VerificationSkeleton />
          <VerificationSkeleton />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
          Unable to load verification reports. Please try again later.
        </div>
      )}

      {/* Empty state */}
      {data && data.reports.length === 0 && (
        <div className="glass rounded-2xl px-6 py-12 text-center">
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            No verifications yet
          </p>
        </div>
      )}

      {/* Report cards */}
      {data && data.reports.length > 0 && (
        <>
          <div className="space-y-3">
            {data.reports.map((report) => (
              <a
                key={report.id}
                href={`/verification/${report.id}`}
                className="block glass rounded-2xl p-4 cursor-pointer transition-theme duration-200 hover:border-[var(--color-gsd-accent)]/30 glow-cyan"
              >
                {/* Header: task ref + score */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--color-gsd-text)] break-all">
                    {report.taskRef}
                  </p>
                  <VerificationScoreBadge score={report.overallScore} size="sm" />
                </div>

                {/* Meta: type + status + date */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      report.verificationType === "ai" ? "default" : "secondary"
                    }
                  >
                    {report.verificationType === "ai" ? (
                      <>
                        <Shield className="mr-1 h-3 w-3" />
                        AI
                      </>
                    ) : (
                      <>
                        <Users className="mr-1 h-3 w-3" />
                        Peer
                      </>
                    )}
                  </Badge>

                  <Badge
                    variant={
                      report.status === "completed"
                        ? "success"
                        : report.status === "pending"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {report.status}
                  </Badge>

                  <span className="text-xs text-[var(--color-gsd-text-muted)]">
                    {relativeTime(report.createdAt)}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}

                >
                  Previous
                </Button>
              )}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => p + 1);
                  }}

                >
                  Load more
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
