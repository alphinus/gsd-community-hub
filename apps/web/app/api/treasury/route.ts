import { NextResponse } from "next/server";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import {
  getTreasuryBalance,
  getTreasuryTransactions,
  TREASURY_ADDRESS,
  type TreasuryData,
} from "@/lib/treasury/client";

/**
 * GET /api/treasury
 *
 * Public endpoint (no auth required). Returns treasury balances (SOL + $GSD),
 * recent transactions, and burn total placeholder.
 *
 * Response is cached for 30 seconds via Cache-Control headers.
 * If HELIUS_API_KEY is not configured, transactions are omitted with a warning.
 */
export async function GET() {
  try {
    const rpcUrl =
      process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet");
    const connection = new Connection(rpcUrl, "confirmed");
    const heliusApiKey = process.env.HELIUS_API_KEY;

    const balance = await getTreasuryBalance(connection);

    let transactions: TreasuryData["transactions"] = [];
    let warning: string | undefined;

    if (heliusApiKey) {
      transactions = await getTreasuryTransactions(
        TREASURY_ADDRESS.toBase58(),
        heliusApiKey
      );
    } else {
      warning =
        "HELIUS_API_KEY not configured. Transaction history unavailable.";
    }

    const data: TreasuryData = {
      balance,
      transactions,
      burnTotal: "0",
      ...(warning ? { warning } : {}),
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Treasury API error:", error);
    return NextResponse.json(
      {
        balance: {
          solBalance: 0,
          gsdBalance: "0",
          lastUpdated: new Date().toISOString(),
        },
        transactions: [],
        burnTotal: "0",
        warning: "Failed to fetch treasury data. Please try again later.",
      } satisfies TreasuryData,
      { status: 500 }
    );
  }
}
