import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProfileHeader } from "@/components/profile/profile-header";

interface ProfilePageProps {
  params: Promise<{ wallet: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { wallet } = await params;

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { displayName: true, bio: true },
  });

  if (!user?.displayName) {
    return { title: "Profile Not Found | GSD Community Hub" };
  }

  const description = user.bio
    ? user.bio.length > 160
      ? user.bio.slice(0, 157) + "..."
      : user.bio
    : `Developer profile on GSD Community Hub`;

  return {
    title: `${user.displayName} | GSD Community Hub`,
    description,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { wallet } = await params;

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: {
      walletAddress: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      githubUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      onChainPda: true,
      createdAt: true,
    },
  });

  if (!user || !user.displayName) {
    notFound();
  }

  // Serialize dates for client component
  const profile = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <ProfileHeader profile={profile} />
    </div>
  );
}
