import {
  PublicKey,
  Connection,
  SystemProgram,
  type TransactionInstruction,
} from "@solana/web3.js";

/**
 * SPL Account Compression program ID.
 * Well-known program address for concurrent Merkle tree operations.
 */
export const SPL_ACCOUNT_COMPRESSION_PROGRAM_ID = new PublicKey(
  "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK"
);

/**
 * SPL Noop program ID.
 * Used for logging leaf data in compressed account operations.
 */
export const SPL_NOOP_PROGRAM_ID = new PublicKey(
  "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
);

/**
 * Program ID for the gsd-hub on-chain program.
 */
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw"
);

/**
 * PDA seed prefix for contribution tree config accounts.
 * Mirrors: seeds = [b"contribution_tree", merkle_tree.key().as_ref()]
 */
const TREE_CONFIG_SEED = "contribution_tree";

/**
 * Derive the ContributionTreeConfig PDA address for a given Merkle tree account.
 *
 * On-chain seeds: [b"contribution_tree", merkle_tree.key().as_ref()]
 *
 * @param merkleTree - Public key of the concurrent Merkle tree account
 * @returns [pda, bump] tuple
 */
export function getContributionTreeConfigPDA(
  merkleTree: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(TREE_CONFIG_SEED), merkleTree.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Default tree parameters for contribution trees.
 *
 * depth=14 supports up to 16,384 leaves (contributions).
 * bufferSize=64 allows 64 concurrent updates before needing a root refresh.
 *
 * For testing, use depth=3, bufferSize=8.
 */
export const DEFAULT_TREE_PARAMS = {
  maxDepth: 14,
  maxBufferSize: 64,
} as const;

/**
 * Calculate the account size in bytes for a concurrent Merkle tree.
 *
 * Layout (from spl-account-compression):
 *   discriminator: 1 byte
 *   header (maxDepth, maxBufferSize, authority, padding, etc.): roughly fixed
 *   changelog: maxBufferSize * (maxDepth + 1) * 32 bytes
 *   rightmost proof: maxDepth * 32 bytes
 *   leaf buffer: 32 bytes
 *
 * Simplified formula matching getConcurrentMerkleTreeAccountSize:
 *   2 + 54 + (maxBufferSize * (1 + maxDepth) * 32) + ((2 * maxDepth + 1) * 32)
 */
export function getConcurrentMerkleTreeAccountSize(
  maxDepth: number,
  maxBufferSize: number
): number {
  // Header size: 2 (discriminator) + 6 (sequenceNumber u64 part) + 8 (sequenceNumber)
  // + 4 (activeIndex) + 4 (bufferSize) + 32 (authority) = 56 bytes
  // Changelog entries: maxBufferSize * (1 path root + maxDepth hashes) * 32 bytes each
  // Rightmost proof: maxDepth * 32 bytes
  // Canopy: 0 for canopyDepth=0
  //
  // This matches the exact formula from spl-account-compression:
  //   2 + 54 + (maxBufferSize * (maxDepth + 1) * 32) + ((2 * maxDepth + 1) * 32)
  return (
    2 + 54 + maxBufferSize * (maxDepth + 1) * 32 + (2 * maxDepth + 1) * 32
  );
}

/**
 * Calculate the cost in lamports to allocate a concurrent Merkle tree account.
 *
 * Computes the exact account size and queries the RPC for rent exemption.
 *
 * @param connection - Solana RPC connection
 * @param maxDepth - Maximum depth of the Merkle tree
 * @param maxBufferSize - Maximum buffer size for concurrent updates
 * @returns Cost in lamports for rent-exempt allocation
 */
export async function getTreeCost(
  connection: Connection,
  maxDepth: number = DEFAULT_TREE_PARAMS.maxDepth,
  maxBufferSize: number = DEFAULT_TREE_PARAMS.maxBufferSize
): Promise<number> {
  const requiredSpace = getConcurrentMerkleTreeAccountSize(
    maxDepth,
    maxBufferSize
  );
  const lamports =
    await connection.getMinimumBalanceForRentExemption(requiredSpace);
  return lamports;
}

/**
 * Create the instruction to allocate space for a concurrent Merkle tree account.
 *
 * This instruction must be sent before `initContributionTree` since the tree
 * account needs to be pre-allocated with the correct size by the system program.
 *
 * @param connection - Solana RPC connection
 * @param merkleTree - Public key of the new tree account (must be a signer)
 * @param payer - Public key of the account paying for allocation
 * @param maxDepth - Maximum depth of the Merkle tree
 * @param maxBufferSize - Maximum buffer size for concurrent updates
 * @returns TransactionInstruction for allocating the tree account
 */
export async function createTreeAllocIx(
  connection: Connection,
  merkleTree: PublicKey,
  payer: PublicKey,
  maxDepth: number = DEFAULT_TREE_PARAMS.maxDepth,
  maxBufferSize: number = DEFAULT_TREE_PARAMS.maxBufferSize
): Promise<TransactionInstruction> {
  const requiredSpace = getConcurrentMerkleTreeAccountSize(
    maxDepth,
    maxBufferSize
  );
  const lamports =
    await connection.getMinimumBalanceForRentExemption(requiredSpace);

  return SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: merkleTree,
    lamports,
    space: requiredSpace,
    programId: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  });
}

/**
 * Get the tree configuration (PDA, params, cost) for display or transaction building.
 *
 * @param connection - Solana RPC connection
 * @param merkleTree - Public key of the Merkle tree account
 * @param maxDepth - Maximum tree depth
 * @param maxBufferSize - Maximum buffer size
 * @returns Tree config with PDA address, params, and estimated cost
 */
export async function getTreeConfig(
  connection: Connection,
  merkleTree: PublicKey,
  maxDepth: number = DEFAULT_TREE_PARAMS.maxDepth,
  maxBufferSize: number = DEFAULT_TREE_PARAMS.maxBufferSize
) {
  const [configPda, bump] = getContributionTreeConfigPDA(merkleTree);
  const cost = await getTreeCost(connection, maxDepth, maxBufferSize);

  return {
    configPda,
    bump,
    merkleTree,
    maxDepth,
    maxBufferSize,
    maxLeaves: 2 ** maxDepth,
    costLamports: cost,
    costSol: cost / 1e9,
  };
}
