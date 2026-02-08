import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/transparency/changelog
 *
 * Public endpoint (no auth required). Returns program upgrade history
 * from the database, ordered by date descending with pagination.
 *
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const skip = (page - 1) * limit;

  try {
    const [upgrades, total] = await Promise.all([
      prisma.programUpgrade.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.programUpgrade.count(),
    ]);

    return NextResponse.json({
      upgrades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    // Database may not be configured yet during early development.
    // Return empty state instead of an error so the page still renders.
    console.error("Failed to fetch changelog:", error);
    return NextResponse.json({
      upgrades: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  }
}
