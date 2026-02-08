import { startAnchor } from "anchor-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { BN, Program } from "@coral-xyz/anchor";
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

const SPL_ACCOUNT_COMPRESSION_ID = new PublicKey(
  "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK"
);
const SPL_NOOP_ID = new PublicKey(
  "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
);

// Tree params: depth=3 (8 leaves max), buffer=8
const MAX_DEPTH = 3;
const MAX_BUFFER_SIZE = 8;

// Merkle tree account size for depth=3, buffer=8 is 1304 bytes
// Formula from spl-account-compression: getConcurrentMerkleTreeAccountSize(3, 8)
const MERKLE_TREE_ACCOUNT_SIZE = 1304;

/**
 * Helper: create bankrun context with compression + noop programs loaded
 */
async function createContext() {
  return startAnchor(
    ".",
    [
      {
        name: "spl_account_compression",
        programId: SPL_ACCOUNT_COMPRESSION_ID,
      },
      {
        name: "spl_noop",
        programId: SPL_NOOP_ID,
      },
    ],
    []
  );
}

/**
 * Helper: allocate a Merkle tree account with the right size.
 * In bankrun we create a transaction that allocates the account.
 */
async function allocateMerkleTree(
  provider: BankrunProvider,
  merkleTree: Keypair,
  payer: PublicKey,
  space: number
) {
  const rent =
    await provider.connection.getMinimumBalanceForRentExemption(space);
  const ix = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: merkleTree.publicKey,
    lamports: rent,
    space,
    programId: SPL_ACCOUNT_COMPRESSION_ID,
  });
  const tx = new Transaction().add(ix);
  // Use bankrun's context to process the transaction
  const recentBlockhash = provider.context.lastBlockhash;
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = payer;
  tx.sign(provider.wallet.payer, merkleTree);
  await provider.context.banksClient.processTransaction(tx);
}

describe("Contribution Tree", () => {
  it("initializes contribution tree", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    // Generate a keypair for the Merkle tree account
    const merkleTree = Keypair.generate();

    // Pre-allocate the Merkle tree account
    await allocateMerkleTree(
      provider,
      merkleTree,
      authority,
      MERKLE_TREE_ACCOUNT_SIZE
    );

    // Derive tree_config PDA
    const [treeConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution_tree"), merkleTree.publicKey.toBuffer()],
      PROGRAM_ID
    );

    await program.methods
      .initContributionTree(MAX_DEPTH, MAX_BUFFER_SIZE)
      .accounts({
        treeConfig,
        merkleTree: merkleTree.publicKey,
        authority,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
        noopProgram: SPL_NOOP_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify tree config PDA
    const config = await program.account.contributionTreeConfig.fetch(
      treeConfig
    );
    expect(config.authority.toBase58()).to.equal(authority.toBase58());
    expect(config.merkleTree.toBase58()).to.equal(
      merkleTree.publicKey.toBase58()
    );
    expect(config.totalContributions.toNumber()).to.equal(0);
    expect(config.bump).to.be.a("number");
    expect(config.createdAt.toNumber()).to.be.greaterThan(0);
  });

  it("records a contribution", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    const merkleTree = Keypair.generate();
    await allocateMerkleTree(
      provider,
      merkleTree,
      authority,
      MERKLE_TREE_ACCOUNT_SIZE
    );

    const [treeConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution_tree"), merkleTree.publicKey.toBuffer()],
      PROGRAM_ID
    );

    // Init tree first
    await program.methods
      .initContributionTree(MAX_DEPTH, MAX_BUFFER_SIZE)
      .accounts({
        treeConfig,
        merkleTree: merkleTree.publicKey,
        authority,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
        noopProgram: SPL_NOOP_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Record a contribution
    const developer = Keypair.generate().publicKey;
    const taskRef = new Uint8Array(32).fill(0xab);
    const verificationScore = 8500; // 85.00%
    const contentHash = new Uint8Array(32).fill(0xcd);

    await program.methods
      .recordContribution(
        developer,
        Array.from(taskRef) as number[],
        verificationScore,
        Array.from(contentHash) as number[]
      )
      .accounts({
        treeConfig,
        merkleTree: merkleTree.publicKey,
        authority,
        noopProgram: SPL_NOOP_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
      })
      .rpc();

    // Verify total_contributions incremented
    const config = await program.account.contributionTreeConfig.fetch(
      treeConfig
    );
    expect(config.totalContributions.toNumber()).to.equal(1);
  });

  it("rejects contribution with invalid verification score", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    const merkleTree = Keypair.generate();
    await allocateMerkleTree(
      provider,
      merkleTree,
      authority,
      MERKLE_TREE_ACCOUNT_SIZE
    );

    const [treeConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution_tree"), merkleTree.publicKey.toBuffer()],
      PROGRAM_ID
    );

    await program.methods
      .initContributionTree(MAX_DEPTH, MAX_BUFFER_SIZE)
      .accounts({
        treeConfig,
        merkleTree: merkleTree.publicKey,
        authority,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
        noopProgram: SPL_NOOP_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const developer = Keypair.generate().publicKey;
    const taskRef = new Uint8Array(32).fill(0xab);
    const invalidScore = 10001; // > 10000, invalid
    const contentHash = new Uint8Array(32).fill(0xcd);

    try {
      await program.methods
        .recordContribution(
          developer,
          Array.from(taskRef) as number[],
          invalidScore,
          Array.from(contentHash) as number[]
        )
        .accounts({
          treeConfig,
          merkleTree: merkleTree.publicKey,
          authority,
          noopProgram: SPL_NOOP_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
        })
        .rpc();
      expect.fail("Expected invalid verification score to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("InvalidVerificationScore");
    }
  });

  it("rejects contribution from non-authority", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    const merkleTree = Keypair.generate();
    await allocateMerkleTree(
      provider,
      merkleTree,
      authority,
      MERKLE_TREE_ACCOUNT_SIZE
    );

    const [treeConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("contribution_tree"), merkleTree.publicKey.toBuffer()],
      PROGRAM_ID
    );

    await program.methods
      .initContributionTree(MAX_DEPTH, MAX_BUFFER_SIZE)
      .accounts({
        treeConfig,
        merkleTree: merkleTree.publicKey,
        authority,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
        noopProgram: SPL_NOOP_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Create a different signer (non-authority)
    const fakeAuthority = Keypair.generate();

    const developer = Keypair.generate().publicKey;
    const taskRef = new Uint8Array(32).fill(0xab);
    const verificationScore = 5000;
    const contentHash = new Uint8Array(32).fill(0xcd);

    try {
      await program.methods
        .recordContribution(
          developer,
          Array.from(taskRef) as number[],
          verificationScore,
          Array.from(contentHash) as number[]
        )
        .accounts({
          treeConfig,
          merkleTree: merkleTree.publicKey,
          authority: fakeAuthority.publicKey,
          noopProgram: SPL_NOOP_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_ID,
        })
        .signers([fakeAuthority])
        .rpc();
      expect.fail("Expected non-authority to be rejected");
    } catch (err: any) {
      // Should fail with authority mismatch
      expect(err).to.exist;
    }
  });

  it("updates developer contribution score", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    // First register a developer profile
    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), authority.toBuffer()],
      PROGRAM_ID
    );

    const profileHash = new Uint8Array(32).fill(1);
    await program.methods
      .registerDeveloper(Array.from(profileHash) as number[])
      .accounts({
        developerProfile: profilePda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Now update the contribution score
    const tasksCompleted = 5;
    const totalVerificationScore = 42500; // 5 tasks * avg 8500
    const timeActiveDays = 30;
    const contributionScore = 1_500_000; // scaled by 1e6
    const scoreVersion = 1;

    await program.methods
      .updateContributionScore(
        tasksCompleted,
        new BN(totalVerificationScore),
        timeActiveDays,
        new BN(contributionScore),
        scoreVersion
      )
      .accounts({
        developerProfile: profilePda,
        developerWallet: authority,
        authority,
        payer: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify score fields
    const profile = await program.account.developerProfile.fetch(profilePda);
    expect(profile.tasksCompleted).to.equal(tasksCompleted);
    expect(profile.totalVerificationScore.toNumber()).to.equal(
      totalVerificationScore
    );
    expect(profile.timeActiveDays).to.equal(timeActiveDays);
    expect(profile.contributionScore.toNumber()).to.equal(contributionScore);
    expect(profile.scoreVersion).to.equal(scoreVersion);
    expect(profile.firstContributionAt.toNumber()).to.be.greaterThan(0);
    expect(profile.lastContributionAt.toNumber()).to.be.greaterThan(0);
  });
});
