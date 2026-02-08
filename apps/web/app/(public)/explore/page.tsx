import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { DirectoryGrid } from "@/components/profile/directory-grid";
import Link from "next/link";

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
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-gsd-text)]">
            Explore Builders
          </h1>
          <p className="mt-2 text-[var(--color-gsd-text-muted)]">
            Developers building in the GSD community
          </p>
        </div>

        <Link
          href="/profile/edit"
          className="hidden rounded-lg bg-[var(--color-gsd-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-gsd-bg)] transition-colors hover:bg-[var(--color-gsd-accent-hover)] sm:block"
        >
          Join the Movement
        </Link>
      </div>

      <DirectoryGrid initialData={initialData} />

      {/* Mobile CTA */}
      <div className="mt-8 block sm:hidden">
        <Link
          href="/profile/edit"
          className="block rounded-lg bg-[var(--color-gsd-accent)] px-5 py-3 text-center text-sm font-semibold text-[var(--color-gsd-bg)] transition-colors hover:bg-[var(--color-gsd-accent-hover)]"
        >
          Join the Movement
        </Link>
      </div>
    </div>
  );
}
