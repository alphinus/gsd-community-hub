import type { CreateProfileInput } from "@gsd/types";

/**
 * Compute a deterministic SHA-256 hash of profile data.
 * Uses canonical JSON serialization: filter undefined values, sort keys alphabetically.
 */
export async function computeProfileHash(
  profile: CreateProfileInput
): Promise<Uint8Array> {
  // Filter out undefined values and sort keys alphabetically
  const filtered: Record<string, string> = {};
  const sortedKeys = Object.keys(profile).sort();
  for (const key of sortedKeys) {
    const value = (profile as Record<string, unknown>)[key];
    if (value !== undefined) {
      filtered[key] = String(value);
    }
  }

  const canonical = JSON.stringify(filtered);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}

/**
 * Convert a Uint8Array hash to a number[] for Anchor compatibility.
 */
export function profileHashToBytes32(hash: Uint8Array): number[] {
  return Array.from(hash);
}
