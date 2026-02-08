import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { RoundCard } from "@/components/governance/RoundCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Idea Rounds | GSD Community Hub",
  description:
    "Browse all governance idea rounds. See active proposals, voting status, and community-submitted ideas.",
};

export default async function RoundsPage() {
  let activeRounds: Array<{
    id: string;
    roundIndex: number;
    title: string;
    description: string;
    status: string;
    submissionStart: Date;
    submissionEnd: Date;
    votingEnd: Date;
    quorumType: string;
    createdAt: Date;
    _count: { ideas: number };
  }> = [];

  let closedRounds: typeof activeRounds = [];

  try {
    const [active, closed] = await Promise.all([
      prisma.ideaRound.findMany({
        where: { status: { in: ["open", "voting"] } },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { ideas: true } } },
      }),
      prisma.ideaRound.findMany({
        where: { status: "closed" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { _count: { select: { ideas: true } } },
      }),
    ]);

    activeRounds = active;
    closedRounds = closed;
  } catch {
    // Graceful degradation
  }

  const totalRounds = activeRounds.length + closedRounds.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-gsd-text)]">
            Idea Rounds
          </h1>
          <p className="mt-2 text-[var(--color-gsd-text-muted)]">
            {totalRounds} {totalRounds === 1 ? "round" : "rounds"} total
          </p>
        </div>
        <Link
          href="/governance"
          className="text-sm text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
        >
          Back to Governance
        </Link>
      </div>

      {totalRounds === 0 ? (
        <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] px-6 py-16 text-center">
          <p className="text-lg font-medium text-[var(--color-gsd-text)]">
            No rounds yet
          </p>
          <p className="mt-2 text-sm text-[var(--color-gsd-text-muted)]">
            Governance rounds will appear here once they are created by the
            admin.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active rounds */}
          {activeRounds.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-gsd-text-muted)]">
                Active ({activeRounds.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeRounds.map((round) => (
                  <RoundCard
                    key={round.id}
                    round={{
                      ...round,
                      status: round.status as "open" | "voting" | "closed",
                      submissionStart: round.submissionStart.toISOString(),
                      submissionEnd: round.submissionEnd.toISOString(),
                      votingEnd: round.votingEnd.toISOString(),
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Closed rounds */}
          {closedRounds.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-gsd-text-muted)]">
                Closed ({closedRounds.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {closedRounds.map((round) => (
                  <RoundCard
                    key={round.id}
                    round={{
                      ...round,
                      status: round.status as "open" | "voting" | "closed",
                      submissionStart: round.submissionStart.toISOString(),
                      submissionEnd: round.submissionEnd.toISOString(),
                      votingEnd: round.votingEnd.toISOString(),
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
