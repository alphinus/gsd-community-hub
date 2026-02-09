use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VerificationType {
    Ai,
    Peer,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VerificationStatus {
    Pending,
    Completed,
    Disputed,
}

#[account]
#[derive(InitSpace)]
pub struct VerificationReport {
    /// Developer who submitted the work (32 bytes)
    pub developer: Pubkey,
    /// SHA-256 hash of task reference (32 bytes)
    pub task_ref: [u8; 32],
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Type of verification performed (1 byte)
    pub verification_type: VerificationType,
    /// Current status of the verification (1 byte)
    pub status: VerificationStatus,
    /// Overall score 0-10000 (maps to 0.00%-100.00%) (2 bytes)
    pub score: u16,
    /// AI confidence level 0-10000 (2 bytes)
    pub confidence: u16,
    /// SHA-256 of full off-chain report JSON (32 bytes)
    pub report_hash: [u8; 32],
    /// Unix timestamp when verification was performed (8 bytes)
    pub verified_at: i64,
    /// Number of peer reviewers (0 for AI verification) (1 byte)
    pub reviewer_count: u8,
    /// Config version at time of verification (1 byte)
    pub config_version: u8,
}
// PDA seeds: ["verification", developer.key(), task_ref]
// Total: 8 + 32 + 32 + 1 + 1 + 1 + 2 + 2 + 32 + 8 + 1 + 1 = 121 bytes
