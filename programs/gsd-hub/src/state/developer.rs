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

    // --- Contribution score fields (appended for backward compatibility) ---

    /// Number of verified tasks completed (4 bytes)
    pub tasks_completed: u32,
    /// Sum of all verification scores, for average calculation (8 bytes)
    pub total_verification_score: u64,
    /// Days active since first contribution (4 bytes)
    pub time_active_days: u32,
    /// Contribution score scaled by 1e6 for fixed-point precision (8 bytes)
    pub contribution_score: u64,
    /// Unix timestamp of first contribution, 0 = none yet (8 bytes)
    pub first_contribution_at: i64,
    /// Unix timestamp of most recent contribution (8 bytes)
    pub last_contribution_at: i64,
    /// Score formula version, starts at 1 (1 byte)
    pub score_version: u8,
}
// Total: 8 (discriminator) + 32 + 1 + 8 + 8 + 32 + 4 + 8 + 4 + 8 + 8 + 8 + 1 = 130 bytes (122 data + 8 disc)
