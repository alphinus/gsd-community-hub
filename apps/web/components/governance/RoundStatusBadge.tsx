"use client";

import { Badge } from "@/components/ui/badge";

type RoundStatus = "open" | "voting" | "closed";

interface RoundStatusBadgeProps {
  status: RoundStatus;
  submissionEnd: string | Date;
  votingEnd: string | Date;
}

/**
 * Compute the effective display status.
 * Handles stale on-chain status where timestamps have passed
 * but the on-chain status hasn't been transitioned yet (Research Pitfall 4).
 */
function getEffectiveStatus(
  status: RoundStatus,
  submissionEnd: Date,
  votingEnd: Date
): { label: string; variant: "success" | "warning" | "secondary" } {
  const now = new Date();

  if (status === "open") {
    if (now > submissionEnd) {
      return { label: "Transitioning to Voting...", variant: "warning" };
    }
    return { label: "Open", variant: "success" };
  }

  if (status === "voting") {
    if (now > votingEnd) {
      return { label: "Closing...", variant: "secondary" };
    }
    return { label: "Voting", variant: "warning" };
  }

  return { label: "Closed", variant: "secondary" };
}

export function RoundStatusBadge({
  status,
  submissionEnd,
  votingEnd,
}: RoundStatusBadgeProps) {
  const subEnd =
    submissionEnd instanceof Date
      ? submissionEnd
      : new Date(submissionEnd);
  const vEnd =
    votingEnd instanceof Date ? votingEnd : new Date(votingEnd);

  const { label, variant } = getEffectiveStatus(status, subEnd, vEnd);

  return (
    <Badge
      variant={variant}
      className="rounded-xl transition-theme duration-200"
    >
      {label}
    </Badge>
  );
}
