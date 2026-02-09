import { NextRequest, NextResponse } from "next/server";
import {
  getDelegationsForWallet,
  getDelegateStats,
} from "@/lib/governance/delegation";

/**
 * GET /api/governance/delegate - Get delegation info for a wallet
 *
 * Query params:
 *   - wallet: Wallet address (required)
 *
 * Returns delegations where the wallet is either delegator or delegate,
 * plus aggregate stats when the wallet acts as a delegate.
 *
 * Public endpoint (no auth -- delegation info is transparent on-chain).
 * BigInt amounts serialized as strings (project convention from 02-05).
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

    // Fetch delegations and delegate stats in parallel
    const [delegations, delegateStats] = await Promise.all([
      getDelegationsForWallet(wallet),
      getDelegateStats(wallet),
    ]);

    // Separate delegations by role for convenience
    const asDelegator = delegations.find(
      (d) => d.delegatorWallet === wallet && d.isActive
    );

    return NextResponse.json(
      {
        delegations,
        stats: {
          asDelegator: asDelegator ?? null,
          asDelegate: {
            delegatorCount: delegateStats.delegatorCount,
            totalDelegated: delegateStats.totalDelegated,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/governance/delegate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
