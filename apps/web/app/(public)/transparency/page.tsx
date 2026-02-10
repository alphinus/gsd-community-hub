import type { Metadata } from "next";
import { transparencyConfig } from "@/lib/config/transparency-config";
import { MultisigCard } from "@/components/transparency/multisig-card";
import { ProgramInfo } from "@/components/transparency/program-info";
import { ChangelogList } from "@/components/transparency/changelog-list";
import { HeroBackground } from "@/components/ui/hero-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata: Metadata = {
  title: "Transparency | GSD Community Hub",
  description:
    "On-chain governance, program upgrade history, and token authority status. Everything is verifiable.",
};

export default function TransparencyPage() {
  const { multisig, programs, repository, tokenInfo } = transparencyConfig;

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Eluma hero background */}
      <HeroBackground particleCount={25} />

      {/* Page header */}
      <ScrollReveal>
        <div className="mb-10">
          <span className="eluma-badge mb-3 inline-block">On-Chain Verifiable</span>
          <h1 className="text-3xl font-extralight tracking-tight gradient-text-cyan sm:text-4xl">
            Transparency
          </h1>
          <p className="mt-2 text-lg font-light text-[#94A3B8]">
            Everything is on-chain. Everything is verifiable.
          </p>
        </div>
      </ScrollReveal>

      {/* Content */}
      <div className="space-y-8">
        <ScrollReveal delay={1}>
          <div className="glass eluma-card rounded-2xl p-1">
            <MultisigCard
              address={multisig.address}
              threshold={multisig.threshold}
              totalMembers={multisig.totalMembers}
              members={multisig.members}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <div className="glass eluma-card rounded-2xl p-1">
            <ProgramInfo
              programs={programs}
              repository={repository}
              tokenInfo={tokenInfo}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={3}>
          <div className="glass eluma-card rounded-2xl p-1">
            <ChangelogList />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
