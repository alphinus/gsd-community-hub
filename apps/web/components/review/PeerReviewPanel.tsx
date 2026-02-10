"use client";

/**
 * Peer review submission panel.
 *
 * Shows current consensus status and provides a form for submitting
 * peer reviews with score, pass/fail, and required evidence.
 * Evidence must include at least 1 criterion entry (anti-rubber-stamping).
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewConsensusProgress } from "./ReviewConsensusProgress";
import type { PeerReviewInfo, ReviewerTier } from "@gsd/types";
import { MIN_REVIEWERS, CONSENSUS_THRESHOLD } from "@/lib/review/constants";

interface ReviewStatusResponse {
  verificationReportId: string;
  taskRef: string;
  reviews: PeerReviewInfo[];
  hasConsensus: boolean;
  consensusPassed: boolean;
  weightedScore: number;
}

interface EvidenceEntry {
  criterion: string;
  met: boolean;
  details: string;
}

interface PeerReviewPanelProps {
  verificationReportId: string;
  onReviewSubmitted?: () => void;
}

export function PeerReviewPanel({
  verificationReportId,
  onReviewSubmitted,
}: PeerReviewPanelProps) {
  const queryClient = useQueryClient();

  // Form state
  const [score, setScore] = useState(70);
  const [passed, setPassed] = useState(true);
  const [evidence, setEvidence] = useState<EvidenceEntry[]>([
    { criterion: "", met: true, details: "" },
  ]);

  // Fetch current consensus status
  const { data: status, isLoading: statusLoading } =
    useQuery<ReviewStatusResponse>({
      queryKey: ["review-status", verificationReportId],
      queryFn: async () => {
        const res = await fetch(
          `/api/review/status/${verificationReportId}`
        );
        if (!res.ok) throw new Error("Failed to fetch review status");
        return res.json();
      },
      staleTime: 15_000,
    });

  // Submit review mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const body = {
        verificationReportId,
        score: score * 100, // Scale to 0-10000 BPS
        passed,
        evidenceJson: evidence.map((e) => ({
          criterion: e.criterion,
          met: e.met,
          details: e.details,
        })),
      };

      const res = await fetch("/api/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? `Submit failed (${res.status})`);
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Review submitted successfully");
      queryClient.invalidateQueries({
        queryKey: ["review-status", verificationReportId],
      });
      onReviewSubmitted?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Evidence management
  const addEvidence = useCallback(() => {
    setEvidence((prev) => [...prev, { criterion: "", met: true, details: "" }]);
  }, []);

  const removeEvidence = useCallback((index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateEvidence = useCallback(
    (index: number, field: keyof EvidenceEntry, value: string | boolean) => {
      setEvidence((prev) =>
        prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
      );
    },
    []
  );

  // Validate form
  const isValid =
    evidence.length >= 1 &&
    evidence.every((e) => e.criterion.trim() && e.details.trim());

  if (statusLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-gsd-text-muted)]" />
          <span className="ml-2 text-sm text-[var(--color-gsd-text-muted)]">
            Loading review status...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass overflow-hidden">
      <div className="h-1 gradient-cyan" />

      <CardHeader>
        <CardTitle className="text-base">Peer Review</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Consensus status */}
        {status && (
          <ReviewConsensusProgress
            reviews={status.reviews}
            minReviewers={MIN_REVIEWERS}
            consensusThreshold={CONSENSUS_THRESHOLD}
          />
        )}

        {/* Review form */}
        {status && !status.hasConsensus && (
          <div className="space-y-4 border-t border-[var(--color-gsd-border-subtle)] pt-4">
            <h4 className="text-sm font-semibold text-[var(--color-gsd-text)]">
              Submit Your Review
            </h4>

            {/* Score slider */}
            <div>
              <label className="mb-1 block text-xs text-[var(--color-gsd-text-muted)]">
                Score: {score}/100
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-[var(--color-gsd-accent)]"
              />
            </div>

            {/* Pass/fail toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-gsd-text-muted)]">
                Verdict:
              </span>
              <button
                onClick={() => setPassed(true)}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-theme duration-200 ${
                  passed
                    ? "bg-[var(--color-gsd-accent)]/20 text-[var(--color-gsd-accent-hover)] border border-[var(--color-gsd-accent)]/30"
                    : "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text-muted)] border border-transparent"
                }`}
              >
                Pass
              </button>
              <button
                onClick={() => setPassed(false)}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-theme duration-200 ${
                  !passed
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text-muted)] border border-transparent"
                }`}
              >
                Fail
              </button>
            </div>

            {/* Evidence entries */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-gsd-text-muted)]">
                  Evidence (min 1 required)
                </span>
                <button
                  onClick={addEvidence}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs text-[var(--color-gsd-accent)] transition-theme duration-200 hover:text-[var(--color-gsd-accent-hover)] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add criterion
                </button>
              </div>

              <div className="space-y-3">
                {evidence.map((entry, i) => (
                  <div
                    key={i}
                    className="glass-surface rounded-2xl p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Criterion (e.g., Error handling)"
                        value={entry.criterion}
                        onChange={(e) =>
                          updateEvidence(i, "criterion", e.target.value)
                        }
                        className="flex-1 rounded-xl bg-[var(--color-gsd-surface-raised)] px-2 py-1 text-xs text-[var(--color-gsd-text)] placeholder-[var(--color-gsd-text-muted)] outline-none focus:ring-1 focus:ring-[var(--color-gsd-accent)]"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateEvidence(i, "met", !entry.met)}
                          className={`cursor-pointer rounded-xl px-2 py-0.5 text-xs transition-theme duration-200 ${
                            entry.met
                              ? "bg-[var(--color-gsd-accent)]/20 text-[var(--color-gsd-accent-hover)]"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {entry.met ? "Met" : "Not Met"}
                        </button>
                        {evidence.length > 1 && (
                          <button
                            onClick={() => removeEvidence(i)}
                            className="cursor-pointer text-[var(--color-gsd-text-muted)] transition-theme duration-200 hover:text-[var(--color-gsd-error)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      placeholder="Evidence details..."
                      value={entry.details}
                      onChange={(e) =>
                        updateEvidence(i, "details", e.target.value)
                      }
                      rows={2}
                      className="w-full resize-none rounded-xl bg-[var(--color-gsd-surface-raised)] px-2 py-1 text-xs text-[var(--color-gsd-text)] placeholder-[var(--color-gsd-text-muted)] outline-none focus:ring-1 focus:ring-[var(--color-gsd-accent)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!isValid || submitMutation.isPending}
              className="w-full"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
