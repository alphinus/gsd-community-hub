import { PublicKey } from "@solana/web3.js";

// --- PDA seed constants (matching on-chain seed strings) ---

export const VERIFICATION_CONFIG_SEED = "verification_config";
export const VERIFICATION_REPORT_SEED = "verification";
export const PEER_REVIEW_SEED = "peer_review";
export const REVIEWER_PROFILE_SEED = "reviewer";

/**
 * Derive the VerificationConfig singleton PDA.
 * Seeds: ["verification_config"]
 */
export function getVerificationConfigPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VERIFICATION_CONFIG_SEED)],
    programId
  );
}

/**
 * Derive a VerificationReport PDA by developer and task reference.
 * Seeds: ["verification", developer.key(), task_ref]
 */
export function getVerificationReportPDA(
  developer: PublicKey,
  taskRef: Buffer,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VERIFICATION_REPORT_SEED), developer.toBuffer(), taskRef],
    programId
  );
}

/**
 * Derive a PeerReview PDA by reviewer and verification report.
 * Seeds: ["peer_review", reviewer.key(), verification_report.key()]
 */
export function getPeerReviewPDA(
  reviewer: PublicKey,
  verificationReport: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PEER_REVIEW_SEED),
      reviewer.toBuffer(),
      verificationReport.toBuffer(),
    ],
    programId
  );
}

/**
 * Derive a ReviewerProfile PDA by reviewer authority.
 * Seeds: ["reviewer", authority.key()]
 */
export function getReviewerProfilePDA(
  reviewer: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVIEWER_PROFILE_SEED), reviewer.toBuffer()],
    programId
  );
}
