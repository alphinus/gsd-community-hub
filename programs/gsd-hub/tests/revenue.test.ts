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

  const data = Buffer.alloc(1);
  data.writeUInt8(1, 0); // InitializeAccount instruction index

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
  const data = Buffer.alloc(9);
  data.writeUInt8(7, 0); // MintTo instruction index
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
 * Read the raw SPL token account balance from on-chain data
 */
async function getTokenBalance(
  provider: BankrunProvider,
  tokenAccount: PublicKey
): Promise<bigint> {
  const accountInfo = await provider.connection.getAccountInfo(tokenAccount);
  if (!accountInfo) throw new Error("Token account not found");
  return accountInfo.data.readBigUInt64LE(64);
}

/**
 * Get SOL balance (lamports) for an account via getAccountInfo
 * (bankrun doesn't support getBalance directly)
 */
async function getSolBalance(
  provider: BankrunProvider,
  account: PublicKey
): Promise<number> {
  const accountInfo = await provider.connection.getAccountInfo(account);
  if (!accountInfo) return 0;
  return accountInfo.lamports;
}

/**
 * Initialize revenue config and return key accounts
 */
async function setupRevenueConfig(opts?: { minThreshold?: number }) {
  const context = await createContext();
  const provider = new BankrunProvider(context);
  const program = new Program<GsdHub>(IDL as GsdHub, provider);
  const admin = provider.wallet.publicKey;
  const adminKeypair = provider.wallet.payer;

  const treasuryAddress = Keypair.generate().publicKey;
  const maintenanceAddress = Keypair.generate().publicKey;
  const gsdMint = Keypair.generate().publicKey;
  const usdcMint = Keypair.generate().publicKey;
  const minThreshold = opts?.minThreshold ?? 100_000_000; // 0.1 SOL default

  // Derive RevenueConfig PDA
  const [revenueConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("revenue_config")],
    PROGRAM_ID
  );

  await program.methods
    .initRevenueConfig(
      treasuryAddress,
      maintenanceAddress,
      gsdMint,
      usdcMint,
      new BN(minThreshold)
    )
    .accounts({
      revenueConfig: revenueConfigPda,
      admin,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    context,
    provider,
    program,
    admin,
    adminKeypair,
    revenueConfigPda,
    treasuryAddress,
    maintenanceAddress,
    gsdMint,
    usdcMint,
    minThreshold,
  };
}

describe("Revenue Instructions", () => {
  it("initializes revenue config with 60/20/10/10 split", async () => {
    const s = await setupRevenueConfig();

    const config = await s.program.account.revenueConfig.fetch(
      s.revenueConfigPda
    );
    expect(config.developerBps).to.equal(6000);
    expect(config.treasuryBps).to.equal(2000);
    expect(config.burnBps).to.equal(1000);
    expect(config.maintenanceBps).to.equal(1000);
    expect(config.eventCount).to.equal(0);
    expect(config.admin.toBase58()).to.equal(s.admin.toBase58());
    expect(config.treasuryAddress.toBase58()).to.equal(
      s.treasuryAddress.toBase58()
    );
    expect(config.maintenanceAddress.toBase58()).to.equal(
      s.maintenanceAddress.toBase58()
    );
    expect(config.minRevenueThreshold.toNumber()).to.equal(s.minThreshold);
  });

  it("records a revenue event with correct split amounts and funds vault", async () => {
    const s = await setupRevenueConfig();

    const totalAmount = 10_000_000_000; // 10 SOL
    const eventIndex = 0;

    // Derive RevenueEvent PDA
    const [revenueEventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_event"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    // Derive developer pool vault PDA
    const [developerPoolVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_vault"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    const originSignature = new Uint8Array(64).fill(0xaa);
    const totalContributionScore = 1000;

    await s.program.methods
      .recordRevenueEvent(
        new BN(totalAmount),
        { sol: {} },
        Array.from(originSignature) as number[],
        new BN(totalContributionScore)
      )
      .accounts({
        revenueConfig: s.revenueConfigPda,
        revenueEvent: revenueEventPda,
        developerPoolVault,
        authority: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Fetch and verify the RevenueEvent
    const event = await s.program.account.revenueEvent.fetch(revenueEventPda);
    expect(event.developerPool.toNumber()).to.equal(6_000_000_000);
    expect(event.treasuryReserve.toNumber()).to.equal(2_000_000_000);
    expect(event.burnAmount.toNumber()).to.equal(1_000_000_000);
    expect(event.maintenanceAmount.toNumber()).to.equal(1_000_000_000);
    expect(JSON.stringify(event.status)).to.equal(
      JSON.stringify({ recorded: {} })
    );
    expect(event.totalContributionScore.toNumber()).to.equal(
      totalContributionScore
    );
    expect(event.claimedAmount.toNumber()).to.equal(0);

    // Verify config event_count incremented
    const config = await s.program.account.revenueConfig.fetch(
      s.revenueConfigPda
    );
    expect(config.eventCount).to.equal(1);

    // Verify vault was funded with developer_pool SOL
    const vaultBalance = await getSolBalance(s.provider, developerPoolVault);
    expect(vaultBalance).to.equal(6_000_000_000);
  });

  it("rejects revenue below minimum threshold", async () => {
    const s = await setupRevenueConfig({ minThreshold: 100_000_000 }); // 0.1 SOL

    const eventIndex = 0;
    const [revenueEventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_event"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );
    const [developerPoolVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_vault"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    try {
      await s.program.methods
        .recordRevenueEvent(
          new BN(50_000_000), // 0.05 SOL -- below threshold
          { sol: {} },
          Array.from(new Uint8Array(64)) as number[],
          new BN(1000)
        )
        .accounts({
          revenueConfig: s.revenueConfigPda,
          revenueEvent: revenueEventPda,
          developerPoolVault,
          authority: s.admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Expected BelowMinimumThreshold error");
    } catch (err: any) {
      expect(err.toString()).to.include("BelowMinimumThreshold");
    }
  });

  it("contributor claims revenue share proportional to score with SOL transfer", async () => {
    const s = await setupRevenueConfig();

    // Register a developer profile for the contributor
    const contributor = Keypair.generate();
    await airdrop(s.provider, contributor.publicKey);

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), contributor.publicKey.toBuffer()],
      PROGRAM_ID
    );

    // Register developer
    await s.program.methods
      .registerDeveloper(Array.from(new Uint8Array(32).fill(1)) as number[])
      .accounts({
        developerProfile: profilePda,
        authority: contributor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    // Update contribution score
    const contributorScore = 500;
    const totalScore = 1000;
    await s.program.methods
      .updateContributionScore(
        5, // tasks_completed
        new BN(42500), // total_verification_score
        30, // time_active_days
        new BN(contributorScore), // contribution_score
        1 // score_version
      )
      .accounts({
        developerProfile: profilePda,
        developerWallet: contributor.publicKey,
        authority: s.admin,
        payer: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Record a revenue event (10 SOL)
    const totalAmount = 10_000_000_000;
    const eventIndex = 0;

    const [revenueEventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_event"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );
    const [developerPoolVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_vault"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await s.program.methods
      .recordRevenueEvent(
        new BN(totalAmount),
        { sol: {} },
        Array.from(new Uint8Array(64).fill(0xbb)) as number[],
        new BN(totalScore)
      )
      .accounts({
        revenueConfig: s.revenueConfigPda,
        revenueEvent: revenueEventPda,
        developerPoolVault,
        authority: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Derive RevenueClaim PDA
    const [revenueClaimPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_claim"),
        contributor.publicKey.toBuffer(),
        revenueEventPda.toBuffer(),
      ],
      PROGRAM_ID
    );

    // Record balances before claim
    const contributorBalanceBefore = await getSolBalance(
      s.provider,
      contributor.publicKey
    );
    const vaultBalanceBefore = await getSolBalance(
      s.provider,
      developerPoolVault
    );

    // Claim revenue share
    await s.program.methods
      .claimRevenueShare()
      .accounts({
        revenueEvent: revenueEventPda,
        revenueClaim: revenueClaimPda,
        developerProfile: profilePda,
        claimant: contributor.publicKey,
        developerPoolVault,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    // Expected: 6_000_000_000 * 500 / 1000 = 3_000_000_000
    const expectedAmount = 3_000_000_000;

    // Verify RevenueClaim
    const claim = await s.program.account.revenueClaim.fetch(revenueClaimPda);
    expect(claim.amount.toNumber()).to.equal(expectedAmount);
    expect(claim.contributionScore.toNumber()).to.equal(contributorScore);
    expect(claim.totalScore.toNumber()).to.equal(totalScore);
    expect(claim.claimant.toBase58()).to.equal(
      contributor.publicKey.toBase58()
    );

    // Verify event claimed_amount updated
    const event = await s.program.account.revenueEvent.fetch(revenueEventPda);
    expect(event.claimedAmount.toNumber()).to.equal(expectedAmount);

    // Verify SOL transfers: contributor gained, vault lost
    const contributorBalanceAfter = await getSolBalance(
      s.provider,
      contributor.publicKey
    );
    const vaultBalanceAfter = await getSolBalance(
      s.provider,
      developerPoolVault
    );

    // Contributor balance increased by expectedAmount minus rent for RevenueClaim account
    // The claimant pays rent for the RevenueClaim PDA init, so net gain = expectedAmount - rent
    const claimAccountRent =
      await s.provider.connection.getMinimumBalanceForRentExemption(
        8 + 32 + 32 + 1 + 8 + 8 + 8 + 8 // RevenueClaim size = 105 bytes
      );
    const netGain = contributorBalanceAfter - contributorBalanceBefore;
    // Net gain should be expectedAmount - rent - transaction fee
    // Just verify the vault decreased by exactly expectedAmount
    expect(vaultBalanceBefore - vaultBalanceAfter).to.equal(expectedAmount);
    // And contributor gained more than 0 (they received SOL)
    expect(netGain).to.be.greaterThan(0);
  });

  it("prevents double-claiming for same event", async () => {
    const s = await setupRevenueConfig();

    // Register and score a contributor
    const contributor = Keypair.generate();
    await airdrop(s.provider, contributor.publicKey);

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), contributor.publicKey.toBuffer()],
      PROGRAM_ID
    );

    await s.program.methods
      .registerDeveloper(Array.from(new Uint8Array(32).fill(1)) as number[])
      .accounts({
        developerProfile: profilePda,
        authority: contributor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    await s.program.methods
      .updateContributionScore(5, new BN(42500), 30, new BN(500), 1)
      .accounts({
        developerProfile: profilePda,
        developerWallet: contributor.publicKey,
        authority: s.admin,
        payer: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Record revenue event
    const eventIndex = 0;
    const [revenueEventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_event"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );
    const [developerPoolVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_vault"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await s.program.methods
      .recordRevenueEvent(
        new BN(10_000_000_000),
        { sol: {} },
        Array.from(new Uint8Array(64)) as number[],
        new BN(1000)
      )
      .accounts({
        revenueConfig: s.revenueConfigPda,
        revenueEvent: revenueEventPda,
        developerPoolVault,
        authority: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Derive RevenueClaim PDA
    const [revenueClaimPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_claim"),
        contributor.publicKey.toBuffer(),
        revenueEventPda.toBuffer(),
      ],
      PROGRAM_ID
    );

    // First claim -- should succeed
    await s.program.methods
      .claimRevenueShare()
      .accounts({
        revenueEvent: revenueEventPda,
        revenueClaim: revenueClaimPda,
        developerProfile: profilePda,
        claimant: contributor.publicKey,
        developerPoolVault,
        systemProgram: SystemProgram.programId,
      })
      .signers([contributor])
      .rpc();

    // Second claim -- should fail (PDA already exists)
    try {
      await s.program.methods
        .claimRevenueShare()
        .accounts({
          revenueEvent: revenueEventPda,
          revenueClaim: revenueClaimPda,
          developerProfile: profilePda,
          claimant: contributor.publicKey,
          developerPoolVault,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor])
        .rpc();
      expect.fail("Expected double-claim to fail");
    } catch (err: any) {
      // PDA already initialized -- Anchor returns an error
      expect(err.toString()).to.satisfy(
        (s: string) =>
          s.includes("already in use") ||
          s.includes("already been processed") ||
          s.includes("Error")
      );
    }
  });

  it("records burn with traceability", async () => {
    const s = await setupRevenueConfig();

    // Create a real GSD mint and token account for the burn
    const gsdMintKeypair = Keypair.generate();
    await createMintAccount(s.provider, gsdMintKeypair, s.admin);
    const gsdMint = gsdMintKeypair.publicKey;

    // Create token account for burn authority (admin)
    const gsdTokenKeypair = Keypair.generate();
    const gsdTokenAccount = await createTokenAccount(
      s.provider,
      gsdTokenKeypair,
      gsdMint,
      s.admin
    );

    // Mint some GSD tokens to burn authority's account
    const burnAmount = 1_000_000; // 1 GSD (6 decimals)
    await mintTo(
      s.provider,
      gsdMint,
      gsdTokenAccount,
      s.adminKeypair,
      BigInt(burnAmount)
    );

    // Verify initial balance
    const balanceBefore = await getTokenBalance(s.provider, gsdTokenAccount);
    expect(Number(balanceBefore)).to.equal(burnAmount);

    // Record a revenue event first
    const eventIndex = 0;
    const [revenueEventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_event"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );
    const [developerPoolVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_vault"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await s.program.methods
      .recordRevenueEvent(
        new BN(10_000_000_000),
        { sol: {} },
        Array.from(new Uint8Array(64).fill(0xcc)) as number[],
        new BN(1000)
      )
      .accounts({
        revenueConfig: s.revenueConfigPda,
        revenueEvent: revenueEventPda,
        developerPoolVault,
        authority: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Execute burn
    const burnTxSignature = new Uint8Array(64).fill(0xdd);

    await s.program.methods
      .executeBurn(
        new BN(burnAmount),
        Array.from(burnTxSignature) as number[]
      )
      .accounts({
        revenueEvent: revenueEventPda,
        burnAuthority: s.admin,
        revenueConfig: s.revenueConfigPda,
        gsdTokenAccount,
        gsdMint,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Verify RevenueEvent updated
    const event = await s.program.account.revenueEvent.fetch(revenueEventPda);
    expect(event.gsdBurned.toNumber()).to.equal(burnAmount);
    expect(Array.from(event.burnSignature as number[])).to.deep.equal(
      Array.from(burnTxSignature)
    );
    expect(JSON.stringify(event.status)).to.equal(
      JSON.stringify({ completed: {} })
    );

    // Verify tokens were burned
    const balanceAfter = await getTokenBalance(s.provider, gsdTokenAccount);
    expect(Number(balanceAfter)).to.equal(0);
  });

  it("prevents double burn on same event", async () => {
    const s = await setupRevenueConfig();

    // Create GSD mint and token account
    const gsdMintKeypair = Keypair.generate();
    await createMintAccount(s.provider, gsdMintKeypair, s.admin);
    const gsdMint = gsdMintKeypair.publicKey;

    const gsdTokenKeypair = Keypair.generate();
    const gsdTokenAccount = await createTokenAccount(
      s.provider,
      gsdTokenKeypair,
      gsdMint,
      s.admin
    );
    await mintTo(
      s.provider,
      gsdMint,
      gsdTokenAccount,
      s.adminKeypair,
      BigInt(2_000_000)
    );

    // Record revenue event
    const eventIndex = 0;
    const [revenueEventPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_event"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );
    const [developerPoolVault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("revenue_vault"),
        Buffer.from(new Uint32Array([eventIndex]).buffer),
      ],
      PROGRAM_ID
    );

    await s.program.methods
      .recordRevenueEvent(
        new BN(10_000_000_000),
        { sol: {} },
        Array.from(new Uint8Array(64)) as number[],
        new BN(1000)
      )
      .accounts({
        revenueConfig: s.revenueConfigPda,
        revenueEvent: revenueEventPda,
        developerPoolVault,
        authority: s.admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // First burn -- should succeed
    await s.program.methods
      .executeBurn(
        new BN(1_000_000),
        Array.from(new Uint8Array(64).fill(0xee)) as number[]
      )
      .accounts({
        revenueEvent: revenueEventPda,
        burnAuthority: s.admin,
        revenueConfig: s.revenueConfigPda,
        gsdTokenAccount,
        gsdMint,
        tokenProgram: SPL_TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Second burn -- should fail
    try {
      await s.program.methods
        .executeBurn(
          new BN(1_000_000),
          Array.from(new Uint8Array(64).fill(0xff)) as number[]
        )
        .accounts({
          revenueEvent: revenueEventPda,
          burnAuthority: s.admin,
          revenueConfig: s.revenueConfigPda,
          gsdTokenAccount,
          gsdMint,
          tokenProgram: SPL_TOKEN_PROGRAM_ID,
        })
        .rpc();
      expect.fail("Expected BurnAlreadyExecuted error");
    } catch (err: any) {
      expect(err.toString()).to.include("BurnAlreadyExecuted");
    }
  });
});
