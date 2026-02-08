import type { ContributionData } from "@gsd/types";
import { PublicKey } from "@solana/web3.js";

/**
 * Convert a hex string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have even length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert a Uint8Array to a lowercase hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Serialize a ContributionData object into a 106-byte buffer matching
 * the on-chain Borsh (AnchorSerialize) layout of ContributionLeaf.
 *
 * Layout (all multi-byte integers are little-endian):
 *   [0..32)   developer    - Pubkey bytes
 *   [32..64)  task_ref     - [u8; 32]
 *   [64..66)  verification_score - u16 LE
 *   [66..74)  timestamp    - i64 LE
 *   [74..106) content_hash - [u8; 32]
 *
 * Total: 106 bytes
 */
export function serializeContributionLeaf(data: ContributionData): Uint8Array {
  const buf = new Uint8Array(106);
  const view = new DataView(buf.buffer);

  // developer: 32 bytes (base58-encoded public key)
  const developerBytes = new PublicKey(data.developer).toBytes();
  buf.set(developerBytes, 0);

  // task_ref: 32 bytes (hex-encoded)
  const taskRefBytes = hexToBytes(data.taskRef);
  if (taskRefBytes.length !== 32) {
    throw new Error(`taskRef must be 32 bytes (64 hex chars), got ${taskRefBytes.length}`);
  }
  buf.set(taskRefBytes, 32);

  // verification_score: u16 little-endian
  view.setUint16(64, data.verificationScore, true);

  // timestamp: i64 little-endian
  // Use BigInt for full i64 range
  view.setBigInt64(66, BigInt(data.timestamp), true);

  // content_hash: 32 bytes (hex-encoded)
  const contentHashBytes = hexToBytes(data.contentHash);
  if (contentHashBytes.length !== 32) {
    throw new Error(`contentHash must be 32 bytes (64 hex chars), got ${contentHashBytes.length}`);
  }
  buf.set(contentHashBytes, 74);

  return buf;
}

/**
 * Compute the SHA-256 leaf hash for a contribution, matching the on-chain
 * `ContributionLeaf::to_leaf_hash()` method.
 *
 * The on-chain method:
 *   1. Borsh-serializes the struct to 106 bytes
 *   2. Computes `solana_program::hash::hash(&data)` (SHA-256)
 *   3. Returns the 32-byte hash as `[u8; 32]`
 *
 * This function mirrors that process exactly.
 *
 * @returns Lowercase hex string of the 32-byte SHA-256 hash
 */
export async function computeContributionLeafHash(
  data: ContributionData
): Promise<string> {
  const serialized = serializeContributionLeaf(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", serialized.buffer as ArrayBuffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}
