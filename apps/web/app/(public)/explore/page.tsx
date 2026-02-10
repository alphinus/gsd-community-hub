import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { DirectoryGrid } from "@/components/profile/directory-grid";
import Link from "next/link";
import { Compass } from "lucide-react";
import { HeroBackground } from "@/components/ui/hero-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
      {/* Eluma hero background with grid, orbs, and particles */}
      <HeroBackground particleCount={25} />

      <ScrollReveal>
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="eluma-badge mb-3 inline-block">Builder Directory</span>
            <div className="mb-2 flex items-center gap-3">
              <Compass className="h-7 w-7 text-[var(--color-gsd-accent)]" />
              <h1 className="text-3xl font-extralight gradient-text-cyan sm:text-4xl">
                Explore Builders
              </h1>
            </div>
            <p className="mt-2 font-light text-[var(--color-gsd-text-secondary)]">
              Developers building in the GSD community
            </p>
          </div>

          <Link
            href="/profile/edit"
            className="hidden cursor-pointer rounded-xl gradient-cyan px-6 py-2.5 text-sm font-normal text-white shadow-lg shadow-[#4fd1c5]/20 transition-theme duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#4fd1c5]/30 sm:block"
          >
            Join the Movement
          </Link>
        </div>
      </ScrollReveal>

      {/* Glass-surface search section wrapper */}
      <ScrollReveal delay={2}>
        <div className="glass-surface eluma-card rounded-2xl p-6">
          <DirectoryGrid initialData={initialData} />
        </div>
      </ScrollReveal>

      {/* Mobile CTA */}
      <ScrollReveal delay={3}>
        <div className="mt-8 block sm:hidden">
          <Link
            href="/profile/edit"
            className="block cursor-pointer rounded-xl gradient-cyan px-5 py-3 text-center text-sm font-normal text-white shadow-lg shadow-[#4fd1c5]/20 transition-theme duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#4fd1c5]/30"
          >
            Join the Movement
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
