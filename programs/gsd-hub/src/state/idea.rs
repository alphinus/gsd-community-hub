use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum IdeaStatus {
    Submitted,
    Approved,
    Rejected,
    Vetoed,
}

#[account]
#[derive(InitSpace)]
pub struct Idea {
    /// Wallet that submitted the idea (32 bytes)
    pub author: Pubkey,
    /// The IdeaRound this idea belongs to (32 bytes)
    pub round: Pubkey,
    /// Sequential index within the round (4 bytes)
    pub idea_index: u32,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Current status of the idea (1 byte)
    pub status: IdeaStatus,
    /// SHA-256 hash of off-chain idea content (32 bytes)
    pub content_hash: [u8; 32],
    /// Unix timestamp of submission (8 bytes)
    pub submitted_at: i64,
    /// Total weight of Yes votes (8 bytes)
    pub yes_weight: u64,
    /// Total weight of No votes (8 bytes)
    pub no_weight: u64,
    /// Total weight of Abstain votes (8 bytes)
    pub abstain_weight: u64,
    /// Number of unique voters (4 bytes)
    pub voter_count: u32,
    /// Unix timestamp after which idea can be executed if approved (8 bytes)
    pub execution_eligible_at: i64,
}
// PDA seeds: ["idea", round.key(), idea_index.to_le_bytes()]
// Total: 8 + 32 + 32 + 4 + 1 + 1 + 32 + 8 + 8 + 8 + 8 + 4 + 8 = 154 bytes
