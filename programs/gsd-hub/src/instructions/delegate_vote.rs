use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{DelegationRecord, GovernanceConfig, VoteDeposit};

#[derive(Accounts)]
pub struct DelegateVote<'info> {
    #[account(
        seeds = [b"governance_config".as_ref()],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        seeds = [b"vote_deposit".as_ref(), delegator.key().as_ref()],
        bump = vote_deposit.bump,
        constraint = vote_deposit.deposited_amount > 0 @ GovernanceError::NoDeposit,
        constraint = vote_deposit.active_votes == 0 @ GovernanceError::CannotDelegateWithActiveVotes
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(
        init,
        payer = delegator,
        space = 8 + DelegationRecord::INIT_SPACE,
        seeds = [b"delegation".as_ref(), delegator.key().as_ref()],
        bump
    )]
    pub delegation_record: Account<'info, DelegationRecord>,

    #[account(mut)]
    pub delegator: Signer<'info>,

    /// CHECK: Just stored as a pubkey -- the delegate receiving voting power
    pub delegate: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DelegateVote>) -> Result<()> {
    let clock = Clock::get()?;

    let record = &mut ctx.accounts.delegation_record;
    record.delegator = ctx.accounts.delegator.key();
    record.delegate = ctx.accounts.delegate.key();
    record.bump = ctx.bumps.delegation_record;
    record.delegated_amount = ctx.accounts.vote_deposit.deposited_amount;
    record.delegated_at = clock.unix_timestamp;
    record.is_active = true;
    record.effective_from_round = ctx.accounts.governance_config.round_count;

    Ok(())
}
