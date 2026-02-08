/**
 * Transparency page configuration.
 *
 * These values are placeholder defaults for initial development.
 * Update with real addresses after running `scripts/setup-multisig.ts`
 * and deploying the on-chain program.
 */

export interface MultisigMember {
  address: string;
  label: string;
  role: "Core Team" | "Community";
}

export interface ProgramEntry {
  name: string;
  id: string;
  network: "devnet" | "mainnet-beta";
  deployedAt: string | null;
  upgradeAuthority: string;
}

export interface TokenAuthority {
  label: string;
  status: string;
  address: string | null;
  verifiable: boolean;
}

export interface TransparencyConfig {
  multisig: {
    address: string;
    threshold: number;
    totalMembers: number;
    members: MultisigMember[];
  };
  programs: ProgramEntry[];
  repository: {
    url: string;
    license: string;
  };
  tokenInfo: {
    name: string;
    symbol: string;
    authorities: TokenAuthority[];
  };
}

const network = (process.env.NEXT_PUBLIC_NETWORK as "devnet" | "mainnet-beta") || "devnet";

export const transparencyConfig: TransparencyConfig = {
  multisig: {
    address: process.env.NEXT_PUBLIC_MULTISIG_ADDRESS || "PLACEHOLDER_MULTISIG_ADDRESS",
    threshold: 3,
    totalMembers: 5,
    members: [
      {
        address: "PLACEHOLDER_MEMBER_1",
        label: "Core Developer 1",
        role: "Core Team",
      },
      {
        address: "PLACEHOLDER_MEMBER_2",
        label: "Core Developer 2",
        role: "Core Team",
      },
      {
        address: "PLACEHOLDER_MEMBER_3",
        label: "Core Developer 3",
        role: "Core Team",
      },
      {
        address: "PLACEHOLDER_MEMBER_4",
        label: "Community Member 1",
        role: "Community",
      },
      {
        address: "PLACEHOLDER_MEMBER_5",
        label: "Community Member 2",
        role: "Community",
      },
    ],
  },
  programs: [
    {
      name: "GSD Program",
      id: process.env.NEXT_PUBLIC_PROGRAM_ID || "Gn3kafdEiBZ51T5ewMTtXLUDYzECk87kPwxDAjspqYhw",
      network,
      deployedAt: null,
      upgradeAuthority: process.env.NEXT_PUBLIC_MULTISIG_ADDRESS || "PLACEHOLDER_MULTISIG_ADDRESS",
    },
  ],
  repository: {
    url: "https://github.com/gsd-community/gsd-community-hub",
    license: "MIT",
  },
  tokenInfo: {
    name: "GSD Token",
    symbol: "$GSD",
    authorities: [
      {
        label: "Mint Authority",
        status: "Pending — will be assigned to multisig",
        address: null,
        verifiable: false,
      },
      {
        label: "Freeze Authority",
        status: "None — no freeze capability",
        address: null,
        verifiable: true,
      },
      {
        label: "Metadata Authority",
        status: "Pending — will be assigned to multisig",
        address: null,
        verifiable: false,
      },
    ],
  },
};

/**
 * Build a Solana Explorer URL for the current network.
 */
export function explorerUrl(
  address: string,
  type: "address" | "tx" = "address"
): string {
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/${type}/${address}${cluster}`;
}

/**
 * Build a Squads v4 multisig URL.
 */
export function squadsUrl(address: string): string {
  return `https://v4.squads.so/squad/${address}`;
}

/**
 * Truncate a Solana address for display: first 4 + last 4 chars.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
