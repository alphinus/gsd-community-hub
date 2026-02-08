import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      {/* Hero */}
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-[var(--color-gsd-text)]">GSD</span>{" "}
          <span className="text-[var(--color-gsd-accent)]">Community Hub</span>
        </h1>
        <p className="mt-4 text-xl font-medium text-[var(--color-gsd-text-secondary)]">
          Open Source. Real Utility. For All. For Ever.
        </p>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-gsd-text-muted)]">
          A decentralized platform where developers collaborate, build, and earn
          fair rewards. Every contribution is tracked on-chain. Every reward is
          verifiable. No promises -- just working code and transparent
          governance.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/profile/edit"
          className="rounded-lg bg-[var(--color-gsd-accent)] px-8 py-3 text-lg font-semibold text-[var(--color-gsd-bg)] transition-colors hover:bg-[var(--color-gsd-accent-hover)]"
        >
          Join the Movement
        </Link>
        <Link
          href="/transparency"
          className="rounded-lg border border-[var(--color-gsd-border)] px-8 py-3 text-lg font-semibold text-[var(--color-gsd-text-secondary)] transition-colors hover:border-[var(--color-gsd-accent)] hover:text-[var(--color-gsd-accent)]"
        >
          View Transparency
        </Link>
      </div>

      {/* Features */}
      <div className="mt-20 grid max-w-5xl gap-8 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
          <div className="mb-3 text-2xl">&#x1f517;</div>
          <h3 className="text-lg font-semibold text-[var(--color-gsd-text)]">
            On-Chain Identity
          </h3>
          <p className="mt-2 text-sm text-[var(--color-gsd-text-muted)]">
            Your developer profile lives on Solana. Wallet-verified,
            tamper-proof, and always under your control.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
          <div className="mb-3 text-2xl">&#x1f4ca;</div>
          <h3 className="text-lg font-semibold text-[var(--color-gsd-text)]">
            Transparent Governance
          </h3>
          <p className="mt-2 text-sm text-[var(--color-gsd-text-muted)]">
            Multisig-controlled upgrades, public changelogs, and on-chain voting.
            Every decision is auditable.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
          <div className="mb-3 text-2xl">&#x1f4b0;</div>
          <h3 className="text-lg font-semibold text-[var(--color-gsd-text)]">
            Fair Revenue Sharing
          </h3>
          <p className="mt-2 text-sm text-[var(--color-gsd-text-muted)]">
            Contribution-weighted revenue distribution. Build more, earn more.
            Verified on-chain, not trust-me promises.
          </p>
        </div>
      </div>

      {/* Social proof */}
      <div className="mt-16 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--color-gsd-text-muted)]">
          Built with the GSD Framework
        </p>
        <p className="mt-2 text-[var(--color-gsd-text-secondary)]">
          Open source from day one. Every line of code is public.{" "}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-gsd-accent)] underline underline-offset-4 hover:text-[var(--color-gsd-accent-hover)]"
          >
            View on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
