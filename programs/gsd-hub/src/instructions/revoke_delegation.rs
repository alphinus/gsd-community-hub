use anchor_lang::prelude::*;

use crate::errors::GovernanceError;
use crate::state::DelegationRecord;

#[derive(Accounts)]
pub struct RevokeDelegation<'info> {
    #[account(
        mut,
        seeds = [b"delegation".as_ref(), delegator.key().as_ref()],
        bump = delegation_record.bump,
        constraint = delegation_record.is_active @ GovernanceError::NoDelegation,
        close = delegator
    )]
    pub delegation_record: Account<'info, DelegationRecord>,

    #[account(mut)]
    pub delegator: Signer<'info>,
}

pub fn handler(ctx: Context<RevokeDelegation>) -> Result<()> {
    // Account will be closed by the `close = delegator` constraint,
    // returning rent to the delegator. A new delegation can be created later.
    // Set is_active = false before close for safety (though close zeroes the account)
    ctx.accounts.delegation_record.is_active = false;

    Ok(())
}
