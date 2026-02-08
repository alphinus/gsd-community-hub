# Phase 5: GSD Framework Integration - Research

**Researched:** 2026-02-08
**Domain:** AI-powered task verification, automated contribution scoring, AI proposal analysis, peer review fallback system, on-chain verification reports
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Task Verification Flow
- AI verifies BOTH code output AND full GSD workflow (plan created, executed, tests passed, code quality) -- not just the result but the path
- Both dimensions feed into a combined verification score with configurable weighting
- Contributor triggers verification manually ("Submit for Verification") -- not automatic
- Score displayed as total (e.g., 87/100) with full breakdown by categories (code quality, task fulfillment, workflow discipline)
- Complete AI verification report is publicly visible -- maximum transparency: what was checked, which files changed, which criteria met/not met
- Every verification report is publicly auditable by any community member

#### AI Proposal Analysis
- AI analysis runs immediately on idea submission -- community sees AI assessment alongside the proposal instantly
- AI is codebase-aware: analyzes current codebase and estimates impact on existing architecture, not just the proposal text in isolation
- AI-Score has weighted influence on voting outcomes -- technically impossible proposals cannot pass even with majority vote (quality filter)
- Output format: Claude's discretion to design optimal presentation (structured report vs pro/contra vs hybrid based on UX research)

#### Fallback & Fairness (3-Tier Review System)
- When AI confidence is below threshold, contributor chooses: Peer Review OR re-submit with more context for another AI attempt
- Peer Review uses a 3-tier weighted system based on:
  - Domain-specific experience of the reviewer (contributions in the same area)
  - Total number of verified contributions the reviewer has made
  - Derived review weight from these two factors -- experienced domain reviewers carry more weight
- Tier system design: Claude's discretion (research optimal tier boundaries, gamification patterns, and how it integrates with existing score formula)
- Peer Reviews are rewarded as contributions but at a lower rate than code contributions -- incentive to review without score inflation
- Consensus rules for valid manual verification: Claude's discretion (design optimal minimum reviewers / tier-weighted consensus threshold)

#### Framework-Pipeline
- Verification results go on-chain immediately after completion (both AI and Peer) -- real-time transparency
- Report storage strategy: Claude's discretion (hash on-chain + off-chain vs Arweave -- choose based on cost analysis and existing Phase 2 content-hash pattern)
- Score update mechanism: Claude's discretion (direct PDA update vs event+indexer -- choose based on existing Phase 2/4 architecture consistency)
- Retroactive migration: ALL existing contributions from Phase 2-4 will be re-evaluated through AI verification to establish a fair baseline for everyone

### Claude's Discretion
- AI proposal analysis output format (structured report, pro/contra, or hybrid)
- Peer Review tier system design (tier boundaries, naming, gamification elements)
- Peer Review consensus rules (minimum reviewers, tier-weighted thresholds)
- Report storage strategy (on-chain hash + off-chain DB vs Arweave permanent storage)
- Score update pipeline pattern (direct PDA update vs event + indexer)
- Verification score weighting formula (code output weight vs workflow quality weight)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

Phase 5 is the platform's core differentiator: AI-verified proof of real developer work, cryptographically recorded on-chain. The phase has four major subsystems: (1) AI task verification that scores both code output quality and GSD workflow discipline, (2) AI proposal analysis that acts as a codebase-aware quality filter for governance, (3) a 3-tier peer review fallback for when AI confidence is low, and (4) the pipeline that records verification results on-chain and updates contribution scores.

The primary technical challenge is building a reliable AI verification engine using the Anthropic Claude API with structured outputs. The engine must analyze git diffs, test results, code quality metrics, and GSD workflow artifacts (plan files, execution logs) to produce a deterministic, reproducible verification score. The Claude API's `output_config.format` with `json_schema` type (now GA for Opus 4.6, Sonnet 4.5, Opus 4.5, Haiku 4.5) guarantees schema-compliant JSON responses, eliminating parsing failures. The TypeScript SDK provides Zod integration via `zodOutputFormat` for type-safe schema definitions. The AI proposal analysis subsystem must be codebase-aware, meaning it needs access to the project's file structure, existing architecture, and dependency graph to assess feasibility -- not just the proposal text.

The secondary challenge is the 3-tier peer review system with weighted consensus. This requires new on-chain state (reviewer profiles with domain experience tracking, review records, review weights), new off-chain models (peer review assignments, review sessions, consensus tracking), and careful incentive design (reviews rewarded at lower rate than code contributions to prevent gaming). The storage decision (on-chain hash + off-chain DB vs Arweave) should follow the existing Phase 2 content-hash pattern: SHA-256 hash stored on-chain, full report in PostgreSQL, with the option to archive to Arweave for permanence.

**Primary recommendation:** Use the Anthropic Claude API with structured outputs (Zod schemas + `output_config.format`) for both AI verification and proposal analysis. Store verification reports using the existing content-hash pattern (SHA-256 on-chain, full report in PostgreSQL). Update contribution scores via direct PDA update (matching the existing `update_contribution_score` instruction pattern from Phase 2). Design the peer review tier system with 3 tiers based on combined domain + volume metrics, requiring minimum 3 reviewers with tier-weighted consensus threshold of 70%.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | latest | Claude API client for AI verification and proposal analysis | Official TypeScript SDK. Supports structured outputs with Zod via `zodOutputFormat`. GA for Claude Opus 4.6 |
| zod | latest | Schema definition for structured AI outputs | Official SDK helper. `zodOutputFormat` transforms Zod schemas to JSON Schema for `output_config.format` |
| Anchor | 0.32.1 | On-chain program framework | Already in use. Extend `gsd-hub` with verification and peer review state/instructions |
| Prisma | ^7.0.0 | Verification report and peer review persistence | Already in use. Add verification and review models |
| Next.js | ^16.0.0 | API routes for verification endpoints | Already in use. Add verification and review API routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.0.0 | Verification UI data fetching | Already in use. Extend for verification report display |
| lucide-react | ^0.563.0 | Icons for verification status, scores, tiers | Already in use |
| Helius webhooks | current | Index verification events from on-chain | Already integrated. Add verification event processor |
| @gsd/utils | workspace:* | Score calculation, hash utilities | Already in use. Extend with verification score weighting |
| @gsd/types | workspace:* | Verification and review type definitions | Already in use. Add verification domain types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude API direct | OpenAI / GPT-4o | Claude's structured outputs (GA) with Zod integration are best-in-class. Project already uses Claude ecosystem. No reason to switch |
| On-chain hash + off-chain DB | Arweave via Irys | Arweave adds permanent storage but costs ~$12/GB, requires AR/SOL payment, adds Irys SDK dependency. Phase 2 already established the content-hash pattern (hash on-chain, data in PostgreSQL). Consistency wins. Arweave can be added later as optional archive layer |
| Direct PDA update | Event + indexer pattern | The existing `update_contribution_score` instruction directly updates the DeveloperProfile PDA. Adding an event+indexer pattern would be architecturally inconsistent and add unnecessary complexity. Direct PDA update is simpler and already proven |
| Custom AI verification | Third-party code review APIs (Qodo, CodeRabbit) | These are code review tools, not GSD workflow verifiers. They cannot verify plan creation, task execution flow, or workflow discipline. The verification must be custom because the GSD workflow is unique |

**Installation:**
```bash
# In apps/web/
pnpm add @anthropic-ai/sdk zod

# zod may already be present transitively via other packages
# @anthropic-ai/sdk is the only truly new dependency

# No new Cargo.toml dependencies -- extending existing gsd-hub program
```

## Architecture Patterns

### Recommended Project Structure (Phase 5 Additions)
```
programs/
  gsd-hub/
    src/
      state/
        mod.rs                              # Add verification + review state modules
        verification_report.rs              # NEW: VerificationReport PDA (per verified task)
        verification_config.rs              # NEW: VerificationConfig singleton (weights, thresholds)
        peer_review.rs                      # NEW: PeerReview PDA (per review per task)
        reviewer_profile.rs                 # NEW: ReviewerProfile PDA (reviewer stats, tier)
      instructions/
        mod.rs                              # Add verification + review instructions
        init_verification_config.rs         # NEW: Initialize verification config
        submit_verification.rs              # NEW: Record AI verification result
        submit_peer_review.rs               # NEW: Record peer review result
        finalize_peer_verification.rs       # NEW: Consensus reached, finalize score
        update_reviewer_profile.rs          # NEW: Update reviewer stats after review
      errors.rs                             # Extend with verification errors

apps/web/
  app/
    api/
      verification/
        submit/
          route.ts                          # NEW: Trigger AI verification for a task
        report/
          [id]/
            route.ts                        # NEW: Get verification report by ID
        reports/
          route.ts                          # NEW: List verification reports (paginated)
        retroactive/
          route.ts                          # NEW: Trigger retroactive re-evaluation
      review/
        assign/
          route.ts                          # NEW: Request peer review assignment
        submit/
          route.ts                          # NEW: Submit peer review
        status/
          [taskId]/
            route.ts                        # NEW: Get review consensus status
      governance/
        rounds/
          [id]/
            ideas/
              route.ts                      # EXTEND: Trigger AI analysis on idea POST
    (public)/
      verification/
        page.tsx                            # NEW: Verification dashboard (all reports)
        [id]/
          page.tsx                          # NEW: Individual verification report view
      profile/
        [wallet]/
          page.tsx                          # EXTEND: Add verification history tab
  components/
    verification/
      VerificationSubmitButton.tsx           # NEW: "Submit for Verification" CTA
      VerificationReport.tsx                # NEW: Full report display (score breakdown)
      VerificationScoreBadge.tsx            # NEW: Compact score display (87/100)
      VerificationHistory.tsx               # NEW: List of verification reports for a user
      ProposalAnalysis.tsx                  # NEW: AI analysis display for governance ideas
    review/
      PeerReviewPanel.tsx                   # NEW: Review submission interface
      ReviewerTierBadge.tsx                 # NEW: Tier display (Explorer/Builder/Architect)
      ReviewConsensusProgress.tsx           # NEW: Progress toward consensus
      FallbackChoicePanel.tsx               # NEW: AI retry vs peer review choice
  lib/
    verification/
      engine.ts                             # NEW: Core AI verification logic (Claude API)
      schemas.ts                            # NEW: Zod schemas for verification output
      workflow-analyzer.ts                  # NEW: GSD workflow artifact analysis
      code-analyzer.ts                      # NEW: Code diff and quality analysis
      proposal-analyzer.ts                  # NEW: AI proposal analysis logic
      scoring.ts                            # NEW: Weighted score computation
      constants.ts                          # NEW: Verification program constants
    review/
      consensus.ts                          # NEW: Tier-weighted consensus calculation
      assignment.ts                         # NEW: Reviewer selection logic
      constants.ts                          # NEW: Review tier definitions, reward rates

packages/
  types/src/
    verification.ts                         # NEW: Verification domain types
    review.ts                               # NEW: Peer review domain types
  utils/src/
    verification-pda.ts                     # NEW: Verification PDA derivations
    verification-hash.ts                    # NEW: Report content hash computation
```

### Pattern 1: AI Verification Engine with Structured Outputs
**What:** Server-side API route that receives a task reference, gathers code diffs, test results, and GSD workflow artifacts, sends them to Claude API with a structured output schema, and returns a deterministic verification report.
**When to use:** When a contributor clicks "Submit for Verification."

```typescript
// lib/verification/schemas.ts
import { z } from 'zod';

export const VerificationCategorySchema = z.object({
  name: z.string(),
  score: z.number(),       // 0-100
  maxScore: z.number(),    // always 100
  findings: z.array(z.object({
    criterion: z.string(),
    met: z.boolean(),
    evidence: z.string(),
    weight: z.number(),
  })),
});

export const VerificationReportSchema = z.object({
  overallScore: z.number(),           // 0-100 combined
  confidence: z.number(),             // 0-100 AI confidence
  codeQuality: VerificationCategorySchema,
  taskFulfillment: VerificationCategorySchema,
  testCoverage: VerificationCategorySchema,
  workflowDiscipline: VerificationCategorySchema,
  filesAnalyzed: z.array(z.string()),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type VerificationReport = z.infer<typeof VerificationReportSchema>;
```

```typescript
// lib/verification/engine.ts
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { VerificationReportSchema } from './schemas';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function verifyTask(context: {
  taskRef: string;
  planContent: string;
  codeDiff: string;
  testResults: string;
  fileList: string[];
}): Promise<z.infer<typeof VerificationReportSchema>> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",  // Cost-effective for verification
    max_tokens: 4096,
    system: `You are a code verification AI for the GSD Community Hub.
Analyze the submitted work against the task plan and score it across four categories:
1. Code Quality (style, patterns, error handling, security)
2. Task Fulfillment (does the code match what the plan specified?)
3. Test Coverage (are tests present, passing, and meaningful?)
4. Workflow Discipline (was the GSD plan followed? Were all tasks completed in order?)

Be strict but fair. Evidence must cite specific files and line ranges.
Confidence below 60 means the submission needs human review.`,
    messages: [{
      role: "user",
      content: `## Task Plan
${context.planContent}

## Code Diff
${context.codeDiff}

## Test Results
${context.testResults}

## Files Changed
${context.fileList.join('\n')}

Verify this submission and produce a detailed verification report.`,
    }],
    output_config: {
      format: zodOutputFormat(VerificationReportSchema),
    },
  });

  return JSON.parse(response.content[0].text);
}
```

### Pattern 2: Codebase-Aware Proposal Analysis
**What:** When an idea is submitted to governance, AI analyzes the proposal against the actual codebase to assess feasibility, estimate impact, and flag risks.
**When to use:** Immediately on idea submission (integrated into the existing POST /api/governance/rounds/:id/ideas endpoint).

```typescript
// lib/verification/proposal-analyzer.ts
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const ProposalAnalysisSchema = z.object({
  feasibilityScore: z.number(),        // 0-100
  estimatedEffort: z.string(),         // "small", "medium", "large", "epic"
  impactAssessment: z.object({
    affectedFiles: z.array(z.string()),
    architecturalImpact: z.string(),   // "none", "minor", "moderate", "major"
    breakingChanges: z.boolean(),
    riskLevel: z.string(),             // "low", "medium", "high", "critical"
  }),
  technicalAnalysis: z.object({
    existingInfrastructure: z.string(),  // What already exists that relates
    requiredNewWork: z.string(),          // What needs to be built
    dependencies: z.array(z.string()),   // External deps needed
    blockers: z.array(z.string()),       // Potential blockers
  }),
  recommendation: z.string(),          // "approve", "needs_revision", "reject"
  reasoning: z.string(),               // Detailed explanation
  costEstimate: z.object({
    solanaFees: z.string(),             // Estimated on-chain costs
    computeResources: z.string(),       // Server/API costs
    developmentTime: z.string(),        // Estimated dev time
  }),
});

export type ProposalAnalysis = z.infer<typeof ProposalAnalysisSchema>;
```

**Integration point:** The existing `POST /api/governance/rounds/:id/ideas` endpoint currently creates an Idea record. After creation, trigger async proposal analysis and store the result in a new `IdeaAnalysis` Prisma model linked to the Idea.

### Pattern 3: Verification Score Weighting Formula
**What:** Combine code output score and workflow discipline score into a single verification score with configurable weighting.
**When to use:** After AI or peer review produces category scores.

**Recommended weighting (Claude's Discretion):**
```
Code Output Weight: 60%
  - Code Quality: 25%
  - Task Fulfillment: 20%
  - Test Coverage: 15%

Workflow Quality Weight: 40%
  - Workflow Discipline: 25%
  - Plan Adherence: 15%

Combined Score = (codeQuality * 0.25 + taskFulfillment * 0.20 + testCoverage * 0.15) +
                 (workflowDiscipline * 0.25 + planAdherence * 0.15)
```

**Rationale:** 60/40 split weights code output slightly higher than workflow because ultimately the code must work. But 40% for workflow is significant enough to reward developers who follow the GSD process, creating the behavioral incentive that makes GSD unique. These weights should be stored in a `VerificationConfig` on-chain account so they can be adjusted via governance.

### Pattern 4: 3-Tier Peer Review System
**What:** When AI confidence is below threshold (recommended: 60%), the contributor chooses between re-submitting with more context or requesting peer review. Peer reviewers are tiered by experience.
**When to use:** Low-confidence AI verification results.

**Recommended Tier Design (Claude's Discretion):**

| Tier | Name | Requirements | Review Weight | Reward Multiplier |
|------|------|-------------|---------------|-------------------|
| 1 | Explorer | 1-9 verified contributions, any domain | 1.0x | 0.15x (15% of code contribution score) |
| 2 | Builder | 10-49 verified contributions, 3+ in review domain | 2.0x | 0.20x (20% of code contribution score) |
| 3 | Architect | 50+ verified contributions, 10+ in review domain | 3.0x | 0.25x (25% of code contribution score) |

**Consensus Rules (Claude's Discretion):**
- Minimum 3 reviewers required for valid peer verification
- Tier-weighted consensus threshold: 70% of total weight must agree
- Example: 1 Architect (3.0) + 1 Builder (2.0) + 1 Explorer (1.0) = 6.0 total weight. Consensus needs 4.2+ weight agreeing.
- If reviewers disagree on pass/fail, the weighted-average score is used with a confidence penalty (-10 points)
- Maximum review time: 7 days. After timeout, contributor can re-submit to AI with more context

**Gamification Elements:**
- Reviewers accumulate "Review XP" that contributes to tier advancement
- Domain expertise is tracked by category tags on contributions (e.g., "on-chain", "frontend", "api", "testing")
- Tier badges displayed on profile (Explorer/Builder/Architect with domain specialties)
- Review quality tracked: if a reviewer's assessment consistently aligns with community consensus, their weight increases; if consistently outlying, their weight decreases (reputation decay for review quality)

### Pattern 5: On-Chain Verification State
**What:** Verification results stored on-chain as PDAs, following the existing content-hash pattern from Phase 2.
**When to use:** After every completed verification (AI or peer).

```rust
// programs/gsd-hub/src/state/verification_report.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VerificationType {
    Ai,
    Peer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VerificationStatus {
    Pending,
    Completed,
    Disputed,
}

#[account]
#[derive(InitSpace)]
pub struct VerificationReport {
    /// The developer whose work was verified (32 bytes)
    pub developer: Pubkey,
    /// SHA-256 hash of task reference (32 bytes)
    pub task_ref: [u8; 32],
    /// PDA bump (1 byte)
    pub bump: u8,
    /// AI or Peer verification (1 byte)
    pub verification_type: VerificationType,
    /// Current status (1 byte)
    pub status: VerificationStatus,
    /// Combined verification score 0-10000 (2 bytes)
    pub score: u16,
    /// AI confidence level 0-10000 (2 bytes)
    pub confidence: u16,
    /// SHA-256 hash of full off-chain report (32 bytes)
    pub report_hash: [u8; 32],
    /// Unix timestamp of verification (8 bytes)
    pub verified_at: i64,
    /// Number of peer reviewers (0 for AI verification) (1 byte)
    pub reviewer_count: u8,
    /// Verification config version used (1 byte)
    pub config_version: u8,
}
// PDA seeds: ["verification", developer.key(), task_ref]
// Total: 8 (disc) + 32 + 32 + 1 + 1 + 1 + 2 + 2 + 32 + 8 + 1 + 1 = 121 bytes
```

### Pattern 6: Score Update Pipeline (Direct PDA Update)
**What:** After verification completes, update the contributor's DeveloperProfile.contribution_score via the existing `update_contribution_score` instruction.
**When to use:** After every successful verification.

**Recommended: Direct PDA Update** (Claude's Discretion decision)

Rationale: The existing Phase 2 architecture uses the `update_contribution_score` instruction to directly update the `DeveloperProfile` PDA. The full flow is:
1. Verification completes (AI or peer) -> verification score produced
2. Server-side recalculates the contributor's aggregate score (incorporating the new verification)
3. Server calls `update_contribution_score` with the new aggregate values
4. Helius webhook picks up the transaction and syncs to the off-chain DB

This is architecturally consistent with Phase 2 and avoids introducing a new event+indexer pattern. The `record_contribution` instruction already records the individual contribution in the Merkle tree; `update_contribution_score` updates the aggregate on the DeveloperProfile. The new AI verification score feeds into this existing pipeline.

### Pattern 7: Report Storage (On-Chain Hash + Off-Chain DB)
**What:** Full verification reports stored in PostgreSQL, SHA-256 hash stored on-chain for integrity verification.
**When to use:** Every verification report.

**Recommended: On-Chain Hash + PostgreSQL** (Claude's Discretion decision)

Rationale:
- Phase 2 established this exact pattern: `content_hash` on-chain, full data in PostgreSQL
- The `VerificationReport` PDA stores `report_hash` (SHA-256 of the full JSON report)
- Anyone can verify integrity: hash the off-chain report and compare to on-chain `report_hash`
- PostgreSQL is free (already running), Arweave costs ~$12/GB
- A typical verification report is 5-15KB JSON. At ~$12/GB, 10,000 reports would cost ~$0.18 on Arweave -- negligible, but adds SDK complexity (Irys) and payment token management
- Arweave can be added later as an optional archive layer without changing the core architecture

### Anti-Patterns to Avoid
- **Sending entire codebase to Claude API:** Token limits and cost. Send only relevant diffs, plan files, and test output. Use file summaries for context, not full file contents
- **Making AI verification score deterministic without seed:** Claude API responses are inherently non-deterministic. Accept variance and design for it (confidence ranges, not exact scores). Use `temperature: 0` to minimize variance but do not promise exact reproducibility
- **Storing full verification reports on-chain:** Reports are 5-15KB each. On-chain storage at Solana rent rates (~0.00696 SOL per byte per year) would cost 35-105 SOL per report. Use content-hash pattern instead
- **Mixing AI verification with peer review in the same PDA:** Keep them separate. AI verification produces a VerificationReport with type=AI. Peer reviews produce PeerReview PDAs. If peer review is needed, a new VerificationReport with type=Peer is created after consensus
- **Trusting AI scores without bounds checking:** Always clamp AI output scores to 0-100 range server-side before on-chain recording. Structured outputs guarantee schema compliance but the values within the schema must be validated
- **Allowing self-review:** A contributor must never be a peer reviewer for their own submission. Enforce this in the assignment logic AND as an on-chain constraint

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI code analysis | Custom LLM inference | Anthropic Claude API with structured outputs | Inference infrastructure, model hosting, prompt engineering. Use managed API |
| JSON schema validation for AI output | Custom JSON parsing + validation | Zod schemas + `zodOutputFormat` from @anthropic-ai/sdk | SDK handles schema transformation, validation, type inference automatically |
| Content hashing for integrity | Custom hash implementation | Existing `@gsd/utils` hash utilities + `crypto.subtle.digest` | Already implemented and battle-tested in Phase 2 |
| Contribution score calculation | New score formula | Existing `calculateContributionScore` from `@gsd/utils/score.ts` | Formula already established and used on-chain. Extend inputs, don't replace |
| PDA derivation patterns | Ad-hoc PDA seeds | Follow existing pattern from `@gsd/utils` (revenue-pda.ts, governance-pda.ts) | Consistency with existing codebase. All PDA helpers follow the same pattern |
| Webhook event processing | Custom event listener | Extend existing Helius webhook handler at `/api/webhooks/helius` | Already handles contribution, governance, and revenue events. Add verification processor |

**Key insight:** Phase 5's uniqueness is in the *what* (verifying GSD workflow + code output) not the *how* (API calls, on-chain storage, webhook indexing). The entire infrastructure stack is already built in Phases 1-4. Phase 5 adds new domain logic (AI verification, peer review, proposal analysis) on top of proven patterns.

## Common Pitfalls

### Pitfall 1: AI Verification Cost Explosion
**What goes wrong:** Each verification call to Claude API costs $0.05-$2.00+ depending on input size (code diffs can be large). With retroactive migration of all Phase 2-4 contributions, costs could reach hundreds of dollars.
**Why it happens:** Sending entire file contents rather than targeted diffs. Using Opus when Sonnet suffices. Not batching retroactive migrations.
**How to avoid:** Use Claude Sonnet 4.5 (cost-effective) for verification, not Opus. Limit code diff context to 50KB per verification. For retroactive migration, batch contributions and use lower-cost models. Implement a cost estimation step before verification. Set monthly API budget limits.
**Warning signs:** API bills exceeding budget. Verification requests timing out due to large inputs.

### Pitfall 2: Non-Deterministic Scoring Creates Disputes
**What goes wrong:** The same code submission verified twice produces different scores (e.g., 82 then 78). Contributors dispute scores.
**Why it happens:** LLM output is inherently non-deterministic even with temperature=0.
**How to avoid:** Set `temperature: 0` to minimize variance. Accept that scores have a +/-5 point variance range and document this. Display score as a range when variance is detected. If a contributor disputes, allow one free re-verification. If scores differ by >10 points, flag for manual review. Never promise exact reproducibility.
**Warning signs:** Multiple re-verification requests. Score variance exceeding 10 points consistently.

### Pitfall 3: Peer Review Gaming (Rubber-Stamping)
**What goes wrong:** Reviewers approve everything to collect review rewards, inflating scores.
**Why it happens:** Review rewards incentivize volume over quality. No accountability for review accuracy.
**How to avoid:** Track review quality: compare individual reviewer scores to consensus. Reviewers whose scores consistently deviate from consensus lose tier weight. Require reviewers to provide evidence (specific file/line references) in their review. Reviews without evidence are rejected. Reward based on review quality, not just participation.
**Warning signs:** Reviewer approval rate >95%. Reviews submitted within seconds (no actual analysis). All reviews giving identical scores.

### Pitfall 4: Codebase Context Overflow in Proposal Analysis
**What goes wrong:** Sending the full codebase to Claude for proposal analysis exceeds context limits (200K tokens) and costs escalate.
**Why it happens:** The requirement is "codebase-aware analysis." Naive implementation sends everything.
**How to avoid:** Build a codebase summary/index: file tree with purpose annotations, dependency graph, architecture overview document. Send this summary (5-10KB) as context, not the full codebase. For specific files the proposal mentions, include only those files. Use the `packages/types/src/*.ts` type definitions as a compact representation of the domain model.
**Warning signs:** Proposal analysis taking >60 seconds. API costs per analysis exceeding $1.

### Pitfall 5: Retroactive Migration Overwhelming the System
**What goes wrong:** Re-evaluating all Phase 2-4 contributions simultaneously overwhelms the Claude API (rate limits), creates burst on-chain transactions (Solana rate limits), and blocks normal operations.
**Why it happens:** Attempting all retroactive verifications at once.
**How to avoid:** Implement as a background job queue. Process 10-20 contributions per hour. Use a separate API key with its own rate limits. Mark retroactive verifications distinctly from new ones. Allow the migration to run over days, not hours. Prioritize contributors with active revenue claims.
**Warning signs:** API rate limit errors (429). Solana transaction failures from burst submissions.

### Pitfall 6: Peer Review Assignment Bias
**What goes wrong:** The same small group of Architect-tier reviewers handles all reviews, creating a bottleneck and potential collusion.
**Why it happens:** Highest-tier reviewers are preferred because their weight accelerates consensus.
**How to avoid:** Require at least one reviewer from a different tier than the others. Randomize assignment within eligible reviewers. Implement cooldown: a reviewer cannot review the same contributor's work consecutively. Track review pair frequency and flag repeated pairings.
**Warning signs:** Same 3-5 reviewers appearing on every review. Review turnaround times increasing as queue grows.

### Pitfall 7: AI Proposal Analysis Blocking Idea Submission
**What goes wrong:** AI analysis runs synchronously on idea submission. If the Claude API is slow or unavailable, the user's idea submission fails.
**Why it happens:** Analysis triggered in the same request as idea creation.
**How to avoid:** Make analysis asynchronous. The idea submission returns immediately (idea created in DB). Analysis runs as a background job. Frontend polls for analysis completion. Display "Analysis in progress..." state. If analysis fails, idea still exists -- it just lacks AI assessment (can be retried).
**Warning signs:** Idea submission taking >10 seconds. Users abandoning submissions.

## Code Examples

### Verification Report Zod Schema (Full)
```typescript
// Source: Anthropic Structured Outputs docs (platform.claude.com/docs/en/build-with-claude/structured-outputs)
import { z } from 'zod';

const FindingSchema = z.object({
  criterion: z.string(),
  met: z.boolean(),
  evidence: z.string(),
  weight: z.number(),
});

const CategorySchema = z.object({
  name: z.string(),
  score: z.number(),
  maxScore: z.number(),
  findings: z.array(FindingSchema),
});

export const VerificationReportOutputSchema = z.object({
  overallScore: z.number(),
  confidence: z.number(),
  categories: z.object({
    codeQuality: CategorySchema,
    taskFulfillment: CategorySchema,
    testCoverage: CategorySchema,
    workflowDiscipline: CategorySchema,
  }),
  filesAnalyzed: z.array(z.string()),
  summary: z.string(),
  recommendations: z.array(z.string()),
});
```

### Using zodOutputFormat with Claude API
```typescript
// Source: Anthropic SDK docs (platform.claude.com/docs/en/build-with-claude/structured-outputs)
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { VerificationReportOutputSchema } from './schemas';

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  messages: [{ role: "user", content: verificationPrompt }],
  output_config: {
    format: zodOutputFormat(VerificationReportOutputSchema),
  },
});

// response.content[0].text is guaranteed valid JSON matching the schema
const report = JSON.parse(response.content[0].text);
```

### Prisma Schema Extensions for Verification
```prisma
model VerificationReport {
  id                   String   @id @default(cuid())
  walletAddress        String
  taskRef              String
  verificationType     String   // "ai" or "peer"
  overallScore         Int      // 0-10000 (matching on-chain precision)
  confidence           Int      // 0-10000
  reportJson           Json     // Full structured report
  reportHash           String   // SHA-256 for on-chain integrity check
  onChainAddress       String?  @unique
  transactionSignature String?  @unique
  status               String   @default("completed")
  configVersion        Int      @default(1)
  createdAt            DateTime @default(now())

  peerReviews          PeerReview[]

  @@index([walletAddress])
  @@index([taskRef])
  @@index([status])
}

model PeerReview {
  id                   String   @id @default(cuid())
  verificationReportId String
  reviewerWallet       String
  reviewerTier         Int      // 1=Explorer, 2=Builder, 3=Architect
  reviewerWeight       Float    // 1.0, 2.0, or 3.0
  score                Int      // 0-10000
  evidenceJson         Json     // Structured review evidence
  reviewHash           String   // SHA-256 for integrity
  onChainAddress       String?  @unique
  transactionSignature String?  @unique
  createdAt            DateTime @default(now())

  verificationReport   VerificationReport @relation(fields: [verificationReportId], references: [id])

  @@unique([verificationReportId, reviewerWallet])
  @@index([reviewerWallet])
}

model ReviewerProfile {
  id                     String   @id @default(cuid())
  walletAddress          String   @unique
  tier                   Int      @default(1) // 1=Explorer, 2=Builder, 3=Architect
  totalReviews           Int      @default(0)
  domainReviews          Json     @default("{}") // { "on-chain": 5, "frontend": 3 }
  verifiedContributions  Int      @default(0)
  domainContributions    Json     @default("{}") // { "on-chain": 12, "frontend": 8 }
  reviewQualityScore     Float    @default(1.0)
  updatedAt              DateTime @updatedAt

  @@index([tier])
}

model IdeaAnalysis {
  id                    String   @id @default(cuid())
  ideaId                String   @unique
  feasibilityScore      Int      // 0-100
  estimatedEffort       String   // "small", "medium", "large", "epic"
  riskLevel             String   // "low", "medium", "high", "critical"
  recommendation        String   // "approve", "needs_revision", "reject"
  analysisJson          Json     // Full structured analysis
  analysisHash          String   // SHA-256 for integrity
  modelUsed             String   // "claude-sonnet-4-5"
  createdAt             DateTime @default(now())

  idea                  Idea @relation(fields: [ideaId], references: [id])

  @@index([feasibilityScore])
}
```

### Verification PDA Derivations
```typescript
// packages/utils/src/verification-pda.ts
import { PublicKey } from "@solana/web3.js";

export const VERIFICATION_CONFIG_SEED = "verification_config";
export const VERIFICATION_REPORT_SEED = "verification";
export const PEER_REVIEW_SEED = "peer_review";
export const REVIEWER_PROFILE_SEED = "reviewer";

export function getVerificationConfigPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VERIFICATION_CONFIG_SEED)],
    programId
  );
}

export function getVerificationReportPDA(
  developer: PublicKey,
  taskRef: Buffer, // 32-byte SHA-256 hash
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VERIFICATION_REPORT_SEED), developer.toBuffer(), taskRef],
    programId
  );
}

export function getPeerReviewPDA(
  reviewer: PublicKey,
  verificationReport: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PEER_REVIEW_SEED),
      reviewer.toBuffer(),
      verificationReport.toBuffer(),
    ],
    programId
  );
}

export function getReviewerProfilePDA(
  reviewer: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(REVIEWER_PROFILE_SEED), reviewer.toBuffer()],
    programId
  );
}
```

### Tier-Weighted Consensus Calculation
```typescript
// lib/review/consensus.ts

export interface ReviewSubmission {
  reviewerTier: 1 | 2 | 3;
  score: number; // 0-100
  pass: boolean;
}

export const TIER_WEIGHTS: Record<number, number> = {
  1: 1.0,  // Explorer
  2: 2.0,  // Builder
  3: 3.0,  // Architect
};

export const MIN_REVIEWERS = 3;
export const CONSENSUS_THRESHOLD = 0.70; // 70% of total weight must agree

export function calculateConsensus(reviews: ReviewSubmission[]): {
  hasConsensus: boolean;
  passed: boolean;
  weightedScore: number;
  totalWeight: number;
  agreementRatio: number;
} {
  if (reviews.length < MIN_REVIEWERS) {
    return { hasConsensus: false, passed: false, weightedScore: 0, totalWeight: 0, agreementRatio: 0 };
  }

  let totalWeight = 0;
  let weightedScoreSum = 0;
  let passWeight = 0;
  let failWeight = 0;

  for (const review of reviews) {
    const weight = TIER_WEIGHTS[review.reviewerTier];
    totalWeight += weight;
    weightedScoreSum += review.score * weight;
    if (review.pass) {
      passWeight += weight;
    } else {
      failWeight += weight;
    }
  }

  const weightedScore = weightedScoreSum / totalWeight;
  const passRatio = passWeight / totalWeight;
  const failRatio = failWeight / totalWeight;

  const hasConsensus = passRatio >= CONSENSUS_THRESHOLD || failRatio >= CONSENSUS_THRESHOLD;
  const passed = passRatio >= CONSENSUS_THRESHOLD;

  return {
    hasConsensus,
    passed,
    weightedScore: Math.round(weightedScore),
    totalWeight,
    agreementRatio: Math.max(passRatio, failRatio),
  };
}
```

### AI Proposal Analysis Integration Point
```typescript
// Extend POST /api/governance/rounds/:id/ideas
// After idea creation, trigger async analysis:

import { analyzeProposal } from '@/lib/verification/proposal-analyzer';

// In the POST handler, after idea upsert:
const idea = await prisma.idea.upsert({ /* existing code */ });

// Trigger async analysis (don't await -- return immediately)
analyzeProposal({
  ideaId: idea.id,
  title: body.title,
  description: body.description,
}).catch((err) => {
  console.error(`Proposal analysis failed for idea ${idea.id}:`, err);
});

// Return idea immediately without waiting for analysis
return NextResponse.json({ idea: serializedIdea }, { status: 200 });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual code review scoring | AI-powered structured verification with Claude API | 2025-2026 | Automated, consistent, auditable scoring. Structured outputs guarantee schema compliance |
| `output_format` parameter (beta) | `output_config.format` (GA) | Late 2025 | No more beta headers required. GA for Opus 4.6, Sonnet 4.5, Opus 4.5, Haiku 4.5 |
| Tool use for structured extraction | `json_schema` output_config + Zod schemas | Late 2025 | Direct JSON output without tool_use wrapper. Simpler, more reliable |
| Manual peer review (unweighted) | Tier-weighted peer review with consensus | Emerging 2025-2026 | Meritocratic review quality. Domain experts carry more weight. Gaming-resistant |
| Off-chain only reports | Content-hash pattern (hash on-chain + data off-chain) | Phase 2 (established) | Integrity verifiable. Existing pattern, no new infrastructure needed |

**Deprecated/outdated:**
- `output_format` parameter (top-level) -- deprecated, use `output_config.format` instead. Old parameter still works temporarily but will be removed
- Beta header `structured-outputs-2025-11-13` -- no longer required for GA models, but still works during transition period
- `client.messages.parse()` with `output_format` -- SDK handles translation internally, but new code should use `output_config.format`

## Open Questions

1. **Claude API Model Selection for Verification**
   - What we know: Claude Sonnet 4.5 is cost-effective (~$3/$15 per MTok input/output). Claude Opus 4.6 is highest quality but more expensive (~$15/$75). Verification needs to be accurate but runs frequently.
   - What's unclear: Whether Sonnet 4.5 produces verification scores of sufficient quality/consistency for production use, or whether Opus-tier is needed for the initial release.
   - Recommendation: Start with **Claude Sonnet 4.5** for cost efficiency. Run a calibration phase during development where the same 20 submissions are verified by both Sonnet and Opus, comparing score distributions. If Sonnet variance is acceptable (+/-5 points of Opus), use Sonnet in production. Reserve Opus for disputed re-verifications.

2. **Retroactive Migration Strategy**
   - What we know: ALL Phase 2-4 contributions must be re-evaluated. The existing contributions have `verificationScore` (0-10000) assigned at record time, but these were not AI-verified.
   - What's unclear: What artifacts exist for Phase 2-4 contributions that can be fed to the AI verifier. If contributions were recorded without associated code diffs or plan files, AI verification may have limited inputs.
   - Recommendation: For contributions with associated git history (commits, PRs), run full AI verification. For contributions without recoverable artifacts, assign a "legacy" verification type with the original score preserved but flagged as "pre-AI." This prevents penalizing early contributors while establishing the new baseline going forward.

3. **AI-Score Weighted Voting Influence**
   - What we know: AI analysis score should have weighted influence on voting outcomes. Technically impossible proposals cannot pass even with majority vote.
   - What's unclear: The exact mechanism. Does a low AI score reduce the proposal's effective vote count? Does it require a higher quorum? Does it add an automatic "no" vote with weight proportional to (100 - feasibilityScore)?
   - Recommendation: Use a **feasibility gate**: proposals with AI feasibility score below 30/100 are automatically flagged as "technically infeasible" and require 80% supermajority (instead of normal quorum) to pass. Proposals scoring 30-60 are flagged "needs revision" and display a warning. Proposals 60+ proceed normally. This acts as a quality filter without completely overriding community governance.

4. **Domain Tagging for Reviewer Matching**
   - What we know: Peer reviewers are weighted by domain expertise. Domains include "on-chain", "frontend", "api", "testing", etc.
   - What's unclear: How contributions get domain-tagged. Manual by contributor? AI-inferred from file paths? Fixed list vs. freeform?
   - Recommendation: **AI-inferred from file paths** during verification. The verification engine analyzes which files were changed and assigns domain tags automatically (e.g., `programs/**/*.rs` -> "on-chain", `components/**/*.tsx` -> "frontend", `app/api/**` -> "api", `tests/**` -> "testing"). Store as an array on the contribution/verification record. Allow contributors to correct/add tags manually. Keep a fixed list of valid domains to prevent fragmentation.

5. **Verification Report Versioning**
   - What we know: The verification scoring weights and criteria will evolve over time.
   - What's unclear: How to handle reports verified under different versions of the scoring rubric.
   - Recommendation: Include a `config_version` field on every VerificationReport PDA and Prisma record. The `VerificationConfig` on-chain account stores the current version number and weight parameters. Historical reports display "Verified under v1 criteria" for transparency. Score comparisons across versions display a caveat.

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - Confirmed: `output_config.format` with `json_schema` type. GA for Opus 4.6, Sonnet 4.5, Opus 4.5, Haiku 4.5. Zod integration via `zodOutputFormat`. `output_format` deprecated in favor of `output_config.format`
- Existing codebase: `programs/gsd-hub/src/` - Confirmed all on-chain state patterns (PDA seeds, content hashing, score storage, Anchor 0.32.1)
- Existing codebase: `apps/web/lib/contributions/indexer.ts` - Confirmed Helius webhook processing pattern, base58 decoding, Prisma upsert for idempotency
- Existing codebase: `packages/utils/src/score.ts` - Confirmed contribution score formula: `sqrt(tasks) * totalVerificationScore * sqrt(days) / PRECISION`
- Existing codebase: `packages/types/src/contribution.ts` - Confirmed `verificationScore` field is u16 (0-10000) mapped to 0.00%-100.00%

### Secondary (MEDIUM confidence)
- [Anthropic Structured Outputs announcement](https://www.anthropic.com/engineering/advanced-tool-use) - Confirmed structured outputs feature, beta launch Nov 2025, GA status for supported models
- [Arweave vs IPFS storage analysis](https://future.forem.com/ribhavmodi/where-blockchain-data-actually-lives-ipfs-arweave-the-2026-storage-war-2bka) - Arweave ~$12/GB one-time, endowment model, permanent storage. Confirmed cost-prohibitive for small JSON documents vs PostgreSQL
- [AI Code Review Tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/) - Confirmed industry trend toward agentic multi-criteria code review with scoring rubrics
- [Gamification in Peer Review](https://link.springer.com/article/10.1007/s10639-020-10228-x) - Confirmed that gamification increases peer review participation; points + badges + tiers are effective patterns

### Tertiary (LOW confidence -- needs validation)
- Claude API pricing for Sonnet 4.5 vs Opus 4.6 -- based on training data, may have changed. Verify current pricing before budgeting
- @anthropic-ai/sdk latest npm version -- could not confirm exact version number due to npm registry access. Use `pnpm add @anthropic-ai/sdk@latest` at implementation time
- Review quality tracking via consensus deviation -- novel design for this project, not verified against existing implementations. Needs empirical testing during development

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core stack is the existing gsd-hub program + Anthropic Claude API (well-documented, GA). Only new dependency is @anthropic-ai/sdk
- Architecture: MEDIUM-HIGH - On-chain patterns follow established Phase 2-4 conventions. AI verification engine is novel but uses well-documented API features. Proposal analysis integration point is clearly identified
- Peer review system: MEDIUM - Tier design, consensus rules, and gamification elements are custom designs based on research but not validated against production systems. Will need iteration
- Pitfalls: HIGH - Well-understood patterns from AI API usage, LLM non-determinism, peer review gaming, and on-chain cost constraints
- Retroactive migration: LOW - Depends on what artifacts exist for Phase 2-4 contributions. May need to be scoped down during planning

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days -- Claude API features stable post-GA, but pricing may change)
