import { prisma } from "@/lib/db/prisma";
import { bytesToHex } from "@gsd/utils";
import { REVENUE_DISCRIMINATOR_TO_INSTRUCTION } from "./constants";
import { detectRevenueInflow } from "./detection";
import type { HeliusEnhancedTransaction } from "@/lib/contributions/indexer";

/**
 * GSD Hub program ID for revenue instructions.
 */
const GSD_PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
  "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw";

/**
 * Helius instruction shape (matches contribution and governance indexer types).
 */
interface HeliusInstruction {
  programId: string;
  accounts: string[];
  data: string;
  innerInstructions: Array<{
    programId: string;
    accounts: string[];
    data: string;
  }>;
}

/**
 * Base58 alphabet used by Bitcoin/Solana.
 */
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Decode a base58 string to bytes.
 * Inline implementation to avoid adding bs58 dependency (project convention from 02-04).
 */
function decodeBase58(str: string): Uint8Array {
  let num = 0n;
  for (const c of str) {
    const idx = BASE58_ALPHABET.indexOf(c);
    if (idx === -1) throw new Error(`Invalid base58 character: ${c}`);
    num = num * 58n + BigInt(idx);
  }

  const hex = num.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }

  let zeros = 0;
  for (const c of str) {
    if (c !== "1") break;
    zeros++;
  }

  if (zeros > 0) {
    const result = new Uint8Array(zeros + bytes.length);
    result.set(bytes, zeros);
    return result;
  }

  return bytes;
}

/**
 * Process a single Helius enhanced transaction for on-chain revenue events.
 *
 * Identifies gsd-hub revenue instructions by discriminator:
 * - record_revenue_event: creates/upserts a RevenueEvent record
 * - claim_revenue_share: creates/upserts a RevenueClaim record
 * - execute_burn: updates the RevenueEvent with burn data
 * - init_revenue_config: logged but no database action needed
 *
 * @param transaction - Helius enhanced transaction
 * @returns Number of revenue events processed
 */
export async function processRevenueEvent(
  transaction: HeliusEnhancedTransaction
): Promise<number> {
  const { signature, instructions } = transaction;
  let processedCount = 0;

  for (const ix of instructions as unknown as HeliusInstruction[]) {
    if (ix.programId !== GSD_PROGRAM_ID) {
      continue;
    }

    // Decode instruction data to identify the discriminator
    let ixData: Uint8Array;
    try {
      ixData = decodeBase58(ix.data);
    } catch {
      continue;
    }

    if (ixData.length < 8) {
      continue;
    }

    // Extract 8-byte discriminator as hex
    const discHex = bytesToHex(ixData.slice(0, 8));
    const instructionName = REVENUE_DISCRIMINATOR_TO_INSTRUCTION[discHex];

    if (!instructionName) {
      // Not a revenue instruction
      continue;
    }

    try {
      switch (instructionName) {
        case "record_revenue_event":
          await processRecordRevenueEvent(ix, ixData, signature);
          processedCount++;
          break;

        case "claim_revenue_share":
          await processClaimRevenueShare(ix, signature);
          processedCount++;
          break;

        case "execute_burn":
          await processExecuteBurn(ix, signature);
          processedCount++;
          break;

        case "init_revenue_config":
          // Config initialization -- no database action needed
          // (RevenueConfig is on-chain only, read via RPC when needed)
          console.log(`Revenue config initialized in tx: ${signature}`);
          processedCount++;
          break;
      }
    } catch (error) {
      console.error(
        `Revenue indexer error [${instructionName}] in ${signature}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return processedCount;
}

/**
 * Process raw SOL/USDC treasury inflows and persist as PendingRevenue.
 *
 * Called on EVERY transaction to detect revenue inflows to the treasury.
 * Creates PendingRevenue records for admin review before distribution.
 *
 * @param transaction - Helius enhanced transaction
 * @returns 1 if a pending revenue record was created/existed, 0 otherwise
 */
export async function processRevenueDetection(
  transaction: HeliusEnhancedTransaction
): Promise<number> {
  const inflow = detectRevenueInflow(transaction);

  if (!inflow) {
    return 0;
  }

  const sender = extractSender(transaction);

  await prisma.pendingRevenue.upsert({
    where: { transactionSignature: transaction.signature },
    create: {
      transactionSignature: transaction.signature,
      token: inflow.token,
      amount: inflow.amount,
      fromAddress: sender,
      status: "pending",
    },
    update: {}, // idempotent -- don't overwrite existing
  });

  return 1;
}

/**
 * Extract the sender address from a transaction.
 * Returns the first nativeTransfers entry's fromUserAccount, or null.
 */
function extractSender(transaction: HeliusEnhancedTransaction): string | null {
  const nativeTransfers = (
    transaction as unknown as {
      nativeTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        amount: number;
      }>;
    }
  ).nativeTransfers;

  if (nativeTransfers && nativeTransfers.length > 0) {
    return nativeTransfers[0].fromUserAccount;
  }

  return null;
}

/**
 * Process a record_revenue_event instruction.
 *
 * Accounts (from RecordRevenueEvent struct):
 *   [0] revenue_config
 *   [1] revenue_event (PDA)
 *   [2] revenue_vault (SystemAccount PDA)
 *   [3] admin
 *   [4] system_program
 *
 * Creates a stub RevenueEvent record with the transaction signature.
 * Split amounts are derived from on-chain account data which the indexer
 * cannot fully parse from instruction data alone. We create a record
 * with known addresses and set status="recorded".
 */
async function processRecordRevenueEvent(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const eventAddress = ix.accounts[1];

  // Count existing events for sequential indexing
  const existingEventCount = await prisma.revenueEvent.count();

  // Parse what we can from instruction data:
  // After 8-byte discriminator, the Anchor args for record_revenue_event are:
  //   origin_signature: string (borsh: 4-byte length prefix + UTF-8 bytes)
  //   amount: u64 LE (8 bytes)
  //   token: enum (1 byte: 0=sol, 1=usdc)
  // This is complex borsh parsing, so we extract minimally.
  const view = new DataView(
    ixData.buffer,
    ixData.byteOffset,
    ixData.byteLength
  );

  // Try to parse origin_signature (borsh string: u32 length + UTF-8)
  let originSig = signature; // fallback to tx signature
  let amount = BigInt(0);
  let tokenStr = "sol";

  if (ixData.length > 12) {
    try {
      const strLen = view.getUint32(8, true);
      if (strLen > 0 && strLen < 200 && ixData.length >= 12 + strLen + 9) {
        const decoder = new TextDecoder();
        originSig = decoder.decode(ixData.slice(12, 12 + strLen));
        const amountOffset = 12 + strLen;
        amount = view.getBigUint64(amountOffset, true);
        const tokenByte = ixData[amountOffset + 8];
        tokenStr = tokenByte === 1 ? "usdc" : "sol";
      }
    } catch {
      // Fallback to defaults if parsing fails
    }
  }

  // Default split ratios (60/20/10/10 bps)
  const developerPool = (amount * 6000n) / 10000n;
  const treasuryReserve = (amount * 2000n) / 10000n;
  const burnAmount = (amount * 1000n) / 10000n;
  const maintenanceAmount = (amount * 1000n) / 10000n;
  // Rounding remainder goes to developer_pool (matching on-chain logic)
  const remainder =
    amount - developerPool - treasuryReserve - burnAmount - maintenanceAmount;
  const adjustedDeveloperPool = developerPool + remainder;

  await prisma.revenueEvent.upsert({
    where: { originSignature: originSig },
    update: {
      status: "recorded",
    },
    create: {
      eventIndex: existingEventCount,
      onChainAddress: eventAddress,
      token: tokenStr,
      totalAmount: amount,
      developerPool: adjustedDeveloperPool,
      treasuryReserve,
      burnAmount,
      maintenanceAmount,
      status: "recorded",
      originSignature: originSig,
      totalContributionScore: BigInt(0), // populated when distribution starts
      claimedAmount: BigInt(0),
      gsdBurned: BigInt(0),
      recordedAt: new Date(),
    },
  });
}

/**
 * Process a claim_revenue_share instruction.
 *
 * Accounts (from ClaimRevenueShare struct):
 *   [0] revenue_config
 *   [1] revenue_event
 *   [2] revenue_claim (PDA)
 *   [3] revenue_vault
 *   [4] developer_profile
 *   [5] claimant
 *   [6] system_program
 */
async function processClaimRevenueShare(
  ix: HeliusInstruction,
  signature: string
): Promise<void> {
  const eventAddress = ix.accounts[1];
  const claimantWallet = ix.accounts[5];

  // Find the revenue event by on-chain address
  const event = await prisma.revenueEvent.findUnique({
    where: { onChainAddress: eventAddress },
    select: { id: true },
  });

  if (!event) {
    console.warn(
      `claim_revenue_share: event not found for address ${eventAddress}, skipping`
    );
    return;
  }

  await prisma.revenueClaim.upsert({
    where: {
      revenueEventId_claimantWallet: {
        revenueEventId: event.id,
        claimantWallet,
      },
    },
    update: {
      transactionSignature: signature,
    },
    create: {
      revenueEventId: event.id,
      claimantWallet,
      contributionScore: BigInt(0), // enriched from on-chain account data
      totalScore: BigInt(0),
      amount: BigInt(0), // enriched from on-chain account data
      transactionSignature: signature,
      claimedAt: new Date(),
    },
  });
}

/**
 * Process an execute_burn instruction.
 *
 * Accounts (from ExecuteBurn struct):
 *   [0] revenue_config
 *   [1] revenue_event
 *   [2] burn_token_account (admin's GSD ATA)
 *   [3] gsd_mint
 *   [4] admin
 *   [5] token_program
 */
async function processExecuteBurn(
  ix: HeliusInstruction,
  signature: string
): Promise<void> {
  const eventAddress = ix.accounts[1];

  await prisma.revenueEvent.updateMany({
    where: { onChainAddress: eventAddress },
    data: {
      burnSignature: signature,
      // gsdBurned amount would come from instruction data parsing
      // For now, mark the burn as executed via signature presence
    },
  });
}
