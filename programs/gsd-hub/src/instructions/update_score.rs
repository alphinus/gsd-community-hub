use anchor_lang::prelude::*;
use crate::state::DeveloperProfile;

#[derive(Accounts)]
pub struct UpdateContributionScore<'info> {
    #[account(
        mut,
        seeds = [b"developer", developer_wallet.key().as_ref()],
        bump = developer_profile.bump,
        realloc = 8 + 130,
        realloc::payer = payer,
        realloc::zero = false,
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    /// CHECK: Used only for PDA seed derivation
    pub developer_wallet: UncheckedAccount<'info>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<UpdateContributionScore>,
    tasks_completed: u32,
    total_verification_score: u64,
    time_active_days: u32,
    contribution_score: u64,
    score_version: u8,
) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    let now = Clock::get()?.unix_timestamp;

    profile.tasks_completed = tasks_completed;
    profile.total_verification_score = total_verification_score;
    profile.time_active_days = time_active_days;
    profile.contribution_score = contribution_score;
    profile.score_version = score_version;
    profile.last_contribution_at = now;

    // Set first_contribution_at on first score update
    if profile.first_contribution_at == 0 {
        profile.first_contribution_at = now;
    }

    profile.updated_at = now;

    Ok(())
}
