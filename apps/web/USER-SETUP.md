# User Setup Required

Before running the web application, you need to configure the following services.

## 1. PostgreSQL Database

**Why:** Off-chain profile storage for User and ProgramUpgrade models.

**Options:**
- **Local:** Install PostgreSQL and create a database
  ```bash
  createdb gsd_hub
  ```
- **Hosted:** Use Neon (https://neon.tech), Supabase, or Railway for a managed PostgreSQL instance

**Environment Variable:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/gsd_hub"
```

**After setting DATABASE_URL**, generate the Prisma client and push the schema:
```bash
cd apps/web
npx prisma generate
npx prisma db push
```

## 2. Auth Secret

**Why:** JWT encryption for Auth.js v5 session management.

**Generate:**
```bash
openssl rand -hex 32
```

**Environment Variable:**
```bash
AUTH_SECRET="<paste generated secret here>"
AUTH_URL="http://localhost:3000"
```

## Setup Steps

1. Copy the example env file:
   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   ```

2. Fill in the required values in `apps/web/.env.local`

3. Push the database schema:
   ```bash
   cd apps/web && npx prisma db push
   ```

4. Start the dev server:
   ```bash
   pnpm dev
   ```
