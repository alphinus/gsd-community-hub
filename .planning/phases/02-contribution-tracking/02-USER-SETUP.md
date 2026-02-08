# Phase 02: Helius Service Configuration

Required for on-chain contribution event indexing via webhooks.

## Prerequisites

- Deployed web application with public URL (for webhook delivery)
- PostgreSQL database with Contribution model migrated (`npx prisma db push`)

## Step 1: Create Helius Account

1. Go to [https://dev.helius.xyz/](https://dev.helius.xyz/)
2. Create a free account (supports devnet with free tier)
3. Navigate to **API Keys** in the dashboard

## Step 2: Set Environment Variables

Add these to `apps/web/.env.local`:

```bash
# Helius API key from dashboard
HELIUS_API_KEY="your-api-key-here"

# Webhook authentication token
# Generate with: openssl rand -hex 32
HELIUS_WEBHOOK_AUTH="your-generated-secret"
```

## Step 3: Create Webhook

After deploying your app (so the webhook URL is reachable):

```bash
npx tsx scripts/setup-helius-webhook.ts \
  --webhook-url https://your-app.vercel.app/api/webhooks/helius
```

For devnet (default) this monitors the gsd-hub program for contribution transactions.

## Step 4: Verify

```bash
# List configured webhooks
npx tsx scripts/setup-helius-webhook.ts --list
```

Make a test contribution on devnet and check:
- Application logs for webhook delivery
- Database for new Contribution record

## Environment Variables Summary

| Variable | Source | Required |
|----------|--------|----------|
| `HELIUS_API_KEY` | [Helius Dashboard](https://dev.helius.xyz/) -> API Keys | Yes |
| `HELIUS_WEBHOOK_AUTH` | `openssl rand -hex 32` | Yes |
| `NEXT_PUBLIC_PROGRAM_ID` | Already set (default: `Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw`) | Pre-configured |
