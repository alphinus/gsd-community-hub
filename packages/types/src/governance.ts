/**
 * Governance types for the GSD Community Hub.
 *
 * These mirror the on-chain governance state structs and enums
 * defined in programs/gsd-hub/src/state/. TypeScript string unions
 * correspond to Rust enums, and interfaces correspond to account
 * structs with off-chain metadata extensions.
 *
 * BigInt fields (vote weights, deposited amounts) are serialized
 * as strings per project convention (JSON cannot serialize BigInt).
 */

// --- Enums (matching on-chain Rust enums) ---

/** Matches on-chain RoundStatus enum (idea_round.rs) */
export type RoundStatus = "open" | "voting" | "closed";

/** Matches on-chain QuorumType enum (idea_round.rs) */
export type QuorumType = "small" | "treasury" | "parameter_change";

/** Matches on-chain IdeaStatus enum (idea.rs) */
export type IdeaStatus = "submitted" | "approved" | "rejected" | "vetoed";

/** Matches on-chain VoteChoice enum (vote_record.rs) */
export type VoteChoice = "yes" | "no" | "abstain";

// --- Account interfaces (on-chain struct + off-chain metadata) ---

/**
 * Idea round combining on-chain IdeaRound account data
 * with off-chain metadata stored in the database.
 */
export interface IdeaRound {
  /** Database ID (cuid) */
  id: string;
  /** Sequential index matching on-chain round_index (u32) */
  roundIndex: number;
  /** Base58-encoded on-chain PDA address */
  onChainAddress: string;
  /** Off-chain round title */
  title: string;
  /** Off-chain round description */
  description: string;
  /** SHA-256 hash of off-chain content (matches on-chain content_hash) */
  contentHash: string;
  /** Current status matching on-chain RoundStatus */
  status: RoundStatus;
  /** When idea submissions open (on-chain submission_start as Date) */
  submissionStart: Date;
  /** When idea submissions close (on-chain submission_end as Date) */
  submissionEnd: Date;
  /** When voting ends (on-chain voting_end as Date) */
  votingEnd: Date;
  /** Number of ideas submitted (on-chain idea_count) */
  ideaCount: number;
  /** Quorum type determining vote threshold (on-chain quorum_type) */
  quorumType: QuorumType;
  /** Database creation timestamp */
  createdAt: Date;
}

/**
 * Idea combining on-chain Idea account data
 * with off-chain metadata stored in the database.
 *
 * Vote weights are serialized as strings (BigInt convention from 02-05).
 */
export interface Idea {
  /** Database ID (cuid) */
  id: string;
  /** Sequential index within the round (on-chain idea_index) */
  ideaIndex: number;
  /** Base58-encoded on-chain PDA address */
  onChainAddress: string;
  /** Foreign key to IdeaRound */
  roundId: string;
  /** Base58-encoded wallet of the idea author (on-chain author) */
  authorWallet: string;
  /** Off-chain idea title */
  title: string;
  /** Off-chain idea description */
  description: string;
  /** SHA-256 hash of off-chain content (matches on-chain content_hash) */
  contentHash: string;
  /** Current status matching on-chain IdeaStatus */
  status: IdeaStatus;
  /** Total weight of Yes votes (string-serialized u64) */
  yesWeight: string;
  /** Total weight of No votes (string-serialized u64) */
  noWeight: string;
  /** Total weight of Abstain votes (string-serialized u64) */
  abstainWeight: string;
  /** Number of unique voters (on-chain voter_count) */
  voterCount: number;
  /** Timestamp when idea was submitted */
  submittedAt: Date;
}

/**
 * Vote record matching on-chain VoteRecord account.
 * Weight is string-serialized BigInt.
 */
export interface VoteRecord {
  /** Database ID (cuid) */
  id: string;
  /** Base58-encoded on-chain PDA address */
  onChainAddress: string;
  /** Foreign key to Idea */
  ideaId: string;
  /** Base58-encoded voter wallet (on-chain voter) */
  voterWallet: string;
  /** Vote choice matching on-chain VoteChoice */
  vote: VoteChoice;
  /** Token weight applied to this vote (string-serialized u64) */
  weight: string;
  /** Timestamp when vote was cast */
  votedAt: Date;
}

/**
 * Vote deposit info matching on-chain VoteDeposit account.
 * Amounts are string-serialized BigInt.
 */
export interface VoteDepositInfo {
  /** Base58-encoded wallet address (on-chain authority) */
  walletAddress: string;
  /** Amount of governance tokens deposited (string-serialized u64) */
  depositedAmount: string;
  /** Timestamp when tokens were deposited */
  depositTimestamp: Date;
  /** Timestamp when tokens become eligible for voting */
  eligibleAt: Date;
  /** Number of currently active votes using this deposit */
  activeVotes: number;
  /** Whether the deposit has passed the timelock and is eligible for voting */
  isEligible: boolean;
}

/**
 * Governance configuration matching on-chain GovernanceConfig singleton.
 * Public keys and amounts are string-serialized.
 */
export interface GovernanceConfig {
  /** Base58-encoded admin authority public key */
  admin: string;
  /** Base58-encoded veto authority public key */
  vetoAuthority: string;
  /** Base58-encoded governance token mint public key */
  tokenMint: string;
  /** Total rounds created (on-chain round_count) */
  roundCount: number;
  /** Total tokens deposited across all vote deposits (string-serialized u64) */
  totalDeposited: string;
  /** Seconds tokens must be deposited before voting eligibility */
  depositTimelock: number;
  /** Seconds after approval before idea can be executed */
  executionTimelock: number;
}

// --- Input types for API endpoints ---

/** Input for creating a new idea via API */
export interface CreateIdeaInput {
  /** IdeaRound database ID */
  roundId: string;
  /** Idea title */
  title: string;
  /** Idea description */
  description: string;
}

/** Input for creating a new idea round via API */
export interface CreateRoundInput {
  /** Round title */
  title: string;
  /** Round description */
  description: string;
  /** When idea submissions open */
  submissionStart: Date;
  /** When idea submissions close */
  submissionEnd: Date;
  /** When voting ends */
  votingEnd: Date;
  /** Quorum type determining required vote threshold */
  quorumType: QuorumType;
}
