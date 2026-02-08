use anchor_lang::prelude::*;

#[error_code]
pub enum GsdHubError {
    #[msg("Profile already exists")]
    ProfileAlreadyExists,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid profile hash")]
    InvalidProfileHash,
}
