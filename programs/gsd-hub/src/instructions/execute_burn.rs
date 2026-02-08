use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

use crate::errors::RevenueError;
use crate::state::{RevenueConfig, RevenueEvent, RevenueStatus};

#[derive(Accounts)]
pub struct ExecuteBurn<'info> {
    #[account(
        mut,
        seeds = [b"revenue_event".as_ref(), revenue_event.event_index.to_le_bytes().as_ref()],
        bump = revenue_event.bump
    )]
    pub revenue_event: Account<'info, RevenueEvent>,

    #[account(
        constraint = burn_authority.key() == revenue_config.admin @ RevenueError::UnauthorizedBurnAuthority
    )]
    pub burn_authority: Signer<'info>,

    #[account(
        seeds = [b"revenue_config"],
        bump = revenue_config.bump
    )]
    pub revenue_config: Account<'info, RevenueConfig>,

    #[account(mut)]
    pub gsd_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub gsd_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<ExecuteBurn>,
    gsd_amount: u64,
    burn_tx_signature: [u8; 64],
) -> Result<()> {
    let event = &ctx.accounts.revenue_event;

    // Validate burn hasn't already been executed
    require!(
        event.burn_signature == [0u8; 64],
        RevenueError::BurnAlreadyExecuted
    );

    // Execute SPL token burn via CPI
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.gsd_mint.to_account_info(),
            from: ctx.accounts.gsd_token_account.to_account_info(),
            authority: ctx.accounts.burn_authority.to_account_info(),
        },
    );
    token::burn(burn_ctx, gsd_amount)?;

    // Update revenue event with burn info
    let event = &mut ctx.accounts.revenue_event;
    event.burn_signature = burn_tx_signature;
    event.gsd_burned = gsd_amount;

    // Mark as Completed after burn is recorded
    event.status = RevenueStatus::Completed;

    Ok(())
}
