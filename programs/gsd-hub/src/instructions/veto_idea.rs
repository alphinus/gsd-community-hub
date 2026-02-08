use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::{GovernanceConfig, Idea, IdeaRound, IdeaStatus};

#[derive(Accounts)]
pub struct VetoIdea<'info> {
    #[account(
        mut,
        seeds = [b"idea".as_ref(), round.key().as_ref(), idea.idea_index.to_le_bytes().as_ref()],
        bump = idea.bump
    )]
    pub idea: Account<'info, Idea>,

    pub round: Account<'info, IdeaRound>,

    #[account(
        seeds = [b"governance_config".as_ref()],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        constraint = veto_authority.key() == governance_config.veto_authority @ GovernanceError::UnauthorizedVeto
    )]
    pub veto_authority: Signer<'info>,
}

pub fn handler(ctx: Context<VetoIdea>) -> Result<()> {
    let idea = &mut ctx.accounts.idea;

    // Only Submitted or Approved ideas can be vetoed
    require!(
        idea.status == IdeaStatus::Submitted || idea.status == IdeaStatus::Approved,
        GovernanceError::NotVetoable
    );

    idea.status = IdeaStatus::Vetoed;

    Ok(())
}
