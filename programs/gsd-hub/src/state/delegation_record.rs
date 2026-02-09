use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DelegationRecord {
    /// Wallet that delegated their voting power (32 bytes)
    pub delegator: Pubkey,
    /// Wallet receiving the delegated voting power (32 bytes)
    pub delegate: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Amount of voting power delegated (8 bytes)
    pub delegated_amount: u64,
    /// Unix timestamp when delegation was created (8 bytes)
    pub delegated_at: i64,
    /// Whether the delegation is currently active (1 byte)
    pub is_active: bool,
    /// Round index from which this delegation takes effect (4 bytes)
    pub effective_from_round: u32,
}
// PDA seeds: ["delegation", delegator.key()]
// Total: 8 (disc) + 32 + 32 + 1 + 8 + 8 + 1 + 4 = 94 bytes
