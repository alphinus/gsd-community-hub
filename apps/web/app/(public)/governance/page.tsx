import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Governance | GSD Community Hub",
  description:
    "Community-driven governance for the GSD ecosystem. Browse idea rounds, submit proposals, and vote on the future of the project.",
};

export default async function GovernancePage() {
  // Fetch aggregate stats server-side
  let stats = { totalRounds: 0, activeRounds: 0, totalDeposited: "0" };

  try {
    const [totalRounds, activeRounds] = await Promise.all([
      prisma.ideaRound.count(),
      prisma.ideaRound.count({
        where: { status: { in: ["open", "voting"] } },
      }),
    ]);

    stats = {
      totalRounds,
      activeRounds,
      totalDeposited: "0",
    };
  } catch {
    // Graceful degradation: show page without stats
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-gsd-text)] sm:text-4xl">
          Governance
        </h1>
        <p className="mt-2 text-lg text-[var(--color-gsd-text-secondary)]">
          Shape the future of GSD. Submit ideas, vote on proposals, and help
          steer the project through community-driven idea rounds.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-10 rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          How Idea Rounds Work
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-500">
              1
            </div>
            <h3 className="mb-1 text-sm font-medium text-[var(--color-gsd-text)]">
              Submit Ideas
            </h3>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              When a round is open, anyone with a connected wallet can submit
              an idea with a title and description.
            </p>
          </div>
          <div>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-500">
              2
            </div>
            <h3 className="mb-1 text-sm font-medium text-[var(--color-gsd-text)]">
              Vote
            </h3>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              During the voting period, eligible token holders vote Yes, No, or
              Abstain. Voting weight equals your deposited $GSD tokens.
            </p>
          </div>
          <div>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-500/15 text-sm font-bold text-gray-400">
              3
            </div>
            <h3 className="mb-1 text-sm font-medium text-[var(--color-gsd-text)]">
              Results
            </h3>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Once voting ends, ideas meeting quorum are approved. All votes and
              results are recorded on-chain for transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Total Rounds
          </p>
          <p className="text-2xl font-bold text-[var(--color-gsd-text)]">
            {stats.totalRounds}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Active Rounds
          </p>
          <p className="text-2xl font-bold text-emerald-500">
            {stats.activeRounds}
          </p>
        </div>
        <div className="col-span-2 rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4 sm:col-span-1">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            On-chain Governance
          </p>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
            100%
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/governance/rounds"
          className="flex-1 rounded-lg bg-[var(--color-gsd-accent)] px-6 py-3 text-center text-sm font-semibold text-[var(--color-gsd-bg)] transition-colors hover:bg-[var(--color-gsd-accent-hover)]"
        >
          Browse Rounds
        </Link>
        <Link
          href="/governance/deposit"
          className="flex-1 rounded-lg border border-[var(--color-gsd-border)] px-6 py-3 text-center text-sm font-semibold text-[var(--color-gsd-text-secondary)] transition-colors hover:bg-[var(--color-gsd-surface-raised)]"
        >
          Deposit Tokens to Vote
        </Link>
      </div>
    </div>
  );
}
