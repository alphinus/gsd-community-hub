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

#[error_code]
pub enum GovernanceError {
    #[msg("Round is not in Open state")]
    RoundNotOpen,

    #[msg("Round is not in Voting state")]
    RoundNotInVotingState,

    #[msg("Round is already closed")]
    AlreadyClosed,

    #[msg("Transition too early -- deadline not reached")]
    TooEarly,

    #[msg("Submission period has ended")]
    SubmissionPeriodEnded,

    #[msg("Voting period has ended")]
    VotingPeriodEnded,

    #[msg("No tokens deposited")]
    NoDeposit,

    #[msg("Tokens not yet eligible for voting (7-day timelock)")]
    TokensNotYetEligible,

    #[msg("Cannot withdraw while votes are active")]
    ActiveVotesExist,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Unauthorized -- not the admin")]
    UnauthorizedAdmin,

    #[msg("Unauthorized veto -- not the veto authority")]
    UnauthorizedVeto,

    #[msg("Invalid timestamps -- end must be after start")]
    InvalidTimestamps,

    #[msg("Idea is not in a vetoable state")]
    NotVetoable,

    #[msg("Round still active -- cannot relinquish vote")]
    RoundStillActive,

    #[msg("Insufficient deposit amount")]
    InsufficientDeposit,
}
