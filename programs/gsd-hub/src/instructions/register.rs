use anchor_lang::prelude::*;
use crate::state::DeveloperProfile;

#[derive(Accounts)]
pub struct RegisterDeveloper<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DeveloperProfile::INIT_SPACE,
        seeds = [b"developer", authority.key().as_ref()],
        bump
    )]
    pub developer_profile: Account<'info, DeveloperProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterDeveloper>, profile_hash: [u8; 32]) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    profile.authority = ctx.accounts.authority.key();
    profile.bump = ctx.bumps.developer_profile;
    profile.created_at = Clock::get()?.unix_timestamp;
    profile.updated_at = Clock::get()?.unix_timestamp;
    profile.profile_hash = profile_hash;
    Ok(())
}
