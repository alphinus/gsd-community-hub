"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileData {
  walletAddress: string;
  displayName: string | null;
  bio: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  onChainPda: string | null;
}

export default function ProfileEditPage() {
  const { data: session } = useSession();
  const [existingProfile, setExistingProfile] = useState<ProfileData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.publicKey) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/profile/${session.publicKey}`);
        if (res.ok) {
          const profile = await res.json();
          setExistingProfile(profile);
          setMode("edit");
        }
      } catch {
        // No profile found -- create mode
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session?.publicKey]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-xl animate-shimmer-violet" />
          <div className="h-96 rounded-2xl animate-shimmer-violet" />
        </div>
      </div>
    );
  }

  if (!session?.publicKey) {
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-12">
        <div className="absolute inset-0 mesh-gradient -z-10" />
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-2xl gradient-text-violet">
              Join the Movement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-gsd-accent)]">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[var(--color-gsd-text)]">
              Connect Your Wallet
            </p>
            <p className="text-sm text-[var(--color-gsd-text-muted)] max-w-sm mx-auto">
              To create or edit your developer profile, connect your Solana wallet using the button in the top right corner.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-12">
      <div className="absolute inset-0 mesh-gradient -z-10" />

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text-violet">
            {mode === "create" ? "Join the Movement" : "Edit Profile"}
          </CardTitle>
          {mode === "create" && (
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              Create your developer profile and register your on-chain identity.
              Your profile becomes part of the GSD community directory.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ProfileForm existingProfile={existingProfile} mode={mode} />
        </CardContent>
      </Card>
    </div>
  );
}
