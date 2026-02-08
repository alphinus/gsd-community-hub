use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::GovernanceError;
use crate::state::{GovernanceConfig, VoteDeposit};

#[derive(Accounts)]
pub struct WithdrawTokens<'info> {
    #[account(
        mut,
        seeds = [b"governance_config".as_ref()],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        mut,
        seeds = [b"vote_deposit".as_ref(), depositor.key().as_ref()],
        bump = vote_deposit.bump,
        constraint = vote_deposit.active_votes == 0 @ GovernanceError::ActiveVotesExist
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawTokens>, amount: u64) -> Result<()> {
    let deposit = &ctx.accounts.vote_deposit;
    require!(
        amount <= deposit.deposited_amount,
        GovernanceError::InsufficientDeposit
    );

    // Transfer tokens from escrow to user using PDA signer
    let governance_config_seeds: &[&[u8]] = &[
        b"governance_config".as_ref(),
        &[ctx.accounts.governance_config.bump],
    ];
    let signer_seeds = &[governance_config_seeds];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.governance_config.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    // Decrement deposit amount
    let deposit = &mut ctx.accounts.vote_deposit;
    deposit.deposited_amount = deposit
        .deposited_amount
        .checked_sub(amount)
        .ok_or(GovernanceError::Overflow)?;

    // Reset timestamps if fully withdrawn
    if deposit.deposited_amount == 0 {
        deposit.deposit_timestamp = 0;
        deposit.eligible_at = 0;
    }

    // Decrement global total deposited
    let config = &mut ctx.accounts.governance_config;
    config.total_deposited = config
        .total_deposited
        .checked_sub(amount)
        .ok_or(GovernanceError::Overflow)?;

    Ok(())
}
