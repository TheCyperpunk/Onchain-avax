import { createPublicClient, formatEther, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract';
import { getStoredTransaction, savePoolToStorage } from './storage';
import type { SIPPlan } from './types';

export const getFujiTestnetLink = (type: 'tx' | 'address' | 'token', hash: string) => {
  const baseUrl = 'https://testnet.snowtrace.io';
  return type === 'tx' ? `${baseUrl}/tx/${hash}` : type === 'address' ? `${baseUrl}/address/${hash}` : type === 'token' ? `${baseUrl}/token/${hash}` : baseUrl;
};

export const formatSIPData = (plan: SIPPlan | undefined, userAddress?: string) => {
  if (!plan) return null;
  const creationTx = userAddress ? getStoredTransaction(userAddress, plan.poolName) : null;
  return {
    totalAmount: formatEther(plan.totalAmount), amountPerInterval: formatEther(plan.amountPerInterval),
    executedAmount: formatEther(plan.executedAmount), remainingAmount: formatEther(plan.totalAmount - plan.executedAmount),
    nextExecution: new Date(Number(plan.nextExecution) * 1000), maturity: new Date(Number(plan.maturity) * 1000),
    frequency: Number(plan.frequency), frequencyDays: Math.floor(Number(plan.frequency) / 86400),
    isNative: plan.token === '0x0000000000000000000000000000000000000000', active: plan.active,
    progress: Number(plan.totalAmount) > 0 ? (Number(plan.executedAmount) / Number(plan.totalAmount)) * 100 : 0,
    canExecute: plan.active && Date.now() >= Number(plan.nextExecution) * 1000 && Date.now() < Number(plan.maturity) * 1000 && Number(plan.executedAmount) + Number(plan.amountPerInterval) <= Number(plan.totalAmount),
    canFinalize: plan.active && Date.now() >= Number(plan.maturity) * 1000, poolName: plan.poolName,
    contractLink: getFujiTestnetLink('address', CONTRACT_ADDRESS), creationTxLink: creationTx ? getFujiTestnetLink('tx', creationTx) : null,
  };
};

export const generatePoolName = (userAddress: string, timestamp: number) => `sip_${userAddress.slice(-6)}_${Math.floor(timestamp / 1000)}`;
export const formatMultipleSIPsData = (plans: SIPPlan[], userAddress?: string) => plans.map(plan => formatSIPData(plan, userAddress)).filter(Boolean);
export const getTotalPortfolioValue = (plans: SIPPlan[]) => plans.reduce((acc, plan) => acc + Number(formatEther(plan.totalAmount)), 0).toFixed(4);
export const getTotalExecutedAmount = (plans: SIPPlan[]) => plans.reduce((acc, plan) => acc + Number(formatEther(plan.executedAmount)), 0).toFixed(4);

export const checkManualPool = async (userAddress: string, poolName: string): Promise<SIPPlan | null> => {
  try {
    const publicClient = createPublicClient({ chain: avalancheFuji, transport: http('https://api.avax-test.network/ext/bc/C/rpc') });
    const sipData = await publicClient.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, abi: CONTRACT_ABI, functionName: 'getPlan', args: [userAddress as `0x${string}`, poolName] });
    const sipWithPool: SIPPlan = { ...(sipData as Omit<SIPPlan, 'poolName'>), poolName };
    if (sipWithPool.active) {
      savePoolToStorage(userAddress, poolName);
      return sipWithPool;
    }
    return null;
  } catch (err) {
    console.error('Error checking manual pool:', err);
    return null;
  }
};
