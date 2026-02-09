import { PublicKey } from "@solana/web3.js";

// --- PDA seed constants (matching on-chain seed strings) ---

export const GOVERNANCE_CONFIG_SEED = "governance_config";
export const IDEA_ROUND_SEED = "idea_round";
export const IDEA_SEED = "idea";
export const VOTE_DEPOSIT_SEED = "vote_deposit";
export const VOTE_RECORD_SEED = "vote_record";
export const DELEGATION_SEED = "delegation";

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
 * Derive the GovernanceConfig singleton PDA.
 * Seeds: ["governance_config"]
 */
export function getGovernanceConfigPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(GOVERNANCE_CONFIG_SEED)],
    programId
  );
}

/**
 * Derive an IdeaRound PDA by round index.
 * Seeds: ["idea_round", round_index.to_le_bytes()]
 */
export function getIdeaRoundPDA(
  roundIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(IDEA_ROUND_SEED), u32ToLeBytes(roundIndex)],
    programId
  );
}

/**
 * Derive an Idea PDA by round address and idea index.
 * Seeds: ["idea", round.key(), idea_index.to_le_bytes()]
 */
export function getIdeaPDA(
  round: PublicKey,
  ideaIndex: number,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(IDEA_SEED), round.toBuffer(), u32ToLeBytes(ideaIndex)],
    programId
  );
}

/**
 * Derive a VoteDeposit PDA by wallet address.
 * Seeds: ["vote_deposit", authority.key()]
 */
export function getVoteDepositPDA(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_DEPOSIT_SEED), wallet.toBuffer()],
    programId
  );
}

/**
 * Derive a VoteRecord PDA by voter and idea.
 * Seeds: ["vote_record", voter.key(), idea.key()]
 */
export function getVoteRecordPDA(
  voter: PublicKey,
  idea: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VOTE_RECORD_SEED), voter.toBuffer(), idea.toBuffer()],
    programId
  );
}

/**
 * Derive a DelegationRecord PDA by delegator wallet.
 * Seeds: ["delegation", delegator.key()]
 */
export function getDelegationPDA(
  delegator: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(DELEGATION_SEED), delegator.toBuffer()],
    programId
  );
}
