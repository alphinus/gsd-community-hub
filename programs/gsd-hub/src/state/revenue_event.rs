use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RevenueStatus {
    Recorded,
    Distributing,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RevenueToken {
    Sol,
    Usdc,
}

#[account]
#[derive(InitSpace)]
pub struct RevenueEvent {
    /// Sequential event index (4 bytes)
    pub event_index: u32,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Bump for the developer_pool_vault PDA (1 byte)
    pub vault_bump: u8,
    /// Token type for this revenue event (1 byte)
    pub token: RevenueToken,
    /// Total revenue amount received (8 bytes)
    pub total_amount: u64,
    /// Amount allocated to developer pool (8 bytes)
    pub developer_pool: u64,
    /// Amount allocated to treasury reserve (8 bytes)
    pub treasury_reserve: u64,
    /// Amount allocated for $GSD burn (8 bytes)
    pub burn_amount: u64,
    /// Amount allocated to maintenance (8 bytes)
    pub maintenance_amount: u64,
    /// Current status of this revenue event (1 byte)
    pub status: RevenueStatus,
    /// Unix timestamp when event was recorded (8 bytes)
    pub recorded_at: i64,
    /// Signature of the originating revenue transaction (64 bytes)
    pub origin_signature: [u8; 64],
    /// Total contribution score snapshotted at recording time (8 bytes)
    pub total_contribution_score: u64,
    /// How much of developer_pool has been claimed (8 bytes)
    pub claimed_amount: u64,
    /// Signature of the burn transaction, zeroed until burn executes (64 bytes)
    pub burn_signature: [u8; 64],
    /// Actual $GSD tokens burned (8 bytes)
    pub gsd_burned: u64,
}
// PDA seeds: ["revenue_event", event_index.to_le_bytes()]
// Total: 8 (disc) + 4 + 1 + 1 + 1 + 8 + 8 + 8 + 8 + 8 + 1 + 8 + 64 + 8 + 8 + 64 + 8 = 226 bytes
