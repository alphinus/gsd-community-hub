import { PublicKey } from "@solana/web3.js";

// --- PDA seed constants (matching on-chain seed strings) ---

export const REVENUE_CONFIG_SEED = "revenue_config";
export const REVENUE_EVENT_SEED = "revenue_event";
export const REVENUE_CLAIM_SEED = "revenue_claim";
export const REVENUE_VAULT_SEED = "revenue_vault";

/**
 * Encode a number as a little-endian u32 buffer (4 bytes).
 * Matches Rust's u32.to_le_bytes() used in PDA seed derivation.
 */
function u32ToLeBytes(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return buf;
}

/**
 * Derive the RevenueConfig singleton PDA.
 * Seeds: ["revenue_config"]
 */
export function getRevenueConfigPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVENUE_CONFIG_SEED)],
    programId
  );
}

/**
 * Derive a RevenueEvent PDA by event index.
 * Seeds: ["revenue_event", event_index.to_le_bytes()]
 */
export function getRevenueEventPDA(
  eventIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVENUE_EVENT_SEED), u32ToLeBytes(eventIndex)],
    programId
  );
}

/**
 * Derive a RevenueClaim PDA by claimant wallet and revenue event.
 * Seeds: ["revenue_claim", claimant.key(), revenue_event.key()]
 */
export function getRevenueClaimPDA(
  claimant: PublicKey,
  revenueEvent: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(REVENUE_CLAIM_SEED),
      claimant.toBuffer(),
      revenueEvent.toBuffer(),
    ],
    programId
  );
}

/**
 * Derive a RevenueVault PDA by event index.
 * Seeds: ["revenue_vault", event_index.to_le_bytes()]
 *
 * This is a SystemAccount PDA that holds SOL for the developer pool.
 * For USDC: the vault is an ATA derived from this PDA.
 */
export function getRevenueVaultPDA(
  eventIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVENUE_VAULT_SEED), u32ToLeBytes(eventIndex)],
    programId
  );
}
