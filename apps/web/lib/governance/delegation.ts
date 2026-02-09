import { prisma } from "@/lib/db/prisma";

/**
 * Delegation query helpers for governance analytics and UI.
 *
 * Provides reusable functions to query delegation state from the database.
 * The Delegation model is populated by the governance-advanced-indexer
 * when delegate_vote and revoke_delegation events are processed.
 */

/** Delegation record shape for API responses */
export interface DelegationInfo {
  id: string;
  onChainAddress: string;
  delegatorWallet: string;
  delegateWallet: string;
  delegatedAmount: string; // BigInt serialized as string (project convention)
  isActive: boolean;
  effectiveFromRound: number;
  delegatedAt: Date;
  revokedAt: Date | null;
}

/** Aggregate stats for a delegate */
export interface DelegateStats {
  delegatorCount: number;
  totalDelegated: string; // BigInt serialized as string
}

/**
 * Get all delegations where the wallet is either delegator or delegate.
 *
 * @param wallet - Wallet address to query
 * @returns Array of delegation records with BigInt amounts as strings
 */
export async function getDelegationsForWallet(
  wallet: string
): Promise<DelegationInfo[]> {
  const delegations = await prisma.delegation.findMany({
    where: {
      OR: [{ delegatorWallet: wallet }, { delegateWallet: wallet }],
    },
    orderBy: { delegatedAt: "desc" },
  });

  return delegations.map((d) => ({
    id: d.id,
    onChainAddress: d.onChainAddress,
    delegatorWallet: d.delegatorWallet,
    delegateWallet: d.delegateWallet,
    delegatedAmount: d.delegatedAmount.toString(),
    isActive: d.isActive,
    effectiveFromRound: d.effectiveFromRound,
    delegatedAt: d.delegatedAt,
    revokedAt: d.revokedAt,
  }));
}

/**
 * Get aggregate stats for a delegate wallet.
 *
 * @param wallet - Delegate's wallet address
 * @returns Delegator count and total delegated amount
 */
export async function getDelegateStats(
  wallet: string
): Promise<DelegateStats> {
  const result = await prisma.delegation.aggregate({
    where: {
      delegateWallet: wallet,
      isActive: true,
    },
    _count: { delegatorWallet: true },
    _sum: { delegatedAmount: true },
  });

  return {
    delegatorCount: result._count.delegatorWallet,
    totalDelegated: (result._sum.delegatedAmount ?? BigInt(0)).toString(),
  };
}

/**
 * Get all active delegations with counts for analytics.
 *
 * Used by the governance analytics API (Plan 06-05) to compute
 * delegation stats including total active delegations, total
 * delegated tokens, and top delegates by delegator count.
 *
 * @returns All active delegation records
 */
export async function getActiveDelegations(): Promise<DelegationInfo[]> {
  const delegations = await prisma.delegation.findMany({
    where: { isActive: true },
    orderBy: { delegatedAt: "desc" },
  });

  return delegations.map((d) => ({
    id: d.id,
    onChainAddress: d.onChainAddress,
    delegatorWallet: d.delegatorWallet,
    delegateWallet: d.delegateWallet,
    delegatedAmount: d.delegatedAmount.toString(),
    isActive: d.isActive,
    effectiveFromRound: d.effectiveFromRound,
    delegatedAt: d.delegatedAt,
    revokedAt: d.revokedAt,
  }));
}
