"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { explorerUrl, truncateAddress } from "@/lib/config/transparency-config";

interface ContributionCardProps {
  contribution: {
    id: string;
    taskRef: string;
    verificationScore: number;
    contentHash: string;
    transactionSignature: string;
    description: string | null;
    createdAt: string;
  };
}

/**
 * Get the color class for a verification score.
 * Green > 80%, Yellow 50-80%, Red < 50%
 * Score is on 0-10000 scale (0.00%-100.00%)
 */
function getScoreColor(score: number): string {
  const pct = score / 100;
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Get a human-readable relative time string.
 */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

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

export function ContributionCard({ contribution }: ContributionCardProps) {
  const [copied, setCopied] = useState(false);
  const scorePct = (contribution.verificationScore / 100).toFixed(1);
  const scoreWidth = Math.min(100, contribution.verificationScore / 100);
  const scoreColor = getScoreColor(contribution.verificationScore);

  function handleCopyHash() {
    navigator.clipboard.writeText(contribution.contentHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Truncate taskRef for display (it's a 64-char hex hash)
  const taskDisplay = contribution.description
    ? contribution.description
    : `${contribution.taskRef.slice(0, 8)}...${contribution.taskRef.slice(-8)}`;

  const txExplorerUrl = explorerUrl(contribution.transactionSignature, "tx");

  return (
    <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] p-4">
      {/* Header: task ref + timestamp */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-gsd-text)] break-all">
          {taskDisplay}
        </p>
        <span className="shrink-0 text-xs text-[var(--color-gsd-text-muted)]">
          {relativeTime(contribution.createdAt)}
        </span>
      </div>

      {/* Verification score bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            Verification Score
          </span>
          <span className="text-xs font-medium text-[var(--color-gsd-text-secondary)]">
            {scorePct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
          <div
            className={`h-full rounded-full transition-all ${scoreColor}`}
            style={{ width: `${scoreWidth}%` }}
          />
        </div>
      </div>

      {/* Content hash + verify on-chain */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            Hash:
          </span>
          <code className="font-mono text-xs text-[var(--color-gsd-text-secondary)]">
            {truncateAddress(contribution.contentHash, 6)}
          </code>
          <button
            onClick={handleCopyHash}
            className="inline-flex h-5 w-5 items-center justify-center text-[var(--color-gsd-text-muted)] transition-colors hover:text-[var(--color-gsd-text)]"
            title="Copy content hash"
          >
            {copied ? (
              <Check className="h-3 w-3 text-[var(--color-gsd-success)]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>

        <a
          href={txExplorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
        >
          Verify on-chain
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
