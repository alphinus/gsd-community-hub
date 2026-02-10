"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/config/transparency-config";

type RoundStatus = "open" | "voting" | "closed";

interface IdeaData {
  id: string;
  ideaIndex: number;
  onChainAddress: string;
  roundId: string;
  authorWallet: string;
  title: string;
  description: string;
  status: string;
  yesWeight: string;
  noWeight: string;
  abstainWeight: string;
  voterCount: number;
  submittedAt: string;
  _count?: { votes: number };
}

interface IdeasResponse {
  ideas: IdeaData[];
  total: number;
  page: number;
  limit: number;
}

interface IdeaListProps {
  roundId: string;
  roundStatus: RoundStatus;
}

type SortOption = "newest" | "most_votes";

const PAGE_SIZE = 10;

function IdeaSkeleton() {
  return (
    <div className="animate-shimmer-violet glass rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="h-5 w-64 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-4 w-20 rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
      <div className="mb-3 h-4 w-32 rounded bg-[var(--color-gsd-surface-raised)]" />
      <div className="h-3 w-full rounded-full bg-[var(--color-gsd-surface-raised)]" />
    </div>
  );
}

/**
 * Parse a BigInt weight string to a number for display purposes.
 * Returns 0 if the value can't be parsed.
 */
function weightToNumber(w: string): number {
  try {
    return Number(BigInt(w));
  } catch {
    return 0;
  }
}

/**
 * Vote tally bar showing proportional Yes/No/Abstain distribution.
 */
function VoteTallyBar({
  yesWeight,
  noWeight,
  abstainWeight,
}: {
  yesWeight: string;
  noWeight: string;
  abstainWeight: string;
}) {
  const yes = weightToNumber(yesWeight);
  const no = weightToNumber(noWeight);
  const abstain = weightToNumber(abstainWeight);
  const total = yes + no + abstain;

  if (total === 0) {
    return (
      <div className="h-2 w-full rounded-full bg-[var(--color-gsd-surface-raised)]" />
    );
  }

  const yPct = (yes / total) * 100;
  const nPct = (no / total) * 100;
  const aPct = (abstain / total) * 100;

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
      {yPct > 0 && (
        <div
          className="h-full bg-[var(--color-gsd-success)] transition-theme duration-200"
          style={{ width: `${yPct}%` }}
        />
      )}
      {nPct > 0 && (
        <div
          className="h-full bg-[var(--color-gsd-error)] transition-theme duration-200"
          style={{ width: `${nPct}%` }}
        />
      )}
      {aPct > 0 && (
        <div
          className="h-full bg-[var(--color-gsd-text-muted)] transition-theme duration-200"
          style={{ width: `${aPct}%` }}
        />
      )}
    </div>
  );
}

function IdeaCard({ idea }: { idea: IdeaData }) {
  const yes = weightToNumber(idea.yesWeight);
  const no = weightToNumber(idea.noWeight);
  const abstain = weightToNumber(idea.abstainWeight);
  const total = yes + no + abstain;

  return (
    <div className="glass rounded-2xl p-4 transition-theme duration-200 hover:glow-violet">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-[var(--color-gsd-text)]">
          {idea.title}
        </h3>
        <span className="shrink-0 rounded-xl bg-[var(--color-gsd-surface-raised)] px-2 py-0.5 text-xs text-[var(--color-gsd-text-muted)]">
          {idea.status}
        </span>
      </div>

      <p className="mb-3 line-clamp-2 text-xs text-[var(--color-gsd-text-muted)]">
        {idea.description}
      </p>

      <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-gsd-text-muted)]">
        <span>by {truncateAddress(idea.authorWallet)}</span>
        <span>{idea.voterCount} {idea.voterCount === 1 ? "voter" : "voters"}</span>
      </div>

      <VoteTallyBar
        yesWeight={idea.yesWeight}
        noWeight={idea.noWeight}
        abstainWeight={idea.abstainWeight}
      />

      {total > 0 && (
        <div className="mt-1.5 flex items-center gap-3 text-xs">
          <span className="text-[var(--color-gsd-success)]">Yes {yes}</span>
          <span className="text-[var(--color-gsd-error)]">No {no}</span>
          <span className="text-[var(--color-gsd-text-muted)]">Abstain {abstain}</span>
        </div>
      )}
    </div>
  );
}

export function IdeaList({ roundId, roundStatus }: IdeaListProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("newest");

  const { data, isLoading, isError } = useQuery<IdeasResponse>({
    queryKey: ["ideas", roundId, page, sort],
    queryFn: async () => {
      const res = await fetch(
        `/api/governance/rounds/${roundId}/ideas?page=${page}&limit=${PAGE_SIZE}&sort=${sort}`
      );
      if (!res.ok) throw new Error("Failed to fetch ideas");
      return res.json();
    },
    staleTime: 30_000,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasMore = page < totalPages;

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-gsd-text-muted)]">
          Sort by:
        </span>
        <button
          onClick={() => {
            setSort("newest");
            setPage(1);
          }}
          className={`cursor-pointer rounded-xl px-2.5 py-1 text-xs font-medium transition-theme duration-200 ${
            sort === "newest"
              ? "bg-[var(--color-gsd-accent)] text-[var(--color-gsd-bg)]"
              : "text-[var(--color-gsd-text-muted)] hover:text-[var(--color-gsd-text)]"
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => {
            setSort("most_votes");
            setPage(1);
          }}
          className={`cursor-pointer rounded-xl px-2.5 py-1 text-xs font-medium transition-theme duration-200 ${
            sort === "most_votes"
              ? "bg-[var(--color-gsd-accent)] text-[var(--color-gsd-bg)]"
              : "text-[var(--color-gsd-text-muted)] hover:text-[var(--color-gsd-text)]"
          }`}
        >
          Most Votes
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <IdeaSkeleton />
          <IdeaSkeleton />
          <IdeaSkeleton />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-2xl border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
          Unable to load ideas. Please try again later.
        </div>
      )}

      {/* Empty state */}
      {data && data.ideas.length === 0 && (
        <div className="glass rounded-2xl px-6 py-12 text-center">
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            {roundStatus === "open"
              ? "No ideas submitted yet. Be the first!"
              : "No ideas were submitted to this round."}
          </p>
        </div>
      )}

      {/* Idea cards */}
      {data && data.ideas.length > 0 && (
        <>
          <div className="space-y-3">
            {data.ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
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
