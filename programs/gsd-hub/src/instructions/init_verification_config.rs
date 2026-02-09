use anchor_lang::prelude::*;

use crate::errors::VerificationError;
use crate::state::VerificationConfig;

#[derive(Accounts)]
pub struct InitVerificationConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + VerificationConfig::INIT_SPACE,
        seeds = [b"verification_config"],
        bump
    )]
    pub verification_config: Account<'info, VerificationConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitVerificationConfig>,
    confidence_threshold: u16,
    code_quality_weight: u16,
    task_fulfillment_weight: u16,
    test_coverage_weight: u16,
    workflow_discipline_weight: u16,
    plan_adherence_weight: u16,
    min_reviewers: u8,
    consensus_threshold_bps: u16,
    review_timeout_days: u8,
) -> Result<()> {
    // Validate weights sum to 10000 bps
    let total_weights = code_quality_weight as u32
        + task_fulfillment_weight as u32
        + test_coverage_weight as u32
        + workflow_discipline_weight as u32
        + plan_adherence_weight as u32;
    require!(
        total_weights == 10000,
        VerificationError::WeightsMustSumTo10000
    );

    let config = &mut ctx.accounts.verification_config;
    config.admin = ctx.accounts.admin.key();
    config.bump = ctx.bumps.verification_config;
    config.version = 1;
    config.confidence_threshold = confidence_threshold;
    config.code_quality_weight = code_quality_weight;
    config.task_fulfillment_weight = task_fulfillment_weight;
    config.test_coverage_weight = test_coverage_weight;
    config.workflow_discipline_weight = workflow_discipline_weight;
    config.plan_adherence_weight = plan_adherence_weight;
    config.min_reviewers = min_reviewers;
    config.consensus_threshold_bps = consensus_threshold_bps;
    config.review_timeout_days = review_timeout_days;

    Ok(())
}
