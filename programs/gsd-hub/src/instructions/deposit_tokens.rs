use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::GovernanceError;
use crate::state::{GovernanceConfig, VoteDeposit};

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(
        mut,
        seeds = [b"governance_config".as_ref()],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        init_if_needed,
        payer = depositor,
        space = 8 + VoteDeposit::INIT_SPACE,
        seeds = [b"vote_deposit".as_ref(), depositor.key().as_ref()],
        bump
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == depositor.key()
            && user_token_account.mint == governance_config.governance_token_mint
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token_account.mint == governance_config.governance_token_mint
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, GovernanceError::InsufficientDeposit);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Transfer tokens from user to escrow
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Update vote deposit
    let deposit = &mut ctx.accounts.vote_deposit;
    deposit.deposited_amount = deposit
        .deposited_amount
        .checked_add(amount)
        .ok_or(GovernanceError::Overflow)?;

    // Set timestamp fields on first deposit
    if deposit.deposit_timestamp == 0 {
        deposit.deposit_timestamp = now;
        deposit.eligible_at = now
            .checked_add(ctx.accounts.governance_config.deposit_timelock)
            .ok_or(GovernanceError::Overflow)?;
    }

    deposit.bump = ctx.bumps.vote_deposit;
    deposit.authority = ctx.accounts.depositor.key();

    // Increment global total deposited
    let config = &mut ctx.accounts.governance_config;
    config.total_deposited = config
        .total_deposited
        .checked_add(amount)
        .ok_or(GovernanceError::Overflow)?;

    Ok(())
}
