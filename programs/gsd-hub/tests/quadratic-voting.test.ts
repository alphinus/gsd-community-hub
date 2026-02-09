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

const CIVIC_GATEWAY_PROGRAM_ID = new PublicKey(
  "gatbGF9DvLAw3kWyn1EmH5Nh1Sqp8sTukF7yaQpSc71"
);

const MINT_SIZE = 82;
const TOKEN_ACCOUNT_SIZE = 165;

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
  const data = Buffer.alloc(67);
  data.writeUInt8(0, 0);
  data.writeUInt8(decimals, 1);
  mintAuthority.toBuffer().copy(data, 2);
  data.writeUInt8(1, 34);
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

async function mintTo(
  provider: BankrunProvider,
  mint: PublicKey,
  destination: PublicKey,
  mintAuthority: Keypair,
  amount: bigint
): Promise<void> {
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
 * Create a mock Civic Gateway Token account for testing sybil gate.
 * Layout: version[1] | owner_pubkey[32] | gatekeeper_network[32] | state[8] | expiry[8] = 81 bytes
 */
async function createMockGatewayToken(
  provider: BankrunProvider,
  gatewayTokenKeypair: Keypair,
  voterPubkey: PublicKey,
  gatekeeperNetwork: PublicKey,
  state: number = 0, // 0 = Active
  expiry: number = 0 // 0 = no expiry
): Promise<PublicKey> {
  // Allocate account owned by Civic Gateway Program
  const dataSize = 81;
  const rent =
    await provider.connection.getMinimumBalanceForRentExemption(dataSize);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: provider.wallet.publicKey,
    newAccountPubkey: gatewayTokenKeypair.publicKey,
    lamports: rent,
    space: dataSize,
    programId: CIVIC_GATEWAY_PROGRAM_ID,
  });

  const tx = new Transaction().add(createAccountIx);
  const recentBlockhash = provider.context.lastBlockhash;
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = provider.wallet.publicKey;
  tx.sign(provider.wallet.payer, gatewayTokenKeypair);
  await provider.context.banksClient.processTransaction(tx);

  // Write gateway token data directly into the account
  const accountInfo = await provider.connection.getAccountInfo(
    gatewayTokenKeypair.publicKey
  );
  if (!accountInfo) throw new Error("Gateway token account not found");

  const gtData = Buffer.alloc(dataSize);
  gtData.writeUInt8(0, 0); // version = 0
  voterPubkey.toBuffer().copy(gtData, 1); // owner/subject at [1..33]
  gatekeeperNetwork.toBuffer().copy(gtData, 33); // gatekeeper_network at [33..65]
  // state (u64 LE) at [65..73]
  const stateBuf = Buffer.alloc(8);
  stateBuf.writeBigUInt64LE(BigInt(state));
  stateBuf.copy(gtData, 65);
  // expiry (u64 LE) at [73..81]
  const expiryBuf = Buffer.alloc(8);
  expiryBuf.writeBigUInt64LE(BigInt(expiry));
  expiryBuf.copy(gtData, 73);

  // Use setAccount to overwrite the gateway token data
  provider.context.setAccount(gatewayTokenKeypair.publicKey, {
    lamports: rent,
    data: gtData,
    owner: CIVIC_GATEWAY_PROGRAM_ID,
    executable: false,
  });

  return gatewayTokenKeypair.publicKey;
}

/**
 * Full governance setup: config + round + idea + voter deposit + optional quadratic enable
 */
async function setupGovernanceWithQuadratic(opts?: {
  enableQuadratic?: boolean;
  depositAmount?: number;
  depositTimelock?: number;
}) {
  const context = await createContext();
  const provider = new BankrunProvider(context);
  const program = new Program<GsdHub>(IDL as GsdHub, provider);
  const admin = provider.wallet.publicKey;
  const adminKeypair = provider.wallet.payer;

  const mintKeypair = Keypair.generate();
  await createMintAccount(provider, mintKeypair, admin);
  const mint = mintKeypair.publicKey;

  const vetoAuthority = Keypair.generate();
  await airdrop(provider, vetoAuthority.publicKey);

  const [governanceConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("governance_config")],
    PROGRAM_ID
  );

  const depositTimelock = opts?.depositTimelock ?? 604800;

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

  // Create escrow
  const escrowKeypair = Keypair.generate();
  const escrowTokenAccount = await createTokenAccount(
    provider,
    escrowKeypair,
    mint,
    governanceConfigPda
  );

  // Create voter
  const voter = Keypair.generate();
  await airdrop(provider, voter.publicKey);
  const voterTokenKeypair = Keypair.generate();
  const voterTokenAccount = await createTokenAccount(
    provider,
    voterTokenKeypair,
    mint,
    voter.publicKey
  );
  const depositAmount = opts?.depositAmount ?? 10_000;
  await mintTo(
    provider,
    mint,
    voterTokenAccount,
    adminKeypair,
    BigInt(depositAmount)
  );

  // Set time, create round
  const baseTime = 1_700_000_000;
  await warpToTimestamp(context, baseTime);

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

  // PDAs
  const [voteDepositPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote_deposit"), voter.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const [voteRecordPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote_record"),
      voter.publicKey.toBuffer(),
      ideaPda.toBuffer(),
    ],
    PROGRAM_ID
  );

  // Deposit tokens
  await program.methods
    .depositTokens(new BN(depositAmount))
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

  // Gatekeeper network for Civic Pass
  const gatekeeperNetwork = Keypair.generate().publicKey;

  // Optionally enable quadratic voting
  if (opts?.enableQuadratic) {
    await program.methods
      .updateGovernanceConfig(true, gatekeeperNetwork, 180)
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // Transition to voting + warp past timelock
  await warpToTimestamp(context, submissionEnd);
  await program.methods
    .transitionRound()
    .accounts({ ideaRound: ideaRoundPda })
    .rpc();

  const votingTime = baseTime + depositTimelock + 2500;
  await warpToTimestamp(context, votingTime);

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
    depositAmount,
    gatekeeperNetwork,
  };
}

describe("Quadratic Voting and Sybil Gate", () => {
  it("linear voting weight when quadratic disabled", async () => {
    const s = await setupGovernanceWithQuadratic({
      enableQuadratic: false,
      depositAmount: 1_000_000,
    });

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

    const record = await s.program.account.voteRecord.fetch(s.voteRecordPda);
    expect(record.weight.toNumber()).to.equal(1_000_000); // linear -- full deposit amount
  });

  it("quadratic voting weight is sqrt of deposited tokens", async () => {
    const s = await setupGovernanceWithQuadratic({
      enableQuadratic: true,
      depositAmount: 10_000,
    });

    // Create mock gateway token
    const gtKeypair = Keypair.generate();
    const gtPubkey = await createMockGatewayToken(
      s.provider,
      gtKeypair,
      s.voter.publicKey,
      s.gatekeeperNetwork,
      0, // Active
      0 // No expiry
    );

    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.voteRecordPda,
        voteDeposit: s.voteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: gtPubkey,
        voter: s.voter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.voter])
      .rpc();

    const record = await s.program.account.voteRecord.fetch(s.voteRecordPda);
    // isqrt(10000) = 100
    expect(record.weight.toNumber()).to.equal(100);
  });

  it("quadratic voting rejects without gateway token", async () => {
    const s = await setupGovernanceWithQuadratic({
      enableQuadratic: true,
      depositAmount: 10_000,
    });

    try {
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
      expect.fail("Expected HumanVerificationRequired error");
    } catch (err: any) {
      expect(err.toString()).to.include("HumanVerificationRequired");
    }
  });

  it("quadratic voting rejects wrong gateway token owner", async () => {
    const s = await setupGovernanceWithQuadratic({
      enableQuadratic: true,
      depositAmount: 10_000,
    });

    // Create gateway token with wrong subject (not the voter)
    const wrongSubject = Keypair.generate().publicKey;
    const gtKeypair = Keypair.generate();
    const gtPubkey = await createMockGatewayToken(
      s.provider,
      gtKeypair,
      wrongSubject, // Wrong owner
      s.gatekeeperNetwork,
      0,
      0
    );

    try {
      await s.program.methods
        .castVote({ yes: {} })
        .accounts({
          idea: s.ideaPda,
          round: s.ideaRoundPda,
          voteRecord: s.voteRecordPda,
          voteDeposit: s.voteDepositPda,
          governanceConfig: s.governanceConfigPda,
          gatewayToken: gtPubkey,
          voter: s.voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([s.voter])
        .rpc();
      expect.fail("Expected GatewayTokenOwnerMismatch error");
    } catch (err: any) {
      expect(err.toString()).to.include("GatewayTokenOwnerMismatch");
    }
  });

  it("quadratic voting rejects expired gateway token", async () => {
    const s = await setupGovernanceWithQuadratic({
      enableQuadratic: true,
      depositAmount: 10_000,
    });

    // Create gateway token with expiry in the past
    const gtKeypair = Keypair.generate();
    const pastExpiry = s.baseTime - 1000; // Well in the past
    const gtPubkey = await createMockGatewayToken(
      s.provider,
      gtKeypair,
      s.voter.publicKey,
      s.gatekeeperNetwork,
      0, // Active
      pastExpiry
    );

    try {
      await s.program.methods
        .castVote({ yes: {} })
        .accounts({
          idea: s.ideaPda,
          round: s.ideaRoundPda,
          voteRecord: s.voteRecordPda,
          voteDeposit: s.voteDepositPda,
          governanceConfig: s.governanceConfigPda,
          gatewayToken: gtPubkey,
          voter: s.voter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([s.voter])
        .rpc();
      expect.fail("Expected GatewayTokenExpired error");
    } catch (err: any) {
      expect(err.toString()).to.include("GatewayTokenExpired");
    }
  });

  it("update_governance_config sets new fields", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

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

    // Verify initial defaults
    let config = await program.account.governanceConfig.fetch(
      governanceConfigPda
    );
    expect(config.quadraticVotingEnabled).to.equal(false);
    expect(config.decayHalfLifeDays).to.equal(180);

    // Update
    const newNetwork = Keypair.generate().publicKey;
    await program.methods
      .updateGovernanceConfig(true, newNetwork, 90)
      .accounts({
        governanceConfig: governanceConfigPda,
        admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify update
    config = await program.account.governanceConfig.fetch(governanceConfigPda);
    expect(config.quadraticVotingEnabled).to.equal(true);
    expect(config.civicGatekeeperNetwork.toBase58()).to.equal(
      newNetwork.toBase58()
    );
    expect(config.decayHalfLifeDays).to.equal(90);
  });

  it("update_governance_config rejects non-admin", async () => {
    const context = await createContext();
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const admin = provider.wallet.publicKey;

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

    // Try to update as non-admin
    const imposter = Keypair.generate();
    await airdrop(provider, imposter.publicKey);

    try {
      await program.methods
        .updateGovernanceConfig(true, Keypair.generate().publicKey, 90)
        .accounts({
          governanceConfig: governanceConfigPda,
          admin: imposter.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([imposter])
        .rpc();
      expect.fail("Expected UnauthorizedAdmin error");
    } catch (err: any) {
      expect(err.toString()).to.include("UnauthorizedAdmin");
    }
  });
});
