import { PublicKey } from "@solana/web3.js";

export const DEVELOPER_SEED = "developer";

export function getDeveloperProfilePDA(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(DEVELOPER_SEED), wallet.toBuffer()],
    programId
  );
}
