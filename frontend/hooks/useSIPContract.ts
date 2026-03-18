// hooks/useSIPContract.ts
import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

export interface SIPPlan {
  token: string;
  totalAmount: bigint;
  amountPerInterval: bigint;
  frequency: bigint;
  nextExecution: bigint;
  maturity: bigint;
  destAddress: string;
  executedAmount: bigint;
  active: boolean;
  poolName: string;
}

export interface SIPEvent {
  user: string;
  pool: string;
  total: bigint;
  intervalAmount: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

// Storage helper functions
const STORAGE_KEY = 'onchain_sip_pools';
const TX_STORAGE_KEY = 'onchain_sip_transactions';

const savePoolToStorage = (userAddress: string, poolName: string, txHash?: string) => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const pools = stored ? JSON.parse(stored) : {};

    if (!pools[userAddress]) {
      pools[userAddress] = [];
    }

    if (!pools[userAddress].includes(poolName)) {
      pools[userAddress].push(poolName);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pools));
    }

    // Also save transaction data
    if (txHash) {
      const txStored = localStorage.getItem(TX_STORAGE_KEY);
      const transactions = txStored ? JSON.parse(txStored) : {};

      if (!transactions[userAddress]) {
        transactions[userAddress] = {};
      }

      transactions[userAddress][poolName] = {
        txHash,
        timestamp: Date.now()
      };

      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
    }
  } catch (err) {
    console.error('Error saving pool to storage:', err);
  }
};

const getStoredPools = (userAddress: string): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const pools = stored ? JSON.parse(stored) : {};
    return pools[userAddress] || [];
  } catch (err) {
    console.error('Error reading stored pools:', err);
    return [];
  }
};

const getStoredTransaction = (userAddress: string, poolName: string): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(TX_STORAGE_KEY);
    const transactions = stored ? JSON.parse(stored) : {};
    return transactions[userAddress]?.[poolName]?.txHash || null;
  } catch (err) {
    console.error('Error reading stored transaction:', err);
    return null;
  }
};

// Explorer link helper functions
export const getFujiTestnetLink = (type: 'tx' | 'address' | 'token', hash: string) => {
  const baseUrl = 'https://testnet.snowtrace.io';
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    case 'token':
      return `${baseUrl}/token/${hash}`;
    default:
      return baseUrl;
  }
};

export const useSIPContract = () => {
  // Enhanced Create SIP Plan with transaction tracking
  const useCreateNativeSIP = (
    pool: string,
    amountPerInterval: string,
    frequency: number,
    maturity: number,
    destAddress: string,
    totalAmount: string
  ) => {
    const { writeContract, data, error, isPending } = useWriteContract();
    const { isLoading: isWaiting, isSuccess, error: txError } = useWaitForTransactionReceipt({
      hash: data,
    });

    const createSIP = () => {
      if (!pool || !amountPerInterval || !frequency || !maturity || !destAddress || !totalAmount) {
        return;
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createPlanWithNative',
        args: [
          pool,
          parseEther(amountPerInterval),
          BigInt(frequency),
          BigInt(maturity),
          destAddress as `0x${string}`
        ],
        value: parseEther(totalAmount),
      });
    };

    // Save pool and transaction data when successful
    useEffect(() => {
      if (isSuccess && data && destAddress) {
        savePoolToStorage(destAddress, pool, data);
        console.log(`SIP created successfully for pool: ${pool}, tx: ${data}`);
      }
    }, [isSuccess, data, destAddress, pool]);

    return {
      createSIP,
      txHash: data,
      isLoading: isPending || isWaiting,
      isSuccess,
      error: error || txError,
      canCreate: Boolean(pool && amountPerInterval && frequency && maturity && destAddress && totalAmount)
    };
  };

  // Get User SIP Plan (single)
  const useGetSIPPlan = (userAddress: string | undefined, pool: string) => {
    const { data, error, isLoading, refetch } = useReadContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'getPlan',
      args: [userAddress as `0x${string}`, pool],
      query: {
        enabled: Boolean(userAddress && pool),
      }
    });

    const plan = data as SIPPlan | undefined;

    // Validate that plan exists and is not empty (0x return)
    const isValidPlan = plan && plan.totalAmount > 0n;

    return {
      plan: isValidPlan ? plan : undefined,
      isLoading,
      error,
      refetch,
      hasActivePlan: plan?.active || false
    };
  };

  // Enhanced Get All User SIPs using on-chain pool enumeration
  const useGetAllUserSIPs = (userAddress: string | undefined) => {
    const [allSIPs, setAllSIPs] = useState<SIPPlan[]>([]);
    const [poolNames, setPoolNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchAllSIPs = async () => {
      if (!userAddress) {
        setAllSIPs([]);
        setPoolNames([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const publicClient = createPublicClient({
          chain: avalancheFuji,
          transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
        });

        // Use the on-chain getUserPoolNames function instead of guessing
        let pools: string[] = [];
        try {
          pools = await publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'getUserPoolNames',
            args: [userAddress as `0x${string}`]
          }) as string[];
        } catch (poolErr: any) {
          // viem throws ContractFunctionExecutionError when the user has no pools
          // (the function returns empty data / "0x" for fresh addresses)
          if (
            poolErr.name === 'ContractFunctionExecutionError' ||
            poolErr.name === 'ContractFunctionZeroDataError' ||
            poolErr.message?.includes('returned no data') ||
            poolErr.message?.includes('0x')
          ) {
            console.log('No on-chain pools found for user (0x return) — treating as empty.');
            pools = [];
          } else {
            throw poolErr; // re-throw unexpected errors
          }
        }

        console.log(`Found ${pools.length} pools for user from contract:`, pools);

        // Also merge with localStorage pools as a fallback for old SIPs
        const storedPools = getStoredPools(userAddress);
        const allPoolNames = [...new Set([...pools, ...storedPools])];

        const validSIPs: SIPPlan[] = [];

        // Fetch each pool's data in batches
        const batchSize = 5;
        for (let i = 0; i < allPoolNames.length; i += batchSize) {
          const batch = allPoolNames.slice(i, i + batchSize);

          const batchPromises = batch.map(async (pool) => {
            try {
              const sipData = await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'getPlan',
                args: [userAddress as `0x${string}`, pool]
              });

              const typedSipData = sipData as any;
              if (!sipData || (typedSipData.totalAmount === 0n && typedSipData.active === false)) {
                return null;
              }

              const sipWithPool: SIPPlan = {
                ...(sipData as Omit<SIPPlan, 'poolName'>),
                poolName: pool
              };

              // Return both active and inactive SIPs so we can show history
              return sipWithPool.totalAmount > 0n ? sipWithPool : null;
            } catch (err: any) {
              if (err.name === 'ContractFunctionZeroDataError' ||
                err.message?.includes('returned no data') ||
                err.message?.includes('0x')) {
                return null;
              }
              console.error(`Error fetching pool ${pool}:`, err);
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const batchValidSIPs = batchResults.filter((sip): sip is SIPPlan => sip !== null);
          validSIPs.push(...batchValidSIPs);
        }

        console.log(`Found ${validSIPs.length} SIPs total, ${validSIPs.filter(s => s.active).length} active`);
        setAllSIPs(validSIPs);
        setPoolNames(validSIPs.map(sip => sip.poolName));

      } catch (err) {
        console.error('Error fetching SIPs:', err);
        setError(err as Error);
        setAllSIPs([]);
        setPoolNames([]);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchAllSIPs();
      // Only refetch when user address changes, not on every block
    }, [userAddress]);

    return {
      allSIPs,
      poolNames,
      isLoading,
      error,
      refetch: fetchAllSIPs,
      hasActiveSIPs: allSIPs.filter((s: SIPPlan) => s.active).length > 0
    };
  };

  // Execute SIP Interval
  const useExecuteSIP = () => {
    const { writeContract, data, error, isPending } = useWriteContract();
    const { isLoading: isWaiting, isSuccess, error: txError } = useWaitForTransactionReceipt({
      hash: data,
    });

    const executeSIP = (pool: string) => {
      if (!pool) return;

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'executeSIP',
        args: [pool],
      });
    };

    return {
      executeSIP,
      txHash: data,
      isLoading: isPending || isWaiting,
      isSuccess,
      error: error || txError,
    };
  };

  // Finalize SIP
  const useFinalizeSIP = () => {
    const { writeContract, data, error, isPending } = useWriteContract();
    const { isLoading: isWaiting, isSuccess, error: txError } = useWaitForTransactionReceipt({
      hash: data,
    });

    const finalizeSIP = (pool: string) => {
      if (!pool) return;

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'finalizeSIP',
        args: [pool],
      });
    };

    return {
      finalizeSIP,
      txHash: data,
      isLoading: isPending || isWaiting,
      isSuccess,
      error: error || txError,
    };
  };

  // Get SIPs from blockchain events (most reliable method)
  const useGetSIPsFromEvents = (userAddress: string | undefined) => {
    const [sips, setSips] = useState<SIPPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const fetchSIPsFromEvents = async () => {
        if (!userAddress) {
          setSips([]);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const publicClient = createPublicClient({
            chain: avalancheFuji,
            transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
          });

          // Get current block number
          const currentBlock = await publicClient.getBlockNumber();
          console.log(`Current block: ${currentBlock}`);

          // Fetch events from last 50k blocks (approximately 1-2 days on Avalanche Fuji)
          const blocksToSearch = 50000n;
          const fromBlock = currentBlock > blocksToSearch ? currentBlock - blocksToSearch : 0n;
          const chunkSize = 10000n; // Larger chunks to minimize RPC calls

          console.log(`Searching for events from block ${fromBlock} to ${currentBlock}`);

          let allLogs: any[] = [];

          // Fetch events in chunks
          for (let start = fromBlock; start <= currentBlock; start += chunkSize) {
            const end = start + chunkSize > currentBlock ? currentBlock : start + chunkSize;

            try {
              const logs = await publicClient.getLogs({
                address: CONTRACT_ADDRESS as `0x${string}`,
                event: {
                  type: 'event',
                  name: 'PlanCreated',
                  inputs: [
                    { type: 'address', indexed: true, name: 'user' },
                    { type: 'string', indexed: false, name: 'pool' },
                    { type: 'uint256', indexed: false, name: 'total' },
                    { type: 'uint256', indexed: false, name: 'intervalAmount' }
                  ]
                },
                args: {
                  user: userAddress as `0x${string}`
                },
                fromBlock: start,
                toBlock: end
              });

              allLogs = [...allLogs, ...logs];
            } catch (err) {
              console.error(`Error fetching logs from block ${start} to ${end}:`, err);
            }
          }

          console.log(`Found ${allLogs.length} PlanCreated events for user`);

          // Extract pool names and fetch SIP data
          const sipPromises = allLogs.map(async (log) => {
            try {
              const pool = log.args.pool as string;
              console.log(`Fetching SIP data for pool: ${pool}`);

              const sipData = await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'getPlan',
                args: [userAddress as `0x${string}`, pool]
              });

              // Check if plan is empty (returns 0x or all zeros)
              const typedSipData = sipData as any;
              if (!sipData || (typedSipData.totalAmount === 0n && typedSipData.active === false)) {
                console.warn(`Plan not found or empty for pool ${pool}`);
                return null;
              }

              const sipWithPool: SIPPlan = {
                ...(sipData as Omit<SIPPlan, 'poolName'>),
                poolName: pool
              };

              return sipWithPool.active ? sipWithPool : null;
            } catch (err: any) {
              // Handle ContractFunctionZeroDataError (0x return)
              if (err.name === 'ContractFunctionZeroDataError' ||
                err.message?.includes('returned no data') ||
                err.message?.includes('0x')) {
                console.warn(`Plan returned 0x for pool ${log.args.pool} (doesn't exist)`);
                return null;
              }
              console.error(`Error fetching pool ${log.args.pool}:`, err);
              return null;
            }
          });

          const allSips = await Promise.all(sipPromises);
          const activeSips = allSips.filter((sip): sip is SIPPlan => sip !== null);

          console.log(`Found ${activeSips.length} active SIPs from events`);
          setSips(activeSips);
        } catch (err) {
          console.error('Error fetching SIPs from events:', err);
          setError(err as Error);
          setSips([]);
        } finally {
          setLoading(false);
        }
      };

      fetchSIPsFromEvents();
    }, [userAddress]);

    return { sips, loading, error };
  };

  // Get SIPs from Routescan transaction history (most comprehensive method)
  const useGetSIPsFromTransactions = (userAddress: string | undefined) => {
    const [transactionSIPs, setTransactionSIPs] = useState<SIPPlan[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchSIPsFromTransactions = async () => {
        console.log('[useGetSIPsFromTransactions] Starting fetch, userAddress:', userAddress);

        if (!userAddress) {
          console.log('[useGetSIPsFromTransactions] No user address, returning empty');
          setTransactionSIPs([]);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          // Fetch transactions from Routescan API
          const apiUrl = `https://cdn.testnet.routescan.io/api/evm/all/transactions?ecosystem=avalanche&fromAddresses=${userAddress}&toAddresses=${CONTRACT_ADDRESS}&sort=desc&limit=100&count=true`;
          console.log('[useGetSIPsFromTransactions] Fetching from:', apiUrl);

          const response = await fetch(apiUrl);

          if (!response.ok) {
            throw new Error('Failed to fetch transactions');
          }

          const data = await response.json();
          console.log('Routescan transactions:', data);

          // Filter for SIP creation transactions (methodId: 0xe1dc1c04 is createPlanWithNative)
          const sipCreationTxs = data.items?.filter((tx: any) =>
            tx.methodId === '0xe1dc1c04' && tx.status === true
          ) || [];

          console.log(`Found ${sipCreationTxs.length} SIP creation transactions`);

          if (sipCreationTxs.length === 0) {
            setTransactionSIPs([]);
            setIsLoading(false);
            return;
          }

          // For each transaction, we need to decode the pool name from the transaction input
          // The pool name is the first parameter in the createPlanWithNative function
          // We'll fetch the full transaction details to get the input data
          const publicClient = createPublicClient({
            chain: avalancheFuji,
            transport: http()
          });

          const sipPlans: SIPPlan[] = [];

          for (const tx of sipCreationTxs) {
            try {
              // Get transaction details to extract pool name
              const txDetails = await publicClient.getTransaction({
                hash: tx.txHash as `0x${string}`
              });

              // Decode the input data to get pool name
              // The input format is: 0xe1dc1c04 + encoded parameters
              // Pool name is the first parameter (string)
              const inputData = txDetails.input;

              // Skip the function selector (first 10 characters: 0x + 8 hex chars)
              const params = inputData.slice(10);

              // The first 32 bytes (64 hex chars) point to the offset of the string
              // The next 32 bytes contain the length of the string
              // Then comes the actual string data
              const stringOffset = parseInt(params.slice(0, 64), 16) * 2;
              const stringLength = parseInt(params.slice(stringOffset, stringOffset + 64), 16) * 2;
              const stringData = params.slice(stringOffset + 64, stringOffset + 64 + stringLength);

              // Convert hex to string (browser-compatible)
              const poolName = stringData.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '';

              console.log(`Decoded pool name: ${poolName} from tx: ${tx.txHash}`);

              // Now fetch the SIP plan from the contract using the pool name
              const sipData = await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'getPlan',
                args: [userAddress as `0x${string}`, poolName]
              }) as any;

              // Validate the SIP data
              if (sipData && sipData.totalAmount > 0n) {
                const typedSipData = sipData as any;
                sipPlans.push({
                  token: typedSipData.token || '0x0000000000000000000000000000000000000000',
                  totalAmount: typedSipData.totalAmount,
                  amountPerInterval: typedSipData.amountPerInterval,
                  frequency: typedSipData.frequency,
                  nextExecution: typedSipData.nextExecution,
                  maturity: typedSipData.maturity,
                  destAddress: typedSipData.destAddress,
                  executedAmount: typedSipData.executedAmount,
                  active: typedSipData.active,
                  poolName: poolName
                });
              }
            } catch (err) {
              console.warn(`Failed to process transaction ${tx.txHash}:`, err);
            }
          }

          console.log(`Successfully fetched ${sipPlans.length} SIPs from transactions`);
          setTransactionSIPs(sipPlans);
        } catch (err: any) {
          console.error('Error fetching SIPs from transactions:', err);
          setError(err.message || 'Failed to fetch SIPs from transactions');
        } finally {
          setIsLoading(false);
        }
      };

      fetchSIPsFromTransactions();
    }, [userAddress]);

    return {
      transactionSIPs,
      isLoading,
      error
    };
  };

  return {
    useCreateNativeSIP,
    useGetSIPPlan,
    useGetAllUserSIPs,
    useGetSIPsFromEvents,
    useGetSIPsFromTransactions,
    useExecuteSIP,
    useFinalizeSIP
  };
};

// Enhanced formatSIPData with explorer links
export const formatSIPData = (plan: SIPPlan | undefined, userAddress?: string) => {
  if (!plan) return null;
  // Show all SIPs, even if not yet executed or nextExecution is in the future
  const creationTx = userAddress ? getStoredTransaction(userAddress, plan.poolName) : null;
  return {
    totalAmount: formatEther(plan.totalAmount),
    amountPerInterval: formatEther(plan.amountPerInterval),
    executedAmount: formatEther(plan.executedAmount),
    remainingAmount: formatEther(plan.totalAmount - plan.executedAmount),
    nextExecution: new Date(Number(plan.nextExecution) * 1000),
    maturity: new Date(Number(plan.maturity) * 1000),
    frequency: Number(plan.frequency),
    frequencyDays: Math.floor(Number(plan.frequency) / (24 * 3600)),
    isNative: plan.token === '0x0000000000000000000000000000000000000000',
    active: plan.active,
    progress: Number(plan.totalAmount) > 0
      ? (Number(plan.executedAmount) / Number(plan.totalAmount)) * 100
      : 0,
    canExecute: plan.active &&
      Date.now() >= Number(plan.nextExecution) * 1000 &&
      Date.now() < Number(plan.maturity) * 1000 &&
      Number(plan.executedAmount) + Number(plan.amountPerInterval) <= Number(plan.totalAmount),
    canFinalize: plan.active && Date.now() >= Number(plan.maturity) * 1000,
    poolName: plan.poolName,
    // Explorer links
    contractLink: getFujiTestnetLink('address', CONTRACT_ADDRESS),
    creationTxLink: creationTx ? getFujiTestnetLink('tx', creationTx) : null,
  };
};

// Pool name generator
export const generatePoolName = (userAddress: string, timestamp: number) => {
  return `sip_${userAddress.slice(-6)}_${Math.floor(timestamp / 1000)}`;
};

// Format multiple SIPs data with user address for transaction links
export const formatMultipleSIPsData = (plans: SIPPlan[], userAddress?: string) => {
  return plans.map(plan => formatSIPData(plan, userAddress)).filter(Boolean);
};

// Get total portfolio value across all SIPs
export const getTotalPortfolioValue = (plans: SIPPlan[]) => {
  const total = plans.reduce((acc, plan) => {
    return acc + Number(formatEther(plan.totalAmount));
  }, 0);

  return total.toFixed(4);
};

// Get total executed amount across all SIPs
export const getTotalExecutedAmount = (plans: SIPPlan[]) => {
  const total = plans.reduce((acc, plan) => {
    return acc + Number(formatEther(plan.executedAmount));
  }, 0);

  return total.toFixed(4);
};

// Manual pool checking function
export const checkManualPool = async (userAddress: string, poolName: string): Promise<SIPPlan | null> => {
  try {
    const publicClient = createPublicClient({
      chain: avalancheFuji,
      transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
    });

    const sipData = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'getPlan',
      args: [userAddress as `0x${string}`, poolName]
    });

    const sipWithPool: SIPPlan = {
      ...(sipData as Omit<SIPPlan, 'poolName'>),
      poolName
    };

    if (sipWithPool.active) {
      // Save to localStorage for future reference
      savePoolToStorage(userAddress, poolName);
      return sipWithPool;
    }

    return null;
  } catch (err) {
    console.error('Error checking manual pool:', err);
    return null;
  }
};
