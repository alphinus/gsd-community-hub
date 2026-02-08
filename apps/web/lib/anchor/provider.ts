"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Import IDL - will be available after anchor build
// The IDL JSON is generated at target/idl/gsd_hub.json
// For now, we type it loosely and will refine when IDL is consumed
import type { Idl } from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw"
);

export function useAnchorProvider(): AnchorProvider | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);
}

export function useGsdProgram(idl: Idl | null): Program | null {
  const provider = useAnchorProvider();

  return useMemo(() => {
    if (!provider || !idl) return null;
    return new Program(idl, provider);
  }, [provider, idl]);
}

export { PROGRAM_ID };
