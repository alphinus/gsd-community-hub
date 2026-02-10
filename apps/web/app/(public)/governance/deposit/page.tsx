"use client";

import Link from "next/link";
import { DepositPanel } from "@/components/governance/DepositPanel";

export default function DepositPage() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12">
      <div className="absolute inset-0 mesh-gradient -z-10" />

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-gsd-text-muted)]">
          <Link
            href="/governance"
            className="hover:text-[var(--color-gsd-accent)] transition-colors cursor-pointer"
          >
            Governance
          </Link>
          <span className="text-[var(--color-gsd-border)]">/</span>
          <span className="text-[var(--color-gsd-text)]">Deposit</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text-cyan">
          Token Deposit
        </h1>
        <p className="mt-2 text-[var(--color-gsd-text-secondary)]">
          Deposit $GSD tokens to participate in governance voting. Your voting
          weight equals the amount of tokens deposited.
        </p>
      </div>

      {/* Deposit panel */}
      <DepositPanel />

      {/* Info section */}
      <div className="mt-8 rounded-2xl glass p-6">
        <h2 className="mb-3 text-base font-semibold text-[var(--color-gsd-text)]">
          How Deposits Work
        </h2>
        <div className="space-y-3 text-sm text-[var(--color-gsd-text-muted)]">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/15 text-xs font-bold text-[var(--color-gsd-accent)]">
              1
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                Deposit tokens:
              </strong>{" "}
              Send $GSD tokens to the governance escrow vault. Your tokens are
              held securely on-chain.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-gsd-gold)]/15 text-xs font-bold text-[var(--color-gsd-gold)]">
              2
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                7-day timelock:
              </strong>{" "}
              After depositing, wait 7 days before your tokens become eligible
              for voting. This prevents last-minute vote manipulation.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/15 text-xs font-bold text-[var(--color-gsd-accent)]">
              3
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                Vote:
              </strong>{" "}
              Once eligible, vote on ideas with weight equal to your deposited
              amount. Vote Yes, No, or Abstain.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-[var(--color-gsd-text-muted)]">
              4
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                Withdraw:
              </strong>{" "}
              You can withdraw tokens at any time as long as you have no active
              votes. Relinquish votes first to unlock withdrawal.
            </p>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link
          href="/governance/dashboard"
          className="text-sm text-[var(--color-gsd-accent)] underline-offset-4 hover:underline cursor-pointer transition-colors"
        >
          Back to Governance Dashboard
        </Link>
      </div>
    </div>
  );
}
