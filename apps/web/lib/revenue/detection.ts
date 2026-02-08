import { TREASURY_ADDRESS_STR } from "@/lib/treasury/client";
import type { HeliusEnhancedTransaction } from "@/lib/contributions/indexer";

/**
 * USDC mint address (mainnet default, configurable via env).
 */
export const USDC_MINT_STR =
  process.env.NEXT_PUBLIC_USDC_MINT ||
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Detect SOL or USDC revenue inflows to the treasury address.
 *
 * Checks both nativeTransfers (SOL) and tokenTransfers (USDC) in a
 * Helius enhanced transaction. Sums all matching inflows per token type
 * and returns the largest inflow, or null if none detected.
 *
 * Only inflows (transfers TO the treasury) are considered.
 * Outflows and non-treasury transfers are ignored.
 *
 * @param transaction - Helius enhanced transaction with transfer arrays
 * @returns Detected inflow with token type and amount, or null
 */
export function detectRevenueInflow(
  transaction: HeliusEnhancedTransaction
): { token: "sol" | "usdc"; amount: bigint } | null {
  let solTotal = 0n;
  let usdcTotal = 0n;

  // Check native (SOL) transfers to treasury
  const nativeTransfers = (
    transaction as unknown as {
      nativeTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        amount: number;
      }>;
    }
  ).nativeTransfers;

  if (nativeTransfers) {
    for (const nt of nativeTransfers) {
      if (nt.toUserAccount === TREASURY_ADDRESS_STR && nt.amount > 0) {
        solTotal += BigInt(nt.amount);
      }
    }
  }

  // Check token transfers (USDC) to treasury
  const tokenTransfers = (
    transaction as unknown as {
      tokenTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        tokenAmount: number;
        mint: string;
      }>;
    }
  ).tokenTransfers;

  if (tokenTransfers) {
    for (const tt of tokenTransfers) {
      if (
        tt.toUserAccount === TREASURY_ADDRESS_STR &&
        tt.mint === USDC_MINT_STR &&
        tt.tokenAmount > 0
      ) {
        // tokenAmount from Helius is already in human-readable decimals
        // Convert to raw amount (USDC has 6 decimals)
        usdcTotal += BigInt(Math.round(tt.tokenAmount * 1e6));
      }
    }
  }

  // Return the largest inflow (SOL or USDC), or null if none
  if (solTotal > 0n && usdcTotal > 0n) {
    // Both detected -- return the one with larger lamport/raw value
    // This is a simplification; in practice only one token type per tx is typical
    return solTotal >= usdcTotal
      ? { token: "sol", amount: solTotal }
      : { token: "usdc", amount: usdcTotal };
  }

  if (solTotal > 0n) {
    return { token: "sol", amount: solTotal };
  }

  if (usdcTotal > 0n) {
    return { token: "usdc", amount: usdcTotal };
  }

  return null;
}
