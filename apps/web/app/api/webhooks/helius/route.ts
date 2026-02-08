import { NextRequest, NextResponse } from "next/server";
import {
  processContributionEvent,
  type HeliusEnhancedTransaction,
} from "@/lib/contributions/indexer";
import { processGovernanceEvent } from "@/lib/governance/indexer";

/**
 * POST /api/webhooks/helius
 *
 * Receives Helius enhanced transaction webhooks for on-chain events.
 *
 * Authentication: Validates the Authorization header against HELIUS_WEBHOOK_AUTH.
 * Payload: Array of Helius enhanced transactions.
 *
 * Each transaction is processed for both contribution and governance data:
 * - Contribution: Finds gsd-hub program instructions, extracts ContributionLeaf from noop
 * - Governance: Identifies governance instruction discriminators (create_round, submit_idea, etc.)
 *
 * A transaction matches one processor or the other based on instruction type.
 * Duplicate webhook deliveries are silently ignored (upsert idempotency).
 */
export async function POST(request: NextRequest) {
  // Validate webhook authentication
  const webhookAuth = process.env.HELIUS_WEBHOOK_AUTH;
  if (!webhookAuth) {
    console.error("HELIUS_WEBHOOK_AUTH not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== webhookAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse the webhook payload
  let transactions: HeliusEnhancedTransaction[];
  try {
    const body = await request.json();
    // Helius sends an array of enhanced transactions
    transactions = Array.isArray(body) ? body : [body];
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Process each transaction through both contribution and governance processors
  let contributionsProcessed = 0;
  let governanceProcessed = 0;
  const errors: string[] = [];

  for (const tx of transactions) {
    if (!tx.signature) {
      errors.push("Transaction missing signature");
      continue;
    }

    // Try contribution processor
    try {
      const count = await processContributionEvent(tx);
      contributionsProcessed += count;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to process contribution ${tx.signature}:`,
        message
      );
      errors.push(`contribution:${tx.signature}: ${message}`);
    }

    // Try governance processor
    try {
      const count = await processGovernanceEvent(tx);
      governanceProcessed += count;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to process governance ${tx.signature}:`,
        message
      );
      errors.push(`governance:${tx.signature}: ${message}`);
    }
  }

  const totalProcessed = contributionsProcessed + governanceProcessed;

  if (errors.length > 0) {
    console.warn(
      `Webhook processed ${totalProcessed} events (${contributionsProcessed} contributions, ${governanceProcessed} governance) with ${errors.length} errors`
    );
  }

  return NextResponse.json({
    received: true,
    processed: totalProcessed,
    contributions: contributionsProcessed,
    governance: governanceProcessed,
    total: transactions.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
