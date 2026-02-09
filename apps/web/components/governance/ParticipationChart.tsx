"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TurnoutByRound {
  roundIndex: number;
  title: string;
  distinctVoters: number;
  totalDepositors: number;
  turnoutRate: number;
}

interface ParticipationTrend {
  distinctVoters: number;
  turnoutRate: number;
}

interface ParticipationChartProps {
  turnoutByRound: TurnoutByRound[];
  participationTrends: {
    last30Days: ParticipationTrend;
    last60Days: ParticipationTrend;
    last90Days: ParticipationTrend;
  };
}

export function ParticipationChart({
  turnoutByRound,
  participationTrends,
}: ParticipationChartProps) {
  if (turnoutByRound.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)]">
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          No voting rounds completed yet
        </p>
      </div>
    );
  }

  const chartData = turnoutByRound.map((round) => ({
    name: `Round ${round.roundIndex}`,
    turnout: Math.round(round.turnoutRate * 100),
    voters: round.distinctVoters,
  }));

  const trends = [
    {
      period: "30 days",
      voters: participationTrends.last30Days.distinctVoters,
      turnout: `${Math.round(participationTrends.last30Days.turnoutRate * 100)}%`,
    },
    {
      period: "60 days",
      voters: participationTrends.last60Days.distinctVoters,
      turnout: `${Math.round(participationTrends.last60Days.turnoutRate * 100)}%`,
    },
    {
      period: "90 days",
      voters: participationTrends.last90Days.distinctVoters,
      turnout: `${Math.round(participationTrends.last90Days.turnoutRate * 100)}%`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Bar chart */}
      <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
          Voter Turnout by Round
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
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
                "Turnout",
              ]}
            />
            <Bar
              dataKey="turnout"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Participation trends table */}
      <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
          Participation Trends (Rolling Averages)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {trends.map((trend) => (
            <div
              key={trend.period}
              className="rounded-lg bg-[var(--color-gsd-bg)] p-3 text-center"
            >
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                Last {trend.period}
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-500">
                {trend.turnout}
              </p>
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                {trend.voters} unique voters
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
