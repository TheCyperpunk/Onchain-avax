"use client";

import { useCallback, useState } from "react";
import axios from "axios";
import type { CoinDetails } from "../../lib/crypto/types";

export function useCoinDetails() {
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchCoinDetails = useCallback(async (coinId: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setCoinDetails(null);
      const response = await axios.get(`/api/crypto-details/${coinId}`);
      setCoinDetails(response.data);
    } catch (err: any) {
      setDetailError(err.response?.data?.error || "Failed to load coin details.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const resetCoinDetails = useCallback(() => {
    setCoinDetails(null);
    setDetailError(null);
  }, []);

  return { coinDetails, detailLoading, detailError, fetchCoinDetails, resetCoinDetails };
}
