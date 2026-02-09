import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/human-verification - Get Civic Pass verification status
 *
 * Query params:
 *   - wallet: Wallet address (required)
 *
 * Returns whether a wallet has a valid Civic Pass (human verification)
 * including verification timestamps and gatekeeper network info.
 *
 * Public endpoint -- verification status is transparent.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet query parameter is required" },
        { status: 400 }
      );
    }

    // Validate wallet address format (base58, 32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    const verification = await prisma.humanVerification.findUnique({
      where: { walletAddress: wallet },
    });

    if (!verification) {
      return NextResponse.json(
        {
          verified: false,
          verifiedAt: null,
          expiresAt: null,
          gatekeeperNetwork: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        verified: verification.verified,
        verifiedAt: verification.verifiedAt?.toISOString() ?? null,
        expiresAt: verification.expiresAt?.toISOString() ?? null,
        gatekeeperNetwork: verification.gatekeeperNetwork,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/governance/human-verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
