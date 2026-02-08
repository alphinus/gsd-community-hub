use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RevenueConfig {
    /// Authority who can update config (32 bytes)
    pub admin: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Developer pool basis points, e.g. 6000 = 60% (2 bytes)
    pub developer_bps: u16,
    /// Treasury reserve basis points, e.g. 2000 = 20% (2 bytes)
    pub treasury_bps: u16,
    /// Burn basis points, e.g. 1000 = 10% (2 bytes)
    pub burn_bps: u16,
    /// Maintenance basis points, e.g. 1000 = 10% (2 bytes)
    pub maintenance_bps: u16,
    /// Where treasury reserve share goes (32 bytes)
    pub treasury_address: Pubkey,
    /// Where maintenance share goes (32 bytes)
    pub maintenance_address: Pubkey,
    /// $GSD token mint for burn (32 bytes)
    pub gsd_mint: Pubkey,
    /// USDC mint address (32 bytes)
    pub usdc_mint: Pubkey,
    /// Total revenue events recorded (4 bytes)
    pub event_count: u32,
    /// Minimum amount to trigger distribution (8 bytes)
    pub min_revenue_threshold: u64,
}
// PDA seeds: ["revenue_config"]
// Total: 8 (disc) + 32 + 1 + 2 + 2 + 2 + 2 + 32 + 32 + 32 + 32 + 4 + 8 = 189 bytes
