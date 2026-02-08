#!/usr/bin/env npx tsx
/**
 * setup-multisig.ts
 *
 * Creates a Squads v4 multisig on Solana (devnet or mainnet).
 *
 * Usage:
 *   npx tsx scripts/setup-multisig.ts <pubkey1> <pubkey2> ... <pubkey5>
 *   npx tsx scripts/setup-multisig.ts --dev <pubkey1> <pubkey2> <pubkey3>
 *   npx tsx scripts/setup-multisig.ts --help
 *
 * Options:
 *   --threshold <N>  Signature threshold (default: 3 for prod, 2 for dev)
 *   --dev            Development mode: 2-of-3 multisig for faster iteration
 *   --help           Show usage instructions
 *
 * Environment:
 *   SOLANA_RPC_URL       RPC endpoint (default: devnet)
 *   SOLANA_KEYPAIR_PATH  Path to fee payer keypair (default: ~/.config/solana/id.json)
 *
 * After creating the multisig, transfer program upgrade authority to the
 * multisig vault address using:
 *   solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <VAULT_ADDRESS>
 */

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const { Multisig, Permission, Permissions } = multisig.types;

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function showHelp(): void {
  console.log(`
setup-multisig.ts — Create a Squads v4 multisig on Solana

USAGE
  npx tsx scripts/setup-multisig.ts [OPTIONS] <pubkey1> <pubkey2> ... <pubkeyN>

OPTIONS
  --threshold <N>   Signature threshold (default: 3 for prod, 2 for dev)
  --dev             Development mode: expects 3 members, threshold defaults to 2
  --help            Show this help message

EXAMPLES
  # Production: 3-of-5 multisig
  npx tsx scripts/setup-multisig.ts \\
    Abc111...  Abc222...  Abc333...  Abc444...  Abc555...

  # Development: 2-of-3 multisig on devnet
  npx tsx scripts/setup-multisig.ts --dev \\
    Abc111...  Abc222...  Abc333...

ENVIRONMENT
  SOLANA_RPC_URL        RPC endpoint (default: https://api.devnet.solana.com)
  SOLANA_KEYPAIR_PATH   Fee payer keypair file (default: ~/.config/solana/id.json)

AFTER CREATION
  Transfer program upgrade authority to the vault:
    solana program set-upgrade-authority <PROGRAM_ID> \\
      --new-upgrade-authority <VAULT_ADDRESS>
`);
}

interface ParsedArgs {
  devMode: boolean;
  threshold: number | null;
  members: string[];
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = { devMode: false, threshold: null, members: [] };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg === "--dev") {
      result.devMode = true;
    } else if (arg === "--threshold") {
      i++;
      result.threshold = parseInt(args[i], 10);
      if (isNaN(result.threshold) || result.threshold < 1) {
        console.error("Error: --threshold must be a positive integer");
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      result.members.push(arg);
    } else {
      console.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
    }
    i++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    showHelp();
    process.exit(0);
  }

  const { devMode, threshold: customThreshold, members: memberStrings } = parseArgs(rawArgs);

  // Validate member count
  const expectedMembers = devMode ? 3 : 5;
  const defaultThreshold = devMode ? 2 : 3;
  const threshold = customThreshold ?? defaultThreshold;

  if (memberStrings.length < 1) {
    console.error(
      `Error: expected at least 1 member public key, got ${memberStrings.length}`
    );
    console.error(
      devMode
        ? "Usage: npx tsx scripts/setup-multisig.ts --dev <pubkey1> <pubkey2> <pubkey3>"
        : "Usage: npx tsx scripts/setup-multisig.ts <pubkey1> <pubkey2> ... <pubkey5>"
    );
    process.exit(1);
  }

  if (threshold > memberStrings.length) {
    console.error(
      `Error: threshold (${threshold}) cannot be greater than member count (${memberStrings.length})`
    );
    process.exit(1);
  }

  // Parse member public keys
  let memberKeys: PublicKey[];
  try {
    memberKeys = memberStrings.map((s) => new PublicKey(s));
  } catch (err) {
    console.error("Error: invalid public key provided");
    console.error((err as Error).message);
    process.exit(1);
  }

  // Load fee payer keypair
  const keypairPath =
    process.env.SOLANA_KEYPAIR_PATH ||
    path.join(os.homedir(), ".config", "solana", "id.json");

  if (!fs.existsSync(keypairPath)) {
    console.error(`Error: keypair file not found at ${keypairPath}`);
    console.error(
      "Set SOLANA_KEYPAIR_PATH or run: solana-keygen new"
    );
    process.exit(1);
  }

  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const feePayer = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  // Connect to Solana
  const rpcUrl =
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("=".repeat(60));
  console.log("  Squads v4 Multisig Setup");
  console.log("=".repeat(60));
  console.log(`  Mode:        ${devMode ? "Development" : "Production"}`);
  console.log(`  RPC:         ${rpcUrl}`);
  console.log(`  Fee Payer:   ${feePayer.publicKey.toBase58()}`);
  console.log(`  Members:     ${memberKeys.length}`);
  console.log(`  Threshold:   ${threshold} of ${memberKeys.length}`);
  console.log("=".repeat(60));
  console.log("");

  // Check fee payer balance
  const balance = await connection.getBalance(feePayer.publicKey);
  const solBalance = balance / 1e9;
  console.log(`Fee payer balance: ${solBalance.toFixed(4)} SOL`);

  if (balance < 10_000_000) {
    // 0.01 SOL minimum
    console.error("Error: insufficient SOL for transaction fees");
    console.error(
      "Request devnet SOL: solana airdrop 2 " + feePayer.publicKey.toBase58()
    );
    process.exit(1);
  }

  // Create the multisig
  const createKey = Keypair.generate();

  const [multisigPda] = multisig.getMultisigPda({
    createKey: createKey.publicKey,
  });

  const [vaultPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });

  console.log("Creating multisig...");
  console.log(`  Multisig PDA: ${multisigPda.toBase58()}`);
  console.log(`  Vault PDA:    ${vaultPda.toBase58()}`);
  console.log("");

  // Build member list with full permissions
  const membersConfig = memberKeys.map((key) => ({
    key,
    permissions: Permissions.all(),
  }));

  try {
    const signature = await multisig.rpc.multisigCreateV2({
      connection,
      createKey,
      creator: feePayer,
      multisigPda,
      configAuthority: null,
      timeLock: 0,
      members: membersConfig,
      threshold,
      rentCollector: null,
      treasury: vaultPda,
    });

    console.log("Multisig created successfully!");
    console.log("");
    console.log("=".repeat(60));
    console.log("  RESULTS");
    console.log("=".repeat(60));
    console.log(`  Multisig Address:  ${multisigPda.toBase58()}`);
    console.log(`  Vault Address:     ${vaultPda.toBase58()}`);
    console.log(`  Transaction:       ${signature}`);
    console.log(`  Threshold:         ${threshold} of ${memberKeys.length}`);
    console.log("=".repeat(60));
    console.log("");
    console.log("NEXT STEPS:");
    console.log(
      "  1. Update NEXT_PUBLIC_MULTISIG_ADDRESS in apps/web/.env.local"
    );
    console.log(
      `     NEXT_PUBLIC_MULTISIG_ADDRESS=${multisigPda.toBase58()}`
    );
    console.log("");
    console.log(
      "  2. Transfer program upgrade authority to the vault:"
    );
    console.log(
      `     solana program set-upgrade-authority <PROGRAM_ID> \\`
    );
    console.log(
      `       --new-upgrade-authority ${vaultPda.toBase58()}`
    );
    console.log("");
    console.log(
      `  3. View on Squads: https://v4.squads.so/squad/${multisigPda.toBase58()}`
    );
  } catch (err) {
    console.error("Failed to create multisig:");
    console.error((err as Error).message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
