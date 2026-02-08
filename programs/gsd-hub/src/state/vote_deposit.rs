use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VoteDeposit {
    /// Wallet that deposited tokens (32 bytes)
    pub authority: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Amount of governance tokens deposited (8 bytes)
    pub deposited_amount: u64,
    /// Unix timestamp when tokens were deposited (8 bytes)
    pub deposit_timestamp: i64,
    /// Unix timestamp when tokens become eligible for voting (8 bytes)
    pub eligible_at: i64,
    /// Number of currently active votes using this deposit (4 bytes)
    pub active_votes: u32,
}
// PDA seeds: ["vote_deposit", authority.key()]
// Total: 8 + 32 + 1 + 8 + 8 + 8 + 4 = 69 bytes
