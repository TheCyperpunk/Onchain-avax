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
}

interface TransactionSIPsProps {
    userAddress: string | undefined;
    onExecute: (poolName: string) => void;
    onFinalize: (poolName: string) => void;
    executeLoading: boolean;
    finalizeLoading: boolean;
    selectedPool: string;
}

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
                // Fetch transactions from Routescan API
                const response = await fetch(
                    `https://cdn.testnet.routescan.io/api/evm/all/transactions?ecosystem=avalanche&fromAddresses=${userAddress}&toAddresses=0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b&sort=desc&limit=100&count=true`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();

                // Filter for SIP creation transactions (methodId: 0xe1dc1c04)
                const sipTxs = data.items?.filter((tx: any) =>
                    tx.methodId === '0xe1dc1c04' && tx.status === true
                ) || [];

                // Create SIP objects from transactions
                const sipData: TransactionSIP[] = sipTxs.map((tx: any, index: number) => {
                    // Extract pool name from transaction hash (simplified)
                    const poolName = `sip_tx_${tx.txHash.slice(2, 10)}`;

                    // Parse transaction value (this is the total amount sent)
                    const totalAmount = formatEther(BigInt(tx.value || '0'));

                    // For demo purposes, calculate other values
                    // In a real implementation, you'd decode the transaction input data
                    const perInterval = (parseFloat(totalAmount) / 10).toFixed(2);
                    const executed = (parseFloat(totalAmount) / 2).toFixed(2);
                    const remaining = (parseFloat(totalAmount) - parseFloat(executed)).toFixed(2);

                    // Calculate dates
                    const txDate = new Date(tx.timestamp);
                    const nextExecution = new Date(txDate.getTime() + 24 * 60 * 60 * 1000); // +1 day
                    const maturity = new Date(txDate.getTime() + 180 * 24 * 60 * 60 * 1000); // +6 months

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
                        txHash: tx.txHash
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
                            <p className="text-gray-400 text-sm mb-1">Maturity</p>
                            <p className="text-sm font-medium text-slate-400">{sip.maturity}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Frequency</p>
                            <p className="text-sm font-medium text-slate-300">{sip.frequency}</p>
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
