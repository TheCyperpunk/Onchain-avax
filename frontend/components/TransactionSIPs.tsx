// components/TransactionSIPs.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { formatEther, createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

interface ContractSIP {
    poolName: string;
    totalAmount: string;
    perInterval: string;
    executed: string;
    remaining: string;
    nextExecution: string;
    maturity: string;
    frequency: string;
    frequencyLabel: string;
    canExecute: boolean;
    canFinalize: boolean;
    active: boolean;
    progress: number;
}

interface TransactionSIPsProps {
    userAddress: string | undefined;
    onExecute: (poolName: string) => void;
    onFinalize: (poolName: string) => void;
    executeLoading: boolean;
    finalizeLoading: boolean;
    selectedPool: string;
    refreshKey?: number;
}

const getFrequencyLabel = (seconds: number): string => {
    const days = seconds / (24 * 3600);
    if (days >= 365) return `Yearly`;
    if (days >= 90) return `Quarterly`;
    if (days >= 30) return `Monthly`;
    if (days >= 7) return `Weekly`;
    if (days >= 1) return `Daily`;
    return `Every ${Math.floor(seconds / 3600)}h`;
};

export default function TransactionSIPs({
    userAddress,
    onExecute,
    onFinalize,
    executeLoading,
    finalizeLoading,
    selectedPool,
    refreshKey
}: TransactionSIPsProps) {
    const [sips, setSips] = useState<ContractSIP[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchContractSIPs = async () => {
            if (!userAddress) {
                setSips([]);
                return;
            }

            setLoading(true);
            try {
                const publicClient = createPublicClient({
                    chain: avalancheFuji,
                    transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
                });

                // Use on-chain getUserPoolNames to get all pool names
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
                    if (
                        poolErr.name === 'ContractFunctionExecutionError' ||
                        poolErr.name === 'ContractFunctionZeroDataError' ||
                        poolErr.message?.includes('returned no data') ||
                        poolErr.message?.includes('0x')
                    ) {
                        console.log('No on-chain pools found for user — treating as empty.');
                        pools = [];
                    } else {
                        throw poolErr;
                    }
                }

                const sipData: ContractSIP[] = [];

                for (const pool of pools) {
                    try {
                        const planData = await publicClient.readContract({
                            address: CONTRACT_ADDRESS as `0x${string}`,
                            abi: CONTRACT_ABI,
                            functionName: 'getPlan',
                            args: [userAddress as `0x${string}`, pool]
                        }) as any;

                        if (!planData || planData.totalAmount === 0n) continue;

                        const total = BigInt(planData.totalAmount);
                        const executedAmt = BigInt(planData.executedAmount);
                        const totalAmount = formatEther(total);
                        const perInterval = formatEther(BigInt(planData.amountPerInterval));
                        const executed = formatEther(executedAmt);
                        const remaining = formatEther(total - executedAmt);
                        const frequencySec = Number(planData.frequency);
                        const nextExecTime = Number(planData.nextExecution) * 1000;
                        const maturityTime = Number(planData.maturity) * 1000;
                        const now = Date.now();

                        const progress = Number(total) > 0
                            ? (Number(executedAmt) / Number(total)) * 100
                            : 0;

                        sipData.push({
                            poolName: pool,
                            totalAmount,
                            perInterval,
                            executed,
                            remaining,
                            nextExecution: new Date(nextExecTime).toLocaleDateString() + ' at ' + new Date(nextExecTime).toLocaleTimeString(),
                            maturity: new Date(maturityTime).toLocaleDateString(),
                            frequency: `Every ${Math.floor(frequencySec / (24 * 3600))} days`,
                            frequencyLabel: getFrequencyLabel(frequencySec),
                            canExecute: planData.active && now >= nextExecTime && now < maturityTime && (executedAmt + BigInt(planData.amountPerInterval) <= total),
                            canFinalize: planData.active && now >= maturityTime,
                            active: planData.active,
                            progress,
                        });
                    } catch (err) {
                        console.warn(`Failed to fetch pool ${pool}:`, err);
                    }
                }

                setSips(sipData);
            } catch (error) {
                console.error('Error fetching contract SIPs:', error);
                setSips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchContractSIPs();
    }, [userAddress, refreshKey]);

    if (loading) {
        return (
            <div className="text-center py-10 text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-3"></div>
                <p>Loading SIP plans from contract...</p>
            </div>
        );
    }

    if (sips.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400">
                <p className="text-lg mb-2">No SIP Plans Found</p>
                <p className="text-sm">
                    Create your first SIP plan to get started with automated crypto investing
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {sips.map((sip, index) => (
                <div key={sip.poolName} className="bg-black/40 p-6 rounded-xl border border-transparent">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-transparent">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">SIP Plan #{index + 1}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sip.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {sip.active ? '● Active' : '● Completed'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded">
                            Pool: {sip.poolName}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Execution Progress</span>
                            <span className="text-cyan-400 font-semibold">{sip.progress.toFixed(1)}%</span>
                        </div>
                        <div className="bg-black/40 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${sip.progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                            <p className="text-lg font-bold text-green-500">{parseFloat(sip.totalAmount).toFixed(4)} AVAX</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Per Interval ({sip.frequencyLabel})</p>
                            <p className="text-lg font-bold text-green-500">{parseFloat(sip.perInterval).toFixed(4)} AVAX</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Executed</p>
                            <p className="text-lg font-bold text-green-500">{parseFloat(sip.executed).toFixed(4)} AVAX</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Remaining</p>
                            <p className="text-lg font-bold text-green-500">{parseFloat(sip.remaining).toFixed(4)} AVAX</p>
                        </div>
                    </div>

                    {/* Time Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 bg-black/20 p-4 rounded-lg">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Next Execution</p>
                            <p className={`text-sm font-medium ${sip.canExecute ? 'text-green-400' : 'text-slate-400'}`}>
                                {sip.nextExecution}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Frequency</p>
                            <p className="text-sm font-medium text-slate-400">{sip.frequency}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Maturity</p>
                            <p className={`text-sm font-medium ${sip.canFinalize ? 'text-orange-400' : 'text-slate-400'}`}>
                                {sip.maturity}
                            </p>
                        </div>
                    </div>


                </div>
            ))}
        </div>
    );
}
