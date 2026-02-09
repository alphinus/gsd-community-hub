use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VerificationConfig {
    /// Authority who can update config (32 bytes)
    pub admin: Pubkey,
    /// Canonical PDA bump (1 byte)
    pub bump: u8,
    /// Config version for report versioning (1 byte)
    pub version: u8,
    /// Confidence threshold below which triggers peer review fallback (2 bytes)
    /// Default 6000 = 60%
    pub confidence_threshold: u16,
    /// Code quality weight in basis points (2 bytes) -- default 2500 (25%)
    pub code_quality_weight: u16,
    /// Task fulfillment weight in basis points (2 bytes) -- default 2000 (20%)
    pub task_fulfillment_weight: u16,
    /// Test coverage weight in basis points (2 bytes) -- default 1500 (15%)
    pub test_coverage_weight: u16,
    /// Workflow discipline weight in basis points (2 bytes) -- default 2500 (25%)
    pub workflow_discipline_weight: u16,
    /// Plan adherence weight in basis points (2 bytes) -- default 1500 (15%)
    pub plan_adherence_weight: u16,
    /// Minimum number of peer reviewers required (1 byte) -- default 3
    pub min_reviewers: u8,
    /// Consensus threshold in basis points (2 bytes) -- default 7000 (70%)
    pub consensus_threshold_bps: u16,
    /// Review timeout in days (1 byte) -- default 7
    pub review_timeout_days: u8,
}
// PDA seeds: ["verification_config"]
// Total: 8 (disc) + 32 + 1 + 1 + 2 + 2 + 2 + 2 + 2 + 2 + 1 + 2 + 1 = 58 bytes
