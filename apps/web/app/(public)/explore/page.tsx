import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { DirectoryGrid } from "@/components/profile/directory-grid";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Builders | GSD Community Hub",
  description:
    "Browse the GSD developer directory. See who is building in the community.",
};

export default async function ExplorePage() {
  // Server-side initial data load for SEO and first paint
  const [developers, total] = await Promise.all([
    prisma.user.findMany({
      where: { displayName: { not: null } },
      select: {
        walletAddress: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        onChainPda: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.count({
      where: { displayName: { not: null } },
    }),
  ]);

  // Serialize dates for client component
  const serializedDevelopers = developers.map((dev) => ({
    ...dev,
    createdAt: dev.createdAt.toISOString(),
  }));

  const initialData = {
    developers: serializedDevelopers,
    total,
    page: 1,
    totalPages: Math.ceil(total / 20),
  };

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12">
      {/* Subtle mesh gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#8B5CF6]/5 blur-[100px]" />
        <div className="absolute -top-16 left-1/4 h-48 w-72 rounded-full bg-[#6D28D9]/5 blur-[80px]" />
      </div>

      <div className="mb-10 flex items-center justify-between">
        <div className="animate-slide-up">
          <div className="mb-2 flex items-center gap-3">
            <Compass className="h-7 w-7 text-[var(--color-gsd-accent)]" />
            <h1 className="text-3xl font-bold gradient-text-violet sm:text-4xl">
              Explore Builders
            </h1>
          </div>
          <p className="mt-2 text-[var(--color-gsd-text-secondary)]">
            Developers building in the GSD community
          </p>
        </div>

        <Link
          href="/profile/edit"
          className="hidden cursor-pointer rounded-xl gradient-violet px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-theme duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#8B5CF6]/30 sm:block"
        >
          Join the Movement
        </Link>
      </div>

      {/* Glass-surface search section wrapper */}
      <div className="glass-surface rounded-2xl p-6">
        <DirectoryGrid initialData={initialData} />
      </div>

      {/* Mobile CTA */}
      <div className="mt-8 block sm:hidden">
        <Link
          href="/profile/edit"
          className="block cursor-pointer rounded-xl gradient-violet px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-theme duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#8B5CF6]/30"
        >
          Join the Movement
        </Link>
      </div>
    </div>
  );
}
