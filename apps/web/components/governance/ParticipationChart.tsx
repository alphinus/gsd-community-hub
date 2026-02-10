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
      <div className="flex h-[300px] items-center justify-center glass rounded-2xl">
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
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
          Voter Turnout by Round
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.15)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              axisLine={{ stroke: "rgba(139, 92, 246, 0.2)" }}
            />
            <YAxis
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              axisLine={{ stroke: "rgba(139, 92, 246, 0.2)" }}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161637",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "1rem",
                color: "#F8FAFC",
                fontSize: "0.875rem",
              }}
              formatter={(value: number | undefined) => [
                `${value ?? 0}%`,
                "Turnout",
              ]}
            />
            <Bar
              dataKey="turnout"
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Participation trends table */}
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-gsd-text)]">
          Participation Trends (Rolling Averages)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {trends.map((trend) => (
            <div
              key={trend.period}
              className="rounded-2xl bg-[var(--color-gsd-bg)] p-3 text-center transition-theme duration-200"
            >
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                Last {trend.period}
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--color-gsd-accent)]">
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
