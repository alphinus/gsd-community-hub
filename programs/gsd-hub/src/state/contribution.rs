use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

/// Leaf data for the contribution Merkle tree.
///
/// This is NOT a PDA account -- it is serialized, hashed, and appended
/// as a leaf to the spl-account-compression concurrent Merkle tree.
/// The full serialized data (106 bytes) is also emitted via spl-noop
/// so off-chain indexers can reconstruct contributions from tx logs.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct ContributionLeaf {
    /// Wallet that made the contribution (32 bytes)
    pub developer: Pubkey,
    /// SHA-256 hash of the task identifier (32 bytes)
    pub task_ref: [u8; 32],
    /// Verification score: 0-10000 representing 0.00%-100.00% (2 bytes)
    pub verification_score: u16,
    /// Unix timestamp of when the contribution was recorded (8 bytes)
    pub timestamp: i64,
    /// SHA-256 hash of off-chain contribution content (32 bytes)
    pub content_hash: [u8; 32],
}
// Total serialized: 32 + 32 + 2 + 8 + 32 = 106 bytes

impl ContributionLeaf {
    /// Serialized size of the leaf data.
    pub const SIZE: usize = 106;

    /// Serialize the leaf and hash it for Merkle tree insertion.
    ///
    /// Returns a 32-byte SHA-256 hash suitable for use as a concurrent Merkle tree leaf.
    pub fn to_leaf_hash(&self) -> [u8; 32] {
        let data = AnchorSerialize::try_to_vec(self).expect("ContributionLeaf serialization");
        let mut hasher = Sha256::new();
        hasher.update(&data);
        hasher.finalize().into()
    }
}
