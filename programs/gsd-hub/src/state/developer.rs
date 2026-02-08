use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DeveloperProfile {
    /// The wallet that owns this profile (32 bytes)
    pub authority: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Unix timestamp of profile creation (8 bytes)
    pub created_at: i64,
    /// Unix timestamp of last update (8 bytes)
    pub updated_at: i64,
    /// SHA-256 hash of off-chain profile data (32 bytes)
    pub profile_hash: [u8; 32],
}
// Total: 8 (discriminator) + 32 + 1 + 8 + 8 + 32 = 89 bytes
