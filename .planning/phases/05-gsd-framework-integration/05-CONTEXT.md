# Phase 5: GSD Framework Integration - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-powered task verification and automated contribution scoring — connecting the GSD framework to the contribution pipeline so every piece of work is verifiably proven on-chain. This is the differentiating feature that no other memecoin/Web3 community project has: cryptographic proof of real work, AI-assessed and publicly auditable. Includes AI-powered proposal analysis that acts as a quality filter for governance.

</domain>

<decisions>
## Implementation Decisions

### Task Verification Flow
- AI verifies BOTH code output AND full GSD workflow (plan created, executed, tests passed, code quality) — not just the result but the path
- Both dimensions feed into a combined verification score with configurable weighting
- Contributor triggers verification manually ("Submit for Verification") — not automatic
- Score displayed as total (e.g., 87/100) with full breakdown by categories (code quality, task fulfillment, workflow discipline)
- Complete AI verification report is publicly visible — maximum transparency: what was checked, which files changed, which criteria met/not met
- Every verification report is publicly auditable by any community member

### AI Proposal Analysis
- AI analysis runs immediately on idea submission — community sees AI assessment alongside the proposal instantly
- AI is codebase-aware: analyzes current codebase and estimates impact on existing architecture, not just the proposal text in isolation
- AI-Score has weighted influence on voting outcomes — technically impossible proposals cannot pass even with majority vote (quality filter)
- Output format: Claude's discretion to design optimal presentation (structured report vs pro/contra vs hybrid based on UX research)

### Fallback & Fairness (3-Tier Review System)
- When AI confidence is below threshold, contributor chooses: Peer Review OR re-submit with more context for another AI attempt
- Peer Review uses a 3-tier weighted system based on:
  - Domain-specific experience of the reviewer (contributions in the same area)
  - Total number of verified contributions the reviewer has made
  - Derived review weight from these two factors — experienced domain reviewers carry more weight
- Tier system design: Claude's discretion (research optimal tier boundaries, gamification patterns, and how it integrates with existing score formula)
- Peer Reviews are rewarded as contributions but at a lower rate than code contributions — incentive to review without score inflation
- Consensus rules for valid manual verification: Claude's discretion (design optimal minimum reviewers / tier-weighted consensus threshold)

### Framework-Pipeline
- Verification results go on-chain immediately after completion (both AI and Peer) — real-time transparency
- Report storage strategy: Claude's discretion (hash on-chain + off-chain vs Arweave — choose based on cost analysis and existing Phase 2 content-hash pattern)
- Score update mechanism: Claude's discretion (direct PDA update vs event+indexer — choose based on existing Phase 2/4 architecture consistency)
- Retroactive migration: ALL existing contributions from Phase 2-4 will be re-evaluated through AI verification to establish a fair baseline for everyone

### Claude's Discretion
- AI proposal analysis output format (structured report, pro/contra, or hybrid)
- Peer Review tier system design (tier boundaries, naming, gamification elements)
- Peer Review consensus rules (minimum reviewers, tier-weighted thresholds)
- Report storage strategy (on-chain hash + off-chain DB vs Arweave permanent storage)
- Score update pipeline pattern (direct PDA update vs event + indexer)
- Verification score weighting formula (code output weight vs workflow quality weight)

</decisions>

<specifics>
## Specific Ideas

- "Es soll das revolutionärste Web3-Projekt werden" — This phase is THE differentiator. No other memecoin project has AI-verified proof of real developer work. Design every feature with this positioning in mind.
- The 3-tier peer review system should make reviewing itself engaging — building review weight through contributions creates a meritocratic flywheel
- Reviews rewarded at lower rate than code: prevents gaming while incentivizing participation
- Contributor choice on fallback (AI retry vs peer review) respects creator autonomy — no one gets stuck in a process they can't influence
- Retroactive migration ensures early contributors aren't disadvantaged — everyone starts Phase 5 on a re-verified fair baseline
- AI as governance quality filter (weighted voting influence) prevents technically impossible proposals from wasting community resources
- Codebase-aware proposal analysis means the AI can say "we already have X, this would require changing Y" — dramatically more valuable than generic feasibility

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-gsd-framework-integration*
*Context gathered: 2026-02-08*
