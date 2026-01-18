// components/TransactionSIPs.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { formatEther } from 'viem';

interface TransactionSIP {
    poolName: string;
    totalAmount: string;
    perInterval: string;
    executed: string;
    remaining: string;
    nextExecution: string;
    maturity: string;
    frequency: string;
    canExecute: boolean;
    txHash: string;
    executionCount: number;
    lastExecutionTime: string | null;
}

interface TransactionSIPsProps {
    userAddress: string | undefined;
    onExecute: (poolName: string) => void;
    onFinalize: (poolName: string) => void;
    executeLoading: boolean;
    finalizeLoading: boolean;
    selectedPool: string;
}

const CONTRACT_ADDRESS = '0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b';
const CREATE_SIP_METHOD_ID = '0xe1dc1c04';
const EXECUTE_SIP_METHOD_ID = '0x9c701852';

export default function TransactionSIPs({
    userAddress,
    onExecute,
    onFinalize,
    executeLoading,
    finalizeLoading,
    selectedPool
}: TransactionSIPsProps) {
    const [sips, setSips] = useState<TransactionSIP[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTransactionSIPs = async () => {
            if (!userAddress) {
                setSips([]);
                return;
            }

            setLoading(true);
            try {
                // Fetch all transactions from user to contract
                const response = await fetch(
                    `https://cdn.testnet.routescan.io/api/evm/all/transactions?ecosystem=avalanche&fromAddresses=${userAddress}&toAddresses=${CONTRACT_ADDRESS}&sort=desc&limit=200&count=true`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();

                // Separate creation and execution transactions
                const creationTxs = data.items?.filter((tx: any) =>
                    tx.methodId === CREATE_SIP_METHOD_ID && tx.status === true
                ) || [];

                const executionTxs = data.items?.filter((tx: any) =>
                    tx.methodId === EXECUTE_SIP_METHOD_ID && tx.status === true
                ) || [];

                // Group execution transactions by pool name (derived from tx hash pattern)
                const executionsByPool = new Map<string, any[]>();
                executionTxs.forEach((tx: any) => {
                    // For now, we'll match by timing - executions happen after creation
                    // In a real implementation, we'd decode the input to get the pool name
                    const poolKey = `sip_tx_${tx.txHash.slice(2, 10)}`;
                    if (!executionsByPool.has(poolKey)) {
                        executionsByPool.set(poolKey, []);
                    }
                    executionsByPool.get(poolKey)!.push(tx);
                });

                // Create SIP objects from creation transactions
                const sipData: TransactionSIP[] = creationTxs.map((tx: any, index: number) => {
                    const poolName = `sip_tx_${tx.txHash.slice(2, 10)}`;
                    const totalAmount = formatEther(BigInt(tx.value || '0'));

                    // Get execution history for this SIP
                    const executions = executionsByPool.get(poolName) || [];
                    const executionCount = executions.length;
                    const lastExecution = executions.length > 0 ? executions[0] : null;

                    // Calculate per interval (assuming 10 intervals for 6 months)
                    const perInterval = (parseFloat(totalAmount) / 10).toFixed(4);

                    // Calculate executed amount based on actual executions
                    const executed = (executionCount * parseFloat(perInterval)).toFixed(4);
                    const remaining = (parseFloat(totalAmount) - parseFloat(executed)).toFixed(4);

                    // Calculate dates
                    const txDate = new Date(tx.timestamp);
                    const lastExecutionDate = lastExecution ? new Date(lastExecution.timestamp) : null;

                    // Next execution is 1 day after last execution, or 1 day after creation if never executed
                    const baseDate = lastExecutionDate || txDate;
                    const nextExecution = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);

                    // Maturity is 6 months after creation
                    const maturity = new Date(txDate.getTime() + 180 * 24 * 60 * 60 * 1000);

                    return {
                        poolName,
                        totalAmount,
                        perInterval,
                        executed,
                        remaining,
                        nextExecution: nextExecution.toLocaleDateString() + ' at ' + nextExecution.toLocaleTimeString(),
                        maturity: maturity.toLocaleDateString(),
                        frequency: 'Every 1 days',
                        canExecute: Date.now() > nextExecution.getTime(),
                        txHash: tx.txHash,
                        executionCount,
                        lastExecutionTime: lastExecutionDate ?
                            lastExecutionDate.toLocaleDateString() + ' at ' + lastExecutionDate.toLocaleTimeString() :
                            null
                    };
                });

                setSips(sipData);
            } catch (error) {
                console.error('Error fetching transaction SIPs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactionSIPs();
    }, [userAddress]);

    if (loading) {
        return (
            <div className="text-center py-10 text-slate-400">
                <p>Loading SIP plans...</p>
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
                <div key={sip.txHash} className="bg-black/40 p-6 rounded-xl border border-white/10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                        <h3 className="text-lg font-semibold">SIP Plan #{index + 1}</h3>
                        <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded">
                            Pool: {sip.poolName}
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                            <p className="text-lg font-bold text-green-500">{sip.totalAmount} AVAX</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Per Interval</p>
                            <p className="text-lg font-bold text-blue-500">{sip.perInterval} AVAX</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Executed</p>
                            <p className="text-lg font-bold text-yellow-500">{sip.executed} AVAX</p>
                            <p className="text-xs text-gray-500">({sip.executionCount} times)</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Remaining</p>
                            <p className="text-lg font-bold text-slate-400">{sip.remaining} AVAX</p>
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
                            <p className="text-gray-400 text-sm mb-1">Last Execution</p>
                            <p className="text-sm font-medium text-slate-400">
                                {sip.lastExecutionTime || 'Never executed'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Maturity</p>
                            <p className="text-sm font-medium text-slate-400">{sip.maturity}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 flex-wrap items-center">
                        <button
                            onClick={() => onExecute(sip.poolName)}
                            disabled={executeLoading || !sip.canExecute}
                            className={`px-5 py-3 rounded-lg text-sm font-semibold ${!sip.canExecute
                                    ? 'bg-gray-600/50 text-white cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                }`}
                        >
                            {executeLoading && selectedPool === sip.poolName ? 'Executing...' : 'Execute SIP'}
                        </button>

                        <button
                            onClick={() => onFinalize(sip.poolName)}
                            disabled={finalizeLoading}
                            className="px-5 py-3 rounded-lg text-sm font-semibold bg-gray-600/50 text-white hover:bg-gray-600"
                        >
                            {finalizeLoading && selectedPool === sip.poolName ? 'Finalizing...' : 'Finalize SIP'}
                        </button>

                        <div className="flex items-center gap-2 ml-auto">
                            {sip.canExecute && (
                                <span className="text-green-400 text-sm">● Ready to Execute</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
