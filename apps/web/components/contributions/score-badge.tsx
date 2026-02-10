import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface ScoreBadgeProps {
  /** Contribution score as BigInt string (scaled by 1e6 for fixed-point precision) */
  score: string;
  /** Number of verified tasks completed */
  tasksCompleted: number;
  /** Average verification score (0-10000 scale) */
  averageScore: number;
  /** Days active since first contribution */
  daysActive: number;
}

/**
 * Format a BigInt score string (scaled by 1e6) to a human-readable number.
 * e.g., "1500000" -> "1.50"
 */
function formatScore(scoreStr: string): string {
  try {
    const score = BigInt(scoreStr);
    const whole = score / 1_000_000n;
    const fraction = (score % 1_000_000n).toString().padStart(6, "0").slice(0, 2);
    return `${whole}.${fraction}`;
  } catch {
    return "0.00";
  }
}

/**
 * Format the average verification score from 0-10000 scale to percentage.
 * e.g., 8500 -> "85.00%"
 */
function formatAvgScore(avgScore: number): string {
  return (avgScore / 100).toFixed(0);
}

export function ScoreBadge({
  score,
  tasksCompleted,
  averageScore,
  daysActive,
}: ScoreBadgeProps) {
  const hasContributions = tasksCompleted > 0 && score !== "0";

  if (!hasContributions) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Contribution Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            No contributions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[var(--color-gsd-accent)] to-[var(--color-gsd-accent-hover)]" />
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Contribution Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold gradient-text-cyan">
            {formatScore(score)}
          </span>
        </div>
        <p className="mt-3 text-sm text-[var(--color-gsd-text-muted)]">
          {tasksCompleted} {tasksCompleted === 1 ? "task" : "tasks"} | {formatAvgScore(averageScore)}% avg score | {daysActive} {daysActive === 1 ? "day" : "days"} active
        </p>
      </CardContent>
    </Card>
  );
}
