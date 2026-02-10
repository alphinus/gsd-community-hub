/**
 * Review consensus progress visualization.
 *
 * Shows:
 * - Progress bar of reviews submitted vs required
 * - Tier-weighted visualization of each reviewer
 * - Pass/fail ratio bar
 * - Status text indicating consensus state
 */

import type { PeerReviewInfo, ReviewerTier } from "@gsd/types";
import { ReviewerTierBadge } from "./ReviewerTierBadge";

interface ReviewConsensusProgressProps {
  reviews: PeerReviewInfo[];
  minReviewers: number;
  consensusThreshold: number;
}

/** Tier weights matching review constants */
const TIER_WEIGHTS: Record<ReviewerTier, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
};

export function ReviewConsensusProgress({
  reviews,
  minReviewers,
  consensusThreshold,
}: ReviewConsensusProgressProps) {
  const submitted = reviews.length;
  const required = Math.max(minReviewers, 1);
  const progressPct = Math.min(100, (submitted / required) * 100);

  // Calculate weighted consensus
  let totalWeight = 0;
  let passWeight = 0;
  let failWeight = 0;

  for (const review of reviews) {
    const w = TIER_WEIGHTS[review.tier] ?? 1;
    totalWeight += w;
    if (review.passed) {
      passWeight += w;
    } else {
      failWeight += w;
    }
  }

  const passRatio = totalWeight > 0 ? passWeight / totalWeight : 0;
  const failRatio = totalWeight > 0 ? failWeight / totalWeight : 0;
  const hasConsensus =
    submitted >= required &&
    (passRatio >= consensusThreshold || failRatio >= consensusThreshold);
  const consensusPassed = passRatio >= failRatio;

  // Status text
  let statusText: string;
  let statusColor: string;
  if (hasConsensus) {
    statusText = consensusPassed
      ? "Consensus reached: Passed"
      : "Consensus reached: Failed";
    statusColor = consensusPassed
      ? "text-[var(--color-gsd-success)]"
      : "text-[var(--color-gsd-error)]";
  } else {
    statusText = `${submitted}/${required} reviews submitted`;
    statusColor = "text-[var(--color-gsd-text-muted)]";
  }

  return (
    <div className="space-y-4">
      {/* Progress: reviews submitted */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--color-gsd-text-muted)]">
            Review Progress
          </span>
          <span className={`text-xs font-semibold ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
          <div
            className="h-full rounded-full bg-[var(--color-gsd-accent)] transition-theme"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tier-weighted reviewer blocks */}
      {reviews.length > 0 && (
        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--color-gsd-text-muted)]">
            Reviewers
          </span>
          <div className="flex flex-wrap gap-2">
            {reviews.map((review, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2 transition-theme duration-200 ${
                  review.passed
                    ? "border-[var(--color-gsd-accent)]/20 bg-[var(--color-gsd-accent)]/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <ReviewerTierBadge tier={review.tier} size="sm" />
                <span
                  className={`text-xs font-medium ${
                    review.passed
                      ? "text-[var(--color-gsd-success)]"
                      : "text-[var(--color-gsd-error)]"
                  }`}
                >
                  {review.passed ? "Pass" : "Fail"}
                </span>
                <span className="text-xs text-[var(--color-gsd-text-muted)]">
                  ({TIER_WEIGHTS[review.tier]}x)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pass/fail ratio bar */}
      {reviews.length > 0 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-[var(--color-gsd-text-muted)]">
            Weighted Agreement
          </span>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {passWeight > 0 && (
              <div
                className="h-full bg-[var(--color-gsd-accent)] transition-theme"
                style={{ width: `${passRatio * 100}%` }}
              />
            )}
            {failWeight > 0 && (
              <div
                className="h-full bg-red-500 transition-theme"
                style={{ width: `${failRatio * 100}%` }}
              />
            )}
            {totalWeight === 0 && (
              <div className="h-full w-full bg-[var(--color-gsd-surface-raised)]" />
            )}
          </div>
          <div className="mt-1 flex justify-between text-xs text-[var(--color-gsd-text-muted)]">
            <span>Pass: {Math.round(passRatio * 100)}%</span>
            <span>Fail: {Math.round(failRatio * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
