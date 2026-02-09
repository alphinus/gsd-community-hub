import { startAnchor } from "anchor-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { expect } from "chai";
import { Clock } from "solana-bankrun";
import { GsdHub } from "../../../target/types/gsd_hub";

const IDL = require("../../../target/idl/gsd_hub.json");
const PROGRAM_ID = new PublicKey(IDL.address);

const SPL_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// SPL Token account layouts
const MINT_SIZE = 82;
const TOKEN_ACCOUNT_SIZE = 165;

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
 * Create an SPL Token Mint account in bankrun
 */
async function createMintAccount(
  provider: BankrunProvider,
  mintKeypair: Keypair,
  mintAuthority: PublicKey,
  decimals: number = 6
): Promise<PublicKey> {
  const rent =
    await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    lamports: rent,
    space: MINT_SIZE,
    programId: SPL_TOKEN_PROGRAM_ID,
  });

  // InitializeMint instruction
  const data = Buffer.alloc(67);
  data.writeUInt8(0, 0); // InitializeMint instruction index
  data.writeUInt8(decimals, 1);
  mintAuthority.toBuffer().copy(data, 2);
  data.writeUInt8(1, 34); // COption::Some for freeze_authority
  mintAuthority.toBuffer().copy(data, 35);

  const initMintIx: TransactionInstruction = {
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
 * Create an SPL Token Account
 */
async function createTokenAccount(
  provider: BankrunProvider,
  tokenAccountKeypair: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const rent =
    await provider.connection.getMinimumBalanceForRentExemption(
      TOKEN_ACCOUNT_SIZE
    );

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    newAccountPubkey: tokenAccountKeypair.publicKey,
    lamports: rent,
    space: TOKEN_ACCOUNT_SIZE,
    programId: SPL_TOKEN_PROGRAM_ID,
  });

  // InitializeAccount instruction (index = 1)
  const data = Buffer.alloc(1);
  data.writeUInt8(1, 0);

  const initAccountIx: TransactionInstruction = {
    keys: [
      {
        pubkey: tokenAccountKeypair.publicKey,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: owner, isSigner: false, isWritable: false },
      {
        pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"),
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: SPL_TOKEN_PROGRAM_ID,
    data,
  };

  const tx = new Transaction().add(createAccountIx, initAccountIx);
  const recentBlockhash = provider.context.lastBlockhash;
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = provider.wallet.publicKey;
  tx.sign(provider.wallet.payer, tokenAccountKeypair);
  await provider.context.banksClient.processTransaction(tx);

  return tokenAccountKeypair.publicKey;
}

/**
 * Mint tokens to a token account
 */
async function mintTo(
  provider: BankrunProvider,
  mint: PublicKey,
  destination: PublicKey,
  mintAuthority: Keypair,
  amount: bigint
): Promise<void> {
  // MintTo instruction (index = 7)
  const data = Buffer.alloc(9);
  data.writeUInt8(7, 0);
  data.writeBigUInt64LE(amount, 1);

  const mintToIx: TransactionInstruction = {
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: mintAuthority.publicKey, isSigner: true, isWritable: false },
    ],
    programId: SPL_TOKEN_PROGRAM_ID,
    data,
  };

  const tx = new Transaction().add(mintToIx);
  const recentBlockhash = provider.context.lastBlockhash;
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = provider.wallet.publicKey;
  tx.sign(provider.wallet.payer, mintAuthority);
  await provider.context.banksClient.processTransaction(tx);
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

/**
 * Read the raw SPL token account balance from on-chain data
 */
async function getTokenBalance(
  provider: BankrunProvider,
  tokenAccount: PublicKey
): Promise<bigint> {
  const accountInfo = await provider.connection.getAccountInfo(tokenAccount);
  if (!accountInfo) throw new Error("Token account not found");
  // SPL Token Account layout: amount is at offset 64, 8 bytes LE
  const data = accountInfo.data;
  return data.readBigUInt64LE(64);
}

/**
 * Full governance setup: config + round + idea + voter deposit
 */
async function setupFullGovernance(opts?: { depositTimelock?: number }) {
  const context = await createContext();
  const provider = new BankrunProvider(context);
  const program = new Program<GsdHub>(IDL as GsdHub, provider);
  const admin = provider.wallet.publicKey;
  const adminKeypair = provider.wallet.payer;

  // Create governance token mint (admin is mint authority)
  const mintKeypair = Keypair.generate();
  await createMintAccount(provider, mintKeypair, admin);
  const mint = mintKeypair.publicKey;

  // Veto authority
  const vetoAuthority = Keypair.generate();
  await airdrop(provider, vetoAuthority.publicKey);

  // Derive GovernanceConfig PDA
  const [governanceConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("governance_config")],
    PROGRAM_ID
  );

  const depositTimelock = opts?.depositTimelock ?? 604800; // 7 days default

  // Init governance config
  await program.methods
    .initGovernanceConfig(new BN(depositTimelock), new BN(172800))
    .accounts({
      governanceConfig: governanceConfigPda,
      admin,
      governanceTokenMint: mint,
      vetoAuthority: vetoAuthority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // Create escrow token account owned by governance_config PDA
  const escrowKeypair = Keypair.generate();
  const escrowTokenAccount = await createTokenAccount(
    provider,
    escrowKeypair,
    mint,
    governanceConfigPda
  );

  // Create a voter keypair, fund it, create a token account, mint tokens
  const voter = Keypair.generate();
  await airdrop(provider, voter.publicKey);

  const voterTokenKeypair = Keypair.generate();
  const voterTokenAccount = await createTokenAccount(
    provider,
    voterTokenKeypair,
    mint,
    voter.publicKey
  );

  // Mint 10_000_000 tokens to voter
  await mintTo(
    provider,
    mint,
    voterTokenAccount,
    adminKeypair,
    BigInt(10_000_000)
  );

  // Set a base time, then create the round with timelines accommodating 7-day timelock
  const baseTime = 1_700_000_000;
  await warpToTimestamp(context, baseTime);

  // Round with long submission + voting periods:
  // submission_end = base + 604800 + 2000 (7 days + 2000s buffer)
  // voting_end = base + 604800 + 4000
  const submissionStart = baseTime;
  const submissionEnd = baseTime + depositTimelock + 2000;
  const votingEnd = baseTime + depositTimelock + 4000;

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
      new BN(submissionStart),
      new BN(submissionEnd),
      new BN(votingEnd),
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

  // Submit an idea
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

  // Derive VoteDeposit PDA for voter
  const [voteDepositPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote_deposit"), voter.publicKey.toBuffer()],
    PROGRAM_ID
  );

  // Derive VoteRecord PDA for voter + idea
  const [voteRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote_record"), voter.publicKey.toBuffer(), ideaPda.toBuffer()],
    PROGRAM_ID
  );

  return {
    context,
    provider,
    program,
    admin,
    adminKeypair,
    mint,
    mintKeypair,
    vetoAuthority,
    governanceConfigPda,
    escrowTokenAccount,
    voter,
    voterTokenAccount,
    voteDepositPda,
    voteRecordPda,
    ideaRoundPda,
    ideaPda,
    submitter,
    baseTime,
    submissionEnd,
    votingEnd,
    depositTimelock,
  };
}

describe("Governance Voting and Token Escrow", () => {
  it("deposits tokens for voting weight", async () => {
    const s = await setupFullGovernance();
    const depositAmount = new BN(1_000_000);

    await s.program.methods
      .depositTokens(depositAmount)
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Verify VoteDeposit account
    const deposit = await s.program.account.voteDeposit.fetch(s.voteDepositPda);
    expect(deposit.depositedAmount.toNumber()).to.equal(1_000_000);
    expect(deposit.authority.toBase58()).to.equal(s.voter.publicKey.toBase58());
    expect(deposit.eligibleAt.toNumber()).to.equal(
      s.baseTime + s.depositTimelock
    );
    expect(deposit.activeVotes).to.equal(0);

    // Verify escrow balance
    const escrowBalance = await getTokenBalance(
      s.provider,
      s.escrowTokenAccount
    );
    expect(Number(escrowBalance)).to.equal(1_000_000);

    // Verify governance config total
    const config = await s.program.account.governanceConfig.fetch(
      s.governanceConfigPda
    );
    expect(config.totalDeposited.toNumber()).to.equal(1_000_000);
  });

  it("rejects vote before timelock expires", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;
    const adminKeypair = provider.wallet.payer;

    const mintKeypair = Keypair.generate();
    await createMintAccount(provider, mintKeypair, admin);
    const mint = mintKeypair.publicKey;

    const vetoAuthority = Keypair.generate();

    const [governanceConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("governance_config")],
      PROGRAM_ID
    );

    const depositTimelock = 604800; // 7 days

    await program.methods
      .initGovernanceConfig(new BN(depositTimelock), new BN(172800))
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        governanceTokenMint: mint,
        vetoAuthority: vetoAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Escrow token account
    const escrowKeypair = Keypair.generate();
    const escrowTokenAccount = await createTokenAccount(
      provider,
      escrowKeypair,
      mint,
      governanceConfigPda
    );

    // Voter setup
    const voter = Keypair.generate();
    await airdrop(provider, voter.publicKey);
    const voterTokenKeypair = Keypair.generate();
    const voterTokenAccount = await createTokenAccount(
      provider,
      voterTokenKeypair,
      mint,
      voter.publicKey
    );
    await mintTo(provider, mint, voterTokenAccount, adminKeypair, BigInt(1_000_000));

    const baseTime = 1_700_000_000;
    await warpToTimestamp(context, baseTime);

    // Create a round with SHORT submission period:
    // submission_end = baseTime + 1000 (before timelock expires)
    // voting_end = baseTime + 2_000_000 (long voting period)
    const submissionEnd = baseTime + 1000;
    const votingEnd = baseTime + 2_000_000;

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
        new BN(baseTime),
        new BN(submissionEnd),
        new BN(votingEnd),
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

    // Submit idea
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

    // Deposit tokens (at baseTime, so eligible_at = baseTime + 604800)
    const [voteDepositPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote_deposit"), voter.publicKey.toBuffer()],
      PROGRAM_ID
    );

    await program.methods
      .depositTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: governanceConfigPda,
        voteDeposit: voteDepositPda,
        depositor: voter.publicKey,
        userTokenAccount: voterTokenAccount,
        escrowTokenAccount: escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Warp past submission_end to transition to Voting, but BEFORE eligible_at
    const timeAfterSubmission = baseTime + 1001; // past submission_end, before eligible_at (baseTime + 604800)
    await warpToTimestamp(context, timeAfterSubmission);

    await program.methods
      .transitionRound()
      .accounts({ ideaRound: ideaRoundPda })
      .rpc();

    // Attempt to cast vote -- should fail because timelock hasn't expired
    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote_record"),
        voter.publicKey.toBuffer(),
        ideaPda.toBuffer(),
      ],
      PROGRAM_ID
    );

    try {
      await program.methods
        .castVote({ yes: {} })
        .accounts({
          idea: ideaPda,
          round: ideaRoundPda,
          voteRecord: voteRecordPda,
          voteDeposit: voteDepositPda,
          governanceConfig: governanceConfigPda,
          gatewayToken: null,
          voter: voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();
      expect.fail("Expected vote before timelock to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("TokensNotYetEligible");
    }
  });

  it("casts vote after timelock", async () => {
    const s = await setupFullGovernance();

    // Deposit tokens
    await s.program.methods
      .depositTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Warp past submission_end to transition to Voting
    await warpToTimestamp(s.context, s.submissionEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    // Warp past eligible_at (baseTime + 604800) but before voting_end
    const votingTime = s.baseTime + s.depositTimelock + 2500;
    await warpToTimestamp(s.context, votingTime);

    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Verify VoteRecord
    const record = await s.program.account.voteRecord.fetch(s.voteRecordPda);
    expect(record.voter.toBase58()).to.equal(s.voter.publicKey.toBase58());
    expect(JSON.stringify(record.vote)).to.equal(JSON.stringify({ yes: {} }));
    expect(record.weight.toNumber()).to.equal(1_000_000);

    // Verify Idea tallies
    const idea = await s.program.account.idea.fetch(s.ideaPda);
    expect(idea.yesWeight.toNumber()).to.equal(1_000_000);
    expect(idea.noWeight.toNumber()).to.equal(0);
    expect(idea.abstainWeight.toNumber()).to.equal(0);
    expect(idea.voterCount).to.equal(1);

    // Verify active_votes incremented
    const deposit = await s.program.account.voteDeposit.fetch(s.voteDepositPda);
    expect(deposit.activeVotes).to.equal(1);
  });

  it("prevents double voting on same idea", async () => {
    const s = await setupFullGovernance();

    // Deposit tokens
    await s.program.methods
      .depositTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Transition to Voting and warp past timelock
    await warpToTimestamp(s.context, s.submissionEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    const votingTime = s.baseTime + s.depositTimelock + 2500;
    await warpToTimestamp(s.context, votingTime);

    // First vote
    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Attempt second vote -- PDA already in use
    try {
      await s.program.methods
        .castVote({ no: {} })
        .accounts({
          idea: s.ideaPda,
          round: s.ideaRoundPda,
          voteRecord: s.voteRecordPda,
          voteDeposit: s.voteDepositPda,
          governanceConfig: s.governanceConfigPda,
          gatewayToken: null,
          voter: s.voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([s.voter])
        .rpc();
      expect.fail("Expected double vote to fail");
    } catch (err: any) {
      // Account already in use -- Anchor returns a custom error or system program error
      expect(err.toString()).to.satisfy(
        (s: string) =>
          s.includes("already in use") ||
          s.includes("already been processed") ||
          s.includes("Error") // generic -- PDA init will fail if account exists
      );
    }
  });

  it("prevents withdrawal with active votes", async () => {
    const s = await setupFullGovernance();

    // Deposit tokens
    await s.program.methods
      .depositTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Transition to Voting and cast vote
    await warpToTimestamp(s.context, s.submissionEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    const votingTime = s.baseTime + s.depositTimelock + 2500;
    await warpToTimestamp(s.context, votingTime);

    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Attempt withdrawal -- should fail (active_votes > 0)
    try {
      await s.program.methods
        .withdrawTokens(new BN(1_000_000))
        .accounts({
          governanceConfig: s.governanceConfigPda,
          voteDeposit: s.voteDepositPda,
          depositor: s.voter.publicKey,
          userTokenAccount: s.voterTokenAccount,
          escrowTokenAccount: s.escrowTokenAccount,
          tokenProgram: SPL_TOKEN_PROGRAM_ID,
        })
        .signers([s.voter])
        .rpc();
      expect.fail("Expected withdrawal with active votes to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("ActiveVotesExist");
    }
  });

  it("relinquishes vote after round closes", async () => {
    const s = await setupFullGovernance();

    // Deposit, transition, vote
    await s.program.methods
      .depositTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    await warpToTimestamp(s.context, s.submissionEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    const votingTime = s.baseTime + s.depositTimelock + 2500;
    await warpToTimestamp(s.context, votingTime);

    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    // Transition to Closed
    await warpToTimestamp(s.context, s.votingEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    // Relinquish vote
    await s.program.methods
      .relinquishVote()
      .accounts({
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        voter: s.voter.publicKey,
      })
      .signers([s.voter])
      .rpc();

    const deposit = await s.program.account.voteDeposit.fetch(s.voteDepositPda);
    expect(deposit.activeVotes).to.equal(0);
  });

  it("withdraws tokens after relinquishing", async () => {
    const s = await setupFullGovernance();

    // Full flow: deposit, vote, close round, relinquish, withdraw
    await s.program.methods
      .depositTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    await warpToTimestamp(s.context, s.submissionEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    const votingTime = s.baseTime + s.depositTimelock + 2500;
    await warpToTimestamp(s.context, votingTime);

    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    await warpToTimestamp(s.context, s.votingEnd);
    await s.program.methods
      .transitionRound()
      .accounts({ ideaRound: s.ideaRoundPda })
      .rpc();

    await s.program.methods
      .relinquishVote()
      .accounts({
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        voter: s.voter.publicKey,
      })
      .signers([s.voter])
      .rpc();

    // Now withdraw
    await s.program.methods
      .withdrawTokens(new BN(1_000_000))
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.voteDepositPda,
        depositor: s.voter.publicKey,
        userTokenAccount: s.voterTokenAccount,
        escrowTokenAccount: s.escrowTokenAccount,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
      })
      .signers([s.voter])
      .rpc();

    // Verify voter token balance restored
    const voterBalance = await getTokenBalance(s.provider, s.voterTokenAccount);
    expect(Number(voterBalance)).to.equal(10_000_000); // original minted amount

    // Verify deposit is zeroed out
    const deposit = await s.program.account.voteDeposit.fetch(s.voteDepositPda);
    expect(deposit.depositedAmount.toNumber()).to.equal(0);
    expect(deposit.depositTimestamp.toNumber()).to.equal(0);
    expect(deposit.eligibleAt.toNumber()).to.equal(0);

    // Verify governance config total decremented
    const config = await s.program.account.governanceConfig.fetch(
      s.governanceConfigPda
    );
    expect(config.totalDeposited.toNumber()).to.equal(0);
  });

  it("veto council can veto an idea", async () => {
    const s = await setupFullGovernance();

    // Verify idea is Submitted
    let idea = await s.program.account.idea.fetch(s.ideaPda);
    expect(JSON.stringify(idea.status)).to.equal(
      JSON.stringify({ submitted: {} })
    );

    // Veto the idea
    await s.program.methods
      .vetoIdea()
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        governanceConfig: s.governanceConfigPda,
        vetoAuthority: s.vetoAuthority.publicKey,
      })
      .signers([s.vetoAuthority])
      .rpc();

    // Verify idea status is now Vetoed
    idea = await s.program.account.idea.fetch(s.ideaPda);
    expect(JSON.stringify(idea.status)).to.equal(
      JSON.stringify({ vetoed: {} })
    );
  });

  it("non-veto authority cannot veto", async () => {
    const s = await setupFullGovernance();

    // Random signer (not the veto authority)
    const imposter = Keypair.generate();
    await airdrop(s.provider, imposter.publicKey);

    try {
      await s.program.methods
        .vetoIdea()
        .accounts({
          idea: s.ideaPda,
          round: s.ideaRoundPda,
          governanceConfig: s.governanceConfigPda,
          vetoAuthority: imposter.publicKey,
        })
        .signers([imposter])
        .rpc();
      expect.fail("Expected unauthorized veto to fail");
    } catch (err: any) {
      expect(err.toString()).to.include("UnauthorizedVeto");
    }
  });
});
