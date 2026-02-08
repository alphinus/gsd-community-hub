import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { prisma } from "@/lib/db/prisma";
import {
  distributeRevenue,
  loadBurnAuthority,
} from "@/lib/revenue/distributor";

/**
 * POST /api/revenue/distribute
 *
 * Admin-only endpoint that triggers revenue distribution for a detected
 * treasury inflow. Supports two modes:
 *
 * 1. **Direct mode:** Provide totalAmount, token, and originSignature
 *    directly in the request body.
 * 2. **PendingRevenue mode:** Provide a pendingRevenueId to process a
 *    PendingRevenue record created by the webhook detection pipeline.
 *
 * Authentication: REVENUE_ADMIN_SECRET in the Authorization header.
 * Idempotency: Duplicate originSignature returns 409.
 */
export async function POST(request: NextRequest) {
  // --- Authentication ---
  const adminSecret = process.env.REVENUE_ADMIN_SECRET;
  if (!adminSecret) {
    console.error(
      "REVENUE_ADMIN_SECRET not configured -- distribution endpoint disabled"
    );
    return NextResponse.json(
      { error: "Distribution endpoint not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse request body ---
  let body: {
    totalAmount?: string;
    token?: "sol" | "usdc";
    originSignature?: string;
    pendingRevenueId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // --- Resolve parameters (direct or PendingRevenue mode) ---
  let totalAmount: string;
  let token: "sol" | "usdc";
  let originSignature: string;
  let pendingRevenueId: string | undefined = body.pendingRevenueId;

  if (pendingRevenueId) {
    // PendingRevenue mode
    try {
      const pending = await prisma.pendingRevenue.findUnique({
        where: { id: pendingRevenueId },
      });

      if (!pending) {
        return NextResponse.json(
          { error: "PendingRevenue not found" },
          { status: 404 }
        );
      }

      if (pending.status !== "pending") {
        return NextResponse.json(
          {
            error: `PendingRevenue already ${pending.status}`,
            status: pending.status,
          },
          { status: 409 }
        );
      }

      totalAmount = pending.amount.toString();
      token = pending.token as "sol" | "usdc";
      originSignature = pending.transactionSignature;
    } catch (error) {
      console.error("Error looking up PendingRevenue:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
  } else {
    // Direct mode -- validate required fields
    if (!body.totalAmount || !body.token || !body.originSignature) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: totalAmount, token, originSignature (or provide pendingRevenueId)",
        },
        { status: 400 }
      );
    }

    if (body.token !== "sol" && body.token !== "usdc") {
      return NextResponse.json(
        { error: 'Invalid token: must be "sol" or "usdc"' },
        { status: 400 }
      );
    }

    try {
      BigInt(body.totalAmount);
    } catch {
      return NextResponse.json(
        { error: "Invalid totalAmount: must be a valid BigInt string" },
        { status: 400 }
      );
    }

    totalAmount = body.totalAmount;
    token = body.token;
    originSignature = body.originSignature;
  }

  // --- Idempotency check ---
  try {
    const existing = await prisma.revenueEvent.findUnique({
      where: { originSignature },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "Revenue event already processed for this originSignature",
          existingEvent: {
            eventIndex: existing.eventIndex,
            status: existing.status,
            totalAmount: existing.totalAmount.toString(),
            createdAt: existing.createdAt.toISOString(),
          },
        },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Idempotency check failed:", error);
    return NextResponse.json(
      { error: "Database error during idempotency check" },
      { status: 500 }
    );
  }

  // --- Execute distribution ---
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com"
    );

    const burnAuthority = loadBurnAuthority();

    const result = await distributeRevenue({
      totalAmount: BigInt(totalAmount),
      token,
      originSignature,
      connection,
      burnAuthority: burnAuthority ?? undefined,
      jupiterApiKey: process.env.JUPITER_API_KEY,
      gsdMint: process.env.NEXT_PUBLIC_GSD_MINT,
    });

    // Update PendingRevenue record if applicable
    if (pendingRevenueId) {
      try {
        await prisma.pendingRevenue.update({
          where: { id: pendingRevenueId },
          data: {
            status: "processed",
            processedEventId: result.eventId,
            reviewedAt: new Date(),
          },
        });
      } catch (error) {
        // Log but don't fail -- the distribution itself succeeded
        console.error(
          "Failed to update PendingRevenue status:",
          error
        );
      }
    }

    return NextResponse.json({
      eventId: result.eventId,
      eventIndex: result.eventIndex,
      splits: {
        developerPool: result.splits.developerPool.toString(),
        treasuryReserve: result.splits.treasuryReserve.toString(),
        burnAmount: result.splits.burnAmount.toString(),
        maintenance: result.splits.maintenance.toString(),
      },
      burnResult: result.burnResult
        ? {
            swapSignature: result.burnResult.swapSignature,
            gsdBurned: result.burnResult.gsdBurned.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Distribution failed:", error);
    return NextResponse.json(
      {
        error: "Distribution failed",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
