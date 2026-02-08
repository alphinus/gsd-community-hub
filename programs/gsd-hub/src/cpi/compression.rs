use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use sha2::{Digest, Sha256};

/// spl-account-compression program ID (cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK)
pub static ACCOUNT_COMPRESSION_PROGRAM_ID: Pubkey =
    pubkey!("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");

/// spl-noop program ID (noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV)
pub static NOOP_PROGRAM_ID: Pubkey = pubkey!("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV");

/// Compute the 8-byte Anchor discriminator for a given instruction name.
///
/// spl-account-compression uses Anchor-style discriminators: SHA-256("global:<name>")[..8].
fn anchor_discriminator(instruction_name: &str) -> [u8; 8] {
    let preimage = format!("global:{}", instruction_name);
    let mut hasher = Sha256::new();
    hasher.update(preimage.as_bytes());
    let hash = hasher.finalize();
    let mut disc = [0u8; 8];
    disc.copy_from_slice(&hash[..8]);
    disc
}

/// Append a leaf to a concurrent Merkle tree via raw CPI to spl-account-compression.
///
/// # Arguments
/// * `merkle_tree` - The concurrent Merkle tree account (writable)
/// * `authority` - The tree authority (signer)
/// * `noop_program` - The spl-noop program for logging
/// * `compression_program` - The spl-account-compression program
/// * `leaf` - 32-byte leaf hash to append
/// * `signer_seeds` - If Some, uses invoke_signed (PDA authority); if None, uses invoke
pub fn append_leaf<'info>(
    merkle_tree: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    noop_program: &AccountInfo<'info>,
    compression_program: &AccountInfo<'info>,
    leaf: [u8; 32],
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    // Instruction data: 8-byte discriminator + 32-byte leaf
    let discriminator = anchor_discriminator("append");
    let mut data = Vec::with_capacity(40);
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&leaf);

    let accounts = vec![
        AccountMeta::new(*merkle_tree.key, false),
        AccountMeta::new_readonly(*authority.key, true),
        AccountMeta::new_readonly(*noop_program.key, false),
    ];

    let ix = Instruction {
        program_id: ACCOUNT_COMPRESSION_PROGRAM_ID,
        accounts,
        data,
    };

    let account_infos = &[
        merkle_tree.clone(),
        authority.clone(),
        noop_program.clone(),
        compression_program.clone(),
    ];

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, account_infos, seeds)?,
        None => invoke(&ix, account_infos)?,
    }

    Ok(())
}

/// Initialize an empty concurrent Merkle tree via raw CPI to spl-account-compression.
///
/// # Arguments
/// * `merkle_tree` - The Merkle tree account to initialize (writable, must be pre-allocated)
/// * `authority` - The tree authority (signer)
/// * `noop_program` - The spl-noop program for logging
/// * `compression_program` - The spl-account-compression program
/// * `max_depth` - Maximum depth of the tree (determines max leaves = 2^max_depth)
/// * `max_buffer_size` - Maximum buffer size for concurrent operations
/// * `signer_seeds` - If Some, uses invoke_signed (PDA authority); if None, uses invoke
pub fn init_empty_merkle_tree<'info>(
    merkle_tree: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    noop_program: &AccountInfo<'info>,
    compression_program: &AccountInfo<'info>,
    max_depth: u32,
    max_buffer_size: u32,
    signer_seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
    // Instruction data: 8-byte discriminator + u32 max_depth + u32 max_buffer_size
    let discriminator = anchor_discriminator("init_empty_merkle_tree");
    let mut data = Vec::with_capacity(16);
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&max_depth.to_le_bytes());
    data.extend_from_slice(&max_buffer_size.to_le_bytes());

    let accounts = vec![
        AccountMeta::new(*merkle_tree.key, false),
        AccountMeta::new_readonly(*authority.key, true),
        AccountMeta::new_readonly(*noop_program.key, false),
    ];

    let ix = Instruction {
        program_id: ACCOUNT_COMPRESSION_PROGRAM_ID,
        accounts,
        data,
    };

    let account_infos = &[
        merkle_tree.clone(),
        authority.clone(),
        noop_program.clone(),
        compression_program.clone(),
    ];

    match signer_seeds {
        Some(seeds) => invoke_signed(&ix, account_infos, seeds)?,
        None => invoke(&ix, account_infos)?,
    }

    Ok(())
}
