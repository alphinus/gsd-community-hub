use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    /// Wallet that cast the vote (32 bytes)
    pub voter: Pubkey,
    /// The Idea account this vote is for (32 bytes)
    pub idea: Pubkey,
    /// The IdeaRound this vote belongs to (32 bytes)
    pub round: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// The voter's choice (1 byte)
    pub vote: VoteChoice,
    /// Token weight applied to this vote (8 bytes)
    pub weight: u64,
    /// Unix timestamp of when the vote was cast (8 bytes)
    pub voted_at: i64,
}
// PDA seeds: ["vote_record", voter.key(), idea.key()]
// Total: 8 + 32 + 32 + 32 + 1 + 1 + 8 + 8 = 122 bytes
