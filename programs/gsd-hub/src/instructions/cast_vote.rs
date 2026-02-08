use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{Idea, IdeaRound, RoundStatus, VoteChoice, VoteDeposit, VoteRecord};

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"idea".as_ref(), round.key().as_ref(), idea.idea_index.to_le_bytes().as_ref()],
        bump = idea.bump
    )]
    pub idea: Account<'info, Idea>,

    #[account(
        constraint = round.status == RoundStatus::Voting @ GovernanceError::RoundNotInVotingState
    )]
    pub round: Account<'info, IdeaRound>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote_record".as_ref(), voter.key().as_ref(), idea.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        seeds = [b"vote_deposit".as_ref(), voter.key().as_ref()],
        bump = vote_deposit.bump,
        constraint = vote_deposit.deposited_amount > 0 @ GovernanceError::NoDeposit
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CastVote>, vote: VoteChoice) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Validate timelock eligibility
    require!(
        now >= ctx.accounts.vote_deposit.eligible_at,
        GovernanceError::TokensNotYetEligible
    );

    // Validate within voting period
    require!(
        now < ctx.accounts.round.voting_end,
        GovernanceError::VotingPeriodEnded
    );

    let weight = ctx.accounts.vote_deposit.deposited_amount;

    // Set vote record fields
    let record = &mut ctx.accounts.vote_record;
    record.voter = ctx.accounts.voter.key();
    record.idea = ctx.accounts.idea.key();
    record.round = ctx.accounts.round.key();
    record.bump = ctx.bumps.vote_record;
    record.vote = vote;
    record.weight = weight;
    record.voted_at = now;

    // Update idea tallies
    let idea = &mut ctx.accounts.idea;
    match vote {
        VoteChoice::Yes => {
            idea.yes_weight = idea
                .yes_weight
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
        VoteChoice::No => {
            idea.no_weight = idea
                .no_weight
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
        VoteChoice::Abstain => {
            idea.abstain_weight = idea
                .abstain_weight
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
    }

    idea.voter_count = idea
        .voter_count
        .checked_add(1)
        .ok_or(GovernanceError::Overflow)?;

    // Increment active votes on deposit
    ctx.accounts.vote_deposit.active_votes = ctx
        .accounts
        .vote_deposit
        .active_votes
        .checked_add(1)
        .ok_or(GovernanceError::Overflow)?;

    Ok(())
}
