use anchor_lang::prelude::*;

pub mod cpi;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw");

#[program]
pub mod gsd_hub {
    use super::*;

    pub fn register_developer(
        ctx: Context<RegisterDeveloper>,
        profile_hash: [u8; 32],
    ) -> Result<()> {
        instructions::register::handler(ctx, profile_hash)
    }

    pub fn update_profile_hash(
        ctx: Context<UpdateProfileHash>,
        new_hash: [u8; 32],
    ) -> Result<()> {
        instructions::update_hash::handler(ctx, new_hash)
    }

    pub fn init_contribution_tree(
        ctx: Context<InitContributionTree>,
        max_depth: u32,
        max_buffer_size: u32,
    ) -> Result<()> {
        instructions::init_contribution_tree::handler(ctx, max_depth, max_buffer_size)
    }

    pub fn record_contribution(
        ctx: Context<RecordContribution>,
        developer: Pubkey,
        task_ref: [u8; 32],
        verification_score: u16,
        content_hash: [u8; 32],
    ) -> Result<()> {
        instructions::record_contribution::handler(
            ctx,
            developer,
            task_ref,
            verification_score,
            content_hash,
        )
    }

    pub fn update_contribution_score(
        ctx: Context<UpdateContributionScore>,
        tasks_completed: u32,
        total_verification_score: u64,
        time_active_days: u32,
        contribution_score: u64,
        score_version: u8,
    ) -> Result<()> {
        instructions::update_score::handler(
            ctx,
            tasks_completed,
            total_verification_score,
            time_active_days,
            contribution_score,
            score_version,
        )
    }
}
