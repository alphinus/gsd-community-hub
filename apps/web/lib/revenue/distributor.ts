import {
  Connection,
  VersionedTransaction,
  Keypair,
} from "@solana/web3.js";
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const JUPITER_API_BASE = "https://api.jup.ag/swap/v1";
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// ---------------------------------------------------------------------------
// Buy-and-burn
// ---------------------------------------------------------------------------

/**
 * Execute a Jupiter swap to buy $GSD and prepare for burn.
 *
 * Fetches a quote from Jupiter, builds the swap transaction, signs with
 * the burn authority, and sends it on-chain. Returns the swap signature
 * and the amount of $GSD acquired, or null if any step fails.
 *
 * Buy-and-burn failure is non-blocking: callers should handle null
 * gracefully and continue with other distributions.
 */
export async function executeBuyAndBurn(params: {
  connection: Connection;
  burnAuthority: Keypair;
  inputMint: string; // SOL_MINT or USDC_MINT
  gsdMint: string;
  amountLamports: bigint;
  jupiterApiKey: string;
}): Promise<{ swapSignature: string; gsdBurned: bigint } | null> {
  const {
    connection,
    burnAuthority,
    inputMint,
    gsdMint,
    amountLamports,
    jupiterApiKey,
  } = params;

  // Step 1: Get quote from Jupiter
  let quoteResponse: Record<string, unknown>;
  try {
    const quoteUrl =
      `${JUPITER_API_BASE}/quote` +
      `?inputMint=${inputMint}` +
      `&outputMint=${gsdMint}` +
      `&amount=${amountLamports.toString()}` +
      `&slippageBps=150`;

    const quoteRes = await fetch(quoteUrl, {
      headers: { "x-api-key": jupiterApiKey },
    });

    if (!quoteRes.ok) {
      const body = await quoteRes.text();
      console.error(
        `Jupiter quote failed (${quoteRes.status}): ${body}`
      );
      return null;
    }

    quoteResponse = (await quoteRes.json()) as Record<string, unknown>;
  } catch (error) {
    console.error(
      "Jupiter quote error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }

  // Step 2: Build swap transaction
  let swapTransactionBase64: string;
  try {
    const swapRes = await fetch(`${JUPITER_API_BASE}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": jupiterApiKey,
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: burnAuthority.publicKey.toBase58(),
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 500000,
            priorityLevel: "high",
          },
        },
      }),
    });

    if (!swapRes.ok) {
      const body = await swapRes.text();
      console.error(
        `Jupiter swap failed (${swapRes.status}): ${body}`
      );
      return null;
    }

    const swapData = (await swapRes.json()) as {
      swapTransaction: string;
    };
    swapTransactionBase64 = swapData.swapTransaction;
  } catch (error) {
    console.error(
      "Jupiter swap build error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }

  // Step 3: Sign and send
  let swapSignature: string;
  try {
    const txBuffer = Buffer.from(swapTransactionBase64, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);
    transaction.sign([burnAuthority]);

    swapSignature = await connection.sendTransaction(transaction, {
      skipPreflight: true,
    });
  } catch (error) {
    console.error(
      "Jupiter swap send error:",
      error instanceof Error ? error.message : error
    );
    return null;
  }

  // Step 4: Confirm transaction
  try {
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: swapSignature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
  } catch (error) {
    console.error(
      "Jupiter swap confirmation error:",
      error instanceof Error ? error.message : error
    );
    // Transaction was sent but confirmation failed -- return signature
    // anyway so caller can track it. The swap may still land.
    return {
      swapSignature,
      gsdBurned: BigInt(
        (quoteResponse.outAmount as string) || "0"
      ),
    };
  }

  // Step 5: Return result
  return {
    swapSignature,
    gsdBurned: BigInt(
      (quoteResponse.outAmount as string) || "0"
    ),
  };
}

// ---------------------------------------------------------------------------
// Distribution pipeline
// ---------------------------------------------------------------------------

/**
 * Distribute revenue according to the 60/20/10/10 split.
 *
 * Computes the four-way split (developer pool / treasury reserve / burn /
 * maintenance), records a RevenueEvent in the database, and optionally
 * executes the buy-and-burn via Jupiter.
 *
 * If burnAuthority or jupiterApiKey are not provided, the burn step is
 * skipped (logged as warning). If the burn fails, distribution still
 * succeeds -- the burn can be retried later.
 */
export async function distributeRevenue(params: {
  totalAmount: bigint;
  token: "sol" | "usdc";
  originSignature: string;
  connection: Connection;
  burnAuthority?: Keypair;
  jupiterApiKey?: string;
  gsdMint?: string;
}): Promise<{
  eventId: string;
  eventIndex: number;
  splits: {
    developerPool: bigint;
    treasuryReserve: bigint;
    burnAmount: bigint;
    maintenance: bigint;
  };
  burnResult: { swapSignature: string; gsdBurned: bigint } | null;
}> {
  const {
    totalAmount,
    token,
    originSignature,
    connection,
    burnAuthority,
    jupiterApiKey,
    gsdMint,
  } = params;

  // Step 1: Compute 60/20/10/10 splits
  const developerPool = (totalAmount * 6000n) / 10000n;
  const treasuryReserve = (totalAmount * 2000n) / 10000n;
  const burnAmount = (totalAmount * 1000n) / 10000n;
  const maintenance = (totalAmount * 1000n) / 10000n;
  // Assign remainder from integer division to developer pool
  const remainder =
    totalAmount - developerPool - treasuryReserve - burnAmount - maintenance;
  const adjustedDeveloperPool = developerPool + remainder;

  // Step 2: Record revenue event to database
  const existingEventCount = await prisma.revenueEvent.count();
  const eventIndex = existingEventCount;

  const event = await prisma.revenueEvent.create({
    data: {
      eventIndex,
      onChainAddress: "", // populated when on-chain record_revenue_event executes
      token,
      totalAmount,
      developerPool: adjustedDeveloperPool,
      treasuryReserve,
      burnAmount,
      maintenanceAmount: maintenance,
      status: "recorded",
      originSignature,
      totalContributionScore: BigInt(0), // populated during on-chain distribution
      claimedAmount: BigInt(0),
      gsdBurned: BigInt(0),
      recordedAt: new Date(),
    },
  });

  // Step 3: Attempt buy-and-burn if configured
  let burnResult: { swapSignature: string; gsdBurned: bigint } | null =
    null;

  if (burnAuthority && jupiterApiKey && gsdMint) {
    const inputMint = token === "sol" ? SOL_MINT : USDC_MINT;

    burnResult = await executeBuyAndBurn({
      connection,
      burnAuthority,
      inputMint,
      gsdMint,
      amountLamports: burnAmount,
      jupiterApiKey,
    });

    if (burnResult) {
      // Update the event with burn data
      await prisma.revenueEvent.update({
        where: { id: event.id },
        data: {
          burnSignature: burnResult.swapSignature,
          gsdBurned: burnResult.gsdBurned,
        },
      });
    } else {
      console.warn(
        `Buy-and-burn failed for event ${eventIndex} ` +
          `(origin: ${originSignature}). Burn can be retried later.`
      );
    }
  } else {
    if (!burnAuthority) {
      console.warn(
        "BURN_AUTHORITY_KEYPAIR not set -- buy-and-burn disabled"
      );
    }
    if (!jupiterApiKey) {
      console.warn(
        "JUPITER_API_KEY not set -- buy-and-burn disabled"
      );
    }
  }

  return {
    eventId: event.id,
    eventIndex,
    splits: {
      developerPool: adjustedDeveloperPool,
      treasuryReserve,
      burnAmount,
      maintenance,
    },
    burnResult,
  };
}

// ---------------------------------------------------------------------------
// Burn authority loader
// ---------------------------------------------------------------------------

/**
 * Load the burn authority keypair from environment variables.
 *
 * Supports two formats:
 * - BURN_AUTHORITY_KEYPAIR: base58-encoded secret key
 * - BURN_AUTHORITY_KEYPAIR_PATH: path to a JSON key file (array of bytes)
 *
 * Returns null if neither is configured (logs a warning).
 */
export function loadBurnAuthority(): Keypair | null {
  const base58Key = process.env.BURN_AUTHORITY_KEYPAIR;
  const keyPath = process.env.BURN_AUTHORITY_KEYPAIR_PATH;

  if (base58Key) {
    try {
      // Decode base58 secret key
      const bytes = base58Decode(base58Key);
      return Keypair.fromSecretKey(bytes);
    } catch (error) {
      console.error(
        "Failed to load BURN_AUTHORITY_KEYPAIR:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  if (keyPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      const keyData = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      return Keypair.fromSecretKey(new Uint8Array(keyData));
    } catch (error) {
      console.error(
        "Failed to load BURN_AUTHORITY_KEYPAIR_PATH:",
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  console.warn(
    "BURN_AUTHORITY_KEYPAIR not set -- buy-and-burn disabled"
  );
  return null;
}

// ---------------------------------------------------------------------------
// Base58 decode (inline, matching project convention from 02-04)
// ---------------------------------------------------------------------------

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(str: string): Uint8Array {
  let num = 0n;
  for (const c of str) {
    const idx = BASE58_ALPHABET.indexOf(c);
    if (idx === -1) throw new Error(`Invalid base58 character: ${c}`);
    num = num * 58n + BigInt(idx);
  }

  const hex = num.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
  }

  let zeros = 0;
  for (const c of str) {
    if (c !== "1") break;
    zeros++;
  }

  if (zeros > 0) {
    const result = new Uint8Array(zeros + bytes.length);
    result.set(bytes, zeros);
    return result;
  }

  return bytes;
}
