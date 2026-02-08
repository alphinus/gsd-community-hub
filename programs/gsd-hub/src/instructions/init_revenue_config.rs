use anchor_lang::prelude::*;

use crate::errors::RevenueError;
use crate::state::RevenueConfig;

#[derive(Accounts)]
pub struct InitRevenueConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + RevenueConfig::INIT_SPACE,
        seeds = [b"revenue_config"],
        bump
    )]
    pub revenue_config: Account<'info, RevenueConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitRevenueConfig>,
    treasury_address: Pubkey,
    maintenance_address: Pubkey,
    gsd_mint: Pubkey,
    usdc_mint: Pubkey,
    min_revenue_threshold: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.revenue_config;

    // Default split: 60/20/10/10
    let developer_bps: u16 = 6000;
    let treasury_bps: u16 = 2000;
    let burn_bps: u16 = 1000;
    let maintenance_bps: u16 = 1000;

    // Validate bps sum to 10000
    require!(
        developer_bps as u32 + treasury_bps as u32 + burn_bps as u32 + maintenance_bps as u32
            == 10000,
        RevenueError::InvalidSplitRatios
    );

    config.admin = ctx.accounts.admin.key();
    config.bump = ctx.bumps.revenue_config;
    config.developer_bps = developer_bps;
    config.treasury_bps = treasury_bps;
    config.burn_bps = burn_bps;
    config.maintenance_bps = maintenance_bps;
    config.treasury_address = treasury_address;
    config.maintenance_address = maintenance_address;
    config.gsd_mint = gsd_mint;
    config.usdc_mint = usdc_mint;
    config.event_count = 0;
    config.min_revenue_threshold = min_revenue_threshold;

    Ok(())
}
