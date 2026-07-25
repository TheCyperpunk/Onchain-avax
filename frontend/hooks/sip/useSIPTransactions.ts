"use client";

import { useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../lib/contract";
import { savePoolToStorage } from "../../lib/sip/storage";

export const useCreateNativeSIP = (
  pool: string,
  amountPerInterval: string,
  frequency: number,
  maturity: number,
  destAddress: string,
  totalAmount: string,
) => {
  const { writeContract, data, error, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash: data });

  const createSIP = () => {
    if (!pool || !amountPerInterval || !frequency || !maturity || !destAddress || !totalAmount) return;
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "createPlanWithNative",
      args: [pool, parseEther(amountPerInterval), BigInt(frequency), BigInt(maturity), destAddress as `0x${string}`],
      value: parseEther(totalAmount),
    });
  };

  useEffect(() => {
    if (isSuccess && data && destAddress) savePoolToStorage(destAddress, pool, data);
  }, [isSuccess, data, destAddress, pool]);

  return { createSIP, txHash: data, isLoading: isPending || isWaiting, isSuccess, error: error || txError, canCreate: Boolean(pool && amountPerInterval && frequency && maturity && destAddress && totalAmount) };
};

const useSIPTransaction = (functionName: "executeSIP" | "finalizeSIP") => {
  const { writeContract, data, error, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess, error: txError } = useWaitForTransactionReceipt({ hash: data });
  const submit = (pool: string) => {
    if (!pool) return;
    writeContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI, functionName, args: [pool] });
  };
  return { submit, txHash: data, isLoading: isPending || isWaiting, isSuccess, error: error || txError };
};

export const useExecuteSIP = () => {
  const transaction = useSIPTransaction("executeSIP");
  return { ...transaction, executeSIP: transaction.submit };
};

export const useFinalizeSIP = () => {
  const transaction = useSIPTransaction("finalizeSIP");
  return { ...transaction, finalizeSIP: transaction.submit };
};
