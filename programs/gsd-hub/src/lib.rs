use anchor_lang::prelude::*;

pub mod cpi;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::{QuorumType, RevenueToken, VerificationType, VoteChoice};

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

    pub fn init_governance_config(
        ctx: Context<InitGovernanceConfig>,
        deposit_timelock: i64,
        execution_timelock: i64,
    ) -> Result<()> {
        instructions::init_governance_config::handler(ctx, deposit_timelock, execution_timelock)
    }

    pub fn create_round(
        ctx: Context<CreateRound>,
        submission_start: i64,
        submission_end: i64,
        voting_end: i64,
        quorum_type: QuorumType,
        content_hash: [u8; 32],
    ) -> Result<()> {
        instructions::create_round::handler(
            ctx,
            submission_start,
            submission_end,
            voting_end,
            quorum_type,
            content_hash,
        )
    }

    pub fn submit_idea(ctx: Context<SubmitIdea>, content_hash: [u8; 32]) -> Result<()> {
        instructions::submit_idea::handler(ctx, content_hash)
    }

    pub fn transition_round(ctx: Context<TransitionRound>) -> Result<()> {
        instructions::transition_round::handler(ctx)
    }

    pub fn deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
        instructions::deposit_tokens::handler(ctx, amount)
    }

    pub fn withdraw_tokens(ctx: Context<WithdrawTokens>, amount: u64) -> Result<()> {
        instructions::withdraw_tokens::handler(ctx, amount)
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote: VoteChoice) -> Result<()> {
        instructions::cast_vote::handler(ctx, vote)
    }

    pub fn relinquish_vote(ctx: Context<RelinquishVote>) -> Result<()> {
        instructions::relinquish_vote::handler(ctx)
    }

    pub fn veto_idea(ctx: Context<VetoIdea>) -> Result<()> {
        instructions::veto_idea::handler(ctx)
    }

    pub fn init_revenue_config(
        ctx: Context<InitRevenueConfig>,
        treasury_address: Pubkey,
        maintenance_address: Pubkey,
        gsd_mint: Pubkey,
        usdc_mint: Pubkey,
        min_revenue_threshold: u64,
    ) -> Result<()> {
        instructions::init_revenue_config::handler(
            ctx,
            treasury_address,
            maintenance_address,
            gsd_mint,
            usdc_mint,
            min_revenue_threshold,
        )
    }

    pub fn record_revenue_event(
        ctx: Context<RecordRevenueEvent>,
        total_amount: u64,
        token: RevenueToken,
        origin_signature: [u8; 64],
        total_contribution_score: u64,
    ) -> Result<()> {
        instructions::record_revenue_event::handler(
            ctx,
            total_amount,
            token,
            origin_signature,
            total_contribution_score,
        )
    }

    pub fn claim_revenue_share(ctx: Context<ClaimRevenueShare>) -> Result<()> {
        instructions::claim_revenue_share::handler(ctx)
    }

    pub fn execute_burn(
        ctx: Context<ExecuteBurn>,
        gsd_amount: u64,
        burn_tx_signature: [u8; 64],
    ) -> Result<()> {
        instructions::execute_burn::handler(ctx, gsd_amount, burn_tx_signature)
    }

    pub fn init_verification_config(
        ctx: Context<InitVerificationConfig>,
        confidence_threshold: u16,
        code_quality_weight: u16,
        task_fulfillment_weight: u16,
        test_coverage_weight: u16,
        workflow_discipline_weight: u16,
        plan_adherence_weight: u16,
        min_reviewers: u8,
        consensus_threshold_bps: u16,
        review_timeout_days: u8,
    ) -> Result<()> {
        instructions::init_verification_config::handler(
            ctx,
            confidence_threshold,
            code_quality_weight,
            task_fulfillment_weight,
            test_coverage_weight,
            workflow_discipline_weight,
            plan_adherence_weight,
            min_reviewers,
            consensus_threshold_bps,
            review_timeout_days,
        )
    }

    pub fn submit_verification(
        ctx: Context<SubmitVerification>,
        task_ref: [u8; 32],
        verification_type: VerificationType,
        score: u16,
        confidence: u16,
        report_hash: [u8; 32],
    ) -> Result<()> {
        instructions::submit_verification::handler(
            ctx,
            task_ref,
            verification_type,
            score,
            confidence,
            report_hash,
        )
    }

    pub fn submit_peer_review(
        ctx: Context<SubmitPeerReview>,
        tier: u8,
        weight: u16,
        score: u16,
        passed: bool,
        review_hash: [u8; 32],
    ) -> Result<()> {
        instructions::submit_peer_review::handler(
            ctx,
            tier,
            weight,
            score,
            passed,
            review_hash,
        )
    }

    pub fn finalize_peer_verification(
        ctx: Context<FinalizePeerVerification>,
        final_score: u16,
        final_confidence: u16,
        peer_report_hash: [u8; 32],
    ) -> Result<()> {
        instructions::finalize_peer_verification::handler(
            ctx,
            final_score,
            final_confidence,
            peer_report_hash,
        )
    }

    pub fn delegate_vote(ctx: Context<DelegateVote>) -> Result<()> {
        instructions::delegate_vote::handler(ctx)
    }

    pub fn revoke_delegation(ctx: Context<RevokeDelegation>) -> Result<()> {
        instructions::revoke_delegation::handler(ctx)
    }

    pub fn update_governance_config(
        ctx: Context<UpdateGovernanceConfig>,
        quadratic_voting_enabled: bool,
        civic_gatekeeper_network: Pubkey,
        decay_half_life_days: u16,
    ) -> Result<()> {
        instructions::update_governance_config::handler(
            ctx,
            quadratic_voting_enabled,
            civic_gatekeeper_network,
            decay_half_life_days,
        )
    }
}
