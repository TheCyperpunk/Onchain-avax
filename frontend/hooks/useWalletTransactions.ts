"use client";

import { useEffect, useState } from "react";

export function useWalletTransactions(address: string | undefined, enabled: boolean) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!enabled || !address) return;
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://cdn.testnet.routescan.io/api/evm/all/address/${address}/internal-operations?ecosystem=avalanche&sort=desc&limit=100&count=true`);
        setTransactions((await response.json()).items || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally { setIsLoading(false); }
    };
    fetchTransactions();
  }, [enabled, address]);
  return { transactions, isLoading };
}
