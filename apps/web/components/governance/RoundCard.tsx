"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RoundStatusBadge } from "./RoundStatusBadge";

interface RoundCardRound {
  id: string;
  title: string;
  description: string;
  status: "open" | "voting" | "closed";
  submissionStart: string;
  submissionEnd: string;
  votingEnd: string;
  quorumType: string;
  ideaCount?: number;
  _count?: { ideas: number };
}

interface RoundCardProps {
  round: RoundCardRound;
}

/**
 * Format a quorum type to a human-readable label.
 */
function formatQuorumType(qt: string): string {
  switch (qt) {
    case "small":
      return "Simple Majority";
    case "treasury":
      return "Treasury Decision";
    case "parameter_change":
      return "Parameter Change";
    default:
      return qt;
  }
}

/**
 * Relative time helper for dates in the future or past.
 */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = then - now;

  if (diff > 0) {
    // Future
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return `${minutes}m left`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }

  // Past
  const elapsed = -diff;
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RoundCard({ round }: RoundCardProps) {
  const ideaCount = round.ideaCount ?? round._count?.ideas ?? 0;

  return (
    <Link href={`/governance/rounds/${round.id}`} className="block group cursor-pointer">
      <Card className="glass transition-theme duration-200 group-hover:glow-cyan group-hover:border-[var(--color-gsd-accent)]/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug text-[var(--color-gsd-text)]">
              {round.title}
            </CardTitle>
            <RoundStatusBadge
              status={round.status}
              submissionEnd={round.submissionEnd}
              votingEnd={round.votingEnd}
            />
          </div>
          <CardDescription className="line-clamp-2 text-[var(--color-gsd-text-secondary)]">
            {round.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-gsd-text-muted)]">
            <span>{formatQuorumType(round.quorumType)}</span>
            <span>
              {ideaCount} {ideaCount === 1 ? "idea" : "ideas"}
            </span>
            {round.status === "open" && (
              <span>Submissions close {relativeTime(round.submissionEnd)}</span>
            )}
            {round.status === "voting" && (
              <span>Voting ends {relativeTime(round.votingEnd)}</span>
            )}
            {round.status === "closed" && (
              <span>Ended {relativeTime(round.votingEnd)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
