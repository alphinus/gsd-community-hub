use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke;

use super::compression::NOOP_PROGRAM_ID;

/// Emit application data via spl-noop program.
///
/// The spl-noop program simply logs whatever data is passed as instruction data.
/// No discriminator is needed -- the entire instruction data IS the logged data.
/// This is used to emit the full ContributionLeaf serialized bytes (106 bytes)
/// so off-chain indexers can reconstruct contributions from transaction logs.
///
/// # Arguments
/// * `noop_program` - The spl-noop program account
/// * `data` - Raw bytes to log (typically a serialized ContributionLeaf)
pub fn wrap_application_data<'info>(
    noop_program: &AccountInfo<'info>,
    data: Vec<u8>,
) -> Result<()> {
    let ix = Instruction {
        program_id: NOOP_PROGRAM_ID,
        accounts: vec![],
        data,
    };

    invoke(&ix, &[noop_program.clone()])?;

    Ok(())
}
