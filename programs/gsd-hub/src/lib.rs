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
}
