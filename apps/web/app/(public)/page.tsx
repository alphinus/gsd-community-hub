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
import { HeroBackground } from "@/components/ui/hero-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative cursor-pointer rounded-2xl glass eluma-card p-8"
    >
      <div className="relative z-[1]">
        <div className="mb-5 inline-flex rounded-xl bg-[var(--color-gsd-accent)]/10 border border-[var(--color-gsd-accent)]/15 p-3 transition-all duration-400 group-hover:bg-[var(--color-gsd-accent)]/15 group-hover:border-[var(--color-gsd-accent)]/30 group-hover:shadow-[0_0_20px_rgba(79,209,197,0.15)]">
          <Icon className="h-5 w-5 text-[var(--color-gsd-accent)]" />
        </div>
        <h3 className="text-[17px] font-normal text-[var(--color-gsd-text)] group-hover:text-[var(--color-gsd-accent)] transition-colors duration-300">
          {title}
        </h3>
        <p className="mt-2.5 text-[13px] leading-[1.7] font-light text-[var(--color-gsd-text-muted)]">
          {description}
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-gsd-accent)] opacity-0 -translate-x-2.5 transition-all duration-400 group-hover:opacity-100 group-hover:translate-x-0">
          Explore
          <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="eluma-stat flex flex-col items-center gap-1.5 rounded-2xl glass-surface px-8 py-6 text-center">
      <span className="text-[42px] font-extralight leading-none gradient-text-aurora">
        {value}
      </span>
      <span className="text-xs font-light tracking-[2px] uppercase text-[var(--color-gsd-text-muted)]">
        {label}
      </span>
    </div>
  );
}

export default async function HomePage() {
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
      {/* Hero */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 pb-16 pt-12 sm:pt-20 overflow-hidden">
        <HeroBackground />

        {/* Hero badge */}
        <div className="animate-fade-up-blur mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-gsd-accent)]/20 px-4 py-1.5 text-[11px] font-medium tracking-[2px] uppercase text-[var(--color-gsd-accent)]" style={{ animationDelay: "0.3s" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gsd-accent)] animate-pulse" />
          Built on Solana
        </div>

        {/* Hero title */}
        <h1 className="max-w-4xl text-center text-5xl font-extralight tracking-tight sm:text-7xl">
          <span className="block animate-fade-up-blur text-[var(--color-gsd-text)]" style={{ animationDelay: "0.5s" }}>
            GSD
          </span>
          <span className="block animate-fade-up-blur gradient-text-aurora text-glow-cyan font-light" style={{ animationDelay: "0.7s" }}>
            Community Hub
          </span>
        </h1>

        {/* Hero subtitle */}
        <p className="animate-fade-up-blur mt-5 text-lg font-light text-[var(--color-gsd-text-secondary)]" style={{ animationDelay: "0.9s" }}>
          Open Source. Real Utility. For All. For Ever.
        </p>

        <p className="animate-fade-up-blur mx-auto mt-6 max-w-xl text-center text-base font-light leading-[1.7] text-[var(--color-gsd-text-muted)]" style={{ animationDelay: "1s" }}>
          A decentralized platform where developers collaborate, build, and earn
          fair rewards. Every contribution is tracked on-chain. Every reward is
          verifiable.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-up-blur mt-10 flex flex-col items-center gap-4 sm:flex-row" style={{ animationDelay: "1.2s" }}>
          <Link
            href="/profile/edit"
            className="rounded-lg gradient-cyan px-9 py-3.5 text-[13px] font-semibold tracking-[1px] uppercase text-[var(--color-gsd-bg)] shadow-[0_8px_30px_rgba(79,209,197,0.2)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(79,209,197,0.35)] hover:-translate-y-0.5 cursor-pointer"
          >
            Join the Movement
          </Link>
          <Link
            href="/transparency"
            className="rounded-lg border border-[var(--color-gsd-accent)]/30 bg-transparent px-9 py-3.5 text-[13px] font-medium tracking-[1px] uppercase text-[var(--color-gsd-accent)] transition-all duration-300 hover:bg-[var(--color-gsd-accent)]/8 hover:border-[var(--color-gsd-accent)] hover:-translate-y-0.5 cursor-pointer"
          >
            View Transparency
          </Link>
        </div>

        {/* Live Stats */}
        <div className="animate-fade-up-blur mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ animationDelay: "1.4s" }}>
          <StatCard value={String(stats.builders)} label="Builders" />
          <StatCard value={String(stats.contributions)} label="Contributions" />
          <StatCard value={String(stats.rounds)} label="Rounds" />
          <StatCard value={String(stats.verifications)} label="Verified" />
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <ScrollReveal className="text-center mb-16">
          <p className="eluma-badge mb-4">Features</p>
          <h2 className="text-[42px] font-extralight text-[var(--color-gsd-text)]">
            Everything <span className="gradient-text-cyan">On-Chain</span>
          </h2>
          <p className="mt-3 text-base font-light text-[var(--color-gsd-text-muted)]">
            Real utility, not promises. Every feature is verifiable.
          </p>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ScrollReveal delay={1}>
            <FeatureCard
              icon={Shield}
              title="On-Chain Identity"
              description="Your developer profile lives on Solana. Wallet-verified, tamper-proof, and always under your control."
              href="/explore"
            />
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <FeatureCard
              icon={Vote}
              title="Transparent Governance"
              description="Multisig-controlled upgrades, public changelogs, and on-chain voting. Every decision is auditable."
              href="/governance"
            />
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <FeatureCard
              icon={Coins}
              title="Fair Revenue Sharing"
              description="Contribution-weighted revenue distribution. Build more, earn more. Verified on-chain."
              href="/treasury"
            />
          </ScrollReveal>
          <ScrollReveal delay={4}>
            <FeatureCard
              icon={GitBranch}
              title="Contribution Tracking"
              description="Every commit, PR, and review is indexed and scored. Your work speaks for itself."
              href="/explore"
            />
          </ScrollReveal>
          <ScrollReveal delay={5}>
            <FeatureCard
              icon={BarChart3}
              title="AI Verification"
              description="Automated quality scoring with AI and peer review consensus. Fair and unbiased."
              href="/verification"
            />
          </ScrollReveal>
          <ScrollReveal delay={6}>
            <FeatureCard
              icon={Users}
              title="Community-Driven"
              description="No central authority. Community votes on direction, spending, and priorities."
              href="/governance"
            />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section with rotating conic border */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <ScrollReveal>
          <div className="eluma-cta-border relative rounded-3xl bg-[var(--color-gsd-accent)]/2 px-8 py-20 text-center overflow-hidden">
            <div className="eluma-pulse-ring" />
            <div className="eluma-pulse-ring" />
            <div className="eluma-pulse-ring" />

            <div className="relative z-[1]">
              <h2 className="text-[40px] font-extralight leading-tight text-[var(--color-gsd-text)]">
                Ready to{" "}
                <span className="gradient-text-cyan font-light">Get Stuff Done</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base font-light leading-[1.7] text-[var(--color-gsd-text-muted)]">
                Join builders who ship real code and earn verifiable rewards.
              </p>
              <div className="mt-9 flex justify-center gap-4">
                <Link
                  href="/profile/edit"
                  className="rounded-lg gradient-cyan px-9 py-3.5 text-[13px] font-semibold tracking-[1px] uppercase text-[var(--color-gsd-bg)] shadow-[0_8px_30px_rgba(79,209,197,0.2)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(79,209,197,0.35)] hover:-translate-y-0.5 cursor-pointer"
                >
                  Start Building
                </Link>
                <Link
                  href="/explore"
                  className="rounded-lg border border-[var(--color-gsd-accent)]/30 bg-transparent px-9 py-3.5 text-[13px] font-medium tracking-[1px] uppercase text-[var(--color-gsd-accent)] transition-all duration-300 hover:bg-[var(--color-gsd-accent)]/8 hover:border-[var(--color-gsd-accent)] hover:-translate-y-0.5 cursor-pointer"
                >
                  Explore Projects
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Social proof footer */}
      <section className="border-t border-[var(--color-gsd-border-subtle)] py-12">
        <ScrollReveal className="text-center">
          <p className="eluma-badge mb-3">Open Source</p>
          <p className="text-base font-light text-[var(--color-gsd-text-secondary)]">
            Built in public from day one. Every line of code is verifiable.{" "}
            <a
              href="https://github.com/alphinus/gsd-community-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gsd-accent)] underline underline-offset-4 hover:text-[var(--color-gsd-accent-hover)] transition-colors"
            >
              View on GitHub
            </a>
          </p>
        </ScrollReveal>
      </section>
    </div>
  );
}
