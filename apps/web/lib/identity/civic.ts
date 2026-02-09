/**
 * Civic Pass identity verification configuration for GSD governance.
 *
 * Civic Gateway provides on-chain human verification via "gateway tokens"
 * issued to wallets that pass liveness or identity verification checks.
 *
 * These network addresses are the Civic gatekeeper networks on Solana.
 * See: https://docs.civic.com/integration-guides/civic-idv-on-solana
 */

import { PublicKey } from "@solana/web3.js";

/**
 * Civic Gatekeeper Network addresses on Solana.
 *
 * Each network represents a different level of verification:
 * - LIVENESS: Proof the user is a real person (camera liveness check)
 * - ID_VERIFICATION: Full identity document verification
 */
export const CIVIC_GATEKEEPER_NETWORKS = {
  /** Proof of liveness -- camera check confirms a real person */
  LIVENESS: new PublicKey("ignREusXmGrscGNUesoU9mxfds9AiYqeK8RAQsqjmUu"),

  /** Full identity document verification (passport, ID card) */
  ID_VERIFICATION: new PublicKey(
    "bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw"
  ),
} as const;

/**
 * Default gatekeeper network used by GSD governance.
 *
 * Liveness check is the baseline -- ensures one-person-one-vote
 * without requiring full identity document disclosure.
 */
export const DEFAULT_GATEKEEPER_NETWORK = CIVIC_GATEKEEPER_NETWORKS.LIVENESS;

/**
 * Civic Gateway program ID on Solana.
 *
 * This is the on-chain program that manages gateway token issuance,
 * verification, and revocation.
 */
export const CIVIC_GATEWAY_PROGRAM_ID = new PublicKey(
  "gatbGF9DvLAw3kWyn1EmH5Nh1Sqp8sTukF7yaQpSc71"
);
