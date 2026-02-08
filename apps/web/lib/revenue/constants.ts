import { createHash } from "crypto";

/**
 * Compute an Anchor instruction discriminator.
 *
 * Anchor uses the first 8 bytes of SHA-256("global:{instruction_name}")
 * as the instruction discriminator prefix.
 *
 * @param instructionName - snake_case instruction name (e.g. "record_revenue_event")
 * @returns 16-character hex string (8 bytes)
 */
function anchorDiscriminator(instructionName: string): string {
  const hash = createHash("sha256")
    .update(`global:${instructionName}`)
    .digest();
  return hash.subarray(0, 8).toString("hex");
}

/**
 * Map of revenue instruction names to their Anchor discriminator hex strings.
 *
 * Each discriminator is the first 8 bytes of SHA-256("global:{name}") encoded as hex.
 * Used to identify which revenue instruction a transaction contains by comparing
 * against the first 8 bytes of the instruction data.
 */
export const REVENUE_DISCRIMINATORS: Record<string, string> = {
  init_revenue_config: anchorDiscriminator("init_revenue_config"),
  record_revenue_event: anchorDiscriminator("record_revenue_event"),
  claim_revenue_share: anchorDiscriminator("claim_revenue_share"),
  execute_burn: anchorDiscriminator("execute_burn"),
};

/**
 * Reverse lookup: discriminator hex -> instruction name.
 * Built from REVENUE_DISCRIMINATORS for O(1) matching in the indexer.
 */
export const REVENUE_DISCRIMINATOR_TO_INSTRUCTION: Record<string, string> =
  Object.fromEntries(
    Object.entries(REVENUE_DISCRIMINATORS).map(([name, disc]) => [disc, name])
  );
