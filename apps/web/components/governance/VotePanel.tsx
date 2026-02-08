"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { getVoteRecordPDA } from "@gsd/utils";
import { useAnchorProvider, PROGRAM_ID } from "@/lib/anchor/provider";
import { Button } from "@/components/ui/button";

import idlJson from "../../../../target/idl/gsd_hub.json";

type RoundStatus = "open" | "voting" | "closed";
type VoteChoice = "yes" | "no" | "abstain";

interface VotePanelIdea {
  id: string;
  onChainAddress: string;
  roundId: string;
  yesWeight: string;
  noWeight: string;
  abstainWeight: string;
  voterCount: number;
}

interface VoteDepositInfo {
  walletAddress: string;
  depositedAmount: string;
  depositTimestamp: string;
  eligibleAt: string;
  activeVotes: number;
}

interface VotePanelProps {
  idea: VotePanelIdea;
  roundId: string;
  roundStatus: RoundStatus;
  roundOnChainAddress: string;
}

function weightToNumber(w: string): number {
  try {
    return Number(BigInt(w));
  } catch {
    return 0;
  }
}

function VoteBar({
  yesWeight,
  noWeight,
  abstainWeight,
}: {
  yesWeight: string;
  noWeight: string;
  abstainWeight: string;
}) {
  const yes = weightToNumber(yesWeight);
  const no = weightToNumber(noWeight);
  const abstain = weightToNumber(abstainWeight);
  const total = yes + no + abstain;

  if (total === 0) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-[var(--color-gsd-surface-raised)]" />
        <p className="text-xs text-[var(--color-gsd-text-muted)]">
          No votes cast yet
        </p>
      </div>
    );
  }

  const yPct = ((yes / total) * 100).toFixed(1);
  const nPct = ((no / total) * 100).toFixed(1);
  const aPct = ((abstain / total) * 100).toFixed(1);

  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--color-gsd-surface-raised)]">
        {yes > 0 && (
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${yPct}%` }}
          />
        )}
        {no > 0 && (
          <div className="h-full bg-red-500" style={{ width: `${nPct}%` }} />
        )}
        {abstain > 0 && (
          <div
            className="h-full bg-gray-500"
            style={{ width: `${aPct}%` }}
          />
        )}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-emerald-500">
          Yes {yPct}% ({yes})
        </span>
        <span className="text-red-500">
          No {nPct}% ({no})
        </span>
        <span className="text-gray-400">
          Abstain {aPct}% ({abstain})
        </span>
      </div>
    </div>
  );
}

export function VotePanel({
  idea,
  roundId,
  roundStatus,
  roundOnChainAddress,
}: VotePanelProps) {
  const { publicKey } = useWallet();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);
  const [votingChoice, setVotingChoice] = useState<VoteChoice | null>(null);

  // Fetch user's deposit info
  const { data: depositData } = useQuery<{
    deposit: VoteDepositInfo | null;
    isEligible: boolean;
  }>({
    queryKey: ["deposit", publicKey?.toBase58()],
    queryFn: async () => {
      const res = await fetch(
        `/api/governance/deposit?wallet=${publicKey!.toBase58()}`
      );
      if (!res.ok) throw new Error("Failed to fetch deposit");
      return res.json();
    },
    enabled: !!publicKey,
    staleTime: 30_000,
  });

  // Fetch user's existing vote for this idea
  const { data: existingVoteData } = useQuery<{
    votes: Array<{
      id: string;
      vote: VoteChoice;
      weight: string;
    }>;
    total: number;
  }>({
    queryKey: ["user-vote", idea.id, publicKey?.toBase58()],
    queryFn: async () => {
      const res = await fetch(
        `/api/governance/votes?ideaId=${idea.id}&wallet=${publicKey!.toBase58()}`
      );
      if (!res.ok) throw new Error("Failed to fetch vote");
      return res.json();
    },
    enabled: !!publicKey,
    staleTime: 30_000,
  });

  const userVote =
    existingVoteData?.votes && existingVoteData.votes.length > 0
      ? existingVoteData.votes[0]
      : null;

  const isEligible = depositData?.isEligible ?? false;
  const canVote =
    roundStatus === "voting" && isEligible && !userVote && !!publicKey && !!provider;

  async function handleVote(choice: VoteChoice) {
    if (!publicKey || !provider) return;

    setIsVoting(true);
    setVotingChoice(choice);

    try {
      const program = new Program(idlJson as Idl, provider);
      const ideaKey = new PublicKey(idea.onChainAddress);
      const roundKey = new PublicKey(roundOnChainAddress);

      // Map choice to the on-chain enum variant
      const voteArg = { [choice]: {} };

      const tx = await program.methods
        .castVote(voteArg)
        .accounts({
          voter: publicKey,
          ideaRound: roundKey,
          idea: ideaKey,
        })
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");

      toast.success(`Vote cast: ${choice.charAt(0).toUpperCase() + choice.slice(1)}`);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["ideas", roundId] });
      queryClient.invalidateQueries({
        queryKey: ["user-vote", idea.id, publicKey.toBase58()],
      });
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
      setIsVoting(false);
      setVotingChoice(null);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-4">
      <h4 className="mb-3 text-sm font-medium text-[var(--color-gsd-text)]">
        Vote Tallies
      </h4>

      <VoteBar
        yesWeight={idea.yesWeight}
        noWeight={idea.noWeight}
        abstainWeight={idea.abstainWeight}
      />

      <p className="mt-2 text-xs text-[var(--color-gsd-text-muted)]">
        {idea.voterCount} {idea.voterCount === 1 ? "voter" : "voters"}
      </p>

      {/* User vote status */}
      {userVote && (
        <div className="mt-3 rounded-md bg-[var(--color-gsd-surface-raised)] px-3 py-2">
          <p className="text-xs text-[var(--color-gsd-text-secondary)]">
            You voted:{" "}
            <span
              className={
                userVote.vote === "yes"
                  ? "font-semibold text-emerald-500"
                  : userVote.vote === "no"
                    ? "font-semibold text-red-500"
                    : "font-semibold text-gray-400"
              }
            >
              {userVote.vote.charAt(0).toUpperCase() + userVote.vote.slice(1)}
            </span>{" "}
            (weight: {userVote.weight})
          </p>
        </div>
      )}

      {/* Voting buttons */}
      {canVote && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Your voting weight: {depositData?.deposit?.depositedAmount ?? "0"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleVote("yes")}
              disabled={isVoting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isVoting && votingChoice === "yes" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Yes"
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleVote("no")}
              disabled={isVoting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isVoting && votingChoice === "no" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "No"
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleVote("abstain")}
              disabled={isVoting}
              className="flex-1"
            >
              {isVoting && votingChoice === "abstain" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Abstain"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Not eligible message */}
      {roundStatus === "voting" && !isEligible && publicKey && !userVote && (
        <div className="mt-3 rounded-md bg-[var(--color-gsd-surface-raised)] px-3 py-2">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Deposit tokens and wait 7 days to become eligible to vote.
          </p>
        </div>
      )}

      {/* Not connected message */}
      {roundStatus === "voting" && !publicKey && (
        <div className="mt-3 rounded-md bg-[var(--color-gsd-surface-raised)] px-3 py-2">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Connect your wallet to vote on this idea.
          </p>
        </div>
      )}
    </div>
  );
}
