import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/revenue/summary - Aggregate revenue totals
 *
 * No query params required.
 *
 * Returns aggregate revenue, distribution, burn, and event count totals.
 * All amounts are string-serialized BigInt per project convention.
 *
 * Cached for 30 seconds via Cache-Control headers (matching treasury route pattern).
 */
export async function GET() {
  try {
    const [aggregates, eventCount] = await Promise.all([
      prisma.revenueEvent.aggregate({
        _sum: {
          totalAmount: true,
          burnAmount: true,
          gsdBurned: true,
          claimedAmount: true,
        },
      }),
      prisma.revenueEvent.count(),
    ]);

    const totalRevenue = (aggregates._sum.totalAmount ?? BigInt(0)).toString();
    const totalDistributed = (
      aggregates._sum.claimedAmount ?? BigInt(0)
    ).toString();
    const totalBurnAllocated = (
      aggregates._sum.burnAmount ?? BigInt(0)
    ).toString();
    const totalGsdBurned = (
      aggregates._sum.gsdBurned ?? BigInt(0)
    ).toString();

    return NextResponse.json(
      {
        totalRevenue,
        totalDistributed,
        totalBurnAllocated,
        totalGsdBurned,
        eventCount,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/revenue/summary error:", error);
    return NextResponse.json(
      {
        totalRevenue: "0",
        totalDistributed: "0",
        totalBurnAllocated: "0",
        totalGsdBurned: "0",
        eventCount: 0,
      },
      { status: 200 }
    );
  }
}
