"use client";

interface QuadraticVoteDisplayProps {
  /** Raw deposited amount as BigInt string (lamports) */
  depositedAmount: string;
  /** Whether quadratic voting is currently enabled */
  isQuadratic: boolean;
  /** Optional delegated amount as BigInt string (lamports) */
  delegatedAmount?: string;
}

function formatTokens(amountStr: string): string {
  try {
    return (Number(BigInt(amountStr)) / 1e9).toFixed(2);
  } catch {
    return "0.00";
  }
}

function sqrtWeight(amountStr: string): string {
  try {
    const tokens = Number(BigInt(amountStr)) / 1e9;
    return Math.sqrt(tokens).toFixed(2);
  } catch {
    return "0.00";
  }
}

export function QuadraticVoteDisplay({
  depositedAmount,
  isQuadratic,
  delegatedAmount,
}: QuadraticVoteDisplayProps) {
  const depositTokens = formatTokens(depositedAmount);
  const delegatedTokens = delegatedAmount ? formatTokens(delegatedAmount) : null;

  // Compute total for weight calculation
  const totalRaw =
    BigInt(depositedAmount || "0") + BigInt(delegatedAmount || "0");
  const totalStr = totalRaw.toString();
  const totalTokens = formatTokens(totalStr);

  const weight = isQuadratic ? sqrtWeight(totalStr) : totalTokens;

  return (
    <div className="glass rounded-2xl p-4 transition-theme duration-200">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--color-gsd-text-muted)]">
          Vote Weight
        </p>
        <span
          className={`rounded-xl px-2 py-0.5 text-[10px] font-semibold ${
            isQuadratic
              ? "bg-[var(--color-gsd-accent)]/15 text-[var(--color-gsd-accent)]"
              : "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text-muted)]"
          }`}
        >
          {isQuadratic ? "Quadratic" : "Linear"}
        </span>
      </div>

      {/* Weight display */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold gradient-text-cyan">
          {weight}
        </span>
        <span className="text-xs text-[var(--color-gsd-text-muted)]">
          vote weight
        </span>
      </div>

      {/* Formula breakdown */}
      <div className="mt-3 space-y-1">
        {isQuadratic ? (
          <>
            {delegatedTokens ? (
              <div className="space-y-1 text-xs text-[var(--color-gsd-text-muted)]">
                <p>
                  Your deposit:{" "}
                  <span className="text-[var(--color-gsd-text-secondary)]">
                    {depositTokens}
                  </span>{" "}
                  + Delegated:{" "}
                  <span className="text-[var(--color-gsd-text-secondary)]">
                    {delegatedTokens}
                  </span>{" "}
                  = Total:{" "}
                  <span className="text-[var(--color-gsd-text-secondary)]">
                    {totalTokens}
                  </span>
                </p>
                <p className="font-mono text-[var(--color-gsd-accent-hover)]/80">
                  sqrt({totalTokens}) = {weight}
                </p>
              </div>
            ) : (
              <p className="font-mono text-xs text-[var(--color-gsd-accent-hover)]/80">
                sqrt({depositTokens}) = {weight}
              </p>
            )}
            <p className="text-[10px] text-[var(--color-gsd-text-muted)]">
              Quadratic voting reduces the influence of large holders
            </p>
          </>
        ) : (
          <>
            {delegatedTokens ? (
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                Your deposit:{" "}
                <span className="text-[var(--color-gsd-text-secondary)]">
                  {depositTokens}
                </span>{" "}
                + Delegated:{" "}
                <span className="text-[var(--color-gsd-text-secondary)]">
                  {delegatedTokens}
                </span>{" "}
                = {totalTokens} tokens = {weight} weight
              </p>
            ) : (
              <p className="text-xs text-[var(--color-gsd-text-muted)]">
                {depositTokens} tokens = {weight} vote weight
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
