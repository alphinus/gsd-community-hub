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
    <div className="mesh-gradient min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-10 animate-slide-up">
          <h1 className="gradient-text-violet text-3xl font-bold tracking-tight sm:text-4xl">
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
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-gsd-text)]">
            Verification Links
          </h2>

          <div className="flex flex-wrap gap-3">
            <a
              href={explorerUrl(TREASURY_ADDRESS_STR)}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-surface inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-[var(--color-gsd-accent)] transition-theme hover:border-[var(--color-gsd-accent)]/50 hover:text-[var(--color-gsd-accent-hover)] hover:glow-violet"
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
              className="glass-surface inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-[var(--color-gsd-accent)] transition-theme hover:border-[var(--color-gsd-accent)]/50 hover:text-[var(--color-gsd-accent-hover)] hover:glow-violet"
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
          <div className="glass-surface mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-300/90">
              <span className="font-medium text-[var(--color-gsd-gold)]">Burn tracking:</span> The
              buy-and-burn mechanism is active. 10% of each revenue event is used
              to purchase and permanently burn $GSD tokens. Burn history is
              viewable in the Burns tab above.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
