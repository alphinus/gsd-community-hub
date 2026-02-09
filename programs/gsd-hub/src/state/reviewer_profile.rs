use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ReviewerProfile {
    /// Reviewer's authority public key (32 bytes)
    pub authority: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Reviewer tier: 1=Explorer, 2=Builder, 3=Architect (1 byte)
    pub tier: u8,
    /// Total number of reviews submitted (4 bytes)
    pub total_reviews: u32,
    /// Total verified contributions (4 bytes)
    pub verified_contributions: u32,
    /// Review quality score 0-10000 (2 bytes)
    pub quality_score: u16,
    /// Unix timestamp of last profile update (8 bytes)
    pub updated_at: i64,
}
// PDA seeds: ["reviewer", authority.key()]
// Total: 8 + 32 + 1 + 1 + 4 + 4 + 2 + 8 = 60 bytes
// NOTE: Domain-specific review/contribution counts stored off-chain in Prisma (JSON fields).
// On-chain stores only aggregate totals for tier derivation.
