use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::GovernanceConfig;

#[derive(Accounts)]
pub struct UpdateGovernanceConfig<'info> {
    #[account(
        mut,
        seeds = [b"governance_config".as_ref()],
        bump = governance_config.bump,
        realloc = 8 + 168,
        realloc::payer = admin,
        realloc::zero = false,
        constraint = governance_config.admin == admin.key() @ GovernanceError::UnauthorizedAdmin
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<UpdateGovernanceConfig>,
    quadratic_voting_enabled: bool,
    civic_gatekeeper_network: Pubkey,
    decay_half_life_days: u16,
) -> Result<()> {
    let config = &mut ctx.accounts.governance_config;
    config.quadratic_voting_enabled = quadratic_voting_enabled;
    config.civic_gatekeeper_network = civic_gatekeeper_network;
    config.decay_half_life_days = decay_half_life_days;

    Ok(())
}
