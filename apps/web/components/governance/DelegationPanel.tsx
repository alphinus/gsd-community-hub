"use client";

import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { useAnchorProvider, PROGRAM_ID } from "@/lib/anchor/provider";
import { getDelegationPDA } from "@gsd/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import idlJson from "../../../../target/idl/gsd_hub.json";

interface DelegationRecord {
  id: string;
  onChainAddress: string;
  delegatorWallet: string;
  delegateWallet: string;
  delegatedAmount: string;
  isActive: boolean;
  effectiveFromRound: number;
  delegatedAt: string;
  revokedAt: string | null;
}

interface DelegationResponse {
  delegations: DelegationRecord[];
  stats: {
    asDelegator: DelegationRecord | null;
    asDelegate: {
      delegatorCount: number;
      totalDelegated: string;
    };
  };
}

/**
 * Validate a string as a base58 Solana public key.
 */
function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function DelegationPanel() {
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();

  const [delegateAddress, setDelegateAddress] = useState("");
  const [isDelegating, setIsDelegating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [actionStep, setActionStep] = useState("");

  const walletConnected = !!publicKey && !!session?.publicKey && !!provider;

  // Fetch current delegation status
  const { data: delegationData, isLoading } = useQuery<DelegationResponse>({
    queryKey: ["delegation", publicKey?.toBase58()],
    queryFn: async () => {
      const res = await fetch(
        `/api/governance/delegate?wallet=${publicKey!.toBase58()}`
      );
      if (!res.ok) throw new Error("Failed to fetch delegation info");
      return res.json();
    },
    enabled: walletConnected,
    staleTime: 30_000,
  });

  const activeDelegation = delegationData?.stats?.asDelegator ?? null;

  async function handleDelegate(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !provider) return;

    if (!isValidSolanaAddress(delegateAddress)) {
      toast.error("Enter a valid Solana wallet address");
      return;
    }

    if (delegateAddress === publicKey.toBase58()) {
      toast.error("Cannot delegate to yourself");
      return;
    }

    setIsDelegating(true);

    try {
      setActionStep("Confirm transaction in your wallet...");
      const program = new Program(idlJson as Idl, provider);

      const delegatePubkey = new PublicKey(delegateAddress);
      const [delegationPda] = getDelegationPDA(publicKey, PROGRAM_ID);

      const tx = await program.methods
        .delegateVote()
        .accounts({
          delegator: publicKey,
          delegate: delegatePubkey,
          delegationRecord: delegationPda,
        })
        .rpc();

      setActionStep("Confirming on-chain...");
      await provider.connection.confirmTransaction(tx, "confirmed");

      toast.success(
        `Voting power delegated to ${truncateAddress(delegateAddress)}`
      );
      setDelegateAddress("");

      queryClient.invalidateQueries({
        queryKey: ["delegation", publicKey.toBase58()],
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      if (message.includes("User rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error(message);
      }
    } finally {
      setIsDelegating(false);
      setActionStep("");
    }
  }

  async function handleRevoke() {
    if (!publicKey || !provider) return;

    setIsRevoking(true);

    try {
      setActionStep("Confirm revocation in your wallet...");
      const program = new Program(idlJson as Idl, provider);

      const [delegationPda] = getDelegationPDA(publicKey, PROGRAM_ID);

      const tx = await program.methods
        .revokeDelegation()
        .accounts({
          delegator: publicKey,
          delegationRecord: delegationPda,
        })
        .rpc();

      setActionStep("Confirming on-chain...");
      await provider.connection.confirmTransaction(tx, "confirmed");

      toast.success("Delegation revoked -- you can now vote directly");

      queryClient.invalidateQueries({
        queryKey: ["delegation", publicKey.toBase58()],
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      if (message.includes("User rejected")) {
        toast.error("Transaction cancelled");
      } else {
        toast.error(message);
      }
    } finally {
      setIsRevoking(false);
      setActionStep("");
    }
  }

  if (!walletConnected) {
    return (
      <div className="glass rounded-2xl px-6 py-12 text-center">
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Connect your wallet to manage delegation
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-shimmer-cyan space-y-4 glass rounded-2xl p-6">
        <div className="h-6 w-48 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-20 w-full rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-10 w-full rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current delegation status */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Delegation Status
        </h3>

        {activeDelegation ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-[var(--color-gsd-accent)]/10 px-4 py-3">
              <p className="text-sm text-[var(--color-gsd-accent-hover)]">
                You are delegating{" "}
                <span className="font-semibold">
                  {(
                    Number(BigInt(activeDelegation.delegatedAmount)) / 1e9
                  ).toFixed(2)}{" "}
                  $GSD
                </span>{" "}
                to{" "}
                <span className="font-mono text-xs">
                  {truncateAddress(activeDelegation.delegateWallet)}
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--color-gsd-accent)]/70">
                Effective from Round {activeDelegation.effectiveFromRound}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="w-full border-[var(--color-gsd-error)]/30 text-[var(--color-gsd-error)] hover:bg-[var(--color-gsd-error)]/10"
            >
              {isRevoking ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {actionStep}
                </span>
              ) : (
                "Revoke Delegation"
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            No active delegation. You are voting directly with your deposited
            tokens.
          </p>
        )}
      </div>

      {/* Delegate form */}
      {!activeDelegation && (
        <div className="glass rounded-2xl p-6">
          <h3 className="mb-4 text-base font-semibold text-[var(--color-gsd-text)]">
            Delegate Voting Power
          </h3>
          <form onSubmit={handleDelegate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="delegate-address">Delegate Wallet Address</Label>
              <Input
                id="delegate-address"
                type="text"
                value={delegateAddress}
                onChange={(e) => setDelegateAddress(e.target.value)}
                placeholder="Enter Solana wallet address..."
                disabled={isDelegating}
              />
            </div>
            <Button
              type="submit"
              disabled={isDelegating || !delegateAddress}
              className="w-full bg-[var(--color-gsd-accent)] hover:bg-[var(--color-gsd-accent-hover)]"
            >
              {isDelegating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-gsd-bg)] border-t-transparent" />
                  {actionStep}
                </span>
              ) : (
                "Delegate Voting Power"
              )}
            </Button>
          </form>
          <p className="mt-2 text-xs text-[var(--color-gsd-text-muted)]">
            Delegating transfers your voting power to another wallet. You can
            revoke at any time to regain direct voting ability.
          </p>
        </div>
      )}

      {/* Delegation history */}
      {delegationData &&
        delegationData.delegations.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--color-gsd-text)]">
              Delegation History
            </h3>
            <div className="space-y-2">
              {delegationData.delegations.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-2xl glass-surface px-4 py-3 transition-theme duration-200"
                >
                  <div>
                    <p className="text-sm text-[var(--color-gsd-text)]">
                      {d.delegatorWallet === publicKey.toBase58()
                        ? `To: ${truncateAddress(d.delegateWallet)}`
                        : `From: ${truncateAddress(d.delegatorWallet)}`}
                    </p>
                    <p className="text-xs text-[var(--color-gsd-text-muted)]">
                      {(Number(BigInt(d.delegatedAmount)) / 1e9).toFixed(2)} $GSD
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium ${
                        d.isActive ? "text-[var(--color-gsd-success)]" : "text-[var(--color-gsd-text-muted)]"
                      }`}
                    >
                      {d.isActive ? "Active" : "Revoked"}
                    </span>
                    <p className="text-xs text-[var(--color-gsd-text-muted)]">
                      {new Date(d.delegatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
