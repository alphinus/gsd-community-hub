import { prisma } from "@/lib/db/prisma";
import { bytesToHex } from "@gsd/utils";
import {
  GSD_PROGRAM_ID,
  DISCRIMINATOR_TO_INSTRUCTION,
} from "./constants";

/**
 * Helius instruction shape (matches contribution indexer types).
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

  // Convert BigInt to bytes
  const hex = num.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }

  // Count leading '1's (leading zero bytes)
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
 * Encode bytes to base58 string.
 * Inline implementation (project convention from 02-04).
 */
function encodeBase58(bytes: Uint8Array): string {
  let zeros = 0;
  for (const b of bytes) {
    if (b !== 0) break;
    zeros++;
  }

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

  for (let i = 0; i < zeros; i++) {
    chars.unshift("1");
  }

  return chars.join("");
}

/**
 * Map Anchor RoundStatus enum variant index to string.
 * Borsh serialization uses a single byte for enum discriminant (0, 1, 2).
 */
function parseRoundStatus(byte: number): string {
  switch (byte) {
    case 0:
      return "open";
    case 1:
      return "voting";
    case 2:
      return "closed";
    default:
      return "open";
  }
}

/**
 * Map Anchor QuorumType enum variant index to string.
 */
function parseQuorumType(byte: number): string {
  switch (byte) {
    case 0:
      return "small";
    case 1:
      return "treasury";
    case 2:
      return "parameter_change";
    default:
      return "small";
  }
}

/**
 * Map Anchor IdeaStatus enum variant index to string.
 */
function parseIdeaStatus(byte: number): string {
  switch (byte) {
    case 0:
      return "submitted";
    case 1:
      return "approved";
    case 2:
      return "rejected";
    case 3:
      return "vetoed";
    default:
      return "submitted";
  }
}

/**
 * Map Anchor VoteChoice enum variant index to string.
 */
function parseVoteChoice(byte: number): string {
  switch (byte) {
    case 0:
      return "yes";
    case 1:
      return "no";
    case 2:
      return "abstain";
    default:
      return "abstain";
  }
}

/**
 * Process a single Helius enhanced transaction for governance events.
 *
 * For each transaction:
 * 1. Check if any instruction targets the GSD_PROGRAM_ID
 * 2. Identify instruction type from the first 8 bytes (Anchor discriminator)
 * 3. Parse account data at known offsets based on Anchor struct layout
 * 4. Upsert to database with transaction signature for idempotency
 *
 * Pragmatic simplification: The indexer creates records with on-chain data only.
 * Off-chain content (title, description) comes from POST API endpoints when
 * users submit from the UI.
 *
 * @param transaction - Helius enhanced transaction
 * @returns Number of governance events processed
 */
export async function processGovernanceEvent(transaction: {
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
    const instructionName = DISCRIMINATOR_TO_INSTRUCTION[discHex];

    if (!instructionName) {
      // Not a governance instruction (could be contribution, register, etc.)
      continue;
    }

    try {
      switch (instructionName) {
        case "create_round":
          await processCreateRound(ix, ixData, signature);
          processedCount++;
          break;

        case "submit_idea":
          await processSubmitIdea(ix, ixData, signature);
          processedCount++;
          break;

        case "transition_round":
          await processTransitionRound(ix, signature);
          processedCount++;
          break;

        case "cast_vote":
          await processCastVote(ix, ixData, signature);
          processedCount++;
          break;

        case "deposit_tokens":
          await processDepositTokens(ix, ixData, signature);
          processedCount++;
          break;

        case "withdraw_tokens":
          await processWithdrawTokens(ix, ixData, signature);
          processedCount++;
          break;

        case "relinquish_vote":
          await processRelinquishVote(ix);
          processedCount++;
          break;

        case "veto_idea":
          await processVetoIdea(ix);
          processedCount++;
          break;
      }
    } catch (error) {
      // Log and continue -- don't let one failed event block others
      console.error(
        `Governance indexer error [${instructionName}] in ${signature}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return processedCount;
}

/**
 * Process a create_round instruction.
 *
 * Accounts (from CreateRound struct):
 *   [0] governance_config
 *   [1] idea_round (PDA)
 *   [2] admin
 *   [3] system_program
 *
 * Instruction data after 8-byte discriminator:
 *   submission_start: i64 LE (8 bytes)
 *   submission_end: i64 LE (8 bytes)
 *   voting_end: i64 LE (8 bytes)
 *   quorum_type: u8 (1 byte -- Borsh enum variant index)
 *   content_hash: [u8; 32] (32 bytes)
 */
async function processCreateRound(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const view = new DataView(ixData.buffer, ixData.byteOffset, ixData.byteLength);
  const roundAddress = ix.accounts[1];

  // Parse instruction args
  const submissionStart = Number(view.getBigInt64(8, true));
  const submissionEnd = Number(view.getBigInt64(16, true));
  const votingEnd = Number(view.getBigInt64(24, true));
  const quorumTypeByte = ixData[32];
  const contentHash = bytesToHex(ixData.slice(33, 65));

  // We need the round_index. It comes from governance_config.round_count
  // at the time of creation. We can derive it from the PDA or read the
  // account data. For the indexer, we count existing rounds + 1.
  const existingRoundCount = await prisma.ideaRound.count();

  await prisma.ideaRound.upsert({
    where: { onChainAddress: roundAddress },
    update: {
      status: "open",
      submissionStart: new Date(submissionStart * 1000),
      submissionEnd: new Date(submissionEnd * 1000),
      votingEnd: new Date(votingEnd * 1000),
      quorumType: parseQuorumType(quorumTypeByte),
      contentHash,
    },
    create: {
      roundIndex: existingRoundCount,
      onChainAddress: roundAddress,
      title: `Round ${existingRoundCount + 1}`,
      description: "Pending off-chain content submission",
      contentHash,
      status: "open",
      submissionStart: new Date(submissionStart * 1000),
      submissionEnd: new Date(submissionEnd * 1000),
      votingEnd: new Date(votingEnd * 1000),
      ideaCount: 0,
      quorumType: parseQuorumType(quorumTypeByte),
    },
  });
}

/**
 * Process a submit_idea instruction.
 *
 * Accounts (from SubmitIdea struct):
 *   [0] idea_round
 *   [1] idea (PDA)
 *   [2] author
 *   [3] system_program
 *
 * Instruction data after 8-byte discriminator:
 *   content_hash: [u8; 32] (32 bytes)
 */
async function processSubmitIdea(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const roundAddress = ix.accounts[0];
  const ideaAddress = ix.accounts[1];
  const authorWallet = ix.accounts[2];
  const contentHash = bytesToHex(ixData.slice(8, 40));

  // Resolve the round by on-chain address
  const round = await prisma.ideaRound.findUnique({
    where: { onChainAddress: roundAddress },
    select: { id: true, ideaCount: true },
  });

  if (!round) {
    console.warn(
      `submit_idea: round not found for address ${roundAddress}, skipping`
    );
    return;
  }

  await prisma.idea.upsert({
    where: { onChainAddress: ideaAddress },
    update: {
      contentHash,
    },
    create: {
      ideaIndex: round.ideaCount,
      onChainAddress: ideaAddress,
      roundId: round.id,
      authorWallet,
      title: `Idea ${round.ideaCount + 1}`,
      description: "Pending off-chain content submission",
      contentHash,
      status: "submitted",
      transactionSignature: signature,
    },
  });

  // Increment idea count on the round
  await prisma.ideaRound.update({
    where: { onChainAddress: roundAddress },
    data: { ideaCount: { increment: 1 } },
  });
}

/**
 * Process a transition_round instruction.
 *
 * Accounts (from TransitionRound struct):
 *   [0] idea_round
 *
 * No instruction args beyond discriminator.
 * The new status depends on the previous state:
 *   Open -> Voting, Voting -> Closed
 *
 * Since we don't have the previous on-chain state, we read the current
 * database state and advance it.
 */
async function processTransitionRound(
  ix: HeliusInstruction,
  _signature: string
): Promise<void> {
  const roundAddress = ix.accounts[0];

  const round = await prisma.ideaRound.findUnique({
    where: { onChainAddress: roundAddress },
    select: { status: true },
  });

  if (!round) {
    console.warn(
      `transition_round: round not found for address ${roundAddress}`
    );
    return;
  }

  let newStatus: string;
  if (round.status === "open") {
    newStatus = "voting";
  } else if (round.status === "voting") {
    newStatus = "closed";
  } else {
    // Already closed or unknown state
    return;
  }

  await prisma.ideaRound.update({
    where: { onChainAddress: roundAddress },
    data: { status: newStatus },
  });
}

/**
 * Process a cast_vote instruction.
 *
 * Accounts (from CastVote struct):
 *   [0] idea
 *   [1] round
 *   [2] vote_record (PDA)
 *   [3] vote_deposit
 *   [4] voter
 *   [5] system_program
 *
 * Instruction data after 8-byte discriminator:
 *   vote: u8 (1 byte -- VoteChoice enum variant)
 *
 * The weight comes from the VoteDeposit's deposited_amount. We read
 * it from the database since it was indexed when the deposit occurred.
 */
async function processCastVote(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const ideaAddress = ix.accounts[0];
  const voteRecordAddress = ix.accounts[2];
  const voterWallet = ix.accounts[4];
  const voteChoiceByte = ixData[8];

  const voteChoice = parseVoteChoice(voteChoiceByte);

  // Look up the idea
  const idea = await prisma.idea.findUnique({
    where: { onChainAddress: ideaAddress },
    select: { id: true },
  });

  if (!idea) {
    console.warn(
      `cast_vote: idea not found for address ${ideaAddress}, skipping`
    );
    return;
  }

  // Look up the voter's deposit for weight
  const deposit = await prisma.voteDeposit.findUnique({
    where: { walletAddress: voterWallet },
    select: { depositedAmount: true },
  });

  const weight = deposit?.depositedAmount ?? BigInt(0);

  // Create vote record (unique on ideaId + voterWallet)
  await prisma.vote.upsert({
    where: {
      ideaId_voterWallet: {
        ideaId: idea.id,
        voterWallet,
      },
    },
    update: {
      vote: voteChoice,
      weight,
      transactionSignature: signature,
    },
    create: {
      onChainAddress: voteRecordAddress,
      ideaId: idea.id,
      voterWallet,
      vote: voteChoice,
      weight,
      transactionSignature: signature,
      votedAt: new Date(),
    },
  });

  // Update idea vote tallies
  const weightIncrement: Record<string, bigint> = {
    yes: BigInt(0),
    no: BigInt(0),
    abstain: BigInt(0),
  };
  weightIncrement[voteChoice] = weight;

  await prisma.idea.update({
    where: { onChainAddress: ideaAddress },
    data: {
      yesWeight: { increment: weightIncrement.yes },
      noWeight: { increment: weightIncrement.no },
      abstainWeight: { increment: weightIncrement.abstain },
      voterCount: { increment: 1 },
    },
  });
}

/**
 * Process a deposit_tokens instruction.
 *
 * Accounts (from DepositTokens struct):
 *   [0] governance_config
 *   [1] vote_deposit (PDA)
 *   [2] depositor
 *   [3] user_token_account
 *   [4] escrow_token_account
 *   [5] token_program
 *   [6] system_program
 *
 * Instruction data after 8-byte discriminator:
 *   amount: u64 LE (8 bytes)
 */
async function processDepositTokens(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  _signature: string
): Promise<void> {
  const walletAddress = ix.accounts[2];
  const view = new DataView(ixData.buffer, ixData.byteOffset, ixData.byteLength);
  const amount = view.getBigUint64(8, true);

  const now = new Date();

  // 7-day timelock (604800 seconds) -- default from GovernanceConfig
  const TIMELOCK_SECONDS = 604800;
  const eligibleAt = new Date(now.getTime() + TIMELOCK_SECONDS * 1000);

  await prisma.voteDeposit.upsert({
    where: { walletAddress },
    update: {
      depositedAmount: { increment: amount },
    },
    create: {
      walletAddress,
      depositedAmount: amount,
      depositTimestamp: now,
      eligibleAt,
      activeVotes: 0,
    },
  });
}

/**
 * Process a withdraw_tokens instruction.
 *
 * Accounts (from WithdrawTokens struct):
 *   [0] governance_config
 *   [1] vote_deposit
 *   [2] depositor
 *   [3] user_token_account
 *   [4] escrow_token_account
 *   [5] token_program
 *
 * Instruction data after 8-byte discriminator:
 *   amount: u64 LE (8 bytes)
 */
async function processWithdrawTokens(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  _signature: string
): Promise<void> {
  const walletAddress = ix.accounts[2];
  const view = new DataView(ixData.buffer, ixData.byteOffset, ixData.byteLength);
  const amount = view.getBigUint64(8, true);

  const deposit = await prisma.voteDeposit.findUnique({
    where: { walletAddress },
    select: { depositedAmount: true },
  });

  if (!deposit) {
    console.warn(
      `withdraw_tokens: deposit not found for wallet ${walletAddress}`
    );
    return;
  }

  const newAmount = deposit.depositedAmount - amount;

  if (newAmount <= BigInt(0)) {
    // Full withdrawal -- reset timestamps
    await prisma.voteDeposit.update({
      where: { walletAddress },
      data: {
        depositedAmount: BigInt(0),
        depositTimestamp: new Date(0),
        eligibleAt: new Date(0),
      },
    });
  } else {
    await prisma.voteDeposit.update({
      where: { walletAddress },
      data: {
        depositedAmount: { decrement: amount },
      },
    });
  }
}

/**
 * Process a relinquish_vote instruction.
 *
 * Accounts (from RelinquishVote struct):
 *   [0] round
 *   [1] vote_record
 *   [2] vote_deposit
 *   [3] voter
 *
 * Decrements active_votes on the voter's deposit.
 */
async function processRelinquishVote(ix: HeliusInstruction): Promise<void> {
  const voterWallet = ix.accounts[3];

  await prisma.voteDeposit.update({
    where: { walletAddress: voterWallet },
    data: {
      activeVotes: { decrement: 1 },
    },
  });
}

/**
 * Process a veto_idea instruction.
 *
 * Accounts (from VetoIdea struct):
 *   [0] idea
 *   [1] round
 *   [2] governance_config
 *   [3] veto_authority
 *
 * Sets the idea status to "vetoed".
 */
async function processVetoIdea(ix: HeliusInstruction): Promise<void> {
  const ideaAddress = ix.accounts[0];

  await prisma.idea.updateMany({
    where: { onChainAddress: ideaAddress },
    data: { status: "vetoed" },
  });
}
