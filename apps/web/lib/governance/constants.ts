import { createHash } from "crypto";

/**
 * GSD Hub program ID for governance instructions.
 */
export const GSD_PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
  "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw";

/**
 * Compute an Anchor instruction discriminator.
 *
 * Anchor uses the first 8 bytes of SHA-256("global:{instruction_name}")
 * as the instruction discriminator prefix.
 *
 * @param instructionName - snake_case instruction name (e.g. "create_round")
 * @returns 16-character hex string (8 bytes)
 */
function anchorDiscriminator(instructionName: string): string {
  const hash = createHash("sha256")
    .update(`global:${instructionName}`)
    .digest();
  return hash.subarray(0, 8).toString("hex");
}

/**
 * Map of governance instruction names to their Anchor discriminator hex strings.
 *
 * Each discriminator is the first 8 bytes of SHA-256("global:{name}") encoded as hex.
 * Used to identify which governance instruction a transaction contains by comparing
 * against the first 8 bytes of the instruction data.
 */
export const GOVERNANCE_DISCRIMINATORS: Record<string, string> = {
  create_round: anchorDiscriminator("create_round"),
  submit_idea: anchorDiscriminator("submit_idea"),
  transition_round: anchorDiscriminator("transition_round"),
  cast_vote: anchorDiscriminator("cast_vote"),
  deposit_tokens: anchorDiscriminator("deposit_tokens"),
  withdraw_tokens: anchorDiscriminator("withdraw_tokens"),
  relinquish_vote: anchorDiscriminator("relinquish_vote"),
  veto_idea: anchorDiscriminator("veto_idea"),
};

/**
 * Reverse lookup: discriminator hex -> instruction name.
 * Built from GOVERNANCE_DISCRIMINATORS for O(1) matching in the indexer.
 */
export const DISCRIMINATOR_TO_INSTRUCTION: Record<string, string> =
  Object.fromEntries(
    Object.entries(GOVERNANCE_DISCRIMINATORS).map(([name, disc]) => [
      disc,
      name,
    ])
  );
