import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/governance/deposit - Get vote deposit info for a wallet
 *
 * Query params:
 *   - wallet: Wallet address (required)
 *
 * Returns deposit info with computed isEligible field.
 * BigInt depositedAmount serialized as string (project convention from 02-05).
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

    const deposit = await prisma.voteDeposit.findUnique({
      where: { walletAddress: wallet },
    });

    if (!deposit) {
      return NextResponse.json(
        {
          deposit: null,
          isEligible: false,
        },
        { status: 200 }
      );
    }

    // Compute isEligible: now >= eligibleAt (client-side convenience field, per 03-02 decision)
    const now = new Date();
    const isEligible = now >= deposit.eligibleAt;

    return NextResponse.json(
      {
        deposit: {
          walletAddress: deposit.walletAddress,
          depositedAmount: deposit.depositedAmount.toString(),
          depositTimestamp: deposit.depositTimestamp,
          eligibleAt: deposit.eligibleAt,
          activeVotes: deposit.activeVotes,
        },
        isEligible,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/governance/deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
