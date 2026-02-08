"use client";

import { useQuery } from "@tanstack/react-query";
import { ProfileCard } from "./profile-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Developer {
  walletAddress: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  onChainPda: string | null;
  createdAt: string;
}

interface DirectoryResponse {
  developers: Developer[];
  total: number;
  page: number;
  totalPages: number;
}

async function fetchDirectory(page: number): Promise<DirectoryResponse> {
  const res = await fetch(`/api/directory?page=${page}&limit=20`);
  if (!res.ok) {
    throw new Error("Failed to fetch directory");
  }
  return res.json();
}

interface DirectoryGridProps {
  initialData?: DirectoryResponse;
}

export function DirectoryGrid({ initialData }: DirectoryGridProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["directory", page],
    queryFn: () => fetchDirectory(page),
    initialData: page === 1 ? initialData : undefined,
    placeholderData: (previousData) => previousData,
  });

  // Loading skeleton
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-[var(--color-gsd-surface-raised)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-[var(--color-gsd-error)]/20 bg-[var(--color-gsd-error)]/5 p-8 text-center">
        <p className="text-[var(--color-gsd-error)]">
          Failed to load directory. Please try again later.
        </p>
      </div>
    );
  }

  const total = data?.total ?? 0;
  const developers = data?.developers ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Empty state
  if (total === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-12 text-center">
        <p className="text-lg font-medium text-[var(--color-gsd-text-secondary)]">
          Be the first to join.
        </p>
        <p className="mt-2 text-sm text-[var(--color-gsd-text-muted)]">
          Connect your wallet to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total count */}
      <p className="text-lg font-medium text-[var(--color-gsd-text-secondary)]">
        <span className="text-[var(--color-gsd-accent)] font-bold">{total}</span>{" "}
        {total === 1 ? "builder has" : "builders have"} joined the movement
      </p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {developers.map((dev) => (
          <ProfileCard key={dev.walletAddress} profile={dev} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--color-gsd-text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
