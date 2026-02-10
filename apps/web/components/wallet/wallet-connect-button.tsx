"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { SolanaSignInInput } from "@solana/wallet-standard-features";
import { serializeSignInOutput } from "@/lib/auth/siws";
import dynamic from "next/dynamic";

// Dynamic import WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export function WalletConnectButton() {
  const { connected, wallet, publicKey, disconnect, signMessage } =
    useWallet();
  const { data: session, status } = useSession();
  const isSigningIn = useRef(false);

  /**
   * Initiate SIWS authentication after wallet connects.
   */
  const handleSignIn = useCallback(async () => {
    if (!wallet || !publicKey || isSigningIn.current) return;

    isSigningIn.current = true;

    try {
      // 1. Fetch fresh sign-in input from server
      const res = await fetch("/api/auth/signin-input");
      if (!res.ok) {
        throw new Error("Failed to fetch sign-in input");
      }
      const signInInput: SolanaSignInInput = await res.json();

      // 2. Check if wallet supports the signIn feature (Wallet Standard)
      const walletFeatures = wallet.adapter as any;
      const hasSignInFeature =
        walletFeatures?.wallet?.features?.["solana:signIn"];

      let inputSerialized: string;
      let outputSerialized: string;

      if (hasSignInFeature) {
        // Standard SIWS flow - one-click via Wallet Standard signIn
        const signInFeature =
          walletFeatures.wallet.features["solana:signIn"];
        const [output] = await signInFeature.signIn(signInInput);

        inputSerialized = JSON.stringify(signInInput);
        outputSerialized = serializeSignInOutput(output);
      } else if (signMessage) {
        // Fallback: construct SIWS message manually and use signMessage
        const message = constructSIWSMessage(signInInput, publicKey.toBase58());
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await signMessage(encodedMessage);

        inputSerialized = JSON.stringify(signInInput);
        outputSerialized = JSON.stringify({
          account: {
            address: publicKey.toBase58(),
            publicKey: Buffer.from(publicKey.toBytes()).toString("base64"),
            chains: ["solana:devnet"],
            features: [],
          },
          signedMessage: Buffer.from(encodedMessage).toString("base64"),
          signature: Buffer.from(signature).toString("base64"),
        });
      } else {
        console.error("Wallet does not support signIn or signMessage");
        return;
      }

      // 3. Authenticate with Auth.js
      const result = await signIn("solana", {
        input: inputSerialized,
        output: outputSerialized,
        redirect: false,
      });

      if (result?.error) {
        console.error("Auth error:", result.error);
      }
    } catch (error) {
      console.error("Sign-in error:", error);
    } finally {
      isSigningIn.current = false;
    }
  }, [wallet, publicKey, signMessage]);

  /**
   * Auto-trigger SIWS when wallet connects and user is not already authenticated.
   */
  useEffect(() => {
    if (connected && publicKey && status === "unauthenticated") {
      handleSignIn();
    }
  }, [connected, publicKey, status, handleSignIn]);

  /**
   * Handle disconnect: clear both wallet connection and auth session.
   */
  const handleDisconnect = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      await disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, [disconnect]);

  // Not connected: show wallet multi-button (connect modal)
  if (!connected) {
    return <WalletMultiButton />;
  }

  // Connected but not authenticated: show signing in state or Sign In button
  if (status !== "authenticated") {
    if (isSigningIn.current || status === "loading") {
      return (
        <button
          className="glass-surface rounded-xl border border-[var(--color-gsd-accent)]/20 px-5 py-2 text-sm font-semibold text-[var(--color-gsd-text)] opacity-80 cursor-not-allowed"
          disabled
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-gsd-accent)]" />
            Signing in...
          </span>
        </button>
      );
    }
    return (
      <button
        onClick={handleSignIn}
        className="gradient-cyan glow-cyan rounded-xl px-5 py-2 text-sm font-semibold text-white transition-theme hover:shadow-[0_0_24px_rgba(79,209,197,0.4)] cursor-pointer"
      >
        Sign In
      </button>
    );
  }

  // Authenticated: show address and disconnect
  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-[var(--color-gsd-accent)]/80">
        {truncatedAddress}
      </span>
      <button
        onClick={handleDisconnect}
        className="glass-surface rounded-xl border border-[var(--color-gsd-text-muted)]/30 px-4 py-2 text-sm font-medium text-[var(--color-gsd-text-secondary)] transition-theme hover:border-[var(--color-gsd-error)]/60 hover:text-[var(--color-gsd-error)] hover:shadow-[0_0_16px_rgba(248,113,113,0.15)] cursor-pointer"
      >
        Disconnect
      </button>
    </div>
  );
}

/**
 * Construct a SIWS message for wallets that don't support the signIn feature.
 * This is the fallback path using signMessage.
 */
function constructSIWSMessage(
  input: SolanaSignInInput,
  address: string
): string {
  const lines: string[] = [];

  if (input.domain) {
    lines.push(`${input.domain} wants you to sign in with your Solana account:`);
  }
  lines.push(address);

  if (input.statement) {
    lines.push("");
    lines.push(input.statement);
  }

  lines.push("");

  if (input.nonce) {
    lines.push(`Nonce: ${input.nonce}`);
  }
  if (input.issuedAt) {
    lines.push(`Issued At: ${input.issuedAt}`);
  }
  if (input.expirationTime) {
    lines.push(`Expiration Time: ${input.expirationTime}`);
  }

  return lines.join("\n");
}
