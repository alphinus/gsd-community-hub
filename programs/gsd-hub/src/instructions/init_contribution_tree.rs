use anchor_lang::prelude::*;
use crate::cpi::compression::{ACCOUNT_COMPRESSION_PROGRAM_ID, NOOP_PROGRAM_ID};
use crate::state::ContributionTreeConfig;

#[derive(Accounts)]
pub struct InitContributionTree<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ContributionTreeConfig::INIT_SPACE,
        seeds = [b"contribution_tree", merkle_tree.key().as_ref()],
        bump
    )]
    pub tree_config: Account<'info, ContributionTreeConfig>,

    /// CHECK: Pre-allocated Merkle tree account, validated by spl-account-compression CPI
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Validated against known program ID
    #[account(address = ACCOUNT_COMPRESSION_PROGRAM_ID)]
    pub compression_program: UncheckedAccount<'info>,

    /// CHECK: Validated against known program ID
    #[account(address = NOOP_PROGRAM_ID)]
    pub noop_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitContributionTree>,
    max_depth: u32,
    max_buffer_size: u32,
) -> Result<()> {
    // Initialize the Merkle tree via CPI
    crate::cpi::compression::init_empty_merkle_tree(
        &ctx.accounts.merkle_tree.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.noop_program.to_account_info(),
        &ctx.accounts.compression_program.to_account_info(),
        max_depth,
        max_buffer_size,
        None, // authority signs directly, not a PDA
    )?;

    // Populate the tree config PDA
    let config = &mut ctx.accounts.tree_config;
    config.authority = ctx.accounts.authority.key();
    config.merkle_tree = ctx.accounts.merkle_tree.key();
    config.total_contributions = 0;
    config.bump = ctx.bumps.tree_config;
    config.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}
