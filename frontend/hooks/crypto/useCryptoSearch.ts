"use client";

import { useMemo, useState } from "react";
import type { CryptoData } from "../../lib/crypto/types";

export function useCryptoSearch(cryptoData: CryptoData[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredData = useMemo(() => {
    if (searchQuery.trim() === "") return cryptoData;
    const query = searchQuery.toLowerCase();
    return cryptoData.filter((coin) => coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query));
  }, [searchQuery, cryptoData]);

  return { searchQuery, setSearchQuery, filteredData };
}
