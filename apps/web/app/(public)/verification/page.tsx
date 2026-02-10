import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerificationHistory } from "@/components/verification/VerificationHistory";
import { HeroBackground } from "@/components/ui/hero-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const metadata: Metadata = {
  title: "Verification Dashboard | GSD Community Hub",
  description:
    "Publicly auditable AI and peer verification reports for all contributions",
};

interface VerificationStats {
  total: number;
  averageScore: number;
  aiCount: number;
  peerCount: number;
}

async function getVerificationStats(): Promise<VerificationStats> {
  try {
    const [total, aggregation, aiCount, peerCount] = await Promise.all([
      prisma.verificationReport.count(),
      prisma.verificationReport.aggregate({
        _avg: { overallScore: true },
      }),
      prisma.verificationReport.count({
        where: { verificationType: "ai" },
      }),
      prisma.verificationReport.count({
        where: { verificationType: "peer" },
      }),
    ]);

    return {
      total,
      averageScore: Math.round((aggregation._avg.overallScore ?? 0) / 100),
      aiCount,
      peerCount,
    };
  } catch {
    return { total: 0, averageScore: 0, aiCount: 0, peerCount: 0 };
  }
}

export default async function VerificationDashboardPage() {
  const stats = await getVerificationStats();

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-12">
      {/* Eluma hero background */}
      <HeroBackground particleCount={20} />

      <ScrollReveal>
        <div className="mb-8">
          <span className="eluma-badge mb-3 inline-block">Audit Trail</span>
          <h1 className="text-2xl font-extralight gradient-text-cyan">
            Verification Dashboard
          </h1>
          <p className="mt-1 text-sm font-light text-[#94A3B8]">
            Publicly auditable AI and peer verification reports for all
            contributions
          </p>
        </div>
      </ScrollReveal>

      {/* Stats bar */}
      <ScrollReveal delay={1}>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="glass eluma-stat glow-cyan border-0">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-light text-[#94A3B8]">
                Total Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-extralight text-[#F8FAFC]">
                {stats.total}
              </span>
            </CardContent>
          </Card>

          <Card className="glass eluma-stat glow-cyan border-0">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-light text-[#94A3B8]">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-extralight gradient-text-aurora">
                {stats.averageScore}
              </span>
              <span className="text-sm font-light text-[#94A3B8]">
                /100
              </span>
            </CardContent>
          </Card>

          <Card className="glass eluma-stat glow-cyan border-0">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-light text-[#94A3B8]">
                AI Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-extralight text-[#F8FAFC]">
                {stats.aiCount}
              </span>
            </CardContent>
          </Card>

          <Card className="glass eluma-stat glow-cyan border-0">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-light text-[#94A3B8]">
                Peer Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-extralight text-[#F8FAFC]">
                {stats.peerCount}
              </span>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* Verification history (client component with TanStack Query) */}
      <ScrollReveal delay={2}>
        <div>
          <span className="eluma-badge mb-2 inline-block">Reports</span>
          <h2 className="mb-4 text-lg font-extralight text-[#F8FAFC]">
            <span className="inline-block h-4 w-1 rounded-full bg-[#4fd1c5] mr-2 align-middle" />
            All Verification Reports
          </h2>
          <VerificationHistory />
        </div>
      </ScrollReveal>
    </div>
  );
}
