"use client";

/**
 * Button to submit work for AI verification.
 *
 * Posts task data to /api/verification/submit and displays
 * loading state while AI processes. Shows toast notifications
 * for success/failure via sonner.
 */

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface VerificationReport {
  id: string;
  overallScore: number;
  confidence: number;
  status: string;
}

interface VerificationSubmitButtonProps {
  /** Task reference identifier */
  taskRef: string;
  /** Full plan content for context */
  planContent: string;
  /** Git diff of code changes */
  codeDiff: string;
  /** Test execution results */
  testResults: string;
  /** List of files created/modified */
  fileList: string[];
  /** Optional commit messages for workflow analysis */
  commitMessages?: string[];
  /** Callback on successful verification */
  onComplete?: (report: VerificationReport) => void;
}

export function VerificationSubmitButton({
  taskRef,
  planContent,
  codeDiff,
  testResults,
  fileList,
  commitMessages,
  onComplete,
}: VerificationSubmitButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskRef,
          planContent,
          codeDiff,
          testResults,
          fileList,
          commitMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Verification failed (${response.status})`
        );
      }

      const report: VerificationReport = await response.json();
      const displayScore = Math.round(report.overallScore / 100);

      toast.success(`Verification complete: ${displayScore}/100`, {
        description:
          report.status === "pending"
            ? "Low confidence -- peer review may be required"
            : "AI verification passed",
      });

      onComplete?.(report);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleSubmit} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying...
        </>
      ) : (
        <>
          <Shield className="h-4 w-4" />
          Submit for Verification
        </>
      )}
    </Button>
  );
}
