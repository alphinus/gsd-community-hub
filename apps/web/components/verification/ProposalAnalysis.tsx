"use client";

/**
 * AI proposal analysis display for governance ideas.
 *
 * Fetches analysis from /api/governance/ideas/[ideaId]/analysis and shows
 * feasibility score, effort estimate, risk level, recommendation, and
 * expandable sections for technical analysis, impact assessment, and cost.
 *
 * Per user decision: "AI-Score has weighted influence on voting outcomes."
 * Shows threshold-based banners for feasibility gates.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalysisData {
  status: "pending" | "completed" | "unavailable";
  feasibilityScore?: number;
  estimatedEffort?: string;
  riskLevel?: string;
  recommendation?: string;
  analysisJson?: {
    technicalAnalysis?: string;
    impactAssessment?: string;
    costEstimate?: string;
    reasoning?: string;
  };
}

interface ProposalAnalysisProps {
  ideaId: string;
}

function getRiskColor(risk: string): string {
  switch (risk) {
    case "low":
      return "text-emerald-400";
    case "medium":
      return "text-amber-400";
    case "high":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-[var(--color-gsd-text-muted)]";
  }
}

function getRecommendationVariant(
  rec: string
): "success" | "warning" | "outline" {
  switch (rec) {
    case "approve":
      return "success";
    case "needs_revision":
      return "warning";
    case "reject":
      return "outline";
    default:
      return "outline";
  }
}

function getEffortLabel(effort: string): string {
  switch (effort) {
    case "small":
      return "Small (1-2 days)";
    case "medium":
      return "Medium (1-2 weeks)";
    case "large":
      return "Large (1-2 months)";
    case "epic":
      return "Epic (3+ months)";
    default:
      return effort;
  }
}

function FeasibilityBanner({
  score,
}: {
  score: number;
}) {
  if (score >= 60) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="text-sm text-emerald-300">
          AI Assessment: Feasible
        </span>
      </div>
    );
  }

  if (score >= 30) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="text-sm text-amber-300">
          AI Assessment: Needs Revision -- flagged for careful review
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
      <span className="text-sm text-red-300">
        AI Assessment: Technically Infeasible -- requires 80% supermajority to
        pass
      </span>
    </div>
  );
}

function ExpandableSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-[var(--color-gsd-border-subtle)] pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--color-gsd-text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--color-gsd-text-muted)]" />
        )}
        <span className="text-sm font-medium text-[var(--color-gsd-text)]">
          {title}
        </span>
      </button>
      {expanded && (
        <p className="mt-2 pl-6 text-sm text-[var(--color-gsd-text-secondary)] whitespace-pre-wrap">
          {content}
        </p>
      )}
    </div>
  );
}

export function ProposalAnalysis({ ideaId }: ProposalAnalysisProps) {
  const { data, isLoading } = useQuery<AnalysisData>({
    queryKey: ["proposal-analysis", ideaId],
    queryFn: async () => {
      const res = await fetch(`/api/governance/ideas/${ideaId}/analysis`);
      if (!res.ok) {
        if (res.status === 404) return { status: "unavailable" as const };
        throw new Error("Failed to fetch analysis");
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-gsd-text-muted)]" />
          <span className="ml-2 text-sm text-[var(--color-gsd-text-muted)]">
            Loading analysis...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Pending state
  if (data?.status === "pending") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-gsd-accent)]" />
          <span className="ml-2 text-sm text-[var(--color-gsd-text-muted)]">
            AI analyzing proposal...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Unavailable state
  if (!data || data.status === "unavailable") {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Info className="h-4 w-4 text-[var(--color-gsd-text-muted)]" />
          <span className="ml-2 text-sm text-[var(--color-gsd-text-muted)]">
            AI analysis not available for this proposal
          </span>
        </CardContent>
      </Card>
    );
  }

  // Completed state
  const {
    feasibilityScore = 0,
    estimatedEffort = "medium",
    riskLevel = "medium",
    recommendation = "needs_revision",
    analysisJson,
  } = data;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

      <CardHeader>
        <CardTitle className="text-base">AI Proposal Analysis</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feasibility banner */}
        <FeasibilityBanner score={feasibilityScore} />

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Feasibility score */}
          <div className="rounded-lg bg-[var(--color-gsd-surface-raised)] p-3 text-center">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">
              Feasibility
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--color-gsd-text)]">
              {feasibilityScore}
              <span className="text-sm font-normal text-[var(--color-gsd-text-muted)]">
                /100
              </span>
            </p>
          </div>

          {/* Effort estimate */}
          <div className="rounded-lg bg-[var(--color-gsd-surface-raised)] p-3 text-center">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">Effort</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-gsd-text)]">
              {getEffortLabel(estimatedEffort)}
            </p>
          </div>

          {/* Risk level */}
          <div className="rounded-lg bg-[var(--color-gsd-surface-raised)] p-3 text-center">
            <p className="text-xs text-[var(--color-gsd-text-muted)]">Risk</p>
            <p
              className={`mt-1 text-sm font-semibold capitalize ${getRiskColor(
                riskLevel
              )}`}
            >
              {riskLevel}
            </p>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg bg-[var(--color-gsd-surface-raised)] p-3 text-center">
            <p className="mb-1 text-xs text-[var(--color-gsd-text-muted)]">
              Recommendation
            </p>
            <Badge variant={getRecommendationVariant(recommendation)}>
              {recommendation.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Reasoning */}
        {analysisJson?.reasoning && (
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-gsd-text-muted)]">
              Reasoning
            </h4>
            <p className="text-sm text-[var(--color-gsd-text-secondary)]">
              {analysisJson.reasoning}
            </p>
          </div>
        )}

        {/* Expandable sections */}
        <div className="space-y-1">
          {analysisJson?.technicalAnalysis && (
            <ExpandableSection
              title="Technical Analysis"
              content={analysisJson.technicalAnalysis}
            />
          )}
          {analysisJson?.impactAssessment && (
            <ExpandableSection
              title="Impact Assessment"
              content={analysisJson.impactAssessment}
            />
          )}
          {analysisJson?.costEstimate && (
            <ExpandableSection
              title="Cost Estimate"
              content={analysisJson.costEstimate}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
