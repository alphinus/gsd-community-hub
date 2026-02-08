use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{IdeaRound, RoundStatus};

#[derive(Accounts)]
pub struct TransitionRound<'info> {
    #[account(
        mut,
        seeds = [b"idea_round".as_ref(), idea_round.round_index.to_le_bytes().as_ref()],
        bump = idea_round.bump
    )]
    pub idea_round: Account<'info, IdeaRound>,
}

/// Permissionless crank: anyone can trigger round state transitions after deadlines.
pub fn handler(ctx: Context<TransitionRound>) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    let round = &mut ctx.accounts.idea_round;

    match round.status {
        RoundStatus::Open => {
            require!(now >= round.submission_end, GovernanceError::TooEarly);
            round.status = RoundStatus::Voting;
        }
        RoundStatus::Voting => {
            require!(now >= round.voting_end, GovernanceError::TooEarly);
            round.status = RoundStatus::Closed;
        }
        RoundStatus::Closed => {
            return Err(GovernanceError::AlreadyClosed.into());
        }
    }

    Ok(())
}
