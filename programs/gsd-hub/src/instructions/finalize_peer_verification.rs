use anchor_lang::prelude::*;

use crate::errors::VerificationError;
use crate::state::{VerificationConfig, VerificationReport, VerificationStatus, VerificationType};

#[derive(Accounts)]
pub struct FinalizePeerVerification<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"verification", verification_report.developer.as_ref(), verification_report.task_ref.as_ref()],
        bump = verification_report.bump
    )]
    pub verification_report: Account<'info, VerificationReport>,

    #[account(
        seeds = [b"verification_config"],
        bump = verification_config.bump
    )]
    pub verification_config: Account<'info, VerificationConfig>,
}

pub fn handler(
    ctx: Context<FinalizePeerVerification>,
    final_score: u16,
    final_confidence: u16,
    peer_report_hash: [u8; 32],
) -> Result<()> {
    let report = &ctx.accounts.verification_report;
    let config = &ctx.accounts.verification_config;

    // Validate sufficient reviewers
    require!(
        report.reviewer_count >= config.min_reviewers,
        VerificationError::InsufficientReviewers
    );

    // Update verification report with consensus result
    let report = &mut ctx.accounts.verification_report;
    report.score = final_score;
    report.confidence = final_confidence;
    report.status = VerificationStatus::Completed;
    report.verification_type = VerificationType::Peer;
    report.report_hash = peer_report_hash;

    Ok(())
}
