use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{Idea, IdeaRound, IdeaStatus, RoundStatus};

#[derive(Accounts)]
pub struct SubmitIdea<'info> {
    #[account(
        mut,
        seeds = [b"idea_round".as_ref(), idea_round.round_index.to_le_bytes().as_ref()],
        bump = idea_round.bump,
        constraint = idea_round.status == RoundStatus::Open @ GovernanceError::RoundNotOpen
    )]
    pub idea_round: Account<'info, IdeaRound>,

    #[account(
        init,
        payer = author,
        space = 8 + Idea::INIT_SPACE,
        seeds = [b"idea".as_ref(), idea_round.key().as_ref(), idea_round.idea_count.to_le_bytes().as_ref()],
        bump
    )]
    pub idea: Account<'info, Idea>,

    #[account(mut)]
    pub author: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SubmitIdea>, content_hash: [u8; 32]) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    let round = &ctx.accounts.idea_round;

    // Validate submission period
    require!(
        now >= round.submission_start && now < round.submission_end,
        GovernanceError::SubmissionPeriodEnded
    );

    let idea = &mut ctx.accounts.idea;
    idea.author = ctx.accounts.author.key();
    idea.round = ctx.accounts.idea_round.key();
    idea.idea_index = ctx.accounts.idea_round.idea_count;
    idea.bump = ctx.bumps.idea;
    idea.status = IdeaStatus::Submitted;
    idea.content_hash = content_hash;
    idea.submitted_at = now;
    idea.yes_weight = 0;
    idea.no_weight = 0;
    idea.abstain_weight = 0;
    idea.voter_count = 0;
    idea.execution_eligible_at = 0;

    // Increment idea count on the round
    ctx.accounts.idea_round.idea_count += 1;

    Ok(())
}
