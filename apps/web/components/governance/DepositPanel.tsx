"use client";

import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { useAnchorProvider, PROGRAM_ID } from "@/lib/anchor/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import idlJson from "../../../../target/idl/gsd_hub.json";

interface DepositInfo {
  walletAddress: string;
  depositedAmount: string;
  depositTimestamp: string;
  eligibleAt: string;
  activeVotes: number;
}

/**
 * Format a countdown string from now to a target date.
 */
function formatCountdown(targetDateStr: string): string {
  const target = new Date(targetDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return "Eligible now";

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function DepositPanel() {
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [actionStep, setActionStep] = useState("");

  const walletConnected = !!publicKey && !!session?.publicKey && !!provider;

  // Fetch deposit info
  const { data: depositData, isLoading } = useQuery<{
    deposit: DepositInfo | null;
    isEligible: boolean;
  }>({
    queryKey: ["deposit", publicKey?.toBase58()],
    queryFn: async () => {
      const res = await fetch(
        `/api/governance/deposit?wallet=${publicKey!.toBase58()}`
      );
      if (!res.ok) throw new Error("Failed to fetch deposit info");
      return res.json();
    },
    enabled: walletConnected,
    staleTime: 30_000,
  });

  const deposit = depositData?.deposit;
  const isEligible = depositData?.isEligible ?? false;
  const canWithdraw = deposit && deposit.activeVotes === 0;

  async function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !provider) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid deposit amount");
      return;
    }

    setIsDepositing(true);

    try {
      setActionStep("Confirm transaction in your wallet...");
      const program = new Program(idlJson as Idl, provider);

      // Amount in lamports (assuming token decimals = 9)
      const amountBN = BigInt(Math.floor(amount * 1e9));

      const tx = await program.methods
        .depositTokens({ amount: amountBN.toString() })
        .accounts({
          authority: publicKey,
        })
        .rpc();

      setActionStep("Confirming on-chain...");
      await provider.connection.confirmTransaction(tx, "confirmed");

      toast.success(`Deposited ${amount} $GSD tokens`);
      setDepositAmount("");

      queryClient.invalidateQueries({
        queryKey: ["deposit", publicKey.toBase58()],
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
      setIsDepositing(false);
      setActionStep("");
    }
  }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault();
    if (!publicKey || !provider) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }

    setIsWithdrawing(true);

    try {
      setActionStep("Confirm transaction in your wallet...");
      const program = new Program(idlJson as Idl, provider);

      const amountBN = BigInt(Math.floor(amount * 1e9));

      const tx = await program.methods
        .withdrawTokens({ amount: amountBN.toString() })
        .accounts({
          authority: publicKey,
        })
        .rpc();

      setActionStep("Confirming on-chain...");
      await provider.connection.confirmTransaction(tx, "confirmed");

      toast.success(`Withdrawn ${amount} $GSD tokens`);
      setWithdrawAmount("");

      queryClient.invalidateQueries({
        queryKey: ["deposit", publicKey.toBase58()],
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
      setIsWithdrawing(false);
      setActionStep("");
    }
  }

  if (!walletConnected) {
    return (
      <div className="glass rounded-2xl px-6 py-12 text-center">
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Connect your wallet to manage token deposits
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-shimmer-violet space-y-4 glass rounded-2xl p-6">
        <div className="h-6 w-48 rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-20 w-full rounded bg-[var(--color-gsd-surface-raised)]" />
        <div className="h-10 w-full rounded bg-[var(--color-gsd-surface-raised)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current deposit info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-gsd-text)]">
          Your Deposit
        </h3>

        {deposit ? (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold gradient-text-violet">
                {(Number(BigInt(deposit.depositedAmount)) / 1e9).toFixed(2)}
              </span>
              <span className="text-sm text-[var(--color-gsd-text-muted)]">
                $GSD deposited
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-gsd-text-muted)]">
              <span>
                Status:{" "}
                <span
                  className={
                    isEligible
                      ? "font-medium text-[var(--color-gsd-success)]"
                      : "font-medium text-[var(--color-gsd-gold)]"
                  }
                >
                  {isEligible ? "Eligible to vote" : "Timelock active"}
                </span>
              </span>
              {!isEligible && (
                <span>{formatCountdown(deposit.eligibleAt)}</span>
              )}
              <span>{deposit.activeVotes} active votes</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            No tokens deposited yet. Deposit $GSD to participate in governance
            voting.
          </p>
        )}
      </div>

      {/* Deposit form */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--color-gsd-text)]">
          Deposit Tokens
        </h3>
        <form onSubmit={handleDeposit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount ($GSD)</Label>
            <Input
              id="deposit-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              disabled={isDepositing}
            />
          </div>
          <Button
            type="submit"
            disabled={isDepositing || !depositAmount}
            className="w-full bg-[var(--color-gsd-accent)] hover:bg-[var(--color-gsd-accent-hover)]"
          >
            {isDepositing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-gsd-bg)] border-t-transparent" />
                {actionStep}
              </span>
            ) : (
              "Deposit"
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-[var(--color-gsd-text-muted)]">
          Deposited tokens are locked for 7 days before becoming eligible for
          voting.
        </p>
      </div>

      {/* Withdraw form */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--color-gsd-text)]">
          Withdraw Tokens
        </h3>
        {canWithdraw ? (
          <form onSubmit={handleWithdraw} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount ($GSD)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                disabled={isWithdrawing}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={isWithdrawing || !withdrawAmount}
              className="w-full"
            >
              {isWithdrawing ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {actionStep}
                </span>
              ) : (
                "Withdraw"
              )}
            </Button>
          </form>
        ) : deposit ? (
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            You have {deposit.activeVotes} active{" "}
            {deposit.activeVotes === 1 ? "vote" : "votes"}. Relinquish all
            votes before withdrawing.
          </p>
        ) : (
          <p className="text-sm text-[var(--color-gsd-text-muted)]">
            No tokens to withdraw.
          </p>
        )}
      </div>
    </div>
  );
}
