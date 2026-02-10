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
    <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Mesh gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/3 h-[600px] w-[600px] rounded-full bg-[#8B5CF6]/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 right-1/3 h-[500px] w-[500px] rounded-full bg-[#FBBF24]/5 blur-[120px]" />
      </div>

      {/* Page header */}
      <div className="mb-10 animate-slide-up">
        <h1 className="text-3xl font-bold tracking-tight gradient-text-violet sm:text-4xl">
          Transparency
        </h1>
        <p className="mt-2 text-lg text-[#94A3B8]">
          Everything is on-chain. Everything is verifiable.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        <div className="glass rounded-2xl p-1">
          <MultisigCard
            address={multisig.address}
            threshold={multisig.threshold}
            totalMembers={multisig.totalMembers}
            members={multisig.members}
          />
        </div>

        <div className="glass rounded-2xl p-1">
          <ProgramInfo
            programs={programs}
            repository={repository}
            tokenInfo={tokenInfo}
          />
        </div>

        <div className="glass rounded-2xl p-1">
          <ChangelogList />
        </div>
      </div>
    </div>
  );
}
