"use client";

import { useAccount, useBalance } from "wagmi";
import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { useSIPContract } from "../hooks/useSIPContract";

interface DashboardProps {
    isOpen: boolean;
    onClose: () => void;
    totalSIPs: number;
    totalInvested: string;
    activeSIPs: Array<{
        id: string;
        tokenName: string;
        amount: string;
        frequency: string;
        nextExecution: string;
    }>;
}

export default function Dashboard({ isOpen, onClose, totalSIPs, totalInvested, activeSIPs }: DashboardProps) {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    // Fetch SIP data from smart contract
    const { useGetAllUserSIPs } = useSIPContract();
    const { allSIPs, isLoading: sipsLoading } = useGetAllUserSIPs(address);

    // Helper function to convert frequency in seconds to human-readable label
    const getFrequencyLabel = (frequencySeconds: bigint): string => {
        const seconds = Number(frequencySeconds);
        const days = seconds / (24 * 3600);

        if (days >= 30) return `${Math.floor(days / 30)} Month${Math.floor(days / 30) > 1 ? 's' : ''}`;
        if (days >= 7) return `${Math.floor(days / 7)} Week${Math.floor(days / 7) > 1 ? 's' : ''}`;
        if (days >= 1) return `${Math.floor(days)} Day${Math.floor(days) > 1 ? 's' : ''}`;
        return `${Math.floor(seconds / 3600)} Hour${Math.floor(seconds / 3600) > 1 ? 's' : ''}`;
    };

    // Helper function to calculate investment duration
    const getDuration = (maturityTimestamp: bigint, nextExecution: bigint): string => {
        const maturity = new Date(Number(maturityTimestamp) * 1000);
        const start = new Date(Number(nextExecution) * 1000);
        const durationMs = maturity.getTime() - start.getTime();
        const months = Math.floor(durationMs / (30 * 24 * 60 * 60 * 1000));

        if (months >= 12) return `${Math.floor(months / 12)} Year${Math.floor(months / 12) > 1 ? 's' : ''}`;
        return `${months} Month${months > 1 ? 's' : ''}`;
    };

    // Fetch transaction history
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!address) return;

            setLoadingTransactions(true);
            try {
                const response = await fetch(
                    `https://cdn.testnet.routescan.io/api/evm/all/address/${address}/internal-operations?ecosystem=avalanche&sort=desc&limit=100&count=true`
                );
                const data = await response.json();
                setTransactions(data.items || []);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setTransactions([]);
            } finally {
                setLoadingTransactions(false);
            }
        };

        if (address) {
            fetchTransactions();
        }
    }, [address]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    // Calculate total SIP investment from transactions
    const SIP_CONTRACT_ADDRESS = '0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b';
    const sipTransactions = transactions.filter(tx =>
        tx.to.id.toLowerCase() === SIP_CONTRACT_ADDRESS.toLowerCase() &&
        tx.from.id.toLowerCase() === address?.toLowerCase()
    );
    const totalSIPInvestment = sipTransactions.reduce((sum, tx) => sum + (parseFloat(tx.value) / 1e18), 0);

    // Calculate net worth (wallet balance + SIP investment)
    const netWorth = balance ? parseFloat(balance.formatted) : 0;
    const totalNetWorth = netWorth + totalSIPInvestment;
    const netWorthDisplay = totalNetWorth.toFixed(4);

    // Transform contract SIP data into displayable SIP cards
    // Fallback to transaction-based cards if contract data is unavailable
    const sipCards = allSIPs.length > 0 ? allSIPs.map((sip) => {
        const totalAmount = formatEther(sip.totalAmount);
        const executedAmount = formatEther(sip.executedAmount);
        const progress = (Number(executedAmount) / Number(totalAmount)) * 100;
        const nextExecution = new Date(Number(sip.nextExecution) * 1000);
        const frequency = getFrequencyLabel(sip.frequency);
        const duration = getDuration(sip.maturity, sip.nextExecution);

        return {
            id: sip.poolName,
            tokenName: 'AVAX',
            totalAmount: `${parseFloat(totalAmount).toFixed(4)} AVAX`,
            amountPerInterval: `${parseFloat(formatEther(sip.amountPerInterval)).toFixed(4)} AVAX`,
            frequency: frequency,
            duration: duration,
            progress: progress,
            nextExecution: nextExecution.toLocaleDateString(),
            executedAmount: `${parseFloat(executedAmount).toFixed(4)} AVAX`,
            isContractBased: true
        };
    }) : sipTransactions.map((tx, index) => {
        // Fallback: Use transaction data when contract data is unavailable
        const value = parseFloat(tx.value) / 1e18;
        const date = new Date(tx.timestamp);
        // Calculate progress based on transaction index (older = more progress)
        const progress = ((sipTransactions.length - index) / sipTransactions.length) * 100;
        return {
            id: tx.txHash,
            tokenName: 'AVAX',
            totalAmount: `${value.toFixed(4)} AVAX`,
            amountPerInterval: `${value.toFixed(4)} AVAX`,
            frequency: 'One-time',
            duration: 'N/A',
            progress: progress,
            nextExecution: date.toLocaleDateString(),
            executedAmount: `${value.toFixed(4)} AVAX`,
            isContractBased: false
        };
    });

    // Helper functions for transaction display
    const truncateAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        return `${months}mo ago`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] min-h-[90vh] max-h-[95vh] overflow-hidden border border-white/20 shadow-2xl">
                {/* Header with Close Button */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-3xl font-bold transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 100px)" }}>
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Connected Wallet */}
                <div className="bg-slate-800/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-slate-400">Connected Wallet</h3>
                    </div>
                    <p className="text-white text-xl font-bold mb-1 font-mono">
                        {address ? `${address.slice(0, 6)}...${address.slice(-6)}` : 'Not Connected'}
                    </p>
                    <p className="text-slate-400 text-xs">{balance?.symbol || 'AVAX'} Chain</p>
                    {address && (
                        <button
                            onClick={() => copyToClipboard(address)}
                            className="mt-3 w-full bg-slate-700/40 hover:bg-slate-600/50 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        >
                            {copiedAddress ? '✓ Copied!' : 'Copy Address'}
                        </button>
                    )}
                </div>

                {/* Net Worth */}
                <div className="bg-slate-800/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <h3 className="text-sm font-semibold text-slate-400">Net Worth</h3>
                    </div>
                    <p className="text-white text-2xl font-bold mb-1">
                        {netWorthDisplay} AVAX
                    </p>
                </div>

                {/* Total Invested */}
                <div className="bg-slate-800/40 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-slate-400">Total Invested</h3>
                    </div>
                    <p className="text-green-400 text-2xl font-bold mb-1">
                        {totalSIPInvestment.toFixed(4)} AVAX
                    </p>
                    <p className="text-slate-400 text-xs">Across {totalSIPs} SIP{totalSIPs !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active SIPs - Left Column (Wider) */}
                <div className="lg:col-span-8">
                    <div className="bg-slate-800/40 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h2 className="text-xl font-bold text-white">Active SIPs</h2>
                            <span className="ml-auto bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-semibold">
                                {sipCards.length} Active
                            </span>
                        </div>

                        {(loadingTransactions || sipsLoading) ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                                <p className="text-slate-400 text-lg">Loading SIPs...</p>
                                <p className="text-slate-500 text-sm mt-2">Fetching your investment data</p>
                            </div>
                        ) : sipCards.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-slate-400 text-lg">No active SIPs</p>
                                <p className="text-slate-500 text-sm mt-2">Create your first SIP to start investing</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sipCards.map((sip) => (
                                    <div key={sip.id} className="bg-black/40 rounded-xl p-4 hover:border-white/20 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <span className="text-blue-400 font-bold text-sm">
                                                        {sip.tokenName.slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-semibold">{sip.tokenName} SIP</h3>
                                                    <p className="text-slate-400 text-xs">{sip.frequency} • {sip.duration}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold">{sip.totalAmount}</p>
                                                <p className="text-slate-400 text-xs">Total Investment</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">Progress</span>
                                                <span className="text-cyan-400">{sip.progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${sip.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                                            <div>
                                                <p className="text-slate-400 text-xs">Executed</p>
                                                <p className="text-green-400 text-sm font-semibold">{sip.executedAmount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white text-sm font-semibold">{sip.nextExecution}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction History - Right Column (Narrower) */}
                <div className="lg:col-span-4">
                    <div className="bg-slate-800/40 rounded-2xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <h2 className="text-xl font-bold text-white">Transaction History</h2>
                        </div>

                        <div className="space-y-3">
                            {sipTransactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-slate-400 text-sm">No SIP transactions yet</p>
                                    <p className="text-slate-500 text-xs mt-1">Your SIP transaction history will appear here</p>
                                </div>
                            ) : (
                                <>
                                    {sipTransactions.map((tx, index) => {
                                        const value = parseFloat(tx.value) / 1e18;
                                        const date = new Date(tx.timestamp);
                                        const timeAgo = getTimeAgo(date);

                                        return (
                                            <div key={tx.txHash + index} className="bg-black/40 rounded-xl p-3 hover:border-white/20 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500/20">
                                                            <span className="text-sm text-blue-400">
                                                                💰
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm font-semibold">
                                                                SIP Investment
                                                            </p>
                                                            <p className="text-slate-400 text-xs">
                                                                To SIP Contract
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-green-400">
                                                            +{value.toFixed(4)} AVAX
                                                        </p>
                                                        <p className="text-slate-400 text-xs">{timeAgo}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`https://testnet.snowtrace.io/tx/${tx.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                                                >
                                                    View on Snowtrace
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* Network Status */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm">Network</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-white text-sm font-semibold">Avalanche Fuji Testnet</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                </div>
            </div>
        </div>
    );
}
