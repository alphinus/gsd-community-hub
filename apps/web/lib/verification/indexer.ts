import { prisma } from "@/lib/db/prisma";
import { bytesToHex } from "@gsd/utils";
import { VERIFICATION_DISCRIMINATOR_TO_INSTRUCTION } from "./constants-onchain";
import type { HeliusEnhancedTransaction } from "@/lib/contributions/indexer";

/**
 * GSD Hub program ID for verification instructions.
 */
const GSD_PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
  "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw";

/**
 * Helius instruction shape (matches contribution, governance, and revenue indexer types).
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
 * Process a single Helius enhanced transaction for on-chain verification events.
 *
 * Identifies gsd-hub verification instructions by discriminator:
 * - submit_verification: upserts a VerificationReport record
 * - submit_peer_review: upserts a PeerReview record, updates ReviewerProfile stats
 * - finalize_peer_verification: updates VerificationReport status to "completed"
 * - init_verification_config: logged but no database action needed
 *
 * @param transaction - Helius enhanced transaction
 * @returns Number of verification events processed
 */
export async function processVerificationEvent(
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
    const instructionName =
      VERIFICATION_DISCRIMINATOR_TO_INSTRUCTION[discHex];

    if (!instructionName) {
      // Not a verification instruction
      continue;
    }

    try {
      switch (instructionName) {
        case "submit_verification":
          await processSubmitVerification(ix, ixData, signature);
          processedCount++;
          break;

        case "submit_peer_review":
          await processSubmitPeerReview(ix, ixData, signature);
          processedCount++;
          break;

        case "finalize_peer_verification":
          await processFinalizePeerVerification(ix, ixData, signature);
          processedCount++;
          break;

        case "init_verification_config":
          // Config initialization -- no database action needed
          console.log(
            `Verification config initialized in tx: ${signature}`
          );
          processedCount++;
          break;
      }
    } catch (error) {
      console.error(
        `Verification indexer error [${instructionName}] in ${signature}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return processedCount;
}

/**
 * Process a submit_verification instruction.
 *
 * Accounts (from SubmitVerification struct):
 *   [0] verification_config
 *   [1] verification_report (PDA)
 *   [2] developer_profile
 *   [3] authority (verifier signer)
 *   [4] system_program
 *
 * Instruction data (after 8-byte discriminator):
 *   task_ref: [u8; 32]          - 32 bytes
 *   score: u16 LE               - 2 bytes (0-10000 basis points)
 *   confidence: u16 LE          - 2 bytes (0-10000 basis points)
 *   report_hash: [u8; 32]       - 32 bytes
 *   verification_type: u8       - 1 byte (0=ai, 1=peer)
 *
 * Creates a stub VerificationReport record with the on-chain data.
 * Full report JSON is stored off-chain via the submit API; this indexes
 * the on-chain confirmation of the verification.
 */
async function processSubmitVerification(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const reportAddress = ix.accounts[1];
  const developerProfile = ix.accounts[2];

  // Parse instruction data after 8-byte discriminator
  const view = new DataView(
    ixData.buffer,
    ixData.byteOffset,
    ixData.byteLength
  );

  let taskRefHex = "";
  let score = 0;
  let confidence = 0;
  let reportHash = "";
  let verificationType = "ai";

  if (ixData.length >= 8 + 32 + 2 + 2 + 32 + 1) {
    // task_ref: 32 bytes starting at offset 8
    taskRefHex = bytesToHex(ixData.slice(8, 40));

    // score: u16 LE at offset 40
    score = view.getUint16(40, true);

    // confidence: u16 LE at offset 42
    confidence = view.getUint16(42, true);

    // report_hash: 32 bytes at offset 44
    reportHash = bytesToHex(ixData.slice(44, 76));

    // verification_type: u8 at offset 76
    const vtByte = ixData[76];
    verificationType = vtByte === 1 ? "peer" : "ai";
  }

  await prisma.verificationReport.upsert({
    where: { transactionSignature: signature },
    update: {
      onChainAddress: reportAddress,
      status: "completed",
    },
    create: {
      walletAddress: developerProfile,
      taskRef: taskRefHex || `onchain-${signature.slice(0, 16)}`,
      verificationType,
      overallScore: score,
      confidence,
      reportJson: {},
      reportHash: reportHash || signature,
      onChainAddress: reportAddress,
      transactionSignature: signature,
      status: "completed",
    },
  });
}

/**
 * Process a submit_peer_review instruction.
 *
 * Accounts (from SubmitPeerReview struct):
 *   [0] verification_config
 *   [1] verification_report (PDA)
 *   [2] peer_review (PDA)
 *   [3] reviewer_profile
 *   [4] reviewer (signer)
 *   [5] system_program
 *
 * Instruction data (after 8-byte discriminator):
 *   score: u16 LE               - 2 bytes (0-10000 basis points)
 *   passed: u8                  - 1 byte (0=false, 1=true)
 *   review_hash: [u8; 32]       - 32 bytes
 *
 * Upserts PeerReview in Prisma and updates ReviewerProfile stats.
 */
async function processSubmitPeerReview(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const reportAddress = ix.accounts[1];
  const peerReviewAddress = ix.accounts[2];
  const reviewerWallet = ix.accounts[4];

  // Parse instruction data after 8-byte discriminator
  const view = new DataView(
    ixData.buffer,
    ixData.byteOffset,
    ixData.byteLength
  );

  let score = 0;
  let passed = false;
  let reviewHash = "";

  if (ixData.length >= 8 + 2 + 1 + 32) {
    // score: u16 LE at offset 8
    score = view.getUint16(8, true);

    // passed: u8 at offset 10
    passed = ixData[10] === 1;

    // review_hash: 32 bytes at offset 11
    reviewHash = bytesToHex(ixData.slice(11, 43));
  }

  // Find the verification report by on-chain address
  const report = await prisma.verificationReport.findUnique({
    where: { onChainAddress: reportAddress },
    select: { id: true },
  });

  if (!report) {
    console.warn(
      `submit_peer_review: report not found for address ${reportAddress}, skipping`
    );
    return;
  }

  // Upsert the PeerReview record
  await prisma.peerReview.upsert({
    where: {
      verificationReportId_reviewerWallet: {
        verificationReportId: report.id,
        reviewerWallet,
      },
    },
    update: {
      score,
      passed,
      onChainAddress: peerReviewAddress,
      transactionSignature: signature,
    },
    create: {
      verificationReportId: report.id,
      reviewerWallet,
      reviewerTier: 1, // enriched from on-chain reviewer profile data
      reviewerWeight: 1.0, // enriched from on-chain reviewer profile data
      score,
      passed,
      evidenceJson: {},
      reviewHash: reviewHash || signature,
      onChainAddress: peerReviewAddress,
      transactionSignature: signature,
    },
  });

  // Update ReviewerProfile stats
  await prisma.reviewerProfile.upsert({
    where: { walletAddress: reviewerWallet },
    update: {
      totalReviews: { increment: 1 },
    },
    create: {
      walletAddress: reviewerWallet,
      tier: 1,
      totalReviews: 1,
      domainReviews: {},
      verifiedContributions: 0,
      domainContributions: {},
      reviewQualityScore: 1.0,
    },
  });
}

/**
 * Process a finalize_peer_verification instruction.
 *
 * Accounts (from FinalizePeerVerification struct):
 *   [0] verification_config
 *   [1] verification_report (PDA)
 *   [2] authority (signer)
 *
 * Instruction data (after 8-byte discriminator):
 *   final_score: u16 LE         - 2 bytes (0-10000 basis points)
 *
 * Updates the VerificationReport status to "completed" with the final consensus score.
 */
async function processFinalizePeerVerification(
  ix: HeliusInstruction,
  ixData: Uint8Array,
  signature: string
): Promise<void> {
  const reportAddress = ix.accounts[1];

  // Parse final_score from instruction data
  const view = new DataView(
    ixData.buffer,
    ixData.byteOffset,
    ixData.byteLength
  );

  let finalScore = 0;
  if (ixData.length >= 8 + 2) {
    finalScore = view.getUint16(8, true);
  }

  await prisma.verificationReport.updateMany({
    where: { onChainAddress: reportAddress },
    data: {
      status: "completed",
      overallScore: finalScore,
    },
  });

  console.log(
    `Finalized peer verification for ${reportAddress} with score ${finalScore} in tx: ${signature}`
  );
}
