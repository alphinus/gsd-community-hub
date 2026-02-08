import type { Metadata } from "next";
import {
  explorerUrl,
  squadsUrl,
  transparencyConfig,
} from "@/lib/config/transparency-config";
import { TreasuryDashboard } from "@/components/treasury/TreasuryDashboard";
import { TreasuryTabs } from "@/components/treasury/TreasuryTabs";
import { TREASURY_ADDRESS_STR } from "@/lib/treasury/client";

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Treasury Dashboard | GSD Community Hub",
  description:
    "Real-time view of the GSD community treasury. SOL and $GSD balances, revenue distribution, burn history, and transaction log -- all verifiable on-chain.",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TreasuryPage() {
  const multisigAddress = transparencyConfig.multisig.address;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-gsd-text)] sm:text-4xl">
          Treasury
        </h1>
        <p className="mt-2 text-lg text-[var(--color-gsd-text-secondary)]">
          Real-time view of the GSD community treasury. All balances,
          revenue events, and transactions are verifiable on-chain.
        </p>
      </div>

      {/* Balance cards + revenue summary */}
      <section className="mb-8">
        <TreasuryDashboard />
      </section>

      {/* Tabbed content: Transactions | Revenue Events | My Claims | Burns */}
      <section className="mb-8">
        <TreasuryTabs />
      </section>

      {/* Links and notes */}
      <section className="space-y-4 rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-gsd-text)]">
          Verification Links
        </h2>

        <div className="flex flex-wrap gap-3">
          <a
            href={explorerUrl(TREASURY_ADDRESS_STR)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-4 py-2 text-sm text-[var(--color-gsd-accent)] transition-colors hover:border-[var(--color-gsd-accent)]/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
            View on Solana Explorer
          </a>

          <a
            href={squadsUrl(multisigAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-4 py-2 text-sm text-[var(--color-gsd-accent)] transition-colors hover:border-[var(--color-gsd-accent)]/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
            Squads Multisig Dashboard
          </a>
        </div>

        {/* Burn note */}
        <div className="mt-4 rounded-lg border border-orange-400/20 bg-orange-400/5 px-4 py-3">
          <p className="text-sm text-orange-300/90">
            <span className="font-medium">Burn tracking:</span> The
            buy-and-burn mechanism is active. 10% of each revenue event is used
            to purchase and permanently burn $GSD tokens. Burn history is
            viewable in the Burns tab above.
          </p>
        </div>
      </section>
    </div>
  );
}
