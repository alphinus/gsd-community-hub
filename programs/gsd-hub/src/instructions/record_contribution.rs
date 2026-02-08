use anchor_lang::prelude::*;
use crate::cpi::compression::{ACCOUNT_COMPRESSION_PROGRAM_ID, NOOP_PROGRAM_ID};
use crate::errors::GsdHubError;
use crate::state::{ContributionLeaf, ContributionTreeConfig};

#[derive(Accounts)]
pub struct RecordContribution<'info> {
    #[account(
        mut,
        seeds = [b"contribution_tree", merkle_tree.key().as_ref()],
        bump = tree_config.bump,
        has_one = authority @ GsdHubError::InvalidTreeAuthority,
    )]
    pub tree_config: Account<'info, ContributionTreeConfig>,

    /// CHECK: Merkle tree account, validated by spl-account-compression CPI
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    pub authority: Signer<'info>,

    /// CHECK: Validated against known program ID
    #[account(address = NOOP_PROGRAM_ID)]
    pub noop_program: UncheckedAccount<'info>,

    /// CHECK: Validated against known program ID
    #[account(address = ACCOUNT_COMPRESSION_PROGRAM_ID)]
    pub compression_program: UncheckedAccount<'info>,
}

pub fn handler(
    ctx: Context<RecordContribution>,
    developer: Pubkey,
    task_ref: [u8; 32],
    verification_score: u16,
    content_hash: [u8; 32],
) -> Result<()> {
    // Validate verification score range
    require!(
        verification_score <= 10_000,
        GsdHubError::InvalidVerificationScore
    );

    let timestamp = Clock::get()?.unix_timestamp;

    // Construct the contribution leaf
    let leaf = ContributionLeaf {
        developer,
        task_ref,
        verification_score,
        timestamp,
        content_hash,
    };

    // Serialize leaf data for noop emission (indexers read this)
    let leaf_data = AnchorSerialize::try_to_vec(&leaf)
        .map_err(|_| error!(GsdHubError::InvalidContributionData))?;

    // Emit full leaf data via noop program for off-chain indexing
    crate::cpi::noop::wrap_application_data(
        &ctx.accounts.noop_program.to_account_info(),
        leaf_data,
    )?;

    // Compute leaf hash and append to Merkle tree
    let leaf_hash = leaf.to_leaf_hash();
    crate::cpi::compression::append_leaf(
        &ctx.accounts.merkle_tree.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.noop_program.to_account_info(),
        &ctx.accounts.compression_program.to_account_info(),
        leaf_hash,
        None, // authority signs directly
    )?;

    // Increment contribution count
    let config = &mut ctx.accounts.tree_config;
    config.total_contributions = config
        .total_contributions
        .checked_add(1)
        .ok_or(GsdHubError::ScoreOverflow)?;

    Ok(())
}
