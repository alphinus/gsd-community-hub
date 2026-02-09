import { startAnchor } from "anchor-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import { GsdHub } from "../../../target/types/gsd_hub";

const IDL = require("../../../target/idl/gsd_hub.json");
const PROGRAM_ID = new PublicKey(IDL.address);

/**
 * Create bankrun context for verification tests
 */
async function createContext() {
  return startAnchor(".", [], []);
}

/**
 * Transfer SOL from provider wallet to destination in bankrun
 */
async function airdrop(
  provider: BankrunProvider,
  destination: PublicKey,
  lamports: number = 100_000_000_000 // 100 SOL
) {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: destination,
      lamports,
    })
  );
  const recentBlockhash = provider.context.lastBlockhash;
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = provider.wallet.publicKey;
  tx.sign(provider.wallet.payer);
  await provider.context.banksClient.processTransaction(tx);
}

/**
 * SHA-256 of a string to produce a 32-byte task_ref
 */
function sha256TaskRef(input: string): number[] {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256").update(input).digest();
  return Array.from(new Uint8Array(hash));
}

/**
 * Initialize a VerificationConfig and return key accounts/program
 */
async function setupVerificationConfig(opts?: {
  confidenceThreshold?: number;
  minReviewers?: number;
}) {
  const context = await createContext();
  const provider = new BankrunProvider(context);
  const program = new Program<GsdHub>(IDL as GsdHub, provider);
  const admin = provider.wallet.publicKey;

  const [verificationConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("verification_config")],
    PROGRAM_ID
  );

  // Default weights summing to 10000
  const codeQualityWeight = 2500;
  const taskFulfillmentWeight = 2000;
  const testCoverageWeight = 1500;
  const workflowDisciplineWeight = 2500;
  const planAdherenceWeight = 1500;

  const confidenceThreshold = opts?.confidenceThreshold ?? 6000;
  const minReviewers = opts?.minReviewers ?? 3;

  await program.methods
    .initVerificationConfig(
      confidenceThreshold,
      codeQualityWeight,
      taskFulfillmentWeight,
      testCoverageWeight,
      workflowDisciplineWeight,
      planAdherenceWeight,
      minReviewers,
      7000, // consensus_threshold_bps
      7 // review_timeout_days
    )
    .accounts({
      verificationConfig: verificationConfigPda,
      admin,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    context,
    provider,
    program,
    admin,
    verificationConfigPda,
    confidenceThreshold,
    minReviewers,
  };
}

/**
 * Submit an AI verification report and return its PDA
 */
async function submitAiVerification(
  s: Awaited<ReturnType<typeof setupVerificationConfig>>,
  developer: PublicKey,
  taskRefStr: string,
  score: number,
  confidence: number
) {
  const taskRef = sha256TaskRef(taskRefStr);

  const [verificationReportPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("verification"), developer.toBuffer(), Buffer.from(taskRef)],
    PROGRAM_ID
  );

  const reportHash = sha256TaskRef("report-" + taskRefStr);

  await s.program.methods
    .submitVerification(
      taskRef as number[],
      { ai: {} },
      score,
      confidence,
      reportHash as number[]
    )
    .accounts({
      authority: s.admin,
      developer,
      verificationConfig: s.verificationConfigPda,
      verificationReport: verificationReportPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { verificationReportPda, taskRef, reportHash };
}

describe("Verification Instructions", () => {
  it("initializes verification config with valid weights", async () => {
    const s = await setupVerificationConfig();

    const config = await s.program.account.verificationConfig.fetch(
      s.verificationConfigPda
    );

    expect(config.admin.toBase58()).to.equal(s.admin.toBase58());
    expect(config.version).to.equal(1);
    expect(config.confidenceThreshold).to.equal(6000);
    expect(config.codeQualityWeight).to.equal(2500);
    expect(config.taskFulfillmentWeight).to.equal(2000);
    expect(config.testCoverageWeight).to.equal(1500);
    expect(config.workflowDisciplineWeight).to.equal(2500);
    expect(config.planAdherenceWeight).to.equal(1500);
    expect(config.minReviewers).to.equal(3);
    expect(config.consensusThresholdBps).to.equal(7000);
    expect(config.reviewTimeoutDays).to.equal(7);
  });

  it("rejects verification config with invalid weights (not summing to 10000)", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    const [verificationConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("verification_config")],
      PROGRAM_ID
    );

    try {
      // Weights sum to 9000 (not 10000)
      await program.methods
        .initVerificationConfig(
          6000, // confidence_threshold
          2000, // code_quality_weight
          2000, // task_fulfillment_weight
          1500, // test_coverage_weight
          2000, // workflow_discipline_weight
          1500, // plan_adherence_weight (total = 9000)
          3, // min_reviewers
          7000, // consensus_threshold_bps
          7 // review_timeout_days
        )
        .accounts({
          verificationConfig: verificationConfigPda,
          admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Expected WeightsMustSumTo10000 error");
    } catch (err: any) {
      expect(err.toString()).to.include("WeightsMustSumTo10000");
    }
  });

  it("submits AI verification with high confidence (status = Completed)", async () => {
    const s = await setupVerificationConfig();
    const developer = Keypair.generate();

    const { verificationReportPda, taskRef, reportHash } =
      await submitAiVerification(
        s,
        developer.publicKey,
        "test-task-1",
        8500,
        7500
      );

    const report = await s.program.account.verificationReport.fetch(
      verificationReportPda
    );

    expect(report.developer.toBase58()).to.equal(
      developer.publicKey.toBase58()
    );
    expect(Array.from(report.taskRef as number[])).to.deep.equal(taskRef);
    expect(JSON.stringify(report.verificationType)).to.equal(
      JSON.stringify({ ai: {} })
    );
    expect(JSON.stringify(report.status)).to.equal(
      JSON.stringify({ completed: {} })
    );
    expect(report.score).to.equal(8500);
    expect(report.confidence).to.equal(7500);
    expect(Array.from(report.reportHash as number[])).to.deep.equal(
      reportHash
    );
    expect(report.reviewerCount).to.equal(0);
    expect(report.configVersion).to.equal(1);
  });

  it("submits AI verification with low confidence (status = Pending)", async () => {
    const s = await setupVerificationConfig({ confidenceThreshold: 6000 });
    const developer = Keypair.generate();

    const { verificationReportPda } = await submitAiVerification(
      s,
      developer.publicKey,
      "test-task-low-conf",
      8000,
      5000 // below 6000 threshold
    );

    const report = await s.program.account.verificationReport.fetch(
      verificationReportPda
    );

    expect(JSON.stringify(report.status)).to.equal(
      JSON.stringify({ pending: {} })
    );
    expect(report.confidence).to.equal(5000);
  });

  it("submits peer review on a pending verification report", async () => {
    const s = await setupVerificationConfig({ confidenceThreshold: 6000 });
    const developer = Keypair.generate();

    // Create a pending report (low confidence)
    const { verificationReportPda } = await submitAiVerification(
      s,
      developer.publicKey,
      "test-task-peer",
      7500,
      4000 // low confidence -> Pending
    );

    // Create a different reviewer
    const reviewer = Keypair.generate();
    await airdrop(s.provider, reviewer.publicKey);

    const [peerReviewPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("peer_review"),
        reviewer.publicKey.toBuffer(),
        verificationReportPda.toBuffer(),
      ],
      PROGRAM_ID
    );

    const reviewHash = sha256TaskRef("peer-review-1");

    await s.program.methods
      .submitPeerReview(2, 2000, 8000, true, reviewHash as number[])
      .accounts({
        reviewer: reviewer.publicKey,
        verificationReport: verificationReportPda,
        peerReview: peerReviewPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([reviewer])
      .rpc();

    // Verify PeerReview PDA
    const review = await s.program.account.peerReview.fetch(peerReviewPda);
    expect(review.reviewer.toBase58()).to.equal(
      reviewer.publicKey.toBase58()
    );
    expect(review.verificationReport.toBase58()).to.equal(
      verificationReportPda.toBase58()
    );
    expect(review.tier).to.equal(2);
    expect(review.weight).to.equal(2000);
    expect(review.score).to.equal(8000);
    expect(review.passed).to.equal(true);
    expect(Array.from(review.reviewHash as number[])).to.deep.equal(
      reviewHash
    );

    // Verify reviewer_count was incremented
    const report = await s.program.account.verificationReport.fetch(
      verificationReportPda
    );
    expect(report.reviewerCount).to.equal(1);
  });

  it("prevents self-review (reviewer == developer)", async () => {
    const s = await setupVerificationConfig({ confidenceThreshold: 6000 });

    // Use admin as the developer so we can sign both
    // Submit verification where developer = admin
    const taskRef = sha256TaskRef("self-review-task");
    const [verificationReportPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("verification"),
        s.admin.toBuffer(),
        Buffer.from(taskRef),
      ],
      PROGRAM_ID
    );

    const reportHash = sha256TaskRef("report-self-review-task");

    await s.program.methods
      .submitVerification(
        taskRef as number[],
        { ai: {} },
        7000,
        3000, // low confidence -> Pending
        reportHash as number[]
      )
      .accounts({
        authority: s.admin,
        developer: s.admin, // developer is the admin wallet
        verificationConfig: s.verificationConfigPda,
        verificationReport: verificationReportPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Try to submit peer review where reviewer = developer (admin)
    const [peerReviewPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("peer_review"),
        s.admin.toBuffer(),
        verificationReportPda.toBuffer(),
      ],
      PROGRAM_ID
    );

    try {
      await s.program.methods
        .submitPeerReview(
          1,
          1000,
          8000,
          true,
          sha256TaskRef("self-review-evidence") as number[]
        )
        .accounts({
          reviewer: s.admin, // same as developer
          verificationReport: verificationReportPda,
          peerReview: peerReviewPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Expected ReviewerIsDeveloper error");
    } catch (err: any) {
      expect(err.toString()).to.include("ReviewerIsDeveloper");
    }
  });

  it("finalizes peer verification after sufficient reviews", async () => {
    const s = await setupVerificationConfig({
      confidenceThreshold: 6000,
      minReviewers: 3,
    });
    const developer = Keypair.generate();

    // Create a pending report
    const { verificationReportPda } = await submitAiVerification(
      s,
      developer.publicKey,
      "test-task-finalize",
      6000,
      3000 // low confidence -> Pending
    );

    // Submit 3 peer reviews from different reviewers
    for (let i = 0; i < 3; i++) {
      const reviewer = Keypair.generate();
      await airdrop(s.provider, reviewer.publicKey);

      const [peerReviewPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("peer_review"),
          reviewer.publicKey.toBuffer(),
          verificationReportPda.toBuffer(),
        ],
        PROGRAM_ID
      );

      const reviewHash = sha256TaskRef(`review-finalize-${i}`);

      await s.program.methods
        .submitPeerReview(
          (i + 1) as 1 | 2 | 3, // tiers 1, 2, 3
          (i + 1) * 1000,
          7500 + i * 500,
          true,
          reviewHash as number[]
        )
        .accounts({
          reviewer: reviewer.publicKey,
          verificationReport: verificationReportPda,
          peerReview: peerReviewPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([reviewer])
        .rpc();
    }

    // Verify reviewer_count is 3
    const reportBefore = await s.program.account.verificationReport.fetch(
      verificationReportPda
    );
    expect(reportBefore.reviewerCount).to.equal(3);

    // Finalize with consensus result
    const peerReportHash = sha256TaskRef("peer-consensus-hash");

    await s.program.methods
      .finalizePeerVerification(
        8200, // final_score
        9000, // final_confidence
        peerReportHash as number[]
      )
      .accounts({
        authority: s.admin,
        verificationReport: verificationReportPda,
        verificationConfig: s.verificationConfigPda,
      })
      .rpc();

    // Verify report was updated
    const reportAfter = await s.program.account.verificationReport.fetch(
      verificationReportPda
    );
    expect(JSON.stringify(reportAfter.status)).to.equal(
      JSON.stringify({ completed: {} })
    );
    expect(JSON.stringify(reportAfter.verificationType)).to.equal(
      JSON.stringify({ peer: {} })
    );
    expect(reportAfter.score).to.equal(8200);
    expect(reportAfter.confidence).to.equal(9000);
    expect(Array.from(reportAfter.reportHash as number[])).to.deep.equal(
      peerReportHash
    );
  });

  it("rejects finalization with insufficient reviewers", async () => {
    const s = await setupVerificationConfig({
      confidenceThreshold: 6000,
      minReviewers: 3,
    });
    const developer = Keypair.generate();

    // Create a pending report
    const { verificationReportPda } = await submitAiVerification(
      s,
      developer.publicKey,
      "test-task-insufficient",
      6000,
      3000
    );

    // Submit only 1 peer review (below min_reviewers=3)
    const reviewer = Keypair.generate();
    await airdrop(s.provider, reviewer.publicKey);

    const [peerReviewPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("peer_review"),
        reviewer.publicKey.toBuffer(),
        verificationReportPda.toBuffer(),
      ],
      PROGRAM_ID
    );

    await s.program.methods
      .submitPeerReview(
        1,
        1000,
        7500,
        true,
        sha256TaskRef("insufficient-review") as number[]
      )
      .accounts({
        reviewer: reviewer.publicKey,
        verificationReport: verificationReportPda,
        peerReview: peerReviewPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([reviewer])
      .rpc();

    // Try to finalize with only 1 reviewer when min_reviewers=3
    try {
      await s.program.methods
        .finalizePeerVerification(
          8000,
          8500,
          sha256TaskRef("consensus") as number[]
        )
        .accounts({
          authority: s.admin,
          verificationReport: verificationReportPda,
          verificationConfig: s.verificationConfigPda,
        })
        .rpc();
      expect.fail("Expected InsufficientReviewers error");
    } catch (err: any) {
      expect(err.toString()).to.include("InsufficientReviewers");
    }
  });

  it("prevents re-initialization of verification config", async () => {
    const s = await setupVerificationConfig();

    // Try to re-initialize the same PDA
    try {
      await s.program.methods
        .initVerificationConfig(
          5000, 2000, 2000, 2000, 2000, 2000, 2, 8000, 14
        )
        .accounts({
          verificationConfig: s.verificationConfigPda,
          admin: s.admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Expected re-init to fail");
    } catch (err: any) {
      // Anchor init constraint prevents re-initialization
      expect(err.toString()).to.satisfy(
        (s: string) =>
          s.includes("already in use") ||
          s.includes("already been processed") ||
          s.includes("Error")
      );
    }
  });
});
