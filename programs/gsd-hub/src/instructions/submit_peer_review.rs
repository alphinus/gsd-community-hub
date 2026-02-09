use anchor_lang::prelude::*;

use crate::errors::VerificationError;
use crate::state::{PeerReview, VerificationReport, VerificationStatus};

#[derive(Accounts)]
pub struct SubmitPeerReview<'info> {
    #[account(mut)]
    pub reviewer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"verification", verification_report.developer.as_ref(), verification_report.task_ref.as_ref()],
        bump = verification_report.bump
    )]
    pub verification_report: Account<'info, VerificationReport>,

    #[account(
        init,
        payer = reviewer,
        space = 8 + PeerReview::INIT_SPACE,
        seeds = [b"peer_review", reviewer.key().as_ref(), verification_report.key().as_ref()],
        bump
    )]
    pub peer_review: Account<'info, PeerReview>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitPeerReview>,
    tier: u8,
    weight: u16,
    score: u16,
    passed: bool,
    review_hash: [u8; 32],
) -> Result<()> {
    let report = &ctx.accounts.verification_report;

    // Prevent self-review: reviewer cannot be the developer
    require!(
        ctx.accounts.reviewer.key() != report.developer,
        VerificationError::ReviewerIsDeveloper
    );

    // Only allow reviews on Pending reports
    require!(
        report.status == VerificationStatus::Pending,
        VerificationError::VerificationAlreadyExists
    );

    // Validate tier is 1, 2, or 3
    require!(
        tier >= 1 && tier <= 3,
        VerificationError::InvalidTier
    );

    // Validate score
    require!(score <= 10000, VerificationError::InvalidVerificationScore);

    let clock = Clock::get()?;

    let review = &mut ctx.accounts.peer_review;
    review.reviewer = ctx.accounts.reviewer.key();
    review.verification_report = ctx.accounts.verification_report.key();
    review.bump = ctx.bumps.peer_review;
    review.tier = tier;
    review.weight = weight;
    review.score = score;
    review.passed = passed;
    review.review_hash = review_hash;
    review.reviewed_at = clock.unix_timestamp;

    // Increment reviewer_count on the verification report
    let report = &mut ctx.accounts.verification_report;
    report.reviewer_count = report.reviewer_count.checked_add(1).unwrap();

    Ok(())
}
