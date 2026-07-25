"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { CryptoData } from "../../lib/crypto/types";

export function useCryptoPrices(isOpen: boolean) {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/crypto-prices");
      if (!Array.isArray(response.data)) throw new Error(response.data?.error || "Invalid response");
      setCryptoData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.status === 429 ? "Rate limit exceeded. Please wait 1-2 minutes." : err.message || "Failed to fetch crypto data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refetch();
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, [isOpen, refetch]);

  return { cryptoData, loading, error, refetch };
}
