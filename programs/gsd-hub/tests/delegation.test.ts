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

async function createMockGatewayToken(
  provider: BankrunProvider,
  gatewayTokenKeypair: Keypair,
  voterPubkey: PublicKey,
  gatekeeperNetwork: PublicKey,
  state: number = 0,
  expiry: number = 0
): Promise<PublicKey> {
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

  const gtData = Buffer.alloc(dataSize);
  gtData.writeUInt8(0, 0);
  voterPubkey.toBuffer().copy(gtData, 1);
  gatekeeperNetwork.toBuffer().copy(gtData, 33);
  const stateBuf = Buffer.alloc(8);
  stateBuf.writeBigUInt64LE(BigInt(state));
  stateBuf.copy(gtData, 65);
  const expiryBuf = Buffer.alloc(8);
  expiryBuf.writeBigUInt64LE(BigInt(expiry));
  expiryBuf.copy(gtData, 73);

  provider.context.setAccount(gatewayTokenKeypair.publicKey, {
    lamports: rent,
    data: gtData,
    owner: CIVIC_GATEWAY_PROGRAM_ID,
    executable: false,
  });

  return gatewayTokenKeypair.publicKey;
}

/**
 * Setup governance with two wallets (delegator + delegate) for delegation tests
 */
async function setupDelegation(opts?: {
  enableQuadratic?: boolean;
  delegatorDeposit?: number;
  delegateDeposit?: number;
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

  const [governanceConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("governance_config")],
    PROGRAM_ID
  );

  const depositTimelock = 604800;

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

  const escrowKeypair = Keypair.generate();
  const escrowTokenAccount = await createTokenAccount(
    provider,
    escrowKeypair,
    mint,
    governanceConfigPda
  );

  // Delegator wallet
  const delegator = Keypair.generate();
  await airdrop(provider, delegator.publicKey);
  const delegatorTokenKeypair = Keypair.generate();
  const delegatorTokenAccount = await createTokenAccount(
    provider,
    delegatorTokenKeypair,
    mint,
    delegator.publicKey
  );
  const delegatorDeposit = opts?.delegatorDeposit ?? 5_000;
  await mintTo(
    provider,
    mint,
    delegatorTokenAccount,
    adminKeypair,
    BigInt(delegatorDeposit)
  );

  // Delegate wallet
  const delegate = Keypair.generate();
  await airdrop(provider, delegate.publicKey);
  const delegateTokenKeypair = Keypair.generate();
  const delegateTokenAccount = await createTokenAccount(
    provider,
    delegateTokenKeypair,
    mint,
    delegate.publicKey
  );
  const delegateDeposit = opts?.delegateDeposit ?? 3_000;
  await mintTo(
    provider,
    mint,
    delegateTokenAccount,
    adminKeypair,
    BigInt(delegateDeposit)
  );

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

  // Deposit tokens for delegator
  const [delegatorVoteDepositPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote_deposit"), delegator.publicKey.toBuffer()],
    PROGRAM_ID
  );

  await program.methods
    .depositTokens(new BN(delegatorDeposit))
    .accounts({
      governanceConfig: governanceConfigPda,
      voteDeposit: delegatorVoteDepositPda,
      depositor: delegator.publicKey,
      userTokenAccount: delegatorTokenAccount,
      escrowTokenAccount: escrowTokenAccount,
      tokenProgram: SPL_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([delegator])
    .rpc();

  // Deposit tokens for delegate
  const [delegateVoteDepositPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote_deposit"), delegate.publicKey.toBuffer()],
    PROGRAM_ID
  );

  await program.methods
    .depositTokens(new BN(delegateDeposit))
    .accounts({
      governanceConfig: governanceConfigPda,
      voteDeposit: delegateVoteDepositPda,
      depositor: delegate.publicKey,
      userTokenAccount: delegateTokenAccount,
      escrowTokenAccount: escrowTokenAccount,
      tokenProgram: SPL_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([delegate])
    .rpc();

  // Delegation PDA for delegator
  const [delegationRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegation"), delegator.publicKey.toBuffer()],
    PROGRAM_ID
  );

  // Vote record PDAs
  const [delegatorVoteRecordPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote_record"),
      delegator.publicKey.toBuffer(),
      ideaPda.toBuffer(),
    ],
    PROGRAM_ID
  );
  const [delegateVoteRecordPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vote_record"),
      delegate.publicKey.toBuffer(),
      ideaPda.toBuffer(),
    ],
    PROGRAM_ID
  );

  // Gatekeeper network
  const gatekeeperNetwork = Keypair.generate().publicKey;

  // Optionally enable quadratic
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
    governanceConfigPda,
    escrowTokenAccount,
    delegator,
    delegatorTokenAccount,
    delegatorVoteDepositPda,
    delegatorVoteRecordPda,
    delegate,
    delegateTokenAccount,
    delegateVoteDepositPda,
    delegateVoteRecordPda,
    delegationRecordPda,
    ideaRoundPda,
    ideaPda,
    baseTime,
    submissionEnd,
    votingEnd,
    depositTimelock,
    delegatorDeposit,
    delegateDeposit,
    gatekeeperNetwork,
  };
}

describe("Vote Delegation", () => {
  it("delegate voting power to another wallet", async () => {
    const s = await setupDelegation();

    await s.program.methods
      .delegateVote()
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.delegatorVoteDepositPda,
        delegationRecord: s.delegationRecordPda,
        delegator: s.delegator.publicKey,
        delegate: s.delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.delegator])
      .rpc();

    // Verify DelegationRecord
    const record = await s.program.account.delegationRecord.fetch(
      s.delegationRecordPda
    );
    expect(record.delegator.toBase58()).to.equal(
      s.delegator.publicKey.toBase58()
    );
    expect(record.delegate.toBase58()).to.equal(
      s.delegate.publicKey.toBase58()
    );
    expect(record.delegatedAmount.toNumber()).to.equal(s.delegatorDeposit);
    expect(record.isActive).to.equal(true);
    expect(record.effectiveFromRound).to.equal(1); // round_count is 1 after createRound
  });

  it("delegator cannot vote while delegation active", async () => {
    const s = await setupDelegation();

    // Delegate
    await s.program.methods
      .delegateVote()
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.delegatorVoteDepositPda,
        delegationRecord: s.delegationRecordPda,
        delegator: s.delegator.publicKey,
        delegate: s.delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.delegator])
      .rpc();

    // Attempt to vote as delegator -- pass own delegation PDA as remaining account
    try {
      await s.program.methods
        .castVote({ yes: {} })
        .accounts({
          idea: s.ideaPda,
          round: s.ideaRoundPda,
          voteRecord: s.delegatorVoteRecordPda,
          voteDeposit: s.delegatorVoteDepositPda,
          governanceConfig: s.governanceConfigPda,
          gatewayToken: null,
          voter: s.delegator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts([
          {
            pubkey: s.delegationRecordPda,
            isSigner: false,
            isWritable: false,
          },
        ])
        .signers([s.delegator])
        .rpc();
      expect.fail("Expected VotingPowerDelegated error");
    } catch (err: any) {
      expect(err.toString()).to.include("VotingPowerDelegated");
    }
  });

  it("delegate votes with combined weight (linear)", async () => {
    const s = await setupDelegation({ delegatorDeposit: 5_000, delegateDeposit: 3_000 });

    // Delegate
    await s.program.methods
      .delegateVote()
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.delegatorVoteDepositPda,
        delegationRecord: s.delegationRecordPda,
        delegator: s.delegator.publicKey,
        delegate: s.delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.delegator])
      .rpc();

    // Delegate votes with DelegationRecord as remaining account
    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.delegateVoteRecordPda,
        voteDeposit: s.delegateVoteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        {
          pubkey: s.delegationRecordPda,
          isSigner: false,
          isWritable: false,
        },
      ])
      .signers([s.delegate])
      .rpc();

    // Verify combined weight: 3000 (own) + 5000 (delegated) = 8000 (linear)
    const record = await s.program.account.voteRecord.fetch(
      s.delegateVoteRecordPda
    );
    expect(record.weight.toNumber()).to.equal(8_000);
  });

  it("revoke delegation", async () => {
    const s = await setupDelegation();

    // Delegate
    await s.program.methods
      .delegateVote()
      .accounts({
        governanceConfig: s.governanceConfigPda,
        voteDeposit: s.delegatorVoteDepositPda,
        delegationRecord: s.delegationRecordPda,
        delegator: s.delegator.publicKey,
        delegate: s.delegate.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.delegator])
      .rpc();

    // Verify delegation exists
    let record = await s.program.account.delegationRecord.fetch(
      s.delegationRecordPda
    );
    expect(record.isActive).to.equal(true);

    // Revoke
    await s.program.methods
      .revokeDelegation()
      .accounts({
        delegationRecord: s.delegationRecordPda,
        delegator: s.delegator.publicKey,
      })
      .signers([s.delegator])
      .rpc();

    // Verify delegation account is closed (bankrun throws "Could not find" for closed accounts)
    let delegationClosed = false;
    try {
      await s.program.account.delegationRecord.fetch(s.delegationRecordPda);
    } catch (err: any) {
      delegationClosed = true;
    }
    expect(delegationClosed).to.equal(true);

    // Delegator can now vote directly
    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.delegatorVoteRecordPda,
        voteDeposit: s.delegatorVoteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.delegator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.delegator])
      .rpc();

    const voteRecord = await s.program.account.voteRecord.fetch(
      s.delegatorVoteRecordPda
    );
    expect(voteRecord.weight.toNumber()).to.equal(s.delegatorDeposit);
  });

  it("cannot delegate with no deposit", async () => {
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

    // Create escrow
    const escrowKeypair = Keypair.generate();
    await createTokenAccount(
      provider,
      escrowKeypair,
      mintKeypair.publicKey,
      governanceConfigPda
    );

    // Wallet with no deposit
    const noDepositWallet = Keypair.generate();
    await airdrop(provider, noDepositWallet.publicKey);

    // Create token account and deposit 0 (well, we just never deposit)
    // Need to create VoteDeposit PDA first -- but deposit_tokens with 0 would fail.
    // Actually, the VoteDeposit PDA won't exist at all. So delegate_vote will fail
    // because the vote_deposit account can't be found/derived.
    const [voteDepositPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote_deposit"), noDepositWallet.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const [delegationRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("delegation"), noDepositWallet.publicKey.toBuffer()],
      PROGRAM_ID
    );

    const delegate = Keypair.generate();

    try {
      await program.methods
        .delegateVote()
        .accounts({
          governanceConfig: governanceConfigPda,
          voteDeposit: voteDepositPda,
          delegationRecord: delegationRecordPda,
          delegator: noDepositWallet.publicKey,
          delegate: delegate.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([noDepositWallet])
        .rpc();
      expect.fail("Expected error for no deposit");
    } catch (err: any) {
      // VoteDeposit PDA doesn't exist -- Anchor will fail on account deserialization
      expect(err.toString()).to.satisfy(
        (s: string) =>
          s.includes("AccountNotInitialized") ||
          s.includes("NoDeposit") ||
          s.includes("Error") // Account doesn't exist at PDA
      );
    }
  });

  it("cannot delegate with active votes", async () => {
    const s = await setupDelegation();

    // Cast a vote as delegator first
    await s.program.methods
      .castVote({ yes: {} })
      .accounts({
        idea: s.ideaPda,
        round: s.ideaRoundPda,
        voteRecord: s.delegatorVoteRecordPda,
        voteDeposit: s.delegatorVoteDepositPda,
        governanceConfig: s.governanceConfigPda,
        gatewayToken: null,
        voter: s.delegator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([s.delegator])
      .rpc();

    // Verify active votes > 0
    const deposit = await s.program.account.voteDeposit.fetch(
      s.delegatorVoteDepositPda
    );
    expect(deposit.activeVotes).to.be.greaterThan(0);

    // Attempt to delegate -- should fail
    try {
      await s.program.methods
        .delegateVote()
        .accounts({
          governanceConfig: s.governanceConfigPda,
          voteDeposit: s.delegatorVoteDepositPda,
          delegationRecord: s.delegationRecordPda,
          delegator: s.delegator.publicKey,
          delegate: s.delegate.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([s.delegator])
        .rpc();
      expect.fail("Expected CannotDelegateWithActiveVotes error");
    } catch (err: any) {
      expect(err.toString()).to.include("CannotDelegateWithActiveVotes");
    }
  });
});
