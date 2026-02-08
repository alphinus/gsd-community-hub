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
      if (!session?.publicKey) return;

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
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--color-gsd-surface-raised)]" />
          <div className="h-96 animate-pulse rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
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
