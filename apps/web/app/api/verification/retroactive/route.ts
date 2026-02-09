import { NextRequest, NextResponse } from "next/server";
import {
  runRetroactiveMigration,
  getMigrationStatus,
  cancelMigration,
} from "@/lib/verification/migration";

/**
 * POST /api/verification/retroactive
 *
 * Admin-only endpoint to start or cancel retroactive migration of
 * Phase 2-4 contributions through AI verification.
 *
 * Authentication: REVENUE_ADMIN_SECRET in the Authorization header
 * (reuses existing admin auth pattern from /api/revenue/distribute).
 *
 * Request body:
 *   - action: "start" | "cancel" (required)
 *   - batchSize?: number (optional, default 15)
 *   - delayMs?: number (optional, default 240000)
 *
 * This endpoint is temporary -- once retroactive migration completes
 * for all Phase 2-4 contributions, it is no longer needed.
 */
export async function POST(request: NextRequest) {
  // --- Admin authentication ---
  const adminSecret = process.env.REVENUE_ADMIN_SECRET;
  if (!adminSecret) {
    console.error(
      "REVENUE_ADMIN_SECRET not configured -- retroactive migration endpoint disabled"
    );
    return NextResponse.json(
      { error: "Migration endpoint not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse request body ---
  let body: {
    action?: string;
    batchSize?: number;
    delayMs?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.action || (body.action !== "start" && body.action !== "cancel")) {
    return NextResponse.json(
      { error: 'Invalid action: must be "start" or "cancel"' },
      { status: 400 }
    );
  }

  // --- Handle actions ---
  if (body.action === "start") {
    const currentStatus = getMigrationStatus();

    if (currentStatus.inProgress) {
      return NextResponse.json(
        {
          error: "Migration already in progress",
          status: currentStatus,
        },
        { status: 409 }
      );
    }

    // Fire-and-forget: start migration without awaiting
    // This allows the endpoint to return immediately while migration
    // runs as a background process on the app server
    runRetroactiveMigration(body.batchSize, body.delayMs).catch((error) => {
      console.error("[Migration] Unhandled error in background migration:", error);
    });

    return NextResponse.json({
      message: "Migration started",
      status: getMigrationStatus(),
    });
  }

  if (body.action === "cancel") {
    cancelMigration();

    return NextResponse.json({
      message: "Migration cancellation requested",
      status: getMigrationStatus(),
    });
  }

  // Should not reach here due to action validation above
  return NextResponse.json(
    { error: "Unknown action" },
    { status: 400 }
  );
}

/**
 * GET /api/verification/retroactive
 *
 * Admin-only endpoint to check the current retroactive migration status.
 * Allows monitoring progress via polling.
 *
 * Authentication: REVENUE_ADMIN_SECRET in the Authorization header.
 */
export async function GET(request: NextRequest) {
  // --- Admin authentication ---
  const adminSecret = process.env.REVENUE_ADMIN_SECRET;
  if (!adminSecret) {
    console.error(
      "REVENUE_ADMIN_SECRET not configured -- retroactive migration endpoint disabled"
    );
    return NextResponse.json(
      { error: "Migration endpoint not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getMigrationStatus());
}
