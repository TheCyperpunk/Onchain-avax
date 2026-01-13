"use client";

import { useAccount, useChainId, useBalance } from "wagmi";
import { useState, useEffect } from "react";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    totalSIPs: number;
    totalInvested: string;
    totalExecuted: string;
}

export default function ProfileModal({ isOpen, onClose, totalSIPs, totalInvested, totalExecuted }: ProfileModalProps) {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: balance } = useBalance({ address });
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTxs, setLoadingTxs] = useState(false);

    // Fetch transaction history
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!address) return;

            setLoadingTxs(true);
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
                setLoadingTxs(false);
            }
        };

        if (isOpen && address) {
            fetchTransactions();
        }
    }, [isOpen, address]);

    if (!isOpen) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const openBSCScan = () => {
        if (address) {
            window.open(`https://testnet.snowtrace.io/address/${address}`, '_blank');
        }
    };

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

    // Calculate total SIP investment
    const SIP_CONTRACT_ADDRESS = '0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b';
    const sipTransactions = transactions.filter(tx =>
        tx.to.id.toLowerCase() === SIP_CONTRACT_ADDRESS.toLowerCase() &&
        tx.from.id.toLowerCase() === address?.toLowerCase()
    );
    const totalSIPInvestment = sipTransactions.reduce((sum, tx) => sum + (parseFloat(tx.value) / 1e18), 0);

    // Calculate number of SIPs from transaction count
    const calculatedSIPCount = sipTransactions.length;

    // Use calculated count if contract returns 0 but we have transactions
    const displaySIPCount = totalSIPs > 0 ? totalSIPs : calculatedSIPCount;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] max-h-[95vh] overflow-hidden border border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/20">
                    <h2 className="text-3xl font-bold text-white">Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-3xl font-bold transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-80px)]">
                    {/* Portfolio Summary - Full Width */}
                    <div className="bg-slate-800/40 rounded-2xl p-3 mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <h3 className="text-lg font-bold text-white">Portfolio Summary</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Total Portfolio Value */}
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Total Portfolio Value</p>
                                <p className="text-white text-2xl font-bold">
                                    {(parseFloat(balance?.formatted || '0') + totalSIPInvestment).toFixed(4)} AVAX
                                </p>
                            </div>

                            {/* Total Growth */}
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Total Growth</p>
                                <p className="text-green-400 text-2xl font-bold">
                                    +0.0%
                                </p>
                            </div>

                            {/* Total SIP Investment */}
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Total SIP Investment</p>
                                <p className="text-green-400 text-2xl font-bold">
                                    {totalSIPInvestment.toFixed(4)} AVAX
                                </p>
                                <p className="text-slate-500 text-xs mt-1">Across {displaySIPCount} SIP{displaySIPCount !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Wallet Address */}
                            <div className="bg-slate-800/40 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h3 className="text-xl font-bold text-white">Wallet Address</h3>
                                </div>
                                <div className="bg-black/40 rounded-xl p-4 mb-4">
                                    <p className="text-white font-mono text-sm break-all">
                                        {address || 'Not Connected'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => address && copyToClipboard(address)}
                                        className="bg-slate-700/40 hover:bg-slate-600/50 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        {copiedAddress ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={openBSCScan}
                                        className="bg-slate-700/40 hover:bg-slate-600/50 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Snowtrace
                                    </button>
                                </div>
                            </div>

                            {/* Wallet Balance */}
                            <div className="bg-slate-800/40 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <h3 className="text-xl font-bold text-white">Wallet Balance</h3>
                                </div>
                                <div className="text-center py-6">
                                    <p className="text-5xl font-bold text-white mb-2">
                                        {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'}
                                    </p>
                                    <p className="text-cyan-400 text-xl font-semibold">
                                        {balance?.symbol || 'AVAX'}
                                    </p>
                                </div>
                            </div>

                            {/* Total Invested */}
                            <div className="bg-slate-800/40 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-bold text-white">Total Invested</h3>
                                </div>
                                <div className="text-center py-6">
                                    <p className="text-5xl font-bold text-green-400 mb-2">
                                        {totalSIPInvestment.toFixed(4)}
                                    </p>
                                    <p className="text-cyan-400 text-xl font-semibold mb-1">
                                        AVAX
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        Across {displaySIPCount} SIP{displaySIPCount !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Transaction History */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-slate-800/40 rounded-2xl p-6 h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <h3 className="text-xl font-bold text-white">Transaction History</h3>
                                </div>

                                {/* Transaction List */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {loadingTxs ? (
                                        <div className="text-center py-12">
                                            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-slate-400">Loading transactions...</p>
                                        </div>
                                    ) : transactions.length > 0 ? (
                                        transactions.map((tx, index) => {
                                            const isReceived = tx.to.id.toLowerCase() === address?.toLowerCase();
                                            const value = parseFloat(tx.value) / 1e18; // Convert from wei to AVAX
                                            const date = new Date(tx.timestamp);
                                            const timeAgo = getTimeAgo(date);

                                            return (
                                                <div key={tx.txHash + index} className="bg-black/40 rounded-xl p-4 hover:border-white/20 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isReceived ? 'bg-green-500/20' : 'bg-orange-500/20'
                                                                }`}>
                                                                <span className={`text-lg ${isReceived ? 'text-green-400' : 'text-orange-400'
                                                                    }`}>
                                                                    {isReceived ? '↓' : '↑'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-semibold">
                                                                    {tx.type === 'CREATE' ? 'Contract Deploy' : isReceived ? 'Received' : 'Sent'}
                                                                </p>
                                                                <p className="text-slate-400 text-xs">
                                                                    {isReceived ? 'From' : 'To'}: {truncateAddress(isReceived ? tx.from.id : tx.to.id)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-bold ${isReceived ? 'text-green-400' : 'text-orange-400'
                                                                }`}>
                                                                {isReceived ? '+' : '-'}{value.toFixed(4)} AVAX
                                                            </p>
                                                            <p className="text-slate-400 text-xs">{timeAgo}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
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
                                                        <span className={`px-2 py-1 rounded text-xs ${tx.status ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {tx.status ? 'Success' : 'Failed'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-slate-400 text-lg mb-2">No transactions yet</p>
                                            <p className="text-slate-500 text-sm">Your transaction history will appear here</p>
                                        </div>
                                    )}

                                    {/* Network Status */}
                                    <div className="bg-black/40 rounded-xl p-4 mt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${chainId === 43113 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <div>
                                                    <p className="text-slate-400 text-xs">Network</p>
                                                    <p className="text-white font-semibold text-sm">
                                                        {chainId === 43113 ? 'Avalanche Fuji Testnet' : `Chain ID: ${chainId}`}
                                                    </p>
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
