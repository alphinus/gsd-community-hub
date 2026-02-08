import { prisma } from "@/lib/db/prisma";
import {
  computeContributionLeafHash,
  hexToBytes,
  bytesToHex,
} from "@gsd/utils";
import type { ContributionData } from "@gsd/types";

/**
 * Program ID for the gsd-hub on-chain program.
 */
const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
  "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw";

/**
 * spl-noop program ID used for logging contribution leaf data.
 */
const NOOP_PROGRAM_ID = "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV";

/**
 * Size of a serialized ContributionLeaf in bytes.
 *
 * Layout:
 *   [0..32)   developer          - Pubkey (32 bytes)
 *   [32..64)  task_ref           - [u8; 32]
 *   [64..66)  verification_score - u16 LE
 *   [66..74)  timestamp          - i64 LE
 *   [74..106) content_hash       - [u8; 32]
 */
const CONTRIBUTION_LEAF_SIZE = 106;

/**
 * Helius enhanced transaction types relevant to the webhook.
 */
export interface HeliusEnhancedTransaction {
  signature: string;
  type: string;
  accountData: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges: unknown[];
  }>;
  instructions: Array<HeliusInstruction>;
  events: Record<string, unknown>;
}

interface HeliusInstruction {
  programId: string;
  accounts: string[];
  data: string;
  innerInstructions: Array<HeliusInnerInstruction>;
}

interface HeliusInnerInstruction {
  programId: string;
  accounts: string[];
  data: string;
}

/**
 * Parsed contribution data extracted from a noop instruction.
 */
interface ParsedContribution {
  developer: string;
  taskRef: string;
  verificationScore: number;
  timestamp: number;
  contentHash: string;
}

/**
 * Parse a 106-byte ContributionLeaf from noop instruction data.
 *
 * The noop program logs raw bytes as its instruction data.
 * Helius delivers the data as a base58-encoded string.
 *
 * @param base58Data - Base58-encoded instruction data from noop
 * @returns Parsed contribution data, or null if data is not a valid ContributionLeaf
 */
export function parseContributionFromNoop(
  rawBytes: Uint8Array
): ParsedContribution | null {
  if (rawBytes.length !== CONTRIBUTION_LEAF_SIZE) {
    return null;
  }

  const view = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);

  // developer: bytes [0..32) - Pubkey
  const developerBytes = rawBytes.slice(0, 32);

  // Convert pubkey bytes to base58 using the same approach as @solana/web3.js
  // We import bs58 to decode/encode since this runs server-side
  const developerAddress = encodeBase58(developerBytes);

  // task_ref: bytes [32..64) - [u8; 32] as hex
  const taskRef = bytesToHex(rawBytes.slice(32, 64));

  // verification_score: bytes [64..66) - u16 LE
  const verificationScore = view.getUint16(64, true);

  // timestamp: bytes [66..74) - i64 LE
  const timestampBigInt = view.getBigInt64(66, true);
  const timestamp = Number(timestampBigInt);

  // content_hash: bytes [74..106) - [u8; 32] as hex
  const contentHash = bytesToHex(rawBytes.slice(74, 106));

  return {
    developer: developerAddress,
    taskRef,
    verificationScore,
    timestamp,
    contentHash,
  };
}

/**
 * Base58 alphabet used by Bitcoin/Solana.
 */
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Encode bytes to base58 string.
 * Minimal implementation for pubkey encoding -- avoids adding bs58 dependency
 * to the server-side webhook handler.
 */
function encodeBase58(bytes: Uint8Array): string {
  // Count leading zeros
  let zeros = 0;
  for (const b of bytes) {
    if (b !== 0) break;
    zeros++;
  }

  // Convert to BigInt for base conversion
  let num = 0n;
  for (const b of bytes) {
    num = num * 256n + BigInt(b);
  }

  const chars: string[] = [];
  while (num > 0n) {
    const remainder = Number(num % 58n);
    chars.unshift(BASE58_ALPHABET[remainder]);
    num = num / 58n;
  }

  // Add leading '1's for each leading zero byte
  for (let i = 0; i < zeros; i++) {
    chars.unshift("1");
  }

  return chars.join("");
}

/**
 * Decode a base58 string to bytes.
 */
function decodeBase58(str: string): Uint8Array {
  let num = 0n;
  for (const c of str) {
    const idx = BASE58_ALPHABET.indexOf(c);
    if (idx === -1) throw new Error(`Invalid base58 character: ${c}`);
    num = num * 58n + BigInt(idx);
  }

  // Convert BigInt to bytes
  const hex = num.toString(16).padStart(2, "0");
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = hexToBytes(paddedHex);

  // Count leading '1's (leading zero bytes)
  let zeros = 0;
  for (const c of str) {
    if (c !== "1") break;
    zeros++;
  }

  const result = new Uint8Array(zeros + bytes.length);
  result.set(bytes, zeros);
  return result;
}

/**
 * Process a single Helius enhanced transaction webhook payload.
 *
 * For each transaction:
 * 1. Check idempotency via transaction signature
 * 2. Find gsd-hub program instructions
 * 3. Extract ContributionLeaf from noop inner instructions
 * 4. Compute leaf hash for integrity verification
 * 5. Upsert to database
 *
 * @param transaction - Helius enhanced transaction
 * @returns Number of contributions processed (0 or 1 per transaction)
 */
export async function processContributionEvent(
  transaction: HeliusEnhancedTransaction
): Promise<number> {
  const { signature, instructions } = transaction;

  // Check idempotency: skip if already indexed
  const existing = await prisma.contribution.findUnique({
    where: { transactionSignature: signature },
    select: { id: true },
  });

  if (existing) {
    // Duplicate webhook delivery -- silently ignore
    return 0;
  }

  let processedCount = 0;

  for (const ix of instructions) {
    // Only process instructions targeting the gsd-hub program
    if (ix.programId !== PROGRAM_ID) {
      continue;
    }

    // Look for noop inner instructions containing ContributionLeaf data
    for (const innerIx of ix.innerInstructions) {
      if (innerIx.programId !== NOOP_PROGRAM_ID) {
        continue;
      }

      // Decode the noop instruction data (base58)
      let rawBytes: Uint8Array;
      try {
        rawBytes = decodeBase58(innerIx.data);
      } catch {
        continue;
      }

      const parsed = parseContributionFromNoop(rawBytes);
      if (!parsed) {
        continue;
      }

      // Build ContributionData for leaf hash computation
      const contributionData: ContributionData = {
        developer: parsed.developer,
        taskRef: parsed.taskRef,
        verificationScore: parsed.verificationScore,
        timestamp: parsed.timestamp,
        contentHash: parsed.contentHash,
      };

      const leafHash = await computeContributionLeafHash(contributionData);

      // Extract tree address from the instruction accounts
      // In RecordContribution, the merkle_tree is the second account (index 1)
      const treeAddress = ix.accounts[1] || "unknown";

      // Upsert contribution -- transactionSignature is the idempotency key
      await prisma.contribution.upsert({
        where: { transactionSignature: signature },
        update: {}, // No update needed -- idempotent
        create: {
          walletAddress: parsed.developer,
          taskRef: parsed.taskRef,
          verificationScore: parsed.verificationScore,
          contentHash: parsed.contentHash,
          leafHash,
          leafIndex: 0, // Updated by tree indexer if needed
          treeAddress,
          transactionSignature: signature,
          description: null,
        },
      });

      processedCount++;
      // One contribution per transaction
      break;
    }

    // Only process first matching instruction per transaction
    if (processedCount > 0) break;
  }

  return processedCount;
}
