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

#[error_code]
pub enum RevenueError {
    #[msg("Split ratios must sum to 10000 basis points")]
    InvalidSplitRatios,

    #[msg("Revenue amount below minimum threshold")]
    BelowMinimumThreshold,

    #[msg("Revenue event not in Recorded status")]
    EventNotRecorded,

    #[msg("Revenue event already completed")]
    EventAlreadyCompleted,

    #[msg("Contributor has no contribution score")]
    NoContributionScore,

    #[msg("Revenue share already claimed for this event")]
    AlreadyClaimed,

    #[msg("Claim calculation overflow")]
    ClaimOverflow,

    #[msg("Total contribution score is zero")]
    DivisionByZero,

    #[msg("Escrow balance insufficient for claim")]
    InsufficientEscrowBalance,

    #[msg("Not authorized to execute burn")]
    UnauthorizedBurnAuthority,

    #[msg("Burn already executed for this event")]
    BurnAlreadyExecuted,
}
