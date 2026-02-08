use anchor_lang::prelude::*;

/// On-chain configuration for a contribution Merkle tree.
///
/// PDA seeds: `[b"contribution_tree", merkle_tree.key().as_ref()]`
///
/// Stores metadata about the concurrent Merkle tree used for
/// compressed contribution records. The actual tree data lives
/// in the spl-account-compression account; this PDA tracks
/// authority, contribution count, and creation time.
#[account]
#[derive(InitSpace)]
pub struct ContributionTreeConfig {
    /// Authority that can append leaves to the tree (32 bytes)
    pub authority: Pubkey,
    /// Address of the concurrent Merkle tree account (32 bytes)
    pub merkle_tree: Pubkey,
    /// Number of contributions appended to the tree (8 bytes)
    pub total_contributions: u64,
    /// PDA bump seed (1 byte)
    pub bump: u8,
    /// Unix timestamp of tree creation (8 bytes)
    pub created_at: i64,
}
// Total: 8 (discriminator) + 32 + 32 + 8 + 1 + 8 = 89 bytes
