"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface PowerDistribution {
  giniCoefficient: number;
  top10Concentration: number;
  totalDepositors: number;
  totalDeposited: string;
}

interface QuadraticImpact {
  whaleReduction: number;
  smallHolderBoost: number;
}

interface VotingPowerDistributionProps {
  powerDistribution: PowerDistribution;
  quadraticImpact?: QuadraticImpact;
}

const COLORS = {
  top10: "#f59e0b", // amber-500
  rest: "#10b981", // emerald-500
};

function GiniIndicator({ value }: { value: number }) {
  let colorClass: string;
  let label: string;

  if (value < 0.4) {
    colorClass = "text-emerald-500 bg-emerald-500/15";
    label = "Low inequality";
  } else if (value <= 0.6) {
    colorClass = "text-amber-500 bg-amber-500/15";
    label = "Moderate inequality";
  } else {
    colorClass = "text-red-500 bg-red-500/15";
    label = "High inequality";
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-[var(--color-gsd-text)]">
        {value.toFixed(4)}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {label}
      </span>
    </div>
  );
}

export function VotingPowerDistribution({
  powerDistribution,
  quadraticImpact,
}: VotingPowerDistributionProps) {
  if (powerDistribution.totalDepositors === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)]">
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Deposit tokens to see power distribution
        </p>
      </div>
    );
  }

  const top10Pct = Math.round(powerDistribution.top10Concentration * 100);
  const restPct = 100 - top10Pct;

  const pieData = [
    { name: "Top 10 Holders", value: top10Pct },
    { name: "Other Holders", value: restPct },
  ];

  return (
    <div className="space-y-4">
      {/* Pie chart */}
      <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
          Voting Power Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({
                name,
                value,
              }: {
                name?: string;
                value?: number;
              }) => `${name ?? ""}: ${value ?? 0}%`}
              labelLine={false}
            >
              <Cell fill={COLORS.top10} />
              <Cell fill={COLORS.rest} />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "0.5rem",
                color: "#fafafa",
                fontSize: "0.875rem",
              }}
              formatter={(value: number | undefined) => [
                `${value ?? 0}%`,
                "Share",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "0.75rem", color: "#a1a1aa" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
          <p className="mb-1 text-xs text-[var(--color-gsd-text-muted)]">
            Gini Coefficient
          </p>
          <GiniIndicator value={powerDistribution.giniCoefficient} />
        </div>

        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
          <p className="mb-1 text-xs text-[var(--color-gsd-text-muted)]">
            Top 10 Hold
          </p>
          <p className="text-lg font-bold text-amber-500">
            {top10Pct}%{" "}
            <span className="text-xs font-normal text-[var(--color-gsd-text-muted)]">
              of voting power
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
          <p className="mb-1 text-xs text-[var(--color-gsd-text-muted)]">
            Total Active Voters
          </p>
          <p className="text-lg font-bold text-[var(--color-gsd-text)]">
            {powerDistribution.totalDepositors}
          </p>
        </div>
      </div>

      {/* Quadratic impact comparison */}
      {quadraticImpact && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h3 className="mb-3 text-sm font-semibold text-emerald-500">
            Quadratic Voting Impact
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                Whale Reduction
              </p>
              <p className="text-lg font-bold text-emerald-500">
                -{quadraticImpact.whaleReduction}%
              </p>
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                voting power for top 10
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                Small Holder Boost
              </p>
              <p className="text-lg font-bold text-emerald-500">
                +{quadraticImpact.smallHolderBoost}%
              </p>
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                voting power for bottom 50
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
