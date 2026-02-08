use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RoundStatus {
    Open,
    Voting,
    Closed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum QuorumType {
    Small,
    Treasury,
    ParameterChange,
}

#[account]
#[derive(InitSpace)]
pub struct IdeaRound {
    /// Authority who created this round (32 bytes)
    pub authority: Pubkey,
    /// Sequential index of this round (4 bytes)
    pub round_index: u32,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Current status of the round (1 byte)
    pub status: RoundStatus,
    /// Unix timestamp when idea submissions open (8 bytes)
    pub submission_start: i64,
    /// Unix timestamp when idea submissions close (8 bytes)
    pub submission_end: i64,
    /// Unix timestamp when voting ends (8 bytes)
    pub voting_end: i64,
    /// Number of ideas submitted to this round (4 bytes)
    pub idea_count: u32,
    /// Quorum type determining required vote threshold (1 byte)
    pub quorum_type: QuorumType,
    /// SHA-256 hash of off-chain round metadata (32 bytes)
    pub content_hash: [u8; 32],
}
// PDA seeds: ["idea_round", round_index.to_le_bytes()]
// Total: 8 + 32 + 4 + 1 + 1 + 8 + 8 + 8 + 4 + 1 + 32 = 107 bytes
