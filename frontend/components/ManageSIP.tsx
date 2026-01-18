"use client";

import { useState } from "react";

interface ManageSIPProps {
    isOpen: boolean;
    onClose: () => void;
    activeSIPs: Array<{
        id: string;
        tokenName: string;
        totalInvested: string;
        currentValue: string;
        progress: number;
        nextExecution: string;
        status: 'active' | 'paused';
    }>;
    totalValue: string;
}

export default function ManageSIP({ isOpen, onClose, activeSIPs, totalValue }: ManageSIPProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');

    // Filter SIPs based on status
    const activeSIPsList = activeSIPs.filter(sip => sip.status === 'active');
    const pausedSIPsList = activeSIPs.filter(sip => sip.status === 'paused');

    // Get filtered list based on current filter
    const getFilteredSIPs = () => {
        let filtered = activeSIPs;
        if (filterStatus === 'active') filtered = activeSIPsList;
        if (filterStatus === 'paused') filtered = pausedSIPsList;

        if (searchQuery) {
            filtered = filtered.filter(sip =>
                sip.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sip.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    };

    const filteredSIPs = getFilteredSIPs();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] min-h-[90vh] max-h-[95vh] overflow-hidden border border-white/20 shadow-2xl">
                {/* Header with Close Button */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-3xl font-bold text-white">Manage SIPs</h2>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Active SIPs */}
                <div className="bg-slate-800/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-400">Active SIPs</h3>
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{activeSIPsList.length}</p>
                    <p className="text-green-400 text-xs">Currently running</p>
                </div>

                {/* Paused SIPs */}
                <div className="bg-slate-800/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-400">Paused SIPs</h3>
                        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{pausedSIPsList.length}</p>
                    <p className="text-orange-400 text-xs">Temporarily stopped</p>
                </div>

                {/* Total Value */}
                <div className="bg-slate-800/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-400">Total Value</h3>
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{totalValue}</p>
                    <p className="text-green-400 text-xs">Total invested</p>
                </div>
            </div>

            {/* SIP List */}
            <div className="space-y-4">
                {filteredSIPs.length === 0 ? (
                    <div className="bg-slate-800/40 rounded-2xl p-12 text-center">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-slate-400 text-lg">No SIPs found</p>
                        <p className="text-slate-500 text-sm mt-2">
                            {searchQuery ? 'Try adjusting your search' : 'Create your first SIP to get started'}
                        </p>
                    </div>
                ) : (
                    filteredSIPs.map((sip) => (
                        <div key={sip.id} className="bg-slate-800/40 rounded-2xl p-6 hover:border-white/20 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <span className="text-blue-400 font-bold text-lg">
                                            {sip.tokenName.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{sip.tokenName}</h3>
                                        <p className="text-slate-400 text-sm">Pool ID: {sip.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sip.status === 'active'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                        {sip.status === 'active' ? '● Active' : '⏸ Paused'}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-white font-semibold">{sip.progress}%</span>
                                </div>
                                <div className="bg-black/40 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${sip.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <p className="text-slate-400 text-xs mb-1">Total Invested</p>
                                    <p className="text-white font-bold">{sip.totalInvested}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs mb-1">Current Value</p>
                                    <p className="text-green-400 font-bold">{sip.currentValue}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-400 text-xs mb-1">Next Execution</p>
                                    <p className="text-white font-semibold text-sm">{sip.nextExecution}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                {sip.status === 'active' ? (
                                    <button className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-orange-500/30 flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Pause
                                    </button>
                                ) : (
                                    <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-green-500/30 flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Resume
                                    </button>
                                )}
                                <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-blue-500/30 flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Withdraw
                                </button>
                                <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-red-500/30">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
                </div>
            </div>
        </div>
    );
}
