use anchor_lang::prelude::*;
use crate::state::DeveloperProfile;

#[derive(Accounts)]
pub struct UpdateProfileHash<'info> {
    #[account(
        mut,
        seeds = [b"developer", authority.key().as_ref()],
        bump = developer_profile.bump,
        has_one = authority,
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateProfileHash>, new_hash: [u8; 32]) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    profile.profile_hash = new_hash;
    profile.updated_at = Clock::get()?.unix_timestamp;
    Ok(())
}
