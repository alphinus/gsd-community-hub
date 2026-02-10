import type { Metadata } from "next";
import Link from "next/link";
import { DelegateDirectory } from "@/components/governance/DelegateDirectory";

export const metadata: Metadata = {
  title: "Delegates | GSD Governance",
  description:
    "Browse active delegates in the GSD governance system. Inactive token holders can delegate voting power to active contributors who vote on their behalf.",
};

export default function DelegatesPage() {
  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
          <span className="text-[var(--color-gsd-text)]">Delegates</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text-violet sm:text-4xl">
          Delegate Directory
        </h1>
        <p className="mt-2 text-lg text-[var(--color-gsd-text-secondary)]">
          Browse active delegates who vote on behalf of the community.
        </p>
      </div>

      {/* Explainer */}
      <div className="mb-8 rounded-2xl glass p-6">
        <h2 className="mb-2 text-base font-semibold text-[var(--color-gsd-text)]">
          What is Delegation?
        </h2>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Inactive token holders can delegate their voting power to active
          contributors who participate regularly in governance. Delegates vote
          with the combined weight of their own deposits plus all delegated
          tokens. You retain ownership of your tokens -- only voting power is
          transferred. Delegation can be revoked at any time.
        </p>
        <Link
          href="/governance/delegate"
          className="mt-3 inline-block text-sm text-[var(--color-gsd-accent)] underline-offset-4 hover:underline cursor-pointer transition-colors"
        >
          Manage your delegation
        </Link>
      </div>

      {/* Directory */}
      <DelegateDirectory />
    </div>
  );
}
