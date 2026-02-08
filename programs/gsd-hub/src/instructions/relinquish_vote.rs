use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{IdeaRound, RoundStatus, VoteDeposit, VoteRecord};

#[derive(Accounts)]
pub struct RelinquishVote<'info> {
    #[account(
        constraint = round.status == RoundStatus::Closed @ GovernanceError::RoundStillActive
    )]
    pub round: Account<'info, IdeaRound>,

    #[account(
        constraint = vote_record.voter == voter.key()
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        seeds = [b"vote_deposit".as_ref(), voter.key().as_ref()],
        bump = vote_deposit.bump
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    pub voter: Signer<'info>,
}

pub fn handler(ctx: Context<RelinquishVote>) -> Result<()> {
    let deposit = &mut ctx.accounts.vote_deposit;
    deposit.active_votes = deposit
        .active_votes
        .checked_sub(1)
        .ok_or(GovernanceError::Overflow)?;

    Ok(())
}
