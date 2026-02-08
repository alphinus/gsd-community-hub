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
import { Clock } from "solana-bankrun";
import { GsdHub } from "../../../target/types/gsd_hub";

const IDL = require("../../../target/idl/gsd_hub.json");
const PROGRAM_ID = new PublicKey(IDL.address);

const SPL_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// SPL Token Mint layout: 82 bytes total
// See https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/state.rs
const MINT_SIZE = 82;

/**
 * Create bankrun context with SPL Token program loaded from fixtures
 */
async function createContext() {
  return startAnchor(
    ".",
    [
      {
        name: "spl_token",
        programId: SPL_TOKEN_PROGRAM_ID,
      },
    ],
    []
  );
}

/**
 * Create an SPL Token Mint account in bankrun using createAccount + Token program initializeMint
 */
async function createMintAccount(
  provider: BankrunProvider,
  mintKeypair: Keypair,
  mintAuthority: PublicKey,
  decimals: number = 6
): Promise<PublicKey> {
  const rent =
    await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  // Create account instruction
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    lamports: rent,
    space: MINT_SIZE,
    programId: SPL_TOKEN_PROGRAM_ID,
  });

  // InitializeMint instruction (discriminator = 0, decimals, mintAuthority, option<freezeAuthority>)
  // Layout: [0] (1 byte instruction) + [decimals] (1 byte) + [mintAuthority] (32 bytes) + [1] (option=Some) + [mintAuthority] (32 bytes)
  const data = Buffer.alloc(67);
  data.writeUInt8(0, 0); // InitializeMint instruction index
  data.writeUInt8(decimals, 1); // decimals
  mintAuthority.toBuffer().copy(data, 2); // mint_authority
  data.writeUInt8(1, 34); // COption::Some for freeze_authority
  mintAuthority.toBuffer().copy(data, 35); // freeze_authority

  const initMintIx = {
    keys: [
      { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
      {
        pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"),
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: SPL_TOKEN_PROGRAM_ID,
    data,
  };

  const tx = new Transaction().add(createAccountIx, initMintIx);
  const recentBlockhash = provider.context.lastBlockhash;
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = provider.wallet.publicKey;
  tx.sign(provider.wallet.payer, mintKeypair);
  await provider.context.banksClient.processTransaction(tx);

  return mintKeypair.publicKey;
}

/**
 * Airdrop lamports to a keypair in bankrun context
 */
async function airdrop(
  provider: BankrunProvider,
  destination: PublicKey,
  lamports: number = 10_000_000_000
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
 * Set the bankrun clock to a specific unix timestamp
 */
async function warpToTimestamp(
  context: Awaited<ReturnType<typeof startAnchor>>,
  targetTimestamp: number
) {
  const currentClock = await context.banksClient.getClock();
  context.setClock(
    new Clock(
      currentClock.slot,
      currentClock.epochStartTimestamp,
      currentClock.epoch,
      currentClock.leaderScheduleEpoch,
      BigInt(targetTimestamp)
    )
  );
}

describe("Governance Round Lifecycle", () => {
  it("initializes governance config", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Create a governance token mint
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);

    // Veto authority is just a keypair
    const vetoAuthority = Keypair.generate();

    // Derive GovernanceConfig PDA
    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    const depositTimelock = new BN(604800); // 7 days
    const executionTimelock = new BN(172800); // 48 hours

    await program.methods
      .initGovernanceConfig(depositTimelock, executionTimelock)
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.governanceConfig.fetch(
      governanceConfigPda
    );
    expect(config.admin.toBase58()).to.equal(admin.toBase58());
    expect(config.governanceTokenMint.toBase58()).to.equal(
      mintKeypair.publicKey.toBase58()
    );
    expect(config.vetoAuthority.toBase58()).to.equal(
      vetoAuthority.publicKey.toBase58()
    );
    expect(config.roundCount).to.equal(0);
    expect(config.totalDeposited.toNumber()).to.equal(0);
    expect(config.depositTimelock.toNumber()).to.equal(604800);
    expect(config.executionTimelock.toNumber()).to.equal(172800);
  });

  it("creates an idea round", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Setup: create mint + init governance config
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    await program.methods
      .initGovernanceConfig(new BN(604800), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Create a round: submission_start = now, submission_end = now+3600, voting_end = now+7200
    const now = Math.floor(Date.now() / 1000);
    const submissionStart = new BN(now);
    const submissionEnd = new BN(now + 3600);
    const votingEnd = new BN(now + 7200);
    const contentHash = Array.from(new Uint8Array(32).fill(1)) as number[];

    // Derive IdeaRound PDA with round_index = 0
    const roundIndex = 0;
    const [ideaRoundPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea_round"),
        Buffer.from(new Uint32Array([roundIndex]).buffer),
      ],
      PROGRAM_ID
    );

    // Warp clock so the current time is >= submissionStart
    await warpToTimestamp(context, now);

    await program.methods
      .createRound(
        submissionStart,
        submissionEnd,
        votingEnd,
        { small: {} },
        contentHash
      )
      .accounts({
        governanceConfig: governanceConfigPda,
        ideaRound: ideaRoundPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const round = await program.account.ideaRound.fetch(ideaRoundPda);
    expect(round.authority.toBase58()).to.equal(admin.toBase58());
    expect(round.roundIndex).to.equal(0);
    expect(JSON.stringify(round.status)).to.equal(
      JSON.stringify({ open: {} })
    );
    expect(round.submissionStart.toNumber()).to.equal(now);
    expect(round.submissionEnd.toNumber()).to.equal(now + 3600);
    expect(round.votingEnd.toNumber()).to.equal(now + 7200);
    expect(round.ideaCount).to.equal(0);
    expect(JSON.stringify(round.quorumType)).to.equal(
      JSON.stringify({ small: {} })
    );
    expect(round.contentHash).to.deep.equal(
      Array.from(new Uint8Array(32).fill(1))
    );

    // Verify governance_config round_count incremented
    const config = await program.account.governanceConfig.fetch(
      governanceConfigPda
    );
    expect(config.roundCount).to.equal(1);
  });

  it("submits an idea to open round", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Setup: mint, governance config, round
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    await program.methods
      .initGovernanceConfig(new BN(604800), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const now = Math.floor(Date.now() / 1000);
    await warpToTimestamp(context, now);

    const roundIndex = 0;
    const [ideaRoundPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea_round"),
        Buffer.from(new Uint32Array([roundIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await program.methods
      .createRound(
        new BN(now),
        new BN(now + 3600),
        new BN(now + 7200),
        { small: {} },
        Array.from(new Uint8Array(32).fill(1)) as number[]
      )
      .accounts({
        governanceConfig: governanceConfigPda,
        ideaRound: ideaRoundPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Create a submitter keypair and fund it
    const submitter = Keypair.generate();
    await airdrop(provider, submitter.publicKey);

    // Derive Idea PDA (round key, idea_index=0)
    const ideaIndex = 0;
    const [ideaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea"),
        ideaRoundPda.toBuffer(),
        Buffer.from(new Uint32Array([ideaIndex]).buffer),
      ],
      PROGRAM_ID
    );

    const ideaContentHash = Array.from(
      new Uint8Array(32).fill(2)
    ) as number[];

    await program.methods
      .submitIdea(ideaContentHash)
      .accounts({
        ideaRound: ideaRoundPda,
        idea: ideaPda,
        author: submitter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([submitter])
      .rpc();

    const idea = await program.account.idea.fetch(ideaPda);
    expect(idea.author.toBase58()).to.equal(submitter.publicKey.toBase58());
    expect(idea.round.toBase58()).to.equal(ideaRoundPda.toBase58());
    expect(idea.ideaIndex).to.equal(0);
    expect(JSON.stringify(idea.status)).to.equal(
      JSON.stringify({ submitted: {} })
    );
    expect(idea.contentHash).to.deep.equal(
      Array.from(new Uint8Array(32).fill(2))
    );
    expect(idea.yesWeight.toNumber()).to.equal(0);
    expect(idea.noWeight.toNumber()).to.equal(0);
    expect(idea.abstainWeight.toNumber()).to.equal(0);
    expect(idea.voterCount).to.equal(0);

    // Verify idea_count incremented on round
    const round = await program.account.ideaRound.fetch(ideaRoundPda);
    expect(round.ideaCount).to.equal(1);
  });

  it("rejects idea submission after deadline", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Setup
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    await program.methods
      .initGovernanceConfig(new BN(604800), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const now = Math.floor(Date.now() / 1000);
    await warpToTimestamp(context, now);

    const roundIndex = 0;
    const [ideaRoundPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea_round"),
        Buffer.from(new Uint32Array([roundIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await program.methods
      .createRound(
        new BN(now),
        new BN(now + 3600),
        new BN(now + 7200),
        { small: {} },
        Array.from(new Uint8Array(32).fill(1)) as number[]
      )
      .accounts({
        governanceConfig: governanceConfigPda,
        ideaRound: ideaRoundPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Warp time PAST submission_end
    await warpToTimestamp(context, now + 3601);

    const submitter = Keypair.generate();
    await airdrop(provider, submitter.publicKey);

    const ideaIndex = 0;
    const [ideaPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea"),
        ideaRoundPda.toBuffer(),
        Buffer.from(new Uint32Array([ideaIndex]).buffer),
      ],
      PROGRAM_ID
    );

    try {
      await program.methods
        .submitIdea(Array.from(new Uint8Array(32).fill(2)) as number[])
        .accounts({
          ideaRound: ideaRoundPda,
          idea: ideaPda,
          author: submitter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([submitter])
        .rpc();
      expect.fail("Expected submission after deadline to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("SubmissionPeriodEnded");
    }
  });

  it("transitions round from Open to Voting", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Setup
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    await program.methods
      .initGovernanceConfig(new BN(604800), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const now = Math.floor(Date.now() / 1000);
    await warpToTimestamp(context, now);

    const roundIndex = 0;
    const [ideaRoundPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea_round"),
        Buffer.from(new Uint32Array([roundIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await program.methods
      .createRound(
        new BN(now),
        new BN(now + 3600),
        new BN(now + 7200),
        { small: {} },
        Array.from(new Uint8Array(32).fill(1)) as number[]
      )
      .accounts({
        governanceConfig: governanceConfigPda,
        ideaRound: ideaRoundPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Warp past submission_end to allow Open -> Voting transition
    await warpToTimestamp(context, now + 3600);

    // Permissionless: use any signer (the default provider wallet)
    await program.methods
      .transitionRound()
      .accounts({
        ideaRound: ideaRoundPda,
      })
      .rpc();

    const round = await program.account.ideaRound.fetch(ideaRoundPda);
    expect(JSON.stringify(round.status)).to.equal(
      JSON.stringify({ voting: {} })
    );
  });

  it("rejects early transition", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Setup
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    await program.methods
      .initGovernanceConfig(new BN(604800), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const now = Math.floor(Date.now() / 1000);
    await warpToTimestamp(context, now);

    const roundIndex = 0;
    const [ideaRoundPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea_round"),
        Buffer.from(new Uint32Array([roundIndex]).buffer),
      ],
      PROGRAM_ID
    );

    // Create round with submission_end far in the future
    await program.methods
      .createRound(
        new BN(now),
        new BN(now + 86400), // 24 hours from now
        new BN(now + 172800), // 48 hours from now
        { small: {} },
        Array.from(new Uint8Array(32).fill(1)) as number[]
      )
      .accounts({
        governanceConfig: governanceConfigPda,
        ideaRound: ideaRoundPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Try to transition immediately (should fail -- deadline not reached)
    try {
      await program.methods
        .transitionRound()
        .accounts({
          ideaRound: ideaRoundPda,
        })
        .rpc();
      expect.fail("Expected early transition to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("TooEarly");
    }
  });

  it("transitions round from Voting to Closed", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

    // Setup
    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    await program.methods
      .initGovernanceConfig(new BN(604800), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mintKeypair.publicKey,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const now = Math.floor(Date.now() / 1000);
    await warpToTimestamp(context, now);

    const roundIndex = 0;
    const [ideaRoundPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("idea_round"),
        Buffer.from(new Uint32Array([roundIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await program.methods
      .createRound(
        new BN(now),
        new BN(now + 3600),
        new BN(now + 7200),
        { small: {} },
        Array.from(new Uint8Array(32).fill(1)) as number[]
      )
      .accounts({
        governanceConfig: governanceConfigPda,
        ideaRound: ideaRoundPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // First: transition Open -> Voting (warp past submission_end)
    await warpToTimestamp(context, now + 3600);
    await program.methods
      .transitionRound()
      .accounts({
        ideaRound: ideaRoundPda,
      })
      .rpc();

    // Verify it's in Voting
    let round = await program.account.ideaRound.fetch(ideaRoundPda);
    expect(JSON.stringify(round.status)).to.equal(
      JSON.stringify({ voting: {} })
    );

    // Second: transition Voting -> Closed (warp past voting_end)
    await warpToTimestamp(context, now + 7200);
    await program.methods
      .transitionRound()
      .accounts({
        ideaRound: ideaRoundPda,
      })
      .rpc();

    // Verify it's now Closed
    round = await program.account.ideaRound.fetch(ideaRoundPda);
    expect(JSON.stringify(round.status)).to.equal(
      JSON.stringify({ closed: {} })
    );
  });
});
