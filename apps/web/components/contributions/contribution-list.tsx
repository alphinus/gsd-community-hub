"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ContributionCard } from "./contribution-card";
import { useState } from "react";

interface Contribution {
  id: string;
  walletAddress: string;
  taskRef: string;
  verificationScore: number;
  contentHash: string;
  leafHash: string;
  leafIndex: number;
  treeAddress: string;
  transactionSignature: string;
  description: string | null;
  createdAt: string;
}

interface ContributionsResponse {
  contributions: Contribution[];
  total: number;
  page: number;
  limit: number;
  summary: {
    tasksCompleted: number;
    averageVerificationScore: number;
  };
}

interface ContributionListProps {
  walletAddress: string;
  /** Initial contributions from server-side rendering */
  initialData?: ContributionsResponse;
}

const PAGE_SIZE = 10;

/**
 * Loading skeleton for contribution cards while data is being fetched.
 */
function ContributionSkeleton() {
  return (
    <div className="animate-shimmer-cyan glass rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-4 w-48 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-3 w-16 rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
      <div className="mb-3">
        <div className="mb-1 flex justify-between">
          <div className="h-3 w-24 rounded bg-[var(--color-gsd-surface-raised)]" />
          <div className="h-3 w-10 rounded bg-[var(--color-gsd-surface-raised)]" />
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--color-gsd-surface-raised)]" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-3 w-32 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-3 w-20 rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
    </div>
  );
}

export function ContributionList({
  walletAddress,
  initialData,
}: ContributionListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<ContributionsResponse>({
    queryKey: ["contributions", walletAddress, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/contributions/${walletAddress}?page=${page}&limit=${PAGE_SIZE}`
      );
      if (!res.ok) throw new Error("Failed to fetch contributions");
      return res.json();
    },
    initialData: page === 1 ? initialData : undefined,
    staleTime: 30_000, // 30 seconds
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasMore = page < totalPages;

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <ContributionSkeleton />
          <ContributionSkeleton />
          <ContributionSkeleton />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
          Unable to load contributions. Please try again later.
        </div>
      )}

      {/* Empty state */}
      {data && data.contributions.length === 0 && (
        <div className="glass rounded-2xl px-6 py-12 text-center">
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            No contributions recorded yet
          </p>
        </div>
      )}

      {/* Contribution cards */}
      {data && data.contributions.length > 0 && (
        <>
          <div className="space-y-3">
            {data.contributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
              />
            ))}
          </div>

          {/* Pagination controls */}
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}

                >
                  Previous
                </Button>
              )}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}

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
