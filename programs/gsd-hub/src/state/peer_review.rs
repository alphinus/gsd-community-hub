use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PeerReview {
    /// Reviewer's public key (32 bytes)
    pub reviewer: Pubkey,
    /// Links to the VerificationReport PDA (32 bytes)
    pub verification_report: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Reviewer tier: 1=Explorer, 2=Builder, 3=Architect (1 byte)
    pub tier: u8,
    /// Tier weight in basis points (1000, 2000, 3000) (2 bytes)
    pub weight: u16,
    /// Review score 0-10000 (2 bytes)
    pub score: u16,
    /// Reviewer's pass/fail verdict (1 byte)
    pub passed: bool,
    /// SHA-256 of full off-chain review evidence (32 bytes)
    pub review_hash: [u8; 32],
    /// Unix timestamp when review was submitted (8 bytes)
    pub reviewed_at: i64,
}
// PDA seeds: ["peer_review", reviewer.key(), verification_report.key()]
// Total: 8 + 32 + 32 + 1 + 1 + 2 + 2 + 1 + 32 + 8 = 119 bytes
