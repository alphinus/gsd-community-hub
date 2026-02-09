use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};
use std::str::FromStr;

use crate::errors::GovernanceError;
use crate::state::{
    GovernanceConfig, Idea, IdeaRound, RoundStatus, VoteChoice, VoteDeposit, VoteRecord,
};

/// Compute the 8-byte Anchor account discriminator for a given account name.
/// Anchor uses SHA-256("account:<AccountName>")[..8].
fn account_discriminator(account_name: &str) -> [u8; 8] {
    let mut hasher = Sha256::new();
    hasher.update(format!("account:{}", account_name).as_bytes());
    let result = hasher.finalize();
    let mut disc = [0u8; 8];
    disc.copy_from_slice(&result[..8]);
    disc
}

/// Integer square root using Newton's method for u64 values.
/// Used for quadratic voting weight calculation: weight = floor(sqrt(tokens)).
pub fn isqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    if n == 1 {
        return 1;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"idea".as_ref(), round.key().as_ref(), idea.idea_index.to_le_bytes().as_ref()],
        bump = idea.bump
    )]
    pub idea: Account<'info, Idea>,

    #[account(
        constraint = round.status == RoundStatus::Voting @ GovernanceError::RoundNotInVotingState
    )]
    pub round: Account<'info, IdeaRound>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote_record".as_ref(), voter.key().as_ref(), idea.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        mut,
        seeds = [b"vote_deposit".as_ref(), voter.key().as_ref()],
        bump = vote_deposit.bump,
        constraint = vote_deposit.deposited_amount > 0 @ GovernanceError::NoDeposit
    )]
    pub vote_deposit: Account<'info, VoteDeposit>,

    #[account(
        seeds = [b"governance_config".as_ref()],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    /// CHECK: Validated manually below -- gateway token fields deserialized and verified
    /// Only required when quadratic voting is enabled (Civic Pass sybil resistance)
    pub gateway_token: Option<UncheckedAccount<'info>>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CastVote>, vote: VoteChoice) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Validate timelock eligibility
    require!(
        now >= ctx.accounts.vote_deposit.eligible_at,
        GovernanceError::TokensNotYetEligible
    );

    // Validate within voting period
    require!(
        now < ctx.accounts.round.voting_end,
        GovernanceError::VotingPeriodEnded
    );

    // Sybil gate: when quadratic voting is enabled, require valid Civic Pass gateway token
    if ctx.accounts.governance_config.quadratic_voting_enabled {
        let gt_info = ctx
            .accounts
            .gateway_token
            .as_ref()
            .ok_or(GovernanceError::HumanVerificationRequired)?;

        let civic_gateway =
            Pubkey::from_str("gatbGF9DvLAw3kWyn1EmH5Nh1Sqp8sTukF7yaQpSc71").unwrap();
        require!(
            gt_info.owner == &civic_gateway,
            GovernanceError::InvalidGatewayToken
        );

        let gt_data = gt_info.try_borrow_data()?;
        require!(gt_data.len() >= 81, GovernanceError::InvalidGatewayToken);

        // Gateway Token layout: version[1] | owner_pubkey[32] | gatekeeper_network[32] | state[8] | expiry[8]
        let subject = Pubkey::try_from(&gt_data[1..33]).unwrap();
        let network = Pubkey::try_from(&gt_data[33..65]).unwrap();
        let state = u64::from_le_bytes(gt_data[65..73].try_into().unwrap());
        let expiry = u64::from_le_bytes(gt_data[73..81].try_into().unwrap());

        require!(
            subject == ctx.accounts.voter.key(),
            GovernanceError::GatewayTokenOwnerMismatch
        );
        require!(
            network == ctx.accounts.governance_config.civic_gatekeeper_network,
            GovernanceError::GatewayNetworkMismatch
        );
        require!(state == 0, GovernanceError::GatewayTokenNotActive);

        if expiry > 0 {
            require!(
                expiry as i64 >= clock.unix_timestamp,
                GovernanceError::GatewayTokenExpired
            );
        }
    }

    // Check if voter has an active delegation -- prevent double-counting
    let voter_key = ctx.accounts.voter.key();
    let delegation_seeds: &[&[u8]] = &[b"delegation".as_ref(), voter_key.as_ref()];
    let (delegation_pda, _) =
        Pubkey::find_program_address(delegation_seeds, ctx.program_id);

    // Base weight from voter's own deposit
    let mut total_tokens: u64 = ctx.accounts.vote_deposit.deposited_amount;

    // Iterate remaining_accounts for delegation checks and aggregation
    for account_info in ctx.remaining_accounts.iter() {
        if account_info.key() == delegation_pda {
            // This is the voter's own delegation PDA -- check it's not active
            if account_info.data_len() > 0 {
                let data = account_info.try_borrow_data()?;
                // DelegationRecord layout: discriminator[8] + delegator[32] + delegate[32] + bump[1] + amount[8] + delegated_at[8] + is_active[1] + ...
                // is_active is at offset 8 + 32 + 32 + 1 + 8 + 8 = 89
                if data.len() >= 90 {
                    let is_active = data[89] != 0;
                    require!(
                        !is_active,
                        GovernanceError::VotingPowerDelegated
                    );
                }
            }
        } else {
            // Try to deserialize as a DelegationRecord for delegation aggregation
            let data = account_info.try_borrow_data()?;
            // Check minimum size for DelegationRecord (8 disc + 86 data = 94)
            if data.len() >= 94 {
                // Check discriminator matches DelegationRecord
                let disc = &data[0..8];
                let expected_disc = account_discriminator("DelegationRecord");
                if disc == expected_disc {
                    // Parse delegate pubkey at offset 8 + 32 = 40..72
                    let delegate_key = Pubkey::try_from(&data[40..72]).unwrap();
                    require!(
                        delegate_key == voter_key,
                        GovernanceError::InvalidDelegation
                    );
                    // Parse is_active at offset 89
                    let is_active = data[89] != 0;
                    require!(is_active, GovernanceError::DelegationInactive);
                    // Parse delegated_amount at offset 8 + 32 + 32 + 1 = 73..81
                    let delegated_amount =
                        u64::from_le_bytes(data[73..81].try_into().unwrap());
                    total_tokens = total_tokens
                        .checked_add(delegated_amount)
                        .ok_or(GovernanceError::Overflow)?;
                }
            }
            drop(data);
        }
    }

    // Apply quadratic or linear formula
    let weight = if ctx.accounts.governance_config.quadratic_voting_enabled {
        isqrt(total_tokens)
    } else {
        total_tokens
    };

    // Set vote record fields
    let record = &mut ctx.accounts.vote_record;
    record.voter = ctx.accounts.voter.key();
    record.idea = ctx.accounts.idea.key();
    record.round = ctx.accounts.round.key();
    record.bump = ctx.bumps.vote_record;
    record.vote = vote;
    record.weight = weight;
    record.voted_at = now;

    // Update idea tallies
    let idea = &mut ctx.accounts.idea;
    match vote {
        VoteChoice::Yes => {
            idea.yes_weight = idea
                .yes_weight
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
        VoteChoice::No => {
            idea.no_weight = idea
                .no_weight
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
        VoteChoice::Abstain => {
            idea.abstain_weight = idea
                .abstain_weight
                .checked_add(weight)
                .ok_or(GovernanceError::Overflow)?;
        }
    }

    idea.voter_count = idea
        .voter_count
        .checked_add(1)
        .ok_or(GovernanceError::Overflow)?;

    // Increment active votes on deposit
    ctx.accounts.vote_deposit.active_votes = ctx
        .accounts
        .vote_deposit
        .active_votes
        .checked_add(1)
        .ok_or(GovernanceError::Overflow)?;

    Ok(())
}
