#!/usr/bin/env npx tsx
/**
 * log-upgrade.ts
 *
 * Records a program upgrade in the database for the public transparency changelog.
 *
 * Usage:
 *   npx tsx scripts/log-upgrade.ts \
 *     --program-id <PROGRAM_ID> \
 *     --version <VERSION> \
 *     --description <DESCRIPTION> \
 *     --signers <ADDR1,ADDR2,...> \
 *     --tx <TRANSACTION_SIGNATURE> \
 *     --multisig <MULTISIG_ADDRESS>
 *
 *   npx tsx scripts/log-upgrade.ts --help
 *
 * Environment:
 *   DATABASE_URL  PostgreSQL connection string (required)
 *
 * This is manually run after each program upgrade to maintain the public
 * changelog on the /transparency page.
 */

import { PrismaClient } from "../apps/web/prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function showHelp(): void {
  console.log(`
log-upgrade.ts — Record a program upgrade in the database

USAGE
  npx tsx scripts/log-upgrade.ts [OPTIONS]

REQUIRED OPTIONS
  --program-id <ID>         Solana program ID that was upgraded
  --version <VERSION>       Version string (e.g., "0.1.0", "1.2.3")
  --description <TEXT>      What changed in this upgrade
  --signers <ADDR1,ADDR2>   Comma-separated signer addresses
  --tx <SIGNATURE>          On-chain transaction signature
  --multisig <ADDRESS>      Multisig address that authorized the upgrade

OTHER OPTIONS
  --help                    Show this help message

EXAMPLE
  npx tsx scripts/log-upgrade.ts \\
    --program-id Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw \\
    --version 0.1.0 \\
    --description "Initial deployment with profile registration" \\
    --signers "Abc111...,Abc222...,Abc333..." \\
    --tx "5abcdef..." \\
    --multisig "SQDabc..."

ENVIRONMENT
  DATABASE_URL  PostgreSQL connection string (required)
`);
}

interface ParsedArgs {
  programId: string | null;
  version: string | null;
  description: string | null;
  signers: string | null;
  tx: string | null;
  multisig: string | null;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    programId: null,
    version: null,
    description: null,
    signers: null,
    tx: null,
    multisig: null,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg === "--program-id") {
      result.programId = args[++i];
    } else if (arg === "--version") {
      result.version = args[++i];
    } else if (arg === "--description") {
      result.description = args[++i];
    } else if (arg === "--signers") {
      result.signers = args[++i];
    } else if (arg === "--tx") {
      result.tx = args[++i];
    } else if (arg === "--multisig") {
      result.multisig = args[++i];
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
// Validation
// ---------------------------------------------------------------------------

function validate(args: ParsedArgs): {
  programId: string;
  version: string;
  description: string;
  signers: string[];
  transactionSignature: string;
  multisigAddress: string;
} {
  const missing: string[] = [];

  if (!args.programId) missing.push("--program-id");
  if (!args.version) missing.push("--version");
  if (!args.description) missing.push("--description");
  if (!args.signers) missing.push("--signers");
  if (!args.tx) missing.push("--tx");
  if (!args.multisig) missing.push("--multisig");

  if (missing.length > 0) {
    console.error(`Error: missing required options: ${missing.join(", ")}`);
    console.error("Run with --help for usage information.");
    process.exit(1);
  }

  const signers = args
    .signers!.split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (signers.length === 0) {
    console.error("Error: --signers must contain at least one address");
    process.exit(1);
  }

  return {
    programId: args.programId!,
    version: args.version!,
    description: args.description!,
    signers,
    transactionSignature: args.tx!,
    multisigAddress: args.multisig!,
  };
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

  const parsed = parseArgs(rawArgs);
  const data = validate(parsed);

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL environment variable is not set");
    console.error(
      "Set it to your PostgreSQL connection string, e.g.:"
    );
    console.error(
      '  DATABASE_URL="postgresql://user:pass@localhost:5432/gsd" npx tsx scripts/log-upgrade.ts ...'
    );
    process.exit(1);
  }

  // Connect to database
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("=".repeat(60));
  console.log("  Log Program Upgrade");
  console.log("=".repeat(60));
  console.log(`  Program ID:   ${data.programId}`);
  console.log(`  Version:      ${data.version}`);
  console.log(`  Description:  ${data.description}`);
  console.log(`  Signers:      ${data.signers.join(", ")}`);
  console.log(`  Transaction:  ${data.transactionSignature}`);
  console.log(`  Multisig:     ${data.multisigAddress}`);
  console.log("=".repeat(60));
  console.log("");

  try {
    const record = await prisma.programUpgrade.create({
      data: {
        programId: data.programId,
        version: data.version,
        description: data.description,
        signers: data.signers,
        transactionSignature: data.transactionSignature,
        multisigAddress: data.multisigAddress,
      },
    });

    console.log("Upgrade logged successfully!");
    console.log("");
    console.log("Created record:");
    console.log(`  ID:         ${record.id}`);
    console.log(`  Program:    ${record.programId}`);
    console.log(`  Version:    ${record.version}`);
    console.log(`  Created:    ${record.createdAt.toISOString()}`);
    console.log("");
    console.log(
      "Visit /transparency to see this entry in the changelog."
    );
  } catch (err) {
    console.error("Failed to create upgrade record:");
    console.error((err as Error).message);
    console.error("");
    console.error(
      "Make sure DATABASE_URL is correct and the database has been migrated:"
    );
    console.error("  cd apps/web && npx prisma db push");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
