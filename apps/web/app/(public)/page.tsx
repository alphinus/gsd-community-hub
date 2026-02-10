import Link from "next/link";
import {
  Shield,
  Vote,
  Coins,
  GitBranch,
  BarChart3,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  span,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  span?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative cursor-pointer rounded-2xl glass p-6 transition-theme duration-300 hover:glow-cyan-strong motion-safe:hover:scale-[1.02] ${span || ""}`}
    >
      <div className="mb-4 inline-flex rounded-xl bg-[var(--color-gsd-accent)]/10 p-3">
        <Icon className="h-6 w-6 text-[var(--color-gsd-accent)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-gsd-text)] group-hover:text-[var(--color-gsd-accent-hover)] transition-theme">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-gsd-text-muted)]">
        {description}
      </p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-gsd-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Explore
        <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl glass-surface px-6 py-3">
      <span className="text-2xl font-bold gradient-text-aurora">{value}</span>
      <span className="text-xs text-[var(--color-gsd-text-muted)]">{label}</span>
    </div>
  );
}

export default async function HomePage() {
  // Fetch live stats from DB
  let stats = { builders: 0, contributions: 0, rounds: 0, verifications: 0 };
  try {
    const [builders, contributions, rounds, verifications] = await Promise.all([
      prisma.user.count({ where: { displayName: { not: null } } }),
      prisma.contribution.count(),
      prisma.ideaRound.count(),
      prisma.verificationReport.count(),
    ]);
    stats = { builders, contributions, rounds, verifications };
  } catch {
    // Graceful fallback
  }

  return (
    <div className="relative">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-gradient-strong -z-10" />

      {/* Hero */}
      <section className="relative flex flex-col items-center px-4 pb-16 pt-12 sm:pt-20">
        <div className="max-w-3xl text-center animate-slide-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass-surface px-4 py-1.5 text-xs font-medium text-[var(--color-gsd-text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gsd-success)] animate-pulse" />
            Built on Solana
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="text-[var(--color-gsd-text)]">GSD</span>{" "}
            <span className="gradient-text-aurora text-glow-cyan">Community Hub</span>
          </h1>

          <p className="mt-4 text-xl font-medium text-[var(--color-gsd-text-secondary)]">
            Open Source. Real Utility. For All. For Ever.
          </p>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--color-gsd-text-muted)]">
            A decentralized platform where developers collaborate, build, and earn
            fair rewards. Every contribution is tracked on-chain. Every reward is
            verifiable. No promises -- just working code and transparent
            governance.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row animate-slide-up delay-200">
          <Link
            href="/profile/edit"
            className="rounded-xl gradient-cyan px-8 py-3.5 text-lg font-semibold text-white shadow-[0_0_30px_rgba(79,209,197,0.2)] transition-theme duration-200 hover:shadow-[0_0_40px_rgba(79,209,197,0.35)] hover:brightness-110 cursor-pointer"
          >
            Join the Movement
          </Link>
          <Link
            href="/transparency"
            className="rounded-xl border border-[var(--color-gsd-border)] px-8 py-3.5 text-lg font-semibold text-[var(--color-gsd-text-secondary)] transition-theme duration-200 hover:border-[var(--color-gsd-accent)] hover:text-[var(--color-gsd-accent)] hover:shadow-[0_0_20px_rgba(79,209,197,0.1)] cursor-pointer"
          >
            View Transparency
          </Link>
        </div>

        {/* Live Stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-4 animate-slide-up delay-300">
          <StatPill value={String(stats.builders)} label="Builders" />
          <StatPill value={String(stats.contributions)} label="Contributions" />
          <StatPill value={String(stats.rounds)} label="Governance Rounds" />
          <StatPill value={String(stats.verifications)} label="Verifications" />
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-gsd-text)]">
            Everything On-Chain
          </h2>
          <p className="mt-2 text-[var(--color-gsd-text-muted)]">
            Real utility, not promises. Every feature is verifiable.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Shield}
            title="On-Chain Identity"
            description="Your developer profile lives on Solana. Wallet-verified, tamper-proof, and always under your control."
            href="/explore"
            span="lg:row-span-1"
          />
          <FeatureCard
            icon={Vote}
            title="Transparent Governance"
            description="Multisig-controlled upgrades, public changelogs, and on-chain voting. Every decision is auditable."
            href="/governance"
          />
          <FeatureCard
            icon={Coins}
            title="Fair Revenue Sharing"
            description="Contribution-weighted revenue distribution. Build more, earn more. Verified on-chain."
            href="/treasury"
          />
          <FeatureCard
            icon={GitBranch}
            title="Contribution Tracking"
            description="Every commit, PR, and review is indexed and scored. Your work speaks for itself."
            href="/explore"
          />
          <FeatureCard
            icon={BarChart3}
            title="AI Verification"
            description="Automated quality scoring with AI and peer review consensus. Fair and unbiased."
            href="/verification"
          />
          <FeatureCard
            icon={Users}
            title="Community-Driven"
            description="No central authority. Community votes on direction, spending, and priorities."
            href="/governance"
          />
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-[var(--color-gsd-border-subtle)] py-12">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-gsd-text-muted)]">
            Built with the GSD Framework
          </p>
          <p className="mt-2 text-[var(--color-gsd-text-secondary)]">
            Open source from day one. Every line of code is public.{" "}
            <a
              href="https://github.com/alphinus/gsd-community-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gsd-accent)] underline underline-offset-4 hover:text-[var(--color-gsd-accent-hover)] transition-colors"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
