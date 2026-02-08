use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{GovernanceConfig, IdeaRound, QuorumType, RoundStatus};

#[derive(Accounts)]
pub struct CreateRound<'info> {
    #[account(
        mut,
        seeds = [b"governance_config"],
        bump = governance_config.bump,
        constraint = admin.key() == governance_config.admin @ GovernanceError::UnauthorizedAdmin
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        init,
        payer = admin,
        space = 8 + IdeaRound::INIT_SPACE,
        seeds = [b"idea_round".as_ref(), governance_config.round_count.to_le_bytes().as_ref()],
        bump
    )]
    pub idea_round: Account<'info, IdeaRound>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateRound>,
    submission_start: i64,
    submission_end: i64,
    voting_end: i64,
    quorum_type: QuorumType,
    content_hash: [u8; 32],
) -> Result<()> {
    // Validate timestamps: submission_start < submission_end < voting_end, all > 0
    require!(
        submission_start > 0 && submission_end > 0 && voting_end > 0,
        GovernanceError::InvalidTimestamps
    );
    require!(
        submission_start < submission_end && submission_end < voting_end,
        GovernanceError::InvalidTimestamps
    );

    let round = &mut ctx.accounts.idea_round;
    round.authority = ctx.accounts.admin.key();
    round.round_index = ctx.accounts.governance_config.round_count;
    round.bump = ctx.bumps.idea_round;
    round.status = RoundStatus::Open;
    round.submission_start = submission_start;
    round.submission_end = submission_end;
    round.voting_end = voting_end;
    round.idea_count = 0;
    round.quorum_type = quorum_type;
    round.content_hash = content_hash;

    // Increment round count on governance config
    ctx.accounts.governance_config.round_count += 1;

    Ok(())
}
