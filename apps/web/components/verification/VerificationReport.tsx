"use client";

/**
 * Full verification report display with score breakdown.
 *
 * Per user decision: "Score displayed as total (e.g., 87/100) with full
 * breakdown by categories." Complete AI verification report is publicly visible.
 *
 * Shows:
 * - Header with large score badge, verification type, and date
 * - Summary text
 * - 5 category cards with score bars and expandable findings
 * - Files analyzed, recommendations, domain tags
 * - Report hash for integrity verification
 */

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationScoreBadge } from "./VerificationScoreBadge";
import type {
  VerificationReportInfo,
  VerificationCategory,
} from "@gsd/types";

interface VerificationReportProps {
  report: VerificationReportInfo;
}

function getBarColor(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 70) return "bg-[var(--color-gsd-accent)]";
  if (pct >= 50) return "bg-[var(--color-gsd-gold)]";
  return "bg-red-500";
}

function CategoryCard({ category }: { category: VerificationCategory }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((category.score / category.maxScore) * 100);
  const barColor = getBarColor(category.score, category.maxScore);

  return (
    <div className="glass-surface rounded-2xl p-4 transition-theme duration-200 hover:border-[var(--color-gsd-accent)]/20">
      {/* Category header with score */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--color-gsd-text-muted)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--color-gsd-text-muted)]" />
          )}
          <span className="text-sm font-medium text-[var(--color-gsd-text)]">
            {category.name}
          </span>
        </div>
        <span className="text-sm font-semibold text-[var(--color-gsd-text-secondary)]">
          {pct}%
        </span>
      </button>

      {/* Score bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
        <div
          className={`h-full rounded-full transition-theme ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Expandable findings */}
      {expanded && category.findings && category.findings.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[var(--color-gsd-border-subtle)] pt-3">
          {category.findings.map((finding, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span
                className={`mt-0.5 shrink-0 ${
                  finding.met
                    ? "text-[var(--color-gsd-success)]"
                    : "text-[var(--color-gsd-error)]"
                }`}
              >
                {finding.met ? "PASS" : "FAIL"}
              </span>
              <div>
                <p className="font-medium text-[var(--color-gsd-text)]">
                  {finding.criterion}
                </p>
                <p className="text-[var(--color-gsd-text-muted)]">
                  {finding.evidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VerificationReport({ report }: VerificationReportProps) {
  const [hashCopied, setHashCopied] = useState(false);

  function handleCopyHash() {
    navigator.clipboard.writeText(report.reportHash);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  }

  const dateStr = new Date(report.verifiedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Build categories array from report data
  const categories: VerificationCategory[] = report.categories ?? [];

  return (
    <Card className="glass overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[var(--color-gsd-accent)] to-[var(--color-gsd-accent-hover)]" />

      <CardHeader>
        {/* Header: Score + Type + Date */}
        <div className="flex flex-wrap items-center gap-3">
          <VerificationScoreBadge score={report.score} size="lg" />

          <Badge
            variant={report.verificationType === "ai" ? "default" : "secondary"}
          >
            {report.verificationType === "ai" ? (
              <>
                <Shield className="mr-1 h-3 w-3" />
                AI Verified
              </>
            ) : (
              <>
                <Users className="mr-1 h-3 w-3" />
                Peer Reviewed
              </>
            )}
          </Badge>

          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            {dateStr}
          </span>
        </div>

        <CardTitle className="mt-2 text-base">
          Verification Report: {report.taskRef}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary */}
        {categories.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-gsd-text-muted)]">
              Summary
            </h4>
            <p className="text-sm text-[var(--color-gsd-text-secondary)]">
              Verification completed with {categories.length} categories evaluated.
            </p>
          </div>
        )}

        {/* Category breakdown */}
        {categories.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-gsd-text-muted)]">
              Category Breakdown
            </h4>
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <CategoryCard key={i} category={cat} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {/* Recommendations would come from reportJson, rendered if available */}

        {/* Report hash */}
        <div className="flex items-center gap-2 border-t border-[var(--color-gsd-border-subtle)] pt-4">
          <span className="text-xs text-[var(--color-gsd-text-muted)]">
            Report Hash:
          </span>
          <code className="font-mono text-xs text-[var(--color-gsd-text-secondary)]">
            {report.reportHash.slice(0, 12)}...{report.reportHash.slice(-8)}
          </code>
          <button
            onClick={handleCopyHash}
            className="inline-flex h-5 w-5 cursor-pointer items-center justify-center text-[var(--color-gsd-text-muted)] transition-theme duration-200 hover:text-[var(--color-gsd-text)]"
            title="Copy report hash"
          >
            {hashCopied ? (
              <Check className="h-3 w-3 text-[var(--color-gsd-success)]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
