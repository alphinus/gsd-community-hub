#!/usr/bin/env npx tsx
/**
 * setup-helius-webhook.ts
 *
 * Creates a Helius webhook to monitor gsd-hub program transactions on Solana.
 *
 * Usage:
 *   npx tsx scripts/setup-helius-webhook.ts --webhook-url https://example.com/api/webhooks/helius
 *   npx tsx scripts/setup-helius-webhook.ts --list
 *   npx tsx scripts/setup-helius-webhook.ts --help
 *
 * Options:
 *   --webhook-url <url>   Webhook delivery URL (required for creation)
 *   --network <network>   Solana network: devnet | mainnet-beta (default: devnet)
 *   --list                List existing webhooks
 *   --help                Show usage instructions
 *
 * Environment:
 *   HELIUS_API_KEY         Helius API key (https://dev.helius.xyz/)
 *   HELIUS_WEBHOOK_AUTH    Auth token sent with webhook deliveries
 *   NEXT_PUBLIC_PROGRAM_ID Program ID to monitor (default: Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw)
 */

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function showHelp(): void {
  console.log(`
setup-helius-webhook.ts — Create a Helius webhook for gsd-hub program events

USAGE
  npx tsx scripts/setup-helius-webhook.ts [OPTIONS]

OPTIONS
  --webhook-url <url>   Webhook delivery URL (required for creation)
  --network <network>   Solana network: devnet | mainnet-beta (default: devnet)
  --list                List existing webhooks
  --help                Show this help message

EXAMPLES
  # Create webhook for devnet
  npx tsx scripts/setup-helius-webhook.ts \\
    --webhook-url https://your-app.vercel.app/api/webhooks/helius

  # Create webhook for mainnet
  npx tsx scripts/setup-helius-webhook.ts \\
    --webhook-url https://your-app.vercel.app/api/webhooks/helius \\
    --network mainnet-beta

  # List existing webhooks
  npx tsx scripts/setup-helius-webhook.ts --list

ENVIRONMENT
  HELIUS_API_KEY          Helius API key (required)
                          Get from: https://dev.helius.xyz/ -> API Keys
  HELIUS_WEBHOOK_AUTH     Auth token for webhook delivery (required for create)
                          Generate with: openssl rand -hex 32
  NEXT_PUBLIC_PROGRAM_ID  Program ID to monitor
                          Default: Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw
`);
}

interface ParsedArgs {
  webhookUrl: string | null;
  network: string;
  list: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    webhookUrl: null,
    network: "devnet",
    list: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg === "--webhook-url") {
      i++;
      if (!args[i]) {
        console.error("Error: --webhook-url requires a URL argument");
        process.exit(1);
      }
      result.webhookUrl = args[i];
    } else if (arg === "--network") {
      i++;
      if (!args[i] || !["devnet", "mainnet-beta"].includes(args[i])) {
        console.error(
          "Error: --network must be 'devnet' or 'mainnet-beta'"
        );
        process.exit(1);
      }
      result.network = args[i];
    } else if (arg === "--list") {
      result.list = true;
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
// Helius API helpers
// ---------------------------------------------------------------------------

const HELIUS_API_BASE = "https://api.helius.xyz/v0";

interface HeliusWebhook {
  webhookID: string;
  wallet: string;
  webhookURL: string;
  transactionTypes: string[];
  accountAddresses: string[];
  webhookType: string;
  authHeader?: string;
}

async function listWebhooks(apiKey: string): Promise<HeliusWebhook[]> {
  const response = await fetch(
    `${HELIUS_API_BASE}/webhooks?api-key=${apiKey}`
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to list webhooks: ${response.status} ${text}`
    );
  }

  return response.json() as Promise<HeliusWebhook[]>;
}

async function createWebhook(
  apiKey: string,
  options: {
    webhookUrl: string;
    authHeader: string;
    accountAddresses: string[];
    network: string;
  }
): Promise<HeliusWebhook> {
  const body = {
    webhookURL: options.webhookUrl,
    transactionTypes: ["ANY"],
    accountAddresses: options.accountAddresses,
    webhookType: "enhanced",
    authHeader: options.authHeader,
    txnStatus: "success",
    encoding: "jsonParsed",
  };

  const url =
    options.network === "devnet"
      ? `${HELIUS_API_BASE}/webhooks?api-key=${apiKey}`
      : `${HELIUS_API_BASE}/webhooks?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to create webhook: ${response.status} ${text}`
    );
  }

  return response.json() as Promise<HeliusWebhook>;
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

  const { webhookUrl, network, list } = parseArgs(rawArgs);

  // Validate required env vars
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    console.error("Error: HELIUS_API_KEY environment variable is required");
    console.error("Get your API key from: https://dev.helius.xyz/");
    process.exit(1);
  }

  // Handle --list
  if (list) {
    console.log("Fetching webhooks...\n");
    const webhooks = await listWebhooks(apiKey);

    if (webhooks.length === 0) {
      console.log("No webhooks configured.");
      return;
    }

    console.log("=".repeat(60));
    console.log("  Configured Webhooks");
    console.log("=".repeat(60));

    for (const wh of webhooks) {
      console.log(`  ID:         ${wh.webhookID}`);
      console.log(`  URL:        ${wh.webhookURL}`);
      console.log(`  Type:       ${wh.webhookType}`);
      console.log(`  Tx Types:   ${wh.transactionTypes.join(", ")}`);
      console.log(
        `  Accounts:   ${wh.accountAddresses.length} monitored`
      );
      if (wh.accountAddresses.length <= 5) {
        for (const addr of wh.accountAddresses) {
          console.log(`              - ${addr}`);
        }
      }
      console.log("-".repeat(60));
    }

    console.log(`\nTotal: ${webhooks.length} webhook(s)`);
    return;
  }

  // Validate args for creation
  if (!webhookUrl) {
    console.error("Error: --webhook-url is required for webhook creation");
    console.error(
      "Usage: npx tsx scripts/setup-helius-webhook.ts --webhook-url <url>"
    );
    process.exit(1);
  }

  const webhookAuth = process.env.HELIUS_WEBHOOK_AUTH;
  if (!webhookAuth) {
    console.error(
      "Error: HELIUS_WEBHOOK_AUTH environment variable is required"
    );
    console.error("Generate one with: openssl rand -hex 32");
    process.exit(1);
  }

  const programId =
    process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw";

  // Validate webhook URL
  try {
    const parsed = new URL(webhookUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL must use http or https protocol");
    }
  } catch (err) {
    console.error(`Error: invalid webhook URL: ${webhookUrl}`);
    console.error((err as Error).message);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("  Helius Webhook Setup");
  console.log("=".repeat(60));
  console.log(`  Network:     ${network}`);
  console.log(`  Program ID:  ${programId}`);
  console.log(`  Webhook URL: ${webhookUrl}`);
  console.log(`  Auth:        ${webhookAuth.slice(0, 8)}...`);
  console.log("=".repeat(60));
  console.log("");

  try {
    console.log("Creating webhook...");
    const webhook = await createWebhook(apiKey, {
      webhookUrl,
      authHeader: webhookAuth,
      accountAddresses: [programId],
      network,
    });

    console.log("\nWebhook created successfully!");
    console.log("");
    console.log("=".repeat(60));
    console.log("  RESULTS");
    console.log("=".repeat(60));
    console.log(`  Webhook ID:  ${webhook.webhookID}`);
    console.log(`  URL:         ${webhook.webhookURL}`);
    console.log(`  Type:        ${webhook.webhookType}`);
    console.log(
      `  Monitoring:  ${webhook.accountAddresses.length} account(s)`
    );
    console.log("=".repeat(60));
    console.log("");
    console.log("NEXT STEPS:");
    console.log("  1. Ensure your app is deployed and accessible at:");
    console.log(`     ${webhookUrl}`);
    console.log("");
    console.log(
      "  2. Verify the webhook is receiving events by making a"
    );
    console.log("     contribution on devnet and checking your logs.");
    console.log("");
    console.log("  3. List webhooks anytime with:");
    console.log(
      "     npx tsx scripts/setup-helius-webhook.ts --list"
    );
  } catch (err) {
    console.error("Failed to create webhook:");
    console.error((err as Error).message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
