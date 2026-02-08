use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::errors::RevenueError;
use crate::state::{RevenueConfig, RevenueEvent, RevenueStatus, RevenueToken};

#[derive(Accounts)]
pub struct RecordRevenueEvent<'info> {
    #[account(
        mut,
        seeds = [b"revenue_config"],
        bump = revenue_config.bump
    )]
    pub revenue_config: Account<'info, RevenueConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + RevenueEvent::INIT_SPACE,
        seeds = [b"revenue_event".as_ref(), revenue_config.event_count.to_le_bytes().as_ref()],
        bump
    )]
    pub revenue_event: Account<'info, RevenueEvent>,

    /// The PDA vault that will hold the developer pool SOL for this event
    /// CHECK: This is a PDA system account used as a SOL vault; validated by seeds
    #[account(
        mut,
        seeds = [b"revenue_vault".as_ref(), revenue_config.event_count.to_le_bytes().as_ref()],
        bump
    )]
    pub developer_pool_vault: SystemAccount<'info>,

    #[account(
        mut,
        constraint = authority.key() == revenue_config.admin @ RevenueError::UnauthorizedBurnAuthority
    )]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RecordRevenueEvent>,
    total_amount: u64,
    token: RevenueToken,
    origin_signature: [u8; 64],
    total_contribution_score: u64,
) -> Result<()> {
    let config = &ctx.accounts.revenue_config;

    // Validate minimum threshold
    require!(
        total_amount >= config.min_revenue_threshold,
        RevenueError::BelowMinimumThreshold
    );

    // Compute splits using basis points
    let developer_pool = total_amount
        .checked_mul(config.developer_bps as u64)
        .unwrap()
        / 10000;
    let treasury_reserve = total_amount
        .checked_mul(config.treasury_bps as u64)
        .unwrap()
        / 10000;
    let burn_amount = total_amount
        .checked_mul(config.burn_bps as u64)
        .unwrap()
        / 10000;
    let maintenance_amount = total_amount
        .checked_mul(config.maintenance_bps as u64)
        .unwrap()
        / 10000;

    // Handle rounding: assign remainder to developer_pool
    let sum = developer_pool + treasury_reserve + burn_amount + maintenance_amount;
    let developer_pool = developer_pool + (total_amount - sum);

    // Transfer developer_pool SOL to the vault PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.developer_pool_vault.to_account_info(),
            },
        ),
        developer_pool,
    )?;

    let clock = Clock::get()?;

    // Set all fields on revenue_event
    let event = &mut ctx.accounts.revenue_event;
    event.event_index = ctx.accounts.revenue_config.event_count;
    event.bump = ctx.bumps.revenue_event;
    event.vault_bump = ctx.bumps.developer_pool_vault;
    event.token = token;
    event.total_amount = total_amount;
    event.developer_pool = developer_pool;
    event.treasury_reserve = treasury_reserve;
    event.burn_amount = burn_amount;
    event.maintenance_amount = maintenance_amount;
    event.status = RevenueStatus::Recorded;
    event.recorded_at = clock.unix_timestamp;
    event.origin_signature = origin_signature;
    event.total_contribution_score = total_contribution_score;
    event.claimed_amount = 0;
    event.burn_signature = [0u8; 64];
    event.gsd_burned = 0;

    // Increment event_count
    let config = &mut ctx.accounts.revenue_config;
    config.event_count = config.event_count.checked_add(1).unwrap();

    Ok(())
}
