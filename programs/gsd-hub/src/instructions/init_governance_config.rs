use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::state::GovernanceConfig;

#[derive(Accounts)]
pub struct InitGovernanceConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GovernanceConfig::INIT_SPACE,
        seeds = [b"governance_config"],
        bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    /// The SPL token mint used for governance voting
    pub governance_token_mint: Account<'info, Mint>,

    /// Squads multisig vault or other veto authority -- just store the key
    /// CHECK: No constraints needed; this is stored as a pubkey for later verification
    pub veto_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitGovernanceConfig>,
    deposit_timelock: i64,
    execution_timelock: i64,
) -> Result<()> {
    let config = &mut ctx.accounts.governance_config;
    config.admin = ctx.accounts.admin.key();
    config.veto_authority = ctx.accounts.veto_authority.key();
    config.governance_token_mint = ctx.accounts.governance_token_mint.key();
    config.bump = ctx.bumps.governance_config;
    config.round_count = 0;
    config.total_deposited = 0;

    // Default deposit_timelock to 7 days (604800s) if 0 passed
    config.deposit_timelock = if deposit_timelock == 0 {
        604_800
    } else {
        deposit_timelock
    };

    // Default execution_timelock to 48 hours (172800s) if 0 passed
    config.execution_timelock = if execution_timelock == 0 {
        172_800
    } else {
        execution_timelock
    };

    // Phase 6 advanced governance fields -- disabled by default
    config.quadratic_voting_enabled = false;
    config.civic_gatekeeper_network = Pubkey::default();
    config.decay_half_life_days = 180;

    Ok(())
}
