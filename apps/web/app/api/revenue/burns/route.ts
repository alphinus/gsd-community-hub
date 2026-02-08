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
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeBigInts(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * GET /api/revenue/burns - List burn history with traceability
 *
 * Query params:
 *   - page: Page number (default 1)
 *   - limit: Items per page (default 20, max 100)
 *
 * Returns revenue events that have a burn signature, showing only
 * burn-relevant fields. Each burn links back to the originating
 * revenue event via originSignature for full traceability.
 * BigInt fields are serialized as strings per project convention.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const where = { burnSignature: { not: null } };

    const [burns, total] = await Promise.all([
      prisma.revenueEvent.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        skip,
        take: limit,
        select: {
          eventIndex: true,
          token: true,
          burnAmount: true,
          burnSignature: true,
          gsdBurned: true,
          originSignature: true,
          recordedAt: true,
        },
      }),
      prisma.revenueEvent.count({ where }),
    ]);

    // Serialize BigInt fields as strings
    const serializedBurns = burns.map((burn) => serializeBigInts(burn));

    return NextResponse.json(
      {
        burns: serializedBurns,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/revenue/burns error:", error);
    return NextResponse.json(
      {
        burns: [],
        total: 0,
        page: 1,
        limit: 20,
      },
      { status: 200 }
    );
  }
}
