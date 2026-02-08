import { NextRequest, NextResponse } from "next/server";
import {
  processContributionEvent,
  type HeliusEnhancedTransaction,
} from "@/lib/contributions/indexer";

/**
 * POST /api/webhooks/helius
 *
 * Receives Helius enhanced transaction webhooks for on-chain contribution events.
 *
 * Authentication: Validates the Authorization header against HELIUS_WEBHOOK_AUTH.
 * Payload: Array of Helius enhanced transactions.
 *
 * Each transaction is processed for contribution data:
 * - Finds gsd-hub program instructions
 * - Extracts ContributionLeaf from noop inner instructions
 * - Upserts to PostgreSQL with transaction signature idempotency
 *
 * Duplicate webhook deliveries are silently ignored (no duplicate records).
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

  // Process each transaction
  let processed = 0;
  const errors: string[] = [];

  for (const tx of transactions) {
    if (!tx.signature) {
      errors.push("Transaction missing signature");
      continue;
    }

    try {
      const count = await processContributionEvent(tx);
      processed += count;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Failed to process transaction ${tx.signature}:`,
        message
      );
      errors.push(`${tx.signature}: ${message}`);
    }
  }

  if (errors.length > 0) {
    console.warn(
      `Webhook processed ${processed} contributions with ${errors.length} errors`
    );
  }

  return NextResponse.json({
    received: true,
    processed,
    total: transactions.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
