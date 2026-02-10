"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { computeProfileHash, profileHashToBytes32 } from "@gsd/utils";
import { getDeveloperProfilePDA } from "@gsd/utils";
import { useAnchorProvider, PROGRAM_ID } from "@/lib/anchor/provider";
import { Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Import IDL JSON
import idlJson from "../../../../target/idl/gsd_hub.json";

interface ProfileData {
  walletAddress: string;
  displayName: string | null;
  bio: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  onChainPda: string | null;
}

interface ProfileFormProps {
  existingProfile?: ProfileData | null;
  mode: "create" | "edit";
}

export function ProfileForm({ existingProfile, mode }: ProfileFormProps) {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const provider = useAnchorProvider();

  const [displayName, setDisplayName] = useState(
    existingProfile?.displayName || ""
  );
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [githubUrl, setGithubUrl] = useState(
    existingProfile?.githubUrl || ""
  );
  const [twitterUrl, setTwitterUrl] = useState(
    existingProfile?.twitterUrl || ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    existingProfile?.websiteUrl || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");

  // Update form when existingProfile loads
  useEffect(() => {
    if (existingProfile) {
      setDisplayName(existingProfile.displayName || "");
      setBio(existingProfile.bio || "");
      setGithubUrl(existingProfile.githubUrl || "");
      setTwitterUrl(existingProfile.twitterUrl || "");
      setWebsiteUrl(existingProfile.websiteUrl || "");
    }
  }, [existingProfile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!session?.publicKey || !publicKey || !provider) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        displayName,
        bio,
        ...(githubUrl ? { githubUrl } : {}),
        ...(twitterUrl ? { twitterUrl } : {}),
        ...(websiteUrl ? { websiteUrl } : {}),
      };

      if (mode === "create") {
        // Step 1: Create off-chain profile
        setSubmitStep("Creating profile...");
        const createRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.error || "Failed to create profile");
        }

        // Step 2: Register on-chain PDA
        setSubmitStep("Confirm transaction in your wallet...");
        const hashBytes = await computeProfileHash(profileData);
        const hashArray = profileHashToBytes32(hashBytes);

        const program = new Program(idlJson as Idl, provider);
        const [pdaAddress] = getDeveloperProfilePDA(publicKey, PROGRAM_ID);

        const tx = await program.methods
          .registerDeveloper(hashArray)
          .accounts({
            authority: publicKey,
          })
          .rpc();

        setSubmitStep("Confirming on-chain...");
        await provider.connection.confirmTransaction(tx, "confirmed");

        // Step 3: Update off-chain profile with PDA address
        setSubmitStep("Finalizing...");
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onChainPda: pdaAddress.toBase58() }),
        });

        toast.success("Welcome to the movement! Profile created.");
        router.push(`/profile/${publicKey.toBase58()}`);
      } else {
        // Edit flow
        // Step 1: Update off-chain profile
        setSubmitStep("Updating profile...");
        const updateRes = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });

        if (!updateRes.ok) {
          const err = await updateRes.json();
          throw new Error(err.error || "Failed to update profile");
        }

        // Step 2: Update on-chain hash
        setSubmitStep("Confirm transaction in your wallet...");
        const hashBytes = await computeProfileHash(profileData);
        const hashArray = profileHashToBytes32(hashBytes);

        const program = new Program(idlJson as Idl, provider);

        const tx = await program.methods
          .updateProfileHash(hashArray)
          .accounts({
            authority: publicKey,
          })
          .rpc();

        setSubmitStep("Confirming on-chain...");
        await provider.connection.confirmTransaction(tx, "confirmed");

        toast.success("Profile updated successfully.");
        router.push(`/profile/${publicKey.toBase58()}`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      // Handle user rejection
      if (message.includes("User rejected")) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error(message, {
          action: {
            label: "Try again",
            onClick: () => handleSubmit(new Event("submit") as unknown as FormEvent),
          },
        });
      }
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6 sm:p-8">
      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">
          Display Name <span className="text-[var(--color-gsd-error)]">*</span>
        </Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          maxLength={50}
          minLength={3}
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-[var(--color-gsd-text-muted)]">
          {displayName.length}/50 characters
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">
          Bio <span className="text-[var(--color-gsd-error)]">*</span>
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself and what you build..."
          maxLength={500}
          minLength={1}
          required
          disabled={isSubmitting}
          rows={4}
        />
        <p className="text-xs text-[var(--color-gsd-text-muted)]">
          <span className={bio.length > 450 ? "text-[var(--color-gsd-warning)]" : ""}>
            {bio.length}
          </span>
          /500 characters
        </p>
      </div>

      {/* GitHub URL */}
      <div className="space-y-2">
        <Label htmlFor="githubUrl">GitHub URL</Label>
        <Input
          id="githubUrl"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/username"
          disabled={isSubmitting}
        />
      </div>

      {/* Twitter/X URL */}
      <div className="space-y-2">
        <Label htmlFor="twitterUrl">Twitter/X URL</Label>
        <Input
          id="twitterUrl"
          type="url"
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          placeholder="https://x.com/username"
          disabled={isSubmitting}
        />
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website</Label>
        <Input
          id="websiteUrl"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yoursite.com"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting || !displayName || !bio}
        className="w-full gradient-cyan text-white shadow-lg shadow-[var(--color-gsd-accent)]/20 motion-safe:hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--color-gsd-accent)]/30 glow-cyan"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-[var(--color-gsd-accent)]" />
            <span className="text-[var(--color-gsd-accent-light)]">{submitStep}</span>
          </span>
        ) : mode === "create" ? (
          "Join the Movement"
        ) : (
          "Update Profile"
        )}
      </Button>

      {mode === "create" && (
        <p className="text-center text-xs text-[var(--color-gsd-text-muted)]">
          This will create your on-chain developer profile.
          You&apos;ll need to approve a transaction in your wallet.
        </p>
      )}
    </form>
  );
}
