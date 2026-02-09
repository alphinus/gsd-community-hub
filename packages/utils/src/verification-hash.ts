/**
 * Verification hash utilities for the GSD Community Hub.
 *
 * Provides deterministic hashing for verification reports and task references.
 * Follows the computeProfileHash pattern from hash.ts using crypto.subtle.
 */

/**
 * Compute a deterministic SHA-256 hash of a verification report JSON object.
 * Uses canonical JSON serialization (sorted keys) for consistency.
 *
 * @param reportJson - The verification report object to hash
 * @returns Hex-encoded SHA-256 hash string
 */
export async function computeVerificationReportHash(
  reportJson: object
): Promise<string> {
  const canonical = JSON.stringify(reportJson, Object.keys(reportJson).sort());
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute a SHA-256 hash of a task identifier string.
 * Returns a 32-byte Buffer suitable for PDA seed derivation.
 *
 * @param taskIdentifier - Task identifier string (e.g. "05-01-task-3")
 * @returns 32-byte Buffer containing the SHA-256 hash
 */
export async function computeTaskRef(taskIdentifier: string): Promise<Buffer> {
  const encoded = new TextEncoder().encode(taskIdentifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Buffer.from(hashBuffer);
}
