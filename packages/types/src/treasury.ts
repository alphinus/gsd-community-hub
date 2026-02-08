/**
 * Treasury types for the GSD Community Hub.
 *
 * Used by the treasury dashboard to display balance
 * and transaction history for the program treasury.
 */

/** Treasury balance snapshot for dashboard display */
export interface TreasuryBalance {
  /** SOL balance in lamports converted to SOL (number) */
  solBalance: number;
  /** GSD token balance (string-serialized BigInt, raw token amount) */
  gsdBalance: string;
  /** When the balance was last fetched */
  lastUpdated: Date;
}

/** Individual treasury transaction for history display */
export interface TreasuryTransaction {
  /** Solana transaction signature */
  signature: string;
  /** Direction of fund flow */
  type: "inflow" | "outflow";
  /** Amount in human-readable units */
  amount: number;
  /** Token type */
  token: "SOL" | "GSD";
  /** When the transaction occurred */
  timestamp: Date;
  /** Optional description of the transaction purpose */
  description?: string;
}
