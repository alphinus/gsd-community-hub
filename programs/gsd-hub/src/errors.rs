use anchor_lang::prelude::*;

#[error_code]
pub enum GsdHubError {
    #[msg("Profile already exists")]
    ProfileAlreadyExists,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid profile hash")]
    InvalidProfileHash,

    #[msg("Verification score must be 0-10000")]
    InvalidVerificationScore,

    #[msg("Contribution tree is full")]
    TreeFull,

    #[msg("Invalid tree authority")]
    InvalidTreeAuthority,

    #[msg("Invalid contribution data")]
    InvalidContributionData,

    #[msg("Contribution score calculation overflow")]
    ScoreOverflow,
}
