use anchor_lang::prelude::*;

use super::idea_round::QuorumType;

#[account]
#[derive(InitSpace)]
pub struct GovernanceConfig {
    /// Admin authority who can create rounds and manage governance (32 bytes)
    pub admin: Pubkey,
    /// Authority allowed to veto approved ideas (32 bytes)
    pub veto_authority: Pubkey,
    /// SPL token mint used for governance voting (32 bytes)
    pub governance_token_mint: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Total rounds created (4 bytes)
    pub round_count: u32,
    /// Total tokens currently deposited across all vote deposits (8 bytes)
    pub total_deposited: u64,
    /// Seconds tokens must be deposited before voting eligibility, default 7 days (8 bytes)
    pub deposit_timelock: i64,
    /// Seconds after approval before idea can be executed, default 48 hours (8 bytes)
    pub execution_timelock: i64,
}
// PDA seeds: ["governance_config"]
// Total: 8 (disc) + 32 + 32 + 32 + 1 + 4 + 8 + 8 + 8 = 133 bytes

impl QuorumType {
    /// Returns the required basis points (bps) for quorum.
    /// Small = 5%, Treasury = 20%, ParameterChange = 33%
    pub fn required_bps(&self) -> u64 {
        match self {
            QuorumType::Small => 500,
            QuorumType::Treasury => 2000,
            QuorumType::ParameterChange => 3300,
        }
    }
}
