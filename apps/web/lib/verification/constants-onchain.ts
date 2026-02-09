import { createHash } from "crypto";

/**
 * Compute an Anchor instruction discriminator.
 *
 * Anchor uses the first 8 bytes of SHA-256("global:{instruction_name}")
 * as the instruction discriminator prefix.
 *
 * @param instructionName - snake_case instruction name (e.g. "submit_verification")
 * @returns 16-character hex string (8 bytes)
 */
function anchorDiscriminator(instructionName: string): string {
  const hash = createHash("sha256")
    .update(`global:${instructionName}`)
    .digest();
  return hash.subarray(0, 8).toString("hex");
}

/**
 * Map of verification instruction names to their Anchor discriminator hex strings.
 *
 * Each discriminator is the first 8 bytes of SHA-256("global:{name}") encoded as hex.
 * Used to identify which verification instruction a transaction contains by comparing
 * against the first 8 bytes of the instruction data.
 */
export const VERIFICATION_DISCRIMINATORS: Record<string, string> = {
  init_verification_config: anchorDiscriminator("init_verification_config"),
  submit_verification: anchorDiscriminator("submit_verification"),
  submit_peer_review: anchorDiscriminator("submit_peer_review"),
  finalize_peer_verification: anchorDiscriminator("finalize_peer_verification"),
};

/**
 * Reverse lookup: discriminator hex -> instruction name.
 * Built from VERIFICATION_DISCRIMINATORS for O(1) matching in the indexer.
 */
export const VERIFICATION_DISCRIMINATOR_TO_INSTRUCTION: Record<string, string> =
  Object.fromEntries(
    Object.entries(VERIFICATION_DISCRIMINATORS).map(([name, disc]) => [
      disc,
      name,
    ])
  );
