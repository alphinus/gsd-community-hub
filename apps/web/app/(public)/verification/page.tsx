import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerificationHistory } from "@/components/verification/VerificationHistory";

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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-gsd-text)]">
          Verification Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gsd-text-muted)]">
          Publicly auditable AI and peer verification reports for all
          contributions
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-[var(--color-gsd-text-muted)]">
              Total Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-[var(--color-gsd-text)]">
              {stats.total}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-[var(--color-gsd-text-muted)]">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              {stats.averageScore}
            </span>
            <span className="text-sm text-[var(--color-gsd-text-muted)]">
              /100
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-[var(--color-gsd-text-muted)]">
              AI Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-[var(--color-gsd-text)]">
              {stats.aiCount}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-[var(--color-gsd-text-muted)]">
              Peer Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-[var(--color-gsd-text)]">
              {stats.peerCount}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Verification history (client component with TanStack Query) */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          All Verification Reports
        </h2>
        <VerificationHistory />
      </div>
    </div>
  );
}
