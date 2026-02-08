/// Revenue Vault PDA seed constant.
///
/// The revenue vault is a system account PDA (seeds: ["revenue_vault", event_index.to_le_bytes()])
/// that holds the developer pool SOL for a given revenue event.
///
/// For USDC: the vault is an Associated Token Account (ATA) derived from this PDA,
/// which the program signs for via CPI.
///
/// No Anchor `#[account]` struct is needed since this is a plain SystemAccount PDA.
/// The PDA bump is discovered at runtime via `find_program_address`.
pub const REVENUE_VAULT_SEED: &[u8] = b"revenue_vault";
