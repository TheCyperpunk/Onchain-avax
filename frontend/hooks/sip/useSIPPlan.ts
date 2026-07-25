"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../lib/contract";
import type { SIPPlan } from "../../lib/sip/types";

export const useGetSIPPlan = (userAddress: string | undefined, pool: string) => {
  const { data, error, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getPlan",
    args: [userAddress as `0x${string}`, pool],
    query: { enabled: Boolean(userAddress && pool) },
  });

  const plan = data as SIPPlan | undefined;
  return {
    plan: plan && plan.totalAmount > 0n ? plan : undefined,
    isLoading,
    error,
    refetch,
    hasActivePlan: plan?.active || false,
  };
};
