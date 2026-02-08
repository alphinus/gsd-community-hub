import { NextRequest, NextResponse } from "next/server";
import {
  processContributionEvent,
  type HeliusEnhancedTransaction,
} from "@/lib/contributions/indexer";
import { processGovernanceEvent } from "@/lib/governance/indexer";
import {
  processRevenueEvent,
  processRevenueDetection,
} from "@/lib/revenue/indexer";

/**
 * POST /api/webhooks/helius
 *
 * Receives Helius enhanced transaction webhooks for on-chain events.
 *
 * Authentication: Validates the Authorization header against HELIUS_WEBHOOK_AUTH.
 * Payload: Array of Helius enhanced transactions.
 *
 * Each transaction is processed through 4 processors:
 * 1. Contribution: Finds gsd-hub program instructions, extracts ContributionLeaf from noop
 * 2. Governance: Identifies governance instruction discriminators (create_round, submit_idea, etc.)
 * 3. Revenue instructions: Identifies revenue instruction discriminators (record_revenue_event, claim, burn)
 * 4. Revenue detection: Detects raw SOL/USDC inflows to treasury and persists as PendingRevenue
 *
 * A transaction may match multiple processors. Each uses upsert for idempotency.
 * Duplicate webhook deliveries are silently ignored.
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

  // Process each transaction through all 4 processors
  let contributionsProcessed = 0;
  let governanceProcessed = 0;
  let revenueProcessed = 0;
  let revenueDetected = 0;
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

    // Step 1: Process gsd-hub revenue instructions (record/claim/burn)
    try {
      const count = await processRevenueEvent(tx);
      revenueProcessed += count;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to process revenue event ${tx.signature}:`,
        message
      );
      errors.push(`revenue:${tx.signature}: ${message}`);
    }

    // Step 2: Detect raw SOL/USDC treasury inflows and persist as PendingRevenue
    try {
      const count = await processRevenueDetection(tx);
      revenueDetected += count;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to detect revenue inflow ${tx.signature}:`,
        message
      );
      errors.push(`revenue-detection:${tx.signature}: ${message}`);
    }
  }

  const totalProcessed =
    contributionsProcessed +
    governanceProcessed +
    revenueProcessed +
    revenueDetected;

  if (errors.length > 0) {
    console.warn(
      `Webhook processed ${totalProcessed} events (${contributionsProcessed} contributions, ${governanceProcessed} governance, ${revenueProcessed} revenue, ${revenueDetected} detected) with ${errors.length} errors`
    );
  }

  return NextResponse.json({
    received: true,
    processed: totalProcessed,
    contributions: contributionsProcessed,
    governance: governanceProcessed,
    revenue: revenueProcessed,
    revenueDetected,
    total: transactions.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
