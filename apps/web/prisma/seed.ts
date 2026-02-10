/**
 * Demo seed script — populates the database with realistic mock data
 * so the app can be showcased as a demo.
 *
 * Run: npx tsx prisma/seed.ts
 */

import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomHash(): string {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function randomSolAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 44 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function randomTxSig(): string {
  return Array.from({ length: 88 }, () =>
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[
      Math.floor(Math.random() * 58)
    ]
  ).join("");
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const WALLETS = [
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
  "3kPUXgMmqQiGMYEh9GhF7pE8r9FYhB4dJiCndnPFLzRz",
  "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "FEeSRuEDk8ENZhpgB5VHbMkRjJxgS9CsUqFdMjyGMKBp",
  "HN7cABqLq46Es1jh92dQQisAi5PbLUJq3ZKxXSWboVqX",
  "BmLRmj2wDJRF4L3aJQNegzYhXwsJkz7jQz7v4dGJEP9k",
];

const PROFILES = [
  { name: "Alice Chen", bio: "Full-stack Solana developer. Building decentralized governance tools.", github: "alicechen", twitter: "alice_sol" },
  { name: "Bob Nakamoto", bio: "Smart contract auditor and open source advocate. Rust enthusiast.", github: "bobnaka", twitter: "bob_naka" },
  { name: "Clara Voss", bio: "Frontend engineer specializing in Web3 UX. Making crypto accessible.", github: "claravoss", twitter: "clara_web3" },
  { name: "David Park", bio: "Protocol researcher at GSD. Working on quadratic voting mechanisms.", github: "dpark", twitter: "dpark_crypto" },
  { name: "Elena Torres", bio: "DevOps & infrastructure. Keeping the decentralized stack running.", github: "elenatorres", twitter: "elena_infra" },
  { name: "Frank Müller", bio: "Security researcher. Focused on Solana program security.", github: "fmueller", twitter: "frank_sec" },
  { name: "Grace Kim", bio: "Community builder and governance delegate. Active voter.", github: "gracekim", twitter: "grace_dao" },
  { name: "Hiro Tanaka", bio: "Data engineer building transparency tools for on-chain analytics.", github: "hirotanaka", twitter: "hiro_data" },
];

const TASK_REFS = [
  "GSD-101: Implement quadratic voting module",
  "GSD-102: Add delegation system",
  "GSD-103: Revenue distribution engine",
  "GSD-104: Peer review consensus protocol",
  "GSD-105: Contribution merkle tree indexer",
  "GSD-106: Treasury dashboard frontend",
  "GSD-107: Governance analytics charts",
  "GSD-108: Wallet connect improvements",
  "GSD-109: Mobile responsive navigation",
  "GSD-110: Design system token migration",
  "GSD-111: Verification scoring engine",
  "GSD-112: Burn mechanism implementation",
  "GSD-113: Delegate directory page",
  "GSD-114: Profile on-chain registration",
  "GSD-115: Glassmorphism UI overhaul",
  "GSD-116: WCAG accessibility audit",
];

async function seed() {
  console.log("Seeding database with demo data...\n");

  // -----------------------------------------------------------------------
  // 1. Users
  // -----------------------------------------------------------------------
  console.log("Creating users...");
  const users = await Promise.all(
    WALLETS.map((wallet, i) =>
      prisma.user.upsert({
        where: { walletAddress: wallet },
        update: {},
        create: {
          walletAddress: wallet,
          displayName: PROFILES[i].name,
          bio: PROFILES[i].bio,
          githubUrl: `https://github.com/${PROFILES[i].github}`,
          twitterUrl: `https://x.com/${PROFILES[i].twitter}`,
          profileHash: randomHash(),
          onChainPda: randomSolAddress(),
        },
      })
    )
  );
  console.log(`  ${users.length} users created`);

  // -----------------------------------------------------------------------
  // 2. Contributions
  // -----------------------------------------------------------------------
  console.log("Creating contributions...");
  let contribCount = 0;
  for (let i = 0; i < WALLETS.length; i++) {
    const numContribs = 2 + Math.floor(Math.random() * 4); // 2-5 each
    for (let j = 0; j < numContribs; j++) {
      const taskIdx = (i * 2 + j) % TASK_REFS.length;
      await prisma.contribution.create({
        data: {
          walletAddress: WALLETS[i],
          taskRef: TASK_REFS[taskIdx],
          verificationScore: 7000 + Math.floor(Math.random() * 3000),
          contentHash: randomHash(),
          leafHash: randomHash(),
          leafIndex: contribCount,
          treeAddress: randomSolAddress(),
          transactionSignature: randomTxSig(),
          description: `Completed ${TASK_REFS[taskIdx]}`,
          createdAt: daysAgo(Math.floor(Math.random() * 90)),
        },
      });
      contribCount++;
    }
  }
  console.log(`  ${contribCount} contributions created`);

  // -----------------------------------------------------------------------
  // 3. Governance Rounds
  // -----------------------------------------------------------------------
  console.log("Creating governance rounds...");
  const rounds = [
    {
      roundIndex: 1,
      title: "Infrastructure Priorities Q4 2025",
      description: "Vote on infrastructure improvement proposals for the GSD platform. Topics include RPC scaling, indexer reliability, and monitoring.",
      status: "closed",
      submissionStart: daysAgo(90),
      submissionEnd: daysAgo(75),
      votingEnd: daysAgo(60),
      quorumType: "small",
    },
    {
      roundIndex: 2,
      title: "Treasury Allocation — Developer Grants",
      description: "Proposals for allocating treasury funds to developer grants. Includes bounty programs, hackathon sponsorships, and tooling grants.",
      status: "closed",
      submissionStart: daysAgo(60),
      submissionEnd: daysAgo(45),
      votingEnd: daysAgo(30),
      quorumType: "treasury",
    },
    {
      roundIndex: 3,
      title: "Governance Parameter Updates",
      description: "Proposals to adjust governance parameters including quorum thresholds, voting periods, and delegation rules.",
      status: "voting",
      submissionStart: daysAgo(21),
      submissionEnd: daysAgo(7),
      votingEnd: new Date(Date.now() + 7 * 86400000),
      quorumType: "parameter_change",
    },
    {
      roundIndex: 4,
      title: "Community Growth Initiatives",
      description: "Ideas for growing the GSD community. Submit proposals for marketing, documentation, developer relations, and onboarding improvements.",
      status: "open",
      submissionStart: daysAgo(3),
      submissionEnd: new Date(Date.now() + 11 * 86400000),
      votingEnd: new Date(Date.now() + 25 * 86400000),
      quorumType: "small",
    },
  ];

  const createdRounds = [];
  for (const r of rounds) {
    const round = await prisma.ideaRound.create({
      data: {
        roundIndex: r.roundIndex,
        onChainAddress: randomSolAddress(),
        title: r.title,
        description: r.description,
        contentHash: randomHash(),
        status: r.status,
        submissionStart: r.submissionStart,
        submissionEnd: r.submissionEnd,
        votingEnd: r.votingEnd,
        quorumType: r.quorumType,
      },
    });
    createdRounds.push(round);
  }
  console.log(`  ${createdRounds.length} rounds created`);

  // -----------------------------------------------------------------------
  // 4. Ideas + Votes
  // -----------------------------------------------------------------------
  console.log("Creating ideas and votes...");
  const ideaTemplates = [
    // Round 1 ideas (closed)
    { round: 0, title: "Upgrade to dedicated RPC nodes", desc: "Move from shared RPC to dedicated Helius nodes for better reliability and lower latency.", yes: 45000n, no: 5000n, abstain: 2000n, voters: 12, status: "approved" },
    { round: 0, title: "Implement real-time indexer health monitoring", desc: "Add Grafana dashboards and PagerDuty alerts for the contribution and governance indexers.", yes: 38000n, no: 12000n, abstain: 5000n, voters: 9, status: "approved" },
    { round: 0, title: "Multi-region failover for API servers", desc: "Deploy API servers across US-East and EU-West with automatic failover.", yes: 15000n, no: 25000n, abstain: 8000n, voters: 8, status: "rejected" },
    // Round 2 ideas (closed)
    { round: 1, title: "Launch $5K bounty program for bug fixes", desc: "Allocate 5,000 USDC from treasury for critical bug bounties. Priority: smart contract vulnerabilities.", yes: 52000n, no: 3000n, abstain: 1000n, voters: 15, status: "approved" },
    { round: 1, title: "Sponsor Solana Hackathon NYC", desc: "Use treasury funds to sponsor the upcoming Solana hackathon with a $2K prize pool.", yes: 30000n, no: 18000n, abstain: 7000n, voters: 11, status: "approved" },
    { round: 1, title: "Fund Anchor tooling improvements", desc: "Grant to improve Anchor CLI with better error messages and debugging tools.", yes: 42000n, no: 8000n, abstain: 3000n, voters: 13, status: "approved" },
    // Round 3 ideas (voting)
    { round: 2, title: "Reduce quorum threshold from 30% to 20%", desc: "Current 30% quorum is hard to reach. Lowering to 20% would increase governance throughput while maintaining legitimacy.", yes: 22000n, no: 15000n, abstain: 4000n, voters: 7, status: "submitted" },
    { round: 2, title: "Extend voting period to 14 days", desc: "7-day voting periods are too short for careful deliberation. Propose extending to 14 days.", yes: 18000n, no: 8000n, abstain: 6000n, voters: 6, status: "submitted" },
    { round: 2, title: "Enable quadratic voting for all rounds", desc: "Currently only enabled for treasury rounds. Propose enabling QV for all round types.", yes: 35000n, no: 5000n, abstain: 2000n, voters: 9, status: "submitted" },
    // Round 4 ideas (open, no votes yet)
    { round: 3, title: "Create developer onboarding tutorial series", desc: "Step-by-step video tutorials covering: wallet setup, profile creation, first contribution, and governance participation.", yes: 0n, no: 0n, abstain: 0n, voters: 0, status: "submitted" },
    { round: 3, title: "Launch ambassador program", desc: "Recruit community ambassadors across regions to promote GSD adoption and provide local support.", yes: 0n, no: 0n, abstain: 0n, voters: 0, status: "submitted" },
  ];

  let ideaIdx = 0;
  for (const tmpl of ideaTemplates) {
    const idea = await prisma.idea.create({
      data: {
        ideaIndex: ideaIdx,
        onChainAddress: randomSolAddress(),
        roundId: createdRounds[tmpl.round].id,
        authorWallet: WALLETS[ideaIdx % WALLETS.length],
        title: tmpl.title,
        description: tmpl.desc,
        contentHash: randomHash(),
        status: tmpl.status,
        yesWeight: tmpl.yes,
        noWeight: tmpl.no,
        abstainWeight: tmpl.abstain,
        voterCount: tmpl.voters,
        transactionSignature: randomTxSig(),
        submittedAt: daysAgo(Math.floor(Math.random() * 30) + 10),
      },
    });

    // Create votes for ideas that have voters
    if (tmpl.voters > 0) {
      const voterWallets = WALLETS.slice(0, tmpl.voters);
      for (const voter of voterWallets) {
        const choices = ["yes", "no", "abstain"];
        await prisma.vote.create({
          data: {
            onChainAddress: randomSolAddress(),
            ideaId: idea.id,
            voterWallet: voter,
            vote: choices[Math.floor(Math.random() * 3)],
            weight: BigInt(2000 + Math.floor(Math.random() * 8000)),
            transactionSignature: randomTxSig(),
            votedAt: daysAgo(Math.floor(Math.random() * 14)),
          },
        });
      }
    }

    ideaIdx++;
  }

  // Update round idea counts
  for (const round of createdRounds) {
    const count = await prisma.idea.count({ where: { roundId: round.id } });
    await prisma.ideaRound.update({
      where: { id: round.id },
      data: { ideaCount: count },
    });
  }
  console.log(`  ${ideaIdx} ideas created with votes`);

  // -----------------------------------------------------------------------
  // 5. Vote Deposits
  // -----------------------------------------------------------------------
  console.log("Creating vote deposits...");
  for (let i = 0; i < 6; i++) {
    await prisma.voteDeposit.create({
      data: {
        walletAddress: WALLETS[i],
        depositedAmount: BigInt((5 + Math.floor(Math.random() * 20)) * 1e9),
        depositTimestamp: daysAgo(30 + Math.floor(Math.random() * 60)),
        eligibleAt: daysAgo(23 + Math.floor(Math.random() * 50)),
        activeVotes: Math.floor(Math.random() * 5),
      },
    });
  }
  console.log(`  6 vote deposits created`);

  // -----------------------------------------------------------------------
  // 6. Revenue Events + Claims
  // -----------------------------------------------------------------------
  console.log("Creating revenue events...");
  const revenueEvents = [
    { index: 1, token: "sol", total: 5_000_000_000n, status: "completed", daysAgo: 60 },
    { index: 2, token: "usdc", total: 2_500_000_000n, status: "completed", daysAgo: 45 },
    { index: 3, token: "sol", total: 8_200_000_000n, status: "completed", daysAgo: 30 },
    { index: 4, token: "usdc", total: 3_100_000_000n, status: "distributing", daysAgo: 14 },
    { index: 5, token: "sol", total: 6_750_000_000n, status: "recorded", daysAgo: 3 },
  ];

  for (const rev of revenueEvents) {
    const devPool = (rev.total * 60n) / 100n;
    const treasury = (rev.total * 20n) / 100n;
    const burn = (rev.total * 10n) / 100n;
    const maint = rev.total - devPool - treasury - burn;

    const event = await prisma.revenueEvent.create({
      data: {
        eventIndex: rev.index,
        onChainAddress: randomSolAddress(),
        token: rev.token,
        totalAmount: rev.total,
        developerPool: devPool,
        treasuryReserve: treasury,
        burnAmount: burn,
        maintenanceAmount: maint,
        status: rev.status,
        originSignature: randomTxSig(),
        totalContributionScore: BigInt(50000 + Math.floor(Math.random() * 30000)),
        claimedAmount: rev.status === "completed" ? devPool : 0n,
        recordedAt: daysAgo(rev.daysAgo),
      },
    });

    // Claims for completed events
    if (rev.status === "completed") {
      for (let i = 0; i < 4; i++) {
        const score = BigInt(5000 + Math.floor(Math.random() * 10000));
        await prisma.revenueClaim.create({
          data: {
            revenueEventId: event.id,
            claimantWallet: WALLETS[i],
            contributionScore: score,
            totalScore: 50000n,
            amount: (devPool * score) / 50000n,
            transactionSignature: randomTxSig(),
            claimedAt: daysAgo(rev.daysAgo - 2),
          },
        });
      }
    }
  }
  console.log(`  ${revenueEvents.length} revenue events created`);

  // -----------------------------------------------------------------------
  // 7. Verification Reports + Peer Reviews
  // -----------------------------------------------------------------------
  console.log("Creating verification reports...");
  let reportCount = 0;
  for (let i = 0; i < 6; i++) {
    const numReports = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numReports; j++) {
      const taskIdx = (i * 2 + j) % TASK_REFS.length;
      const score = 6500 + Math.floor(Math.random() * 3500);
      const isAi = Math.random() > 0.4;

      const report = await prisma.verificationReport.create({
        data: {
          walletAddress: WALLETS[i],
          taskRef: TASK_REFS[taskIdx],
          verificationType: isAi ? "ai" : "peer",
          overallScore: score,
          confidence: 7000 + Math.floor(Math.random() * 3000),
          reportJson: {
            categories: [
              { name: "Code Quality", score: 70 + Math.floor(Math.random() * 30), weight: 25 },
              { name: "Task Fulfillment", score: 65 + Math.floor(Math.random() * 35), weight: 30 },
              { name: "Test Coverage", score: 50 + Math.floor(Math.random() * 50), weight: 20 },
              { name: "Workflow Discipline", score: 60 + Math.floor(Math.random() * 40), weight: 15 },
              { name: "Plan Adherence", score: 70 + Math.floor(Math.random() * 30), weight: 10 },
            ],
            summary: "Solid contribution with good code quality and thorough testing.",
          },
          reportHash: randomHash(),
          onChainAddress: randomSolAddress(),
          transactionSignature: randomTxSig(),
          status: "completed",
          createdAt: daysAgo(Math.floor(Math.random() * 60)),
        },
      });

      // Add peer reviews for peer-type verifications
      if (!isAi) {
        for (let r = 0; r < 3; r++) {
          const reviewerIdx = (i + r + 1) % WALLETS.length;
          await prisma.peerReview.create({
            data: {
              verificationReportId: report.id,
              reviewerWallet: WALLETS[reviewerIdx],
              reviewerTier: 1 + Math.floor(Math.random() * 3),
              reviewerWeight: 0.8 + Math.random() * 0.4,
              score: 6000 + Math.floor(Math.random() * 4000),
              passed: Math.random() > 0.15,
              evidenceJson: [
                { criterion: "Code compiles and passes tests", details: "All 42 tests pass." },
                { criterion: "Meets task requirements", details: "Feature implemented as described." },
              ],
              reviewHash: randomHash(),
              onChainAddress: randomSolAddress(),
              transactionSignature: randomTxSig(),
              createdAt: daysAgo(Math.floor(Math.random() * 30)),
            },
          });
        }
      }
      reportCount++;
    }
  }
  console.log(`  ${reportCount} verification reports created`);

  // -----------------------------------------------------------------------
  // 8. Delegations
  // -----------------------------------------------------------------------
  console.log("Creating delegations...");
  const delegations = [
    { from: 4, to: 0, amount: 8_000_000_000n },
    { from: 5, to: 0, amount: 5_000_000_000n },
    { from: 6, to: 2, amount: 12_000_000_000n },
    { from: 7, to: 3, amount: 3_000_000_000n },
  ];

  for (const d of delegations) {
    await prisma.delegation.create({
      data: {
        onChainAddress: randomSolAddress(),
        delegatorWallet: WALLETS[d.from],
        delegateWallet: WALLETS[d.to],
        delegatedAmount: d.amount,
        isActive: true,
        effectiveFromRound: 2,
        transactionSignature: randomTxSig(),
        delegatedAt: daysAgo(20 + Math.floor(Math.random() * 30)),
      },
    });
  }
  console.log(`  ${delegations.length} delegations created`);

  // -----------------------------------------------------------------------
  // 9. Program Upgrades (transparency)
  // -----------------------------------------------------------------------
  console.log("Creating program upgrades...");
  const upgrades = [
    { version: "0.1.0", desc: "Initial program deployment with contribution tracking and developer profiles.", daysAgo: 120 },
    { version: "0.2.0", desc: "Add governance module: idea rounds, voting, and quorum logic.", daysAgo: 90 },
    { version: "0.3.0", desc: "Revenue distribution engine with 60/20/10/10 split and claim system.", daysAgo: 60 },
    { version: "0.4.0", desc: "Verification system: AI scoring, peer review consensus, and on-chain attestations.", daysAgo: 30 },
    { version: "0.5.0", desc: "Delegation system, quadratic voting, and governance parameter configurability.", daysAgo: 7 },
  ];

  for (const u of upgrades) {
    await prisma.programUpgrade.create({
      data: {
        programId: "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw",
        version: u.version,
        description: u.desc,
        signers: [WALLETS[0], WALLETS[1], WALLETS[3]],
        transactionSignature: randomTxSig(),
        multisigAddress: randomSolAddress(),
        createdAt: daysAgo(u.daysAgo),
      },
    });
  }
  console.log(`  ${upgrades.length} program upgrades created`);

  // -----------------------------------------------------------------------
  // 10. Reviewer Profiles
  // -----------------------------------------------------------------------
  console.log("Creating reviewer profiles...");
  for (let i = 0; i < 5; i++) {
    await prisma.reviewerProfile.create({
      data: {
        walletAddress: WALLETS[i],
        tier: i < 2 ? 3 : i < 4 ? 2 : 1,
        totalReviews: 5 + Math.floor(Math.random() * 20),
        verifiedContributions: 3 + Math.floor(Math.random() * 15),
        reviewQualityScore: 0.8 + Math.random() * 0.2,
      },
    });
  }
  console.log(`  5 reviewer profiles created`);

  // -----------------------------------------------------------------------
  // 11. Human Verifications
  // -----------------------------------------------------------------------
  console.log("Creating human verifications...");
  for (let i = 0; i < 4; i++) {
    await prisma.humanVerification.create({
      data: {
        walletAddress: WALLETS[i],
        gatekeeperNetwork: "ignREusXmGrscGNUesoU9mxfds9AiYqSGC83dxPALi6",
        verified: true,
        verifiedAt: daysAgo(30 + Math.floor(Math.random() * 60)),
        expiresAt: new Date(Date.now() + 180 * 86400000),
      },
    });
  }
  console.log(`  4 human verifications created`);

  console.log("\nSeed complete! The app is ready for demo.");
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Seed failed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
