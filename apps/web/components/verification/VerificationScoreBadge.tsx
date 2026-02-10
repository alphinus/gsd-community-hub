/**
 * Compact verification score badge with color coding.
 *
 * Displays a verification score as "87/100" with color-coded background:
 * - Violet (70+): strong verification
 * - Gold (50-69): moderate verification
 * - Red (<50): weak verification
 *
 * Score is on 0-10000 basis points scale internally, displayed as 0-100.
 */

interface VerificationScoreBadgeProps {
  /** Score in 0-10000 basis points scale */
  score: number;
  /** Maximum score (default 10000 for BPS, displayed as 100) */
  maxScore?: number;
  /** Badge size variant */
  size?: "sm" | "md" | "lg";
}

function getScoreColor(displayScore: number): string {
  if (displayScore >= 70) return "from-[var(--color-gsd-accent)] to-[var(--color-gsd-accent-hover)]";
  if (displayScore >= 50) return "from-[var(--color-gsd-gold)] to-yellow-400";
  return "from-red-500 to-rose-400";
}

function getTextColor(displayScore: number): string {
  if (displayScore >= 70) return "text-[var(--color-gsd-accent-hover)]";
  if (displayScore >= 50) return "text-[var(--color-gsd-gold)]";
  return "text-red-400";
}

const sizeClasses: Record<string, { wrapper: string; text: string }> = {
  sm: { wrapper: "px-2 py-0.5", text: "text-xs" },
  md: { wrapper: "px-3 py-1", text: "text-sm" },
  lg: { wrapper: "px-4 py-2", text: "text-lg" },
};

export function VerificationScoreBadge({
  score,
  maxScore = 10000,
  size = "md",
}: VerificationScoreBadgeProps) {
  // Convert from BPS to display scale (0-100)
  const displayScore = Math.round((score / maxScore) * 100);
  const displayMax = 100;
  const gradient = getScoreColor(displayScore);
  const textColor = getTextColor(displayScore);
  const classes = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${gradient} bg-opacity-15 ${classes.wrapper}`}
      style={{ background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`, opacity: 0.15 }}
    >
      {/* Use overlay approach for dark theme compatibility */}
      <span className={`font-bold ${textColor} ${classes.text}`}>
        {displayScore}
      </span>
      <span className={`font-normal text-[var(--color-gsd-text-muted)] ${classes.text}`}>
        /{displayMax}
      </span>
    </span>
  );
}
