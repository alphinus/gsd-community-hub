import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { RoundStatusBadge } from "@/components/governance/RoundStatusBadge";
import { IdeaList } from "@/components/governance/IdeaList";
import { IdeaForm } from "@/components/governance/IdeaForm";
import { VotePanel } from "@/components/governance/VotePanel";

interface RoundDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: RoundDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  const round = await prisma.ideaRound.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!round) {
    return { title: "Round Not Found | GSD Community Hub" };
  }

  return {
    title: `${round.title} | Governance | GSD Community Hub`,
    description:
      round.description.length > 160
        ? round.description.slice(0, 157) + "..."
        : round.description,
  };
}

/**
 * Compute effective status based on timestamps for display,
 * handling stale on-chain status (Research Pitfall 4).
 */
function getEffectiveStatus(
  status: string,
  submissionEnd: Date,
  votingEnd: Date
): "open" | "voting" | "closed" {
  const now = new Date();

  if (status === "open" && now > submissionEnd) {
    return "voting";
  }
  if ((status === "open" || status === "voting") && now > votingEnd) {
    return "closed";
  }
  return status as "open" | "voting" | "closed";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatQuorumType(qt: string): string {
  switch (qt) {
    case "small":
      return "Simple Majority";
    case "treasury":
      return "Treasury Decision";
    case "parameter_change":
      return "Parameter Change";
    default:
      return qt;
  }
}

export default async function RoundDetailPage({
  params,
}: RoundDetailPageProps) {
  const { id } = await params;

  const round = await prisma.ideaRound.findUnique({
    where: { id },
    include: {
      ideas: {
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { ideas: true } },
    },
  });

  if (!round) {
    notFound();
  }

  const effectiveStatus = getEffectiveStatus(
    round.status,
    round.submissionEnd,
    round.votingEnd
  );

  // Serialize ideas for client components
  const serializedIdeas = round.ideas.map((idea) => ({
    ...idea,
    yesWeight: idea.yesWeight.toString(),
    noWeight: idea.noWeight.toString(),
    abstainWeight: idea.abstainWeight.toString(),
    submittedAt: idea.submittedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-gsd-text-muted)]">
        <Link
          href="/governance"
          className="hover:text-[var(--color-gsd-text)]"
        >
          Governance
        </Link>
        <span>/</span>
        <Link
          href="/governance/rounds"
          className="hover:text-[var(--color-gsd-text)]"
        >
          Rounds
        </Link>
        <span>/</span>
        <span className="text-[var(--color-gsd-text)]">{round.title}</span>
      </div>

      {/* Round header */}
      <div className="mb-8">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--color-gsd-text)] sm:text-3xl">
            {round.title}
          </h1>
          <RoundStatusBadge
            status={round.status as "open" | "voting" | "closed"}
            submissionEnd={round.submissionEnd.toISOString()}
            votingEnd={round.votingEnd.toISOString()}
          />
        </div>
        <p className="text-[var(--color-gsd-text-secondary)]">
          {round.description}
        </p>
      </div>

      {/* Round info */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-3">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Quorum Type
          </p>
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            {formatQuorumType(round.quorumType)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-3">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Submissions Open
          </p>
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            {formatDate(round.submissionStart)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-3">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Submissions Close
          </p>
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            {formatDate(round.submissionEnd)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-3">
          <p className="text-xs text-[var(--color-gsd-text-muted)]">
            Voting Ends
          </p>
          <p className="text-sm font-medium text-[var(--color-gsd-text)]">
            {formatDate(round.votingEnd)}
          </p>
        </div>
      </div>

      {/* Ideas section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-gsd-text)]">
            Ideas ({round._count.ideas})
          </h2>
        </div>

        {/* Idea submission form (only if round is open) */}
        {effectiveStatus === "open" && (
          <div className="rounded-xl border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--color-gsd-text)]">
              Submit an Idea
            </h3>
            <IdeaForm
              roundId={round.id}
              roundOnChainAddress={round.onChainAddress}
              ideaCount={round._count.ideas}
            />
          </div>
        )}

        {/* Vote panels (only during voting for top ideas) */}
        {effectiveStatus === "voting" && serializedIdeas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-gsd-text-muted)]">
              Cast Your Vote
            </h3>
            {serializedIdeas.map((idea) => (
              <div key={idea.id} className="space-y-2">
                <h4 className="text-sm font-medium text-[var(--color-gsd-text)]">
                  {idea.title}
                </h4>
                <VotePanel
                  idea={idea}
                  roundId={round.id}
                  roundStatus={effectiveStatus}
                  roundOnChainAddress={round.onChainAddress}
                />
              </div>
            ))}
          </div>
        )}

        {/* Full idea list with pagination */}
        <IdeaList roundId={round.id} roundStatus={effectiveStatus} />
      </div>
    </div>
  );
}
