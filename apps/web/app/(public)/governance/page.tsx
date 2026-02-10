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
    <div className="mesh-gradient min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-10 animate-slide-up">
          <h1 className="gradient-text-violet text-3xl font-bold tracking-tight sm:text-4xl">
            Governance
          </h1>
          <p className="mt-2 text-lg text-[var(--color-gsd-text-secondary)]">
            Shape the future of GSD. Submit ideas, vote on proposals, and help
            steer the project through community-driven idea rounds.
          </p>
        </div>

        {/* How it works */}
        <div className="glass-strong mb-10 rounded-2xl p-6 animate-slide-up delay-100">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
            How Idea Rounds Work
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/15 text-sm font-bold text-[#8B5CF6]">
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
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gsd-gold)]/15 text-sm font-bold text-[#FBBF24]">
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
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-[#F8FAFC]">
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
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 animate-slide-up delay-200">
          <div className="glass rounded-2xl p-4 transition-theme duration-200 hover:glow-violet">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Total Rounds
            </p>
            <p className="animate-count-up text-2xl font-bold text-[var(--color-gsd-text)]">
              {stats.totalRounds}
            </p>
          </div>
          <div className="glass rounded-2xl p-4 transition-theme duration-200 hover:glow-violet">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Active Rounds
            </p>
            <p className="animate-count-up text-2xl font-bold text-[#8B5CF6]">
              {stats.activeRounds}
            </p>
          </div>
          <div className="glass col-span-2 rounded-2xl p-4 sm:col-span-1 transition-theme duration-200 hover:glow-violet">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              On-chain Governance
            </p>
            <p className="gradient-text-aurora animate-count-up text-2xl font-bold">
              100%
            </p>
          </div>
        </div>

        {/* Analytics card */}
        <div className="glass glow-violet mb-8 rounded-2xl p-6 animate-slide-up delay-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-gsd-text)]">
                Analytics Dashboard
              </h2>
              <p className="mt-1 text-sm text-[var(--color-gsd-text-muted)]">
                Voter participation, power distribution, and delegation metrics
              </p>
            </div>
            <Link
              href="/governance/analytics"
              className="gradient-violet cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-white transition-theme duration-200 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:brightness-110"
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row animate-slide-up delay-400">
          <Link
            href="/governance/rounds"
            className="gradient-violet flex-1 cursor-pointer rounded-xl px-6 py-3 text-center text-sm font-semibold text-white transition-theme duration-200 hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:brightness-110"
          >
            Browse Rounds
          </Link>
          <Link
            href="/governance/deposit"
            className="flex-1 cursor-pointer rounded-xl border border-[var(--color-gsd-border)] px-6 py-3 text-center text-sm font-semibold text-[var(--color-gsd-text-secondary)] transition-theme duration-200 hover:border-[#8B5CF6] hover:bg-[var(--color-gsd-accent-muted)] hover:text-[#8B5CF6]"
          >
            Deposit Tokens to Vote
          </Link>
        </div>
      </div>
    </div>
  );
}
