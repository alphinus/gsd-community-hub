import type { Metadata } from "next";
import { transparencyConfig } from "@/lib/config/transparency-config";
import { MultisigCard } from "@/components/transparency/multisig-card";
import { ProgramInfo } from "@/components/transparency/program-info";
import { ChangelogList } from "@/components/transparency/changelog-list";

export const metadata: Metadata = {
  title: "Transparency | GSD Community Hub",
  description:
    "On-chain governance, program upgrade history, and token authority status. Everything is verifiable.",
};

export default function TransparencyPage() {
  const { multisig, programs, repository, tokenInfo } = transparencyConfig;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-gsd-text)] sm:text-4xl">
          Transparency
        </h1>
        <p className="mt-2 text-lg text-[var(--color-gsd-text-secondary)]">
          Everything is on-chain. Everything is verifiable.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        <MultisigCard
          address={multisig.address}
          threshold={multisig.threshold}
          totalMembers={multisig.totalMembers}
          members={multisig.members}
        />

        <ProgramInfo
          programs={programs}
          repository={repository}
          tokenInfo={tokenInfo}
        />

        <ChangelogList />
      </div>
    </div>
  );
}
