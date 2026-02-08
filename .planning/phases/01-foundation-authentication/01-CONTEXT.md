# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning
**Timeline target:** 14 days

<domain>
## Phase Boundary

Security-first project scaffold with wallet auth, on-chain identity, and multisig governance. Developers can connect their Solana wallet, create an on-chain identity, and trust that the platform is secure and transparent from day one.

This is not just infrastructure — it's the launchpad for the GSD Community Hub. Every feature must feel like joining a movement, not signing up for a service.

</domain>

<strategic_context>
## Strategic Context

### Community Mission
"Zusammen zeigen wir es denen, die uns an den Boden drücken wollten."

The GSD Community Hub is a revolution in the AI age — real people with real ideas, supported by AI, united through GSD. Not 1800 scattered forks — one coordinated platform that channels all participating minds into shipping together.

Core principles (non-negotiable):
1. **Utility-first, always.** Product/output creates demand; the token is an amplifier, not the purpose
2. **Open source as core identity.** Public results, reproducible, documented, usable
3. **Output over opinion.** Social proof through demos, releases, tutorials, real usage
4. **Community = one team.** Shared standards, shared repo structure, shared releases
5. **Anti-shill policy.** No price targets, no "buy" calls, no "moon marketing" as main message

**Mantra:** Utility → Reputation → Adoption → Token demand (as consequence)
**Brand:** "Open Source. Real Utility. For All. For Ever."
**Design principle:** "Nicht reden. Bauen. Zeigen. Wiederholen." (Don't talk. Build. Show. Repeat.)

### On-Chain Market Context
The $GSD token is in late accumulation / re-accumulation phase:
- Conviction holders are accumulating while price is weak — classic strong-hand positioning
- Large transfer spikes (Jan 17, Feb 7-8) are repositioning, not panic selling
- Top wallets are net receivers, not dumpers — rotation from weak to strong hands
- Exchange balances stable — no rush to exits
- Distribution score (top 100 ≈ 60%) is structural (LPs, bots, smart traders, infra) not predatory
- Price lagging ownership shift = bullish asymmetry

KOLs coordinated dumps based on narrative, not fundamentals. The same KOLs flip sentiment on a whim. The platform doesn't need to "save" $GSD — the on-chain data shows the token is healthy. The platform is the catalyst for narrative to catch up to fundamentals.

### GSD Framework Adoption Reality
- Praised and integrated in daily workflows of FAANG and Fortune 500 companies
- Users include founders, CTOs, AI/ML experts, senior devs with decades of experience
- Developers who were inactive on social media came out of years-long hiatus to post about GSD
- The open-source framework EXISTS BEFORE the token — this is evolution from meme to mission

</strategic_context>

<decisions>
## Implementation Decisions

### Wallet & Auth Flow
- **Pre-connect experience:** Claude's Discretion — balance between full open access and encouraging wallet connect, guided by "proof visible" strategy
- **Session management:** Claude's Discretion — balance security vs convenience for a dApp context
- **Wallet support:** Claude's Discretion — evaluate Wallet Standard (broad support) vs targeted Big 3
- **Token balance display:** Claude's Discretion — consider whether subtle $GSD balance display builds anticipation or contradicts token-optional Phase 1

### Developer Profiles
- **Identity model:** Both personal identity + on-chain reputation — name, bio, links combined with contribution data
- **External links:** Claude's Discretion — evaluate allowing GitHub/Twitter/X links for bridging crypto and dev identity
- **Data storage:** Claude's Discretion — optimize the on-chain vs off-chain tradeoff for cost, decentralization, and UX
- **Developer directory:** Claude's Discretion — consider a browsable directory that makes the community visible and shows growth (aligns with "proof visible" strategy)
- **Profile as movement:** Creating a profile = joining the GSD community. The directory is proof the community exists and is growing

### Tech Stack & Scaffold
- **Frontend:** Claude's Discretion — evaluate based on Solana ecosystem compatibility and developer experience
- **Solana programs:** Claude's Discretion — evaluate Anchor vs native Rust for development speed vs control
- **Repository:** Claude's Discretion — evaluate monorepo vs separate repos for this project's needs
- **Hosting:** Claude's Discretion — evaluate iteration speed vs decentralization for Phase 1
- **GitHub Org structure:** Platform should align with the SSOT vision — structured repos with submission standards

### Multisig & Security
- **Signer composition:** 3 core team + 2 trusted community members — signals shared ownership from day one
- **Transparency:** Claude's Discretion — evaluate a dedicated security/transparency page showing multisig details (aligns with "proof visible"). Consider framing as an "Anti-Rug Standard" — a reusable checklist that other Solana projects could adopt. Position $GSD as the reference example for transparent token governance. Include: mint authority status, freeze/metadata authority policies, all token parameters documented.
- **Network:** Claude's Discretion — evaluate devnet-first vs mainnet approach for security-first phase
- **Public changelog:** YES — every program upgrade logged with what changed, who signed, and on-chain tx. Full transparency for skeptics. Non-negotiable trust signal.

### Trust & Tone
- **Strategy:** Work first, proof visible — ship real product that speaks for itself, but make real adoption data easily discoverable
- **No defensive posture:** The on-chain data makes the bull case. The platform just needs to be undeniably real
- **Confidence, not desperation:** This is building from a position of strength (real framework, real adoption, accumulating holders)

### Claude's Discretion (Summary)
Claude has flexibility on technical implementation details across wallet flow, session management, wallet support, token display, external links, data storage model, developer directory, frontend framework, Solana program framework, repo structure, hosting, network target, and security transparency page. All decisions should be guided by:
1. The "proof visible" trust strategy
2. The 14-day delivery timeline
3. The community-first, utility-first philosophy
4. Security-first approach (this is a financial platform on Solana)

</decisions>

<specifics>
## Specific Ideas

### Platform as Community Engine
- Not a tool people use alone — a place where builders connect and build together
- Every merge becomes marketing (shorts engine vision for later)
- Idea pool → project pipeline is the core workflow (seed in Phase 1, full governance in Phase 3)
- The platform must feel alive from day one — not a ghost town waiting for features

### Rescue Plan Elements Relevant to Phase 1
- GitHub Org as SSOT with structured repos and submission standards
- Submission standard: README + demo + pitch + tags (no demo = no merge, no docs = no merge)
- Pinboard/Showcase concept — auto-generated project gallery from GitHub (seed for later phases)
- Metrics that matter: submissions, merge rate, reuse (forks/stars/issues), active projects after 30 days

### Content & Social Hook Templates (For Later Reference)
- "Diese Woche hat die Community in 48h ___ gebaut."
- "Open Source, real nutzbar: ___ in 20 Sekunden."
- "Kein Shill. Nur Output: ___."
- "Fork das, bau's aus, veröffentliche es."

### Enterprise Utility Signal
- Team solution locally hostable (Docker/Compose) as killer utility — real payment willingness
- Independent from token — and exactly therefore strong
- Roles/teams/permissions for organizational use

</specifics>

<deferred>
## Deferred Ideas

### For Future Phases (Captured from Rescue Plan)
- **Shorts Engine** — Automated content pipeline from merges/demos → social media (parallel workstream)
- **Pinboard/Showcase v1** — Auto-generated project gallery from GitHub submissions
- **Hackathon Factory** — Monthly hackathons with manipulation-resistant judging, USDT primary + GSD vesting bonus
- **Team Edition / Local-host** — Docker/Compose setup with roles, teams, permissions for enterprise
- **Anti-sybil voting** — No fresh accounts without activity for community voting
- **Retention bonus** — Projects still active after 30 days get additional reward
- **Community governance for token** — Access/perks only if genuine utility, no paywall

### For Roadmap Consideration
- Submission-based contribution model (PR-driven, not just task-tracking)
- "Best of Month" compilation releases
- Automated shorts generation from demo.mp4 + pitch.md

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-02-08*
