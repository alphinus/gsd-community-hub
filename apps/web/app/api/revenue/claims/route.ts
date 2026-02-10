import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Serialize BigInt fields to strings for JSON transport.
 */
function serializeBigInts<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "bigint") {
      result[key] = value.toString();
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeBigInts(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * GET /api/revenue/claims - List per-wallet claim history
 *
 * Query params:
 *   - wallet: Claimant wallet address (required)
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20, max 100)
 *   - eventId: Optional filter by revenue event ID
 *
 * Returns paginated claims for the specified wallet, including
 * context from the parent revenue event.
 * BigInt fields are serialized as strings per project convention.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const eventId = searchParams.get("eventId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet query parameter is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { claimantWallet: wallet };
    if (eventId) {
      where.revenueEventId = eventId;
    }

    const [claims, total] = await Promise.all([
      prisma.revenueClaim.findMany({
        where,
        orderBy: { claimedAt: "desc" },
        skip,
        take: limit,
        include: {
          revenueEvent: {
            select: {
              eventIndex: true,
              token: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.revenueClaim.count({ where }),
    ]);

    // Serialize BigInt fields as strings
    const serializedClaims = claims.map((claim) => serializeBigInts(claim));

    return NextResponse.json(
      {
        claims: serializedClaims,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/revenue/claims error:", error);
    return NextResponse.json(
      {
        claims: [],
        total: 0,
        page: 1,
        limit: 20,
      },
      { status: 200 }
    );
  }
}
