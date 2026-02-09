import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { bytesToHex } from "@gsd/utils";

/**
 * Advanced governance event indexer for Helius webhooks.
 *
 * Processes delegation and governance config update events:
 * - delegate_vote: Creates/updates Delegation records
 * - revoke_delegation: Deactivates Delegation records
 * - update_governance_config: Logs config updates
 *
 * Follows the same indexer pattern as governance-indexer.ts and
 * contribution-indexer.ts: discriminator-based instruction matching,
 * base58 decode, Prisma upsert for idempotency.
 */

// --- GSD Program ID ---

const GSD_PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
  "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw";

// --- Anchor discriminator computation ---

/**
 * Compute an Anchor instruction discriminator.
 * First 8 bytes of SHA-256("global:{instruction_name}") as hex.
 */
function anchorDiscriminator(instructionName: string): string {
  const hash = createHash("sha256")
    .update(`global:${instructionName}`)
    .digest();
  return hash.subarray(0, 8).toString("hex");
}

/**
 * Discriminators for advanced governance instructions.
 */
const ADVANCED_GOVERNANCE_DISCRIMINATORS: Record<string, string> = {
  delegate_vote: anchorDiscriminator("delegate_vote"),
  revoke_delegation: anchorDiscriminator("revoke_delegation"),
  update_governance_config: anchorDiscriminator("update_governance_config"),
};

/**
 * Reverse lookup: discriminator hex -> instruction name.
 * O(1) matching in the indexer (same pattern as governance-indexer.ts constants).
 */
const DISCRIMINATOR_TO_ADVANCED_INSTRUCTION: Record<string, string> =
  Object.fromEntries(
    Object.entries(ADVANCED_GOVERNANCE_DISCRIMINATORS).map(([name, disc]) => [
      disc,
      name,
    ])
  );

// --- Base58 codec (inline, project convention from 02-04) ---

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

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

// --- Helius instruction type ---

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

// --- Main processor ---

/**
 * Process a single Helius enhanced transaction for advanced governance events.
 *
 * Handles:
 * 1. delegate_vote -- Creates Delegation record (upsert by onChainAddress)
 * 2. revoke_delegation -- Deactivates Delegation record
 * 3. update_governance_config -- Logs config update
 *
 * @param transaction - Helius enhanced transaction
 * @returns Number of advanced governance events processed
 */
export async function processAdvancedGovernanceEvent(transaction: {
  signature: string;
  instructions: HeliusInstruction[];
}): Promise<number> {
  const { signature, instructions } = transaction;
  let processedCount = 0;

  for (const ix of instructions) {
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
    const instructionName = DISCRIMINATOR_TO_ADVANCED_INSTRUCTION[discHex];

    if (!instructionName) {
      // Not an advanced governance instruction
      continue;
    }

    try {
      switch (instructionName) {
        case "delegate_vote":
          await processDelegateVote(ix, ixData, signature);
          processedCount++;
          break;

        case "revoke_delegation":
          await processRevokeDelegation(ix, signature);
          processedCount++;
          break;

        case "update_governance_config":
          await processUpdateGovernanceConfig(ix, signature);
          processedCount++;
          break;
      }
    } catch (error) {
      // Log and continue -- don't let one failed event block others
      console.error(
        `Advanced governance indexer error [${instructionName}] in ${signature}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return processedCount;
}

// --- Instruction processors ---

/**
 * Process a delegate_vote instruction.
 *
 * Accounts (from DelegateVote struct):
 *   [0] governance_config
 *   [1] delegation_record (PDA) -- seeds: ["delegation", delegator.key()]
 *   [2] vote_deposit (delegator's deposit)
 *   [3] delegator (signer)
 *   [4] delegate
 *   [5] system_program
 *
 * Instruction data after 8-byte discriminator:
 *   amount: u64 LE (8 bytes) -- delegated voting power
 *
 * Upserts Delegation record with onChainAddress as unique key for idempotency.
 * Single delegation per delegator (per 06-01 decision: delegatorWallet is unique).
 */
async function processDelegateVote(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const delegationRecordAddress = ix.accounts[1];
  const delegatorWallet = ix.accounts[3];
  const delegateWallet = ix.accounts[4];

  // Parse amount from instruction data
  const view = new DataView(
    ixData.buffer,
    ixData.byteOffset,
    ixData.byteLength
  );
  const delegatedAmount = view.getBigUint64(8, true);

  // Determine current round for effectiveFromRound
  // Use the latest open/voting round index, or 0 if none
  const latestRound = await prisma.ideaRound.findFirst({
    where: { status: { in: ["open", "voting"] } },
    orderBy: { roundIndex: "desc" },
    select: { roundIndex: true },
  });
  const effectiveFromRound = latestRound?.roundIndex ?? 0;

  await prisma.delegation.upsert({
    where: { onChainAddress: delegationRecordAddress },
    update: {
      delegateWallet,
      delegatedAmount,
      isActive: true,
      effectiveFromRound,
      transactionSignature: signature,
      delegatedAt: new Date(),
      revokedAt: null,
    },
    create: {
      onChainAddress: delegationRecordAddress,
      delegatorWallet,
      delegateWallet,
      delegatedAmount,
      isActive: true,
      effectiveFromRound,
      transactionSignature: signature,
      delegatedAt: new Date(),
    },
  });
}

/**
 * Process a revoke_delegation instruction.
 *
 * Accounts (from RevokeDelegation struct):
 *   [0] governance_config
 *   [1] delegation_record (PDA, closed after revocation)
 *   [2] vote_deposit
 *   [3] delegator (signer)
 *
 * No instruction args beyond discriminator.
 * Sets isActive to false and records revokedAt timestamp.
 */
async function processRevokeDelegation(
  ix: HeliusInstruction,
  _signature: string
): Promise<void> {
  const delegatorWallet = ix.accounts[3];

  // Find and deactivate delegation by delegator wallet
  // (delegatorWallet is unique per Prisma schema -- one active delegation per wallet)
  const delegation = await prisma.delegation.findUnique({
    where: { delegatorWallet },
    select: { id: true },
  });

  if (!delegation) {
    console.warn(
      `revoke_delegation: no delegation found for wallet ${delegatorWallet}`
    );
    return;
  }

  await prisma.delegation.update({
    where: { delegatorWallet },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });
}

/**
 * Process an update_governance_config instruction.
 *
 * Accounts (from UpdateGovernanceConfig struct):
 *   [0] governance_config
 *   [1] admin (signer)
 *
 * Logs the config update. No separate model needed for v1 --
 * the governance config is a singleton on-chain account.
 * Future enhancement: cache updated config fields in database.
 */
async function processUpdateGovernanceConfig(
  ix: HeliusInstruction,
  signature: string
): Promise<void> {
  const adminWallet = ix.accounts[1];
  console.log(
    `Governance config updated by ${adminWallet} in tx ${signature}`
  );
}
