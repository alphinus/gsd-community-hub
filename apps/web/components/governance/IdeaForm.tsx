"use client";

import { useState, type FormEvent } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { getIdeaPDA } from "@gsd/utils";
import { useAnchorProvider, PROGRAM_ID } from "@/lib/anchor/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import idlJson from "../../../../target/idl/gsd_hub.json";

interface IdeaFormProps {
  roundId: string;
  roundOnChainAddress: string;
  ideaCount: number;
}

/**
 * Compute SHA-256 hash of canonical JSON content.
 * Returns a hex string.
 */
async function computeContentHash(title: string, description: string): Promise<string> {
  const canonical = JSON.stringify({ title, description });
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert a hex hash string to a 32-byte array for on-chain usage.
 */
function hashToBytes32(hexHash: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < 64; i += 2) {
    bytes.push(parseInt(hexHash.slice(i, i + 2), 16));
  }
  return bytes;
}

export function IdeaForm({
  roundId,
  roundOnChainAddress,
  ideaCount,
}: IdeaFormProps) {
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const provider = useAnchorProvider();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");

  const walletConnected = !!publicKey && !!session?.publicKey && !!provider;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!publicKey || !provider) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Compute content hash
      setSubmitStep("Computing content hash...");
      const contentHash = await computeContentHash(title, description);
      const hashArray = hashToBytes32(contentHash);

      // Step 2: Submit on-chain
      setSubmitStep("Confirm transaction in your wallet...");
      const program = new Program(idlJson as Idl, provider);
      const roundKey = new PublicKey(roundOnChainAddress);
      const [ideaPda] = getIdeaPDA(roundKey, ideaCount, PROGRAM_ID);

      const tx = await program.methods
        .submitIdea(hashArray)
        .accounts({
          author: publicKey,
          ideaRound: roundKey,
        })
        .rpc();

      setSubmitStep("Confirming on-chain...");
      await provider.connection.confirmTransaction(tx, "confirmed");

      // Step 3: POST off-chain content
      setSubmitStep("Saving idea details...");
      const res = await fetch(`/api/governance/rounds/${roundId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onChainAddress: ideaPda.toBase58(),
          title,
          description,
          authorWallet: publicKey.toBase58(),
          contentHash,
          ideaIndex: ideaCount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save idea details");
      }

      toast.success("Idea submitted successfully!");
      setTitle("");
      setDescription("");

      // Invalidate ideas query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["ideas", roundId] });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      if (message.includes("User rejected")) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  }

  if (!walletConnected) {
    return (
      <div className="glass rounded-2xl px-6 py-8 text-center">
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Connect your wallet to submit an idea
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="idea-title">
          Title <span className="text-[var(--color-gsd-error)]">*</span>
        </Label>
        <Input
          id="idea-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A concise title for your idea"
          maxLength={200}
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-[var(--color-gsd-text-muted)]">
          {title.length}/200 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idea-description">
          Description <span className="text-[var(--color-gsd-error)]">*</span>
        </Label>
        <Textarea
          id="idea-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your idea in detail..."
          maxLength={5000}
          required
          disabled={isSubmitting}
          rows={6}
        />
        <p className="text-xs text-[var(--color-gsd-text-muted)]">
          <span
            className={
              description.length > 4500
                ? "text-[var(--color-gsd-warning)]"
                : ""
            }
          >
            {description.length}
          </span>
          /5000 characters
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !title || !description}
        className="w-full bg-[var(--color-gsd-accent)] hover:bg-[var(--color-gsd-accent-hover)]"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-gsd-bg)] border-t-transparent" />
            {submitStep}
          </span>
        ) : (
          "Submit Idea"
        )}
      </Button>

      <p className="text-center text-xs text-[var(--color-gsd-text-muted)]">
        Submitting will create an on-chain record and require a wallet transaction.
      </p>
    </form>
  );
}
