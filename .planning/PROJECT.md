# GSD Community Hub

## What This Is

A decentralized community development platform built on Solana that transforms the existing $GSD memecoin into a genuine utility token. Teams collaborate through time-bounded idea rounds, wallet-verified contributions, and on-chain governance — powered by the open-source GSD execution framework. Revenue from successful projects is distributed fairly based on verifiable contribution history.

## Core Value

Every contributor's work is tracked on-chain and rewarded proportionally — if the software succeeds economically, participants earn their fair share based on verified contributions.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Wallet-verified developer registration on Solana (PDA-based identity)
- [ ] Idea Pool with time-bounded submission rounds
- [ ] $GSD-weighted voting and approval system (SPL Governance)
- [ ] On-chain contribution tracking with verifiable developer history
- [ ] Revenue sharing based on contribution weight (SolSplits)
- [ ] Team workspace for collaborative development
- [ ] Integration with GSD execution framework for AI-powered development
- [ ] Token burn mechanism on revenue events

### Out of Scope

- Custom L1/L2 blockchain — Too complex for v1, revisit after proving utility on Solana
- Mobile native app — Web-first, responsive design sufficient for v1
- Real-time chat/messaging — Use existing tools (Discord/Telegram), don't rebuild
- NFT marketplace — Not core to contribution/revenue model
- Cross-chain bridges — Solana-only for v1
- Fiat on/off ramps — External wallets handle this
- AI agent marketplace — Future consideration after core platform proves value

## Context

**Token Context:**
- $GSD exists on Solana: `GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig6N3j1`
- ~3,390 holders, ~$900K-$3.6M market cap, post-selloff
- Token currently rides on GSD framework branding but lacks genuine utility
- Community needs proof that real development is happening

**Strategic Context:**
- Memecoin mindshare collapsed ~90% in 2025 (from 20% to 2.5%)
- "Utility nachträglich" is normally a top signal — but GSD is different because the open-source framework EXISTS BEFORE the token
- This isn't a rescue attempt — it's evolution from meme to mission
- The GSD framework (11 AI agents, 40+ workflows) provides genuine tech foundation

**Technical Foundation:**
- GSD Plugin System: goal-backward verification, wave-based parallel execution, per-task atomic commits
- Solana State Compression: Merkle trees for 99.9% cheaper on-chain storage
- SPL Governance (Realms): Solana-native DAO framework
- SolSplits: On-chain revenue splitting
- Protocol Guild time-weight formula for fair contribution scoring

**Research Findings:**
- Successful utility transitions: Solana (SOL), XRP — key was delivering real product
- Anti-patterns: Dogecoin (utility without product), SafeMoon (unsustainable tokenomics)
- Relevant models: Coordinape (peer allocation), SourceCred (algorithmic scoring), Protocol Guild (time-weighted)
- On-chain identity: ERC-8004 (trustless agent identity, live Jan 2026)
- Governance: Snapshot (off-chain gasless voting), Realms (on-chain SPL Governance)

## Constraints

- **Blockchain**: Solana — $GSD token already exists here, no migration possible
- **Token Contract**: Existing SPL token `GSD4YHbEyRq6rZGzG6c7uikMMmeRAZ2SnwNGEig6N3j1` — cannot modify, must build utility around it
- **Open Source**: Everything must be fully open source — transparency is non-negotiable for trust rebuilding
- **Identity**: GSD branding and philosophy must be reflected — "get shit done" culture, not corporate governance theater
- **Trust**: Every claim must be verifiable on-chain — community has rug fear from selloff
- **Framework**: Must integrate with actual GSD execution framework — this is what makes it real, not vapor

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build on Solana (not custom chain) | $GSD token already exists on Solana, proven ecosystem | — Pending |
| PDA-based developer registry | On-chain, permissionless, verifiable identity | — Pending |
| SPL Governance for voting | Native Solana integration, battle-tested with Realms | — Pending |
| Contribution-weighted revenue sharing | Fair distribution based on verified work, not token holdings alone | — Pending |
| Time-bounded idea rounds | Creates urgency, prevents stagnation, enables structured evaluation | — Pending |
| √(tokens) quadratic voting | Prevents whale dominance while still rewarding holders | — Pending |
| 60/20/10/10 revenue split | 60% devs, 20% treasury, 10% buy-and-burn, 10% maintenance | — Pending |
| Open source from day one | Trust rebuilding requires full transparency | — Pending |

## Future Vision: GSD as Protocol

Captured from Rettungsplan v3.0 (2026-02-08) for future roadmap consideration. Does not affect current milestone scope.

**Core idea:** Evolve GSD from a single tool to an open, client-agnostic protocol. Define structured schemas (`.gsd/` directory: `project.json`, `requirements.json`, `roadmap.json`, `plan.json`, `state.json`) so that any IDE/CLI (Claude Code, Cursor, OpenCode, Gemini CLI) can implement GSD workflows. The protocol standardizes how AI-assisted build flows are structured, making GSD the common language across dev environments.

**Related concepts:**
- Deterministic Mode: fixed LLM settings for reproducible team outputs
- Build League: continuous seasonal challenges replacing one-off hackathons (weekly micro-challenges, monthly majors, USDT primary rewards + GSD vesting bonus)
- awesome-gsd: curated extension registry as immediate-value first step before full showcase platform
- Anti-Rug Standard: exportable checklist/badge for transparent token governance that other projects can adopt

**When to revisit:** After Phase 4 (revenue mechanics proven), evaluate protocol extraction as Phase 7+.

---
*Last updated: 2026-02-08 after Rettungsplan v3.0 review*
