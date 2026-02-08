use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::errors::RevenueError;
use crate::state::{DeveloperProfile, RevenueClaim, RevenueEvent, RevenueStatus};

#[derive(Accounts)]
pub struct ClaimRevenueShare<'info> {
    #[account(
        mut,
        seeds = [b"revenue_event".as_ref(), revenue_event.event_index.to_le_bytes().as_ref()],
        bump = revenue_event.bump
    )]
    pub revenue_event: Account<'info, RevenueEvent>,

    /// Use `init` (NOT `init_if_needed`) to prevent double-claiming:
    /// Anchor's init constraint fails if PDA already exists.
    #[account(
        init,
        payer = claimant,
        space = 8 + RevenueClaim::INIT_SPACE,
        seeds = [b"revenue_claim", claimant.key().as_ref(), revenue_event.key().as_ref()],
        bump
    )]
    pub revenue_claim: Account<'info, RevenueClaim>,

    #[account(
        seeds = [b"developer", claimant.key().as_ref()],
        bump = developer_profile.bump
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    #[account(mut)]
    pub claimant: Signer<'info>,

    /// The PDA vault holding the developer pool SOL
    /// CHECK: Validated by seeds constraint
    #[account(
        mut,
        seeds = [b"revenue_vault".as_ref(), revenue_event.event_index.to_le_bytes().as_ref()],
        bump
    )]
    pub developer_pool_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimRevenueShare>) -> Result<()> {
    let event = &ctx.accounts.revenue_event;

    // Validate event status
    require!(
        event.status == RevenueStatus::Recorded || event.status == RevenueStatus::Distributing,
        RevenueError::EventAlreadyCompleted
    );

    // Validate contributor has score
    let contribution_score = ctx.accounts.developer_profile.contribution_score;
    require!(contribution_score > 0, RevenueError::NoContributionScore);

    // Validate total contribution score
    require!(
        event.total_contribution_score > 0,
        RevenueError::DivisionByZero
    );

    // Calculate share using u128 intermediary to prevent overflow
    let amount = (event.developer_pool as u128)
        .checked_mul(contribution_score as u128)
        .ok_or(RevenueError::ClaimOverflow)?
        .checked_div(event.total_contribution_score as u128)
        .ok_or(RevenueError::DivisionByZero)? as u64;

    // Validate vault has sufficient lamports
    require!(
        ctx.accounts.developer_pool_vault.lamports() >= amount,
        RevenueError::InsufficientEscrowBalance
    );

    // Transfer SOL from vault PDA to claimant
    let event_index_bytes = event.event_index.to_le_bytes();
    let vault_bump = ctx.bumps.developer_pool_vault;
    let vault_seeds: &[&[u8]] = &[b"revenue_vault", event_index_bytes.as_ref(), &[vault_bump]];
    let signer_seeds = &[vault_seeds];

    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.developer_pool_vault.to_account_info(),
                to: ctx.accounts.claimant.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    let clock = Clock::get()?;

    // Set claim fields
    let claim = &mut ctx.accounts.revenue_claim;
    claim.claimant = ctx.accounts.claimant.key();
    claim.revenue_event = ctx.accounts.revenue_event.key();
    claim.bump = ctx.bumps.revenue_claim;
    claim.contribution_score = contribution_score;
    claim.total_score = event.total_contribution_score;
    claim.amount = amount;
    claim.claimed_at = clock.unix_timestamp;

    // Update claimed_amount on event
    let event = &mut ctx.accounts.revenue_event;
    event.claimed_amount = event
        .claimed_amount
        .checked_add(amount)
        .ok_or(RevenueError::ClaimOverflow)?;

    Ok(())
}
