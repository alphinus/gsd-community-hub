"use client";

import Link from "next/link";
import { DelegationPanel } from "@/components/governance/DelegationPanel";

export default function DelegatePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--color-gsd-text-muted)]">
          <Link
            href="/governance"
            className="hover:text-[var(--color-gsd-text)]"
          >
            Governance
          </Link>
          <span>/</span>
          <span className="text-[var(--color-gsd-text)]">Delegate</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-gsd-text)]">
          Vote Delegation
        </h1>
        <p className="mt-2 text-[var(--color-gsd-text-secondary)]">
          Delegate your voting power to a trusted community member, or revoke an
          existing delegation to vote directly.
        </p>
      </div>

      {/* Delegation panel */}
      <DelegationPanel />

      {/* Info section */}
      <div className="mt-8 rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
        <h2 className="mb-3 text-base font-semibold text-[var(--color-gsd-text)]">
          How Delegation Works
        </h2>
        <div className="space-y-3 text-sm text-[var(--color-gsd-text-muted)]">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-500">
              1
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                Choose a delegate:
              </strong>{" "}
              Enter the wallet address of a trusted community member who will
              vote on your behalf.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-500">
              2
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                On-chain transaction:
              </strong>{" "}
              Delegation is recorded on-chain. Your deposited tokens remain in
              your vault -- only voting power is transferred.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-500">
              3
            </span>
            <p>
              <strong className="text-[var(--color-gsd-text-secondary)]">
                Revoke anytime:
              </strong>{" "}
              You can revoke delegation at any time to regain direct voting
              ability. Revocation takes effect in the next round.
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <Link
          href="/governance/delegates"
          className="text-sm text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
        >
          Browse Delegates
        </Link>
        <Link
          href="/governance/dashboard"
          className="text-sm text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
