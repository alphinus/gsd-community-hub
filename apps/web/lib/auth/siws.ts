import type { SolanaSignInInput } from "@solana/wallet-standard-features";
import { verifySignIn } from "@solana/wallet-standard-util";

/**
 * Create a SolanaSignInInput for the SIWS flow.
 * Called by the /api/auth/signin-input endpoint to provide fresh sign-in parameters.
 */
export function createSignInInput(
  domain: string,
  nonce: string
): SolanaSignInInput {
  const now = new Date();
  const expirationTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  return {
    domain,
    statement: "Sign in to GSD Community Hub",
    nonce,
    issuedAt: now.toISOString(),
    expirationTime: expirationTime.toISOString(),
  };
}

/**
 * Serialization helpers for transporting Uint8Array data through Auth.js credentials.
 * Auth.js credentials are string-based, so we serialize Uint8Array fields as base64.
 */
export function serializeUint8Array(arr: Uint8Array): string {
  return Buffer.from(arr).toString("base64");
}

export function deserializeUint8Array(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, "base64"));
}

/**
 * Serialize the SolanaSignInOutput for transport through Auth.js credentials.
 * Converts Uint8Array fields to base64 strings.
 */
export function serializeSignInOutput(output: {
  account: {
    address: string;
    publicKey: Uint8Array;
    chains: string[];
    features: string[];
  };
  signedMessage: Uint8Array;
  signature: Uint8Array;
}): string {
  return JSON.stringify({
    account: {
      address: output.account.address,
      publicKey: serializeUint8Array(output.account.publicKey),
      chains: output.account.chains,
      features: output.account.features,
    },
    signedMessage: serializeUint8Array(output.signedMessage),
    signature: serializeUint8Array(output.signature),
  });
}

/**
 * Deserialize the SolanaSignInOutput from Auth.js credentials.
 * Converts base64 strings back to Uint8Array.
 */
export function deserializeSignInOutput(serialized: string): {
  account: {
    address: string;
    publicKey: Uint8Array;
    chains: string[];
    features: string[];
  };
  signedMessage: Uint8Array;
  signature: Uint8Array;
} {
  const parsed = JSON.parse(serialized);
  return {
    account: {
      address: parsed.account.address,
      publicKey: deserializeUint8Array(parsed.account.publicKey),
      chains: parsed.account.chains || [],
      features: parsed.account.features || [],
    },
    signedMessage: deserializeUint8Array(parsed.signedMessage),
    signature: deserializeUint8Array(parsed.signature),
  };
}

/**
 * Verify a SIWS sign-in attempt.
 * Deserializes the input and output, then calls verifySignIn from @solana/wallet-standard-util.
 *
 * @param inputSerialized - JSON-serialized SolanaSignInInput
 * @param outputSerialized - JSON-serialized SolanaSignInOutput (with base64 Uint8Arrays)
 * @returns The wallet address (public key) on success, null on failure
 */
export function verifySIWS(
  inputSerialized: string,
  outputSerialized: string
): string | null {
  try {
    const input: SolanaSignInInput = JSON.parse(inputSerialized);
    const output = deserializeSignInOutput(outputSerialized);

    // Verify expiration
    if (input.expirationTime) {
      const expirationTime = new Date(input.expirationTime);
      if (expirationTime < new Date()) {
        console.error("SIWS: Sign-in input expired");
        return null;
      }
    }

    // Verify issuedAt is not too far in the past (10 minute window)
    if (input.issuedAt) {
      const issuedAt = new Date(input.issuedAt);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (issuedAt < tenMinutesAgo) {
        console.error("SIWS: Sign-in input issued too long ago");
        return null;
      }
    }

    // Verify the signature using wallet-standard-util
    const isValid = verifySignIn(input, output);

    if (!isValid) {
      console.error("SIWS: Signature verification failed");
      return null;
    }

    return output.account.address;
  } catch (error) {
    console.error("SIWS: Verification error:", error);
    return null;
  }
}
