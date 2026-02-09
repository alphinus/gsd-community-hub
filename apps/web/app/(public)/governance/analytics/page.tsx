import type { Metadata } from "next";
import { GovernanceAnalytics } from "@/components/governance/GovernanceAnalytics";

export const metadata: Metadata = {
  title: "Governance Analytics | GSD Community Hub",
  description:
    "Real-time governance participation, voting power distribution, and delegation analytics",
};

export default function GovernanceAnalyticsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-gsd-text)] sm:text-4xl">
          Governance Analytics
        </h1>
        <p className="mt-2 text-lg text-[var(--color-gsd-text-secondary)]">
          Data-driven insights into governance health and participation
        </p>
      </div>

      {/* Analytics dashboard */}
      <GovernanceAnalytics />
    </div>
  );
}
