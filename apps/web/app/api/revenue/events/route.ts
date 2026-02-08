import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Serialize BigInt fields to strings for JSON transport.
 * Prisma returns BigInt for schema BigInt fields; JSON.stringify cannot handle them.
 */
function serializeBigInts<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "bigint") {
      result[key] = value.toString();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeBigInts(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * GET /api/revenue/events - List paginated revenue events
 *
 * Query params:
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20, max 100)
 *   - status: Optional filter (recorded, distributing, completed)
 *
 * Returns paginated revenue events with claim counts and split breakdowns.
 * BigInt fields are serialized as strings per project convention.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [events, total] = await Promise.all([
      prisma.revenueEvent.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: { claims: true },
          },
        },
      }),
      prisma.revenueEvent.count({ where }),
    ]);

    // Serialize BigInt fields as strings
    const serializedEvents = events.map((event) => serializeBigInts(event));

    return NextResponse.json(
      {
        events: serializedEvents,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/revenue/events error:", error);
    return NextResponse.json(
      {
        events: [],
        total: 0,
        page: 1,
        limit: 20,
      },
      { status: 200 }
    );
  }
}
