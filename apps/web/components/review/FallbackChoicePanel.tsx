"use client";

/**
 * Fallback choice panel for low-confidence AI verification results.
 *
 * Per user decision: "contributor chooses: Peer Review OR re-submit
 * with more context." Presents two cards with clear descriptions
 * of each option.
 */

import { Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FallbackChoicePanelProps {
  /** ID of the verification report with low confidence */
  verificationReportId: string;
  /** Callback when contributor makes their choice */
  onChoice: (choice: "peer_review" | "resubmit") => void;
}

export function FallbackChoicePanel({
  verificationReportId: _verificationReportId,
  onChoice,
}: FallbackChoicePanelProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />

      <CardHeader>
        <CardTitle className="text-base">
          Low Confidence Result
        </CardTitle>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          The AI verification confidence is below the threshold. Choose how to
          proceed:
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Peer Review option */}
          <button
            onClick={() => onChoice("peer_review")}
            className="group rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] p-5 text-left transition-all hover:border-purple-500/40 hover:bg-purple-500/5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <h4 className="mb-1 text-sm font-semibold text-[var(--color-gsd-text)] group-hover:text-purple-300">
              Request Peer Review
            </h4>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              3+ community reviewers will assess your work. Takes up to 7 days.
            </p>
          </button>

          {/* Re-submit option */}
          <button
            onClick={() => onChoice("resubmit")}
            className="group rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] p-5 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <RefreshCw className="h-5 w-5 text-emerald-400" />
            </div>
            <h4 className="mb-1 text-sm font-semibold text-[var(--color-gsd-text)] group-hover:text-emerald-300">
              Re-submit with More Context
            </h4>
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Add more details and try AI verification again.
            </p>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
