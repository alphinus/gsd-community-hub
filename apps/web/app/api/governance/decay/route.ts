import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { computeDecayedScoreForDeveloper } from "@/lib/governance/decay";
import { DECAY_HALF_LIFE_DAYS } from "@gsd/utils";

/**
 * POST /api/governance/decay - Trigger decay score recomputation
 *
 * Body: { wallet: string }
 *
 * Requires authentication -- users can trigger decay recomputation for themselves.
 * Returns the original vs decayed contribution score.
 *
 * NOTE: This does NOT update on-chain scores. It returns computed values only.
 * On-chain updates would require server-side transaction signing (deferred to
 * cron/admin trigger).
 *
 * The halfLifeDays comes from GovernanceConfig (on-chain) or defaults to 180.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { wallet?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet is required in request body" },
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

    // Users can only trigger decay recomputation for their own wallet
    if (wallet !== session.publicKey) {
      return NextResponse.json(
        { error: "Can only compute decay for your own wallet" },
        { status: 403 }
      );
    }

    // Use default half-life (180 days). In production, this could be read
    // from GovernanceConfig on-chain account data.
    const halfLifeDays = DECAY_HALF_LIFE_DAYS;

    const result = await computeDecayedScoreForDeveloper(wallet, halfLifeDays);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/governance/decay error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
