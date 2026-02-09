use anchor_lang::prelude::*;

use crate::errors::VerificationError;
use crate::state::{VerificationConfig, VerificationReport, VerificationStatus, VerificationType};

#[derive(Accounts)]
#[instruction(task_ref: [u8; 32])]
pub struct SubmitVerification<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Developer's public key -- just used for PDA derivation, not validated as signer
    pub developer: UncheckedAccount<'info>,

    #[account(
        seeds = [b"verification_config"],
        bump = verification_config.bump
    )]
    pub verification_config: Account<'info, VerificationConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + VerificationReport::INIT_SPACE,
        seeds = [b"verification", developer.key().as_ref(), task_ref.as_ref()],
        bump
    )]
    pub verification_report: Account<'info, VerificationReport>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitVerification>,
    task_ref: [u8; 32],
    verification_type: VerificationType,
    score: u16,
    confidence: u16,
    report_hash: [u8; 32],
) -> Result<()> {
    // Validate score
    require!(score <= 10000, VerificationError::InvalidVerificationScore);

    // Validate confidence
    require!(
        confidence <= 10000,
        VerificationError::InvalidConfidence
    );

    let clock = Clock::get()?;
    let config = &ctx.accounts.verification_config;

    // Determine status based on verification type and confidence
    let status = match verification_type {
        VerificationType::Ai => {
            if confidence >= config.confidence_threshold {
                VerificationStatus::Completed
            } else {
                VerificationStatus::Pending
            }
        }
        VerificationType::Peer => {
            // Peer type is set by finalize_peer_verification, not submitted directly
            // If called directly with Peer type, mark as Completed (server-side consensus done)
            VerificationStatus::Completed
        }
    };

    let report = &mut ctx.accounts.verification_report;
    report.developer = ctx.accounts.developer.key();
    report.task_ref = task_ref;
    report.bump = ctx.bumps.verification_report;
    report.verification_type = verification_type;
    report.status = status;
    report.score = score;
    report.confidence = confidence;
    report.report_hash = report_hash;
    report.verified_at = clock.unix_timestamp;
    report.reviewer_count = 0;
    report.config_version = config.version;

    Ok(())
}
