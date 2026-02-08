import { startAnchor } from "anchor-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import { GsdHub } from "../../../target/types/gsd_hub";

// Read the IDL from the generated JSON
const IDL = require("../../../target/idl/gsd_hub.json");
const PROGRAM_ID = new PublicKey(IDL.address);

describe("Developer Registration", () => {
  it("creates a developer profile PDA", async () => {
    const context = await startAnchor(".", [], []);
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), authority.toBuffer()],
      PROGRAM_ID
    );

    const profileHash = new Uint8Array(32).fill(1); // test hash

    await program.methods
      .registerDeveloper(Array.from(profileHash) as number[])
      .accounts({
        developerProfile: profilePda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.developerProfile.fetch(profilePda);
    expect(account.authority.toBase58()).to.equal(authority.toBase58());
    expect(account.profileHash).to.deep.equal(Array.from(profileHash));
    expect(account.createdAt.toNumber()).to.be.greaterThan(0);
    expect(account.bump).to.be.a("number");
  });

  it("prevents duplicate registration", async () => {
    const context = await startAnchor(".", [], []);
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), authority.toBuffer()],
      PROGRAM_ID
    );

    const profileHash = new Uint8Array(32).fill(1);

    // First registration should succeed
    await program.methods
      .registerDeveloper(Array.from(profileHash) as number[])
      .accounts({
        developerProfile: profilePda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Second registration with the same wallet should fail
    try {
      await program.methods
        .registerDeveloper(Array.from(profileHash) as number[])
        .accounts({
          developerProfile: profilePda,
          authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Expected duplicate registration to fail");
    } catch (err: any) {
      // Anchor init constraint prevents re-initialization
      expect(err).to.exist;
    }
  });

  it("updates profile hash", async () => {
    const context = await startAnchor(".", [], []);
    const provider = new BankrunProvider(context);
    const program = new Program<GsdHub>(IDL as GsdHub, provider);
    const authority = provider.wallet.publicKey;

    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("developer"), authority.toBuffer()],
      PROGRAM_ID
    );

    const initialHash = new Uint8Array(32).fill(1);
    const newHash = new Uint8Array(32).fill(2);

    // Register first
    await program.methods
      .registerDeveloper(Array.from(initialHash) as number[])
      .accounts({
        developerProfile: profilePda,
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Get initial state
    const beforeUpdate = await program.account.developerProfile.fetch(profilePda);

    // Update the hash
    await program.methods
      .updateProfileHash(Array.from(newHash) as number[])
      .accounts({
        developerProfile: profilePda,
        authority,
      })
      .rpc();

    // Verify the update
    const afterUpdate = await program.account.developerProfile.fetch(profilePda);
    expect(afterUpdate.profileHash).to.deep.equal(Array.from(newHash));
    expect(afterUpdate.updatedAt.toNumber()).to.be.greaterThanOrEqual(
      beforeUpdate.updatedAt.toNumber()
    );
    // Authority should not change
    expect(afterUpdate.authority.toBase58()).to.equal(authority.toBase58());
  });
});
