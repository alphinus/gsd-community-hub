import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Treasury RPC client.
 *
 * Fetches SOL and $GSD balances from the Solana cluster, and transaction
 * history from the Helius Enhanced Transactions API.
 */

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

/** Treasury address string (before PublicKey conversion). */
export const TREASURY_ADDRESS_STR =
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
  // Fallback: devnet placeholder -- update with real multisig vault PDA after setup
  "11111111111111111111111111111111";

/** $GSD mint address string. */
export const GSD_MINT_STR =
  process.env.NEXT_PUBLIC_GSD_MINT ||
  "GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig6N3j1";

export const TREASURY_ADDRESS = new PublicKey(TREASURY_ADDRESS_STR);
export const GSD_MINT_ADDRESS = new PublicKey(GSD_MINT_STR);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreasuryBalance {
  /** SOL balance (human-readable, divided by 1e9) */
  solBalance: number;
  /** $GSD token balance as string (BigInt serialised) */
  gsdBalance: string;
  /** Timestamp of the last fetch */
  lastUpdated: string;
}

export interface TreasuryTransaction {
  signature: string;
  type: "inflow" | "outflow";
  amount: number;
  token: "SOL" | "GSD" | "UNKNOWN";
  timestamp: number;
  description: string;
}

export interface TreasuryData {
  balance: TreasuryBalance;
  transactions: TreasuryTransaction[];
  /** Placeholder -- burn tracking ships in Phase 4 */
  burnTotal: string;
  /** Warning message if transaction history unavailable */
  warning?: string;
}

// ---------------------------------------------------------------------------
// Balance fetching (RPC)
// ---------------------------------------------------------------------------

/**
 * Fetch SOL and $GSD token balances for the treasury address.
 */
export async function getTreasuryBalance(
  connection: Connection
): Promise<TreasuryBalance> {
  try {
    const [solLamports, tokenAccounts] = await Promise.all([
      connection.getBalance(TREASURY_ADDRESS),
      connection.getTokenAccountsByOwner(TREASURY_ADDRESS, {
        mint: GSD_MINT_ADDRESS,
      }),
    ]);

    let gsdBalance = "0";

    if (tokenAccounts.value.length > 0) {
      // SPL Token account data layout: amount is a u64 at byte offset 64
      const data = tokenAccounts.value[0].account.data;
      const raw = Buffer.from(data);
      const amount = raw.readBigUInt64LE(64);
      gsdBalance = amount.toString();
    }

    return {
      solBalance: solLamports / 1e9,
      gsdBalance,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch treasury balance:", error);
    return {
      solBalance: 0,
      gsdBalance: "0",
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Transaction history (Helius Enhanced Transactions API)
// ---------------------------------------------------------------------------

interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number;
  mint: string;
}

interface HeliusTransaction {
  signature: string;
  description: string;
  type: string;
  timestamp: number;
  nativeTransfers?: HeliusNativeTransfer[];
  tokenTransfers?: HeliusTokenTransfer[];
}

/**
 * Fetch recent treasury transactions from the Helius Enhanced Transactions API.
 */
export async function getTreasuryTransactions(
  treasuryAddress: string,
  apiKey: string,
  limit: number = 20
): Promise<TreasuryTransaction[]> {
  try {
    const url = `https://api.helius.xyz/v0/addresses/${treasuryAddress}/transactions?api-key=${apiKey}&limit=${limit}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error("Helius API error:", res.status, await res.text());
      return [];
    }

    const txns: HeliusTransaction[] = await res.json();

    return txns.flatMap((tx) => {
      const results: TreasuryTransaction[] = [];
      const addr = treasuryAddress;

      // Process native (SOL) transfers
      if (tx.nativeTransfers) {
        for (const nt of tx.nativeTransfers) {
          if (nt.fromUserAccount === addr || nt.toUserAccount === addr) {
            results.push({
              signature: tx.signature,
              type: nt.toUserAccount === addr ? "inflow" : "outflow",
              amount: nt.amount / 1e9,
              token: "SOL",
              timestamp: tx.timestamp,
              description: tx.description || "SOL transfer",
            });
          }
        }
      }

      // Process token transfers
      if (tx.tokenTransfers) {
        for (const tt of tx.tokenTransfers) {
          if (tt.fromUserAccount === addr || tt.toUserAccount === addr) {
            const isGsd =
              tt.mint === GSD_MINT_ADDRESS.toBase58() ? "GSD" : "UNKNOWN";
            results.push({
              signature: tx.signature,
              type: tt.toUserAccount === addr ? "inflow" : "outflow",
              amount: tt.tokenAmount,
              token: isGsd,
              timestamp: tx.timestamp,
              description: tx.description || "Token transfer",
            });
          }
        }
      }

      // If no recognised transfers, still record the transaction
      if (results.length === 0) {
        results.push({
          signature: tx.signature,
          type: "inflow",
          amount: 0,
          token: "UNKNOWN",
          timestamp: tx.timestamp,
          description: tx.description || tx.type || "Unknown transaction",
        });
      }

      return results;
    });
  } catch (error) {
    console.error("Failed to fetch treasury transactions:", error);
    return [];
  }
}
