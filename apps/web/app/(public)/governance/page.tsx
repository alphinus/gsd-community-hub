import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { HeroBackground } from "@/components/ui/hero-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
    <div className="relative min-h-screen">
      <HeroBackground particleCount={30} />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <ScrollReveal>
          <div className="mb-10">
            <span className="eluma-badge mb-3 inline-block">Community Governance</span>
            <h1 className="gradient-text-cyan text-3xl font-extralight tracking-tight sm:text-4xl">
              Governance
            </h1>
            <p className="mt-2 text-lg font-light text-[var(--color-gsd-text-secondary)]">
              Shape the future of GSD. Submit ideas, vote on proposals, and help
              steer the project through community-driven idea rounds.
            </p>
          </div>
        </ScrollReveal>

        {/* How it works */}
        <ScrollReveal delay={1}>
          <div className="glass-strong eluma-card mb-10 rounded-2xl p-6">
            <span className="eluma-badge mb-3 inline-block">Process</span>
            <h2 className="mb-4 text-lg font-extralight text-[var(--color-gsd-text)]">
              How Idea Rounds Work
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <ScrollReveal delay={2}>
                <div>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/15 text-sm font-light text-[#4fd1c5]">
                    1
                  </div>
                  <h3 className="mb-1 text-sm font-normal text-[var(--color-gsd-text)]">
                    Submit Ideas
                  </h3>
                  <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                    When a round is open, anyone with a connected wallet can submit
                    an idea with a title and description.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={3}>
                <div>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gsd-gold)]/15 text-sm font-light text-[#3b82f6]">
                    2
                  </div>
                  <h3 className="mb-1 text-sm font-normal text-[var(--color-gsd-text)]">
                    Vote
                  </h3>
                  <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                    During the voting period, eligible token holders vote Yes, No, or
                    Abstain. Voting weight equals your deposited $GSD tokens.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={4}>
                <div>
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-light text-[#F8FAFC]">
                    3
                  </div>
                  <h3 className="mb-1 text-sm font-normal text-[var(--color-gsd-text)]">
                    Results
                  </h3>
                  <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                    Once voting ends, ideas meeting quorum are approved. All votes and
                    results are recorded on-chain for transparency.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={2}>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="glass eluma-stat rounded-2xl p-4 transition-theme duration-200 hover:glow-cyan">
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                Total Rounds
              </p>
              <p className="text-2xl font-extralight text-[var(--color-gsd-text)]">
                {stats.totalRounds}
              </p>
            </div>
            <div className="glass eluma-stat rounded-2xl p-4 transition-theme duration-200 hover:glow-cyan">
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                Active Rounds
              </p>
              <p className="text-2xl font-extralight text-[#4fd1c5]">
                {stats.activeRounds}
              </p>
            </div>
            <div className="glass eluma-stat col-span-2 rounded-2xl p-4 sm:col-span-1 transition-theme duration-200 hover:glow-cyan">
              <p className="text-xs font-light text-[var(--color-gsd-text-muted)]">
                On-chain Governance
              </p>
              <p className="gradient-text-aurora text-2xl font-extralight">
                100%
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Analytics card */}
        <ScrollReveal delay={3}>
          <div className="glass eluma-card glow-cyan mb-8 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="eluma-badge mb-2 inline-block">Insights</span>
                <h2 className="text-lg font-extralight text-[var(--color-gsd-text)]">
                  Analytics Dashboard
                </h2>
                <p className="mt-1 text-sm font-light text-[var(--color-gsd-text-muted)]">
                  Voter participation, power distribution, and delegation metrics
                </p>
              </div>
              <Link
                href="/governance/analytics"
                className="gradient-cyan cursor-pointer rounded-xl px-4 py-2 text-sm font-normal text-white transition-theme duration-200 hover:shadow-[0_0_20px_rgba(79,209,197,0.3)] hover:brightness-110"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Navigation */}
        <ScrollReveal delay={4}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/governance/rounds"
              className="gradient-cyan flex-1 cursor-pointer rounded-xl px-6 py-3 text-center text-sm font-normal text-white transition-theme duration-200 hover:shadow-[0_0_25px_rgba(79,209,197,0.3)] hover:brightness-110"
            >
              Browse Rounds
            </Link>
            <Link
              href="/governance/deposit"
              className="flex-1 cursor-pointer rounded-xl border border-[var(--color-gsd-border)] px-6 py-3 text-center text-sm font-normal text-[var(--color-gsd-text-secondary)] transition-theme duration-200 hover:border-[#4fd1c5] hover:bg-[var(--color-gsd-accent-muted)] hover:text-[#4fd1c5]"
            >
              Deposit Tokens to Vote
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
