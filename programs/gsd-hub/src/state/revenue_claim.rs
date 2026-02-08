use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RevenueClaim {
    /// Wallet that claimed the revenue share (32 bytes)
    pub claimant: Pubkey,
    /// The RevenueEvent account this claim is for (32 bytes)
    pub revenue_event: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Contributor's score at claim time (8 bytes)
    pub contribution_score: u64,
    /// Total contribution score from RevenueEvent snapshot (8 bytes)
    pub total_score: u64,
    /// Amount claimed (8 bytes)
    pub amount: u64,
    /// Unix timestamp of when the claim was made (8 bytes)
    pub claimed_at: i64,
}
// PDA seeds: ["revenue_claim", claimant.key(), revenue_event.key()]
// Total: 8 (disc) + 32 + 32 + 1 + 8 + 8 + 8 + 8 = 105 bytes
