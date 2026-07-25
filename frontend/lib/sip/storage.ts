const STORAGE_KEY = 'onchain_sip_pools';
const TX_STORAGE_KEY = 'onchain_sip_transactions';

export const savePoolToStorage = (userAddress: string, poolName: string, txHash?: string) => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const pools = stored ? JSON.parse(stored) : {};

    if (!pools[userAddress]) pools[userAddress] = [];
    if (!pools[userAddress].includes(poolName)) {
      pools[userAddress].push(poolName);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pools));
    }

    if (txHash) {
      const txStored = localStorage.getItem(TX_STORAGE_KEY);
      const transactions = txStored ? JSON.parse(txStored) : {};
      if (!transactions[userAddress]) transactions[userAddress] = {};
      transactions[userAddress][poolName] = { txHash, timestamp: Date.now() };
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
    }
  } catch (err) {
    console.error('Error saving pool to storage:', err);
  }
};

export const getStoredPools = (userAddress: string): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored ? JSON.parse(stored) : {})[userAddress] || [];
  } catch (err) {
    console.error('Error reading stored pools:', err);
    return [];
  }
};

export const getStoredTransaction = (userAddress: string, poolName: string): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(TX_STORAGE_KEY);
    return (stored ? JSON.parse(stored) : {})[userAddress]?.[poolName]?.txHash || null;
  } catch (err) {
    console.error('Error reading stored transaction:', err);
    return null;
  }
};
