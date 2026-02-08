import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/profile/[wallet] - Get a developer's public profile
 *
 * No authentication required. Returns public profile data by wallet address.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: {
        walletAddress: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUrl: true,
        twitterUrl: true,
        websiteUrl: true,
        onChainPda: true,
        createdAt: true,
      },
    });

    if (!user || !user.displayName) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("GET /api/profile/[wallet] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
