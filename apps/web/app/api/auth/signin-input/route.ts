import { NextResponse } from "next/server";
import { createSignInInput } from "@/lib/auth/siws";

/**
 * GET /api/auth/signin-input
 *
 * Returns a fresh SolanaSignInInput for the SIWS flow.
 * The nonce is a cryptographic random value to prevent replay attacks.
 */
export async function GET() {
  const authUrl = process.env.AUTH_URL || "http://localhost:3000";
  const domain = new URL(authUrl).host;

  // Generate cryptographic nonce for replay protection
  const nonce = crypto.randomUUID();

  const signInInput = createSignInInput(domain, nonce);

  return NextResponse.json(signInInput);
}
