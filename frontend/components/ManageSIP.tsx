"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import avaxLogo from "../image/avalanche-avax-logo.png";
import { Activity } from "lucide-react";

interface SIPDetail {
    id: string;
    tokenName: string;
    totalAmount: string;
    executedAmount: string;
    remainingAmount: string;
    amountPerInterval: string;
    installmentsDone: number;
    totalInstallments: number;
    remainingInstallments: number;
    frequencyLabel: string;
    progress: number;
    nextExecution: string;
    maturityDate: string;
    active: boolean;
    canExecute: boolean;
    canFinalize: boolean;
}

interface ManageSIPProps {
    isOpen: boolean;
    onClose: () => void;
    activeSIPs: SIPDetail[];
    totalValue: string;
    onExecute?: (poolName: string) => void;
    onFinalize?: (poolName: string) => void;
    executeLoading?: boolean;
    finalizeLoading?: boolean;
    selectedPool?: string;
}

export default function ManageSIP({ isOpen, onClose, activeSIPs, totalValue, onExecute, onFinalize, executeLoading, finalizeLoading, selectedPool }: ManageSIPProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

    // Filter SIPs based on status
    const activeSIPsList = activeSIPs.filter(sip => sip.active);
    const completedSIPsList = activeSIPs.filter(sip => !sip.active);

    // Get filtered list based on current filter
    const getFilteredSIPs = () => {
        let filtered = activeSIPs;
        if (filterStatus === 'active') filtered = activeSIPsList;
        if (filterStatus === 'completed') filtered = completedSIPsList;

        if (searchQuery) {
            filtered = filtered.filter(sip =>
                sip.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sip.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    };

    const filteredSIPs = getFilteredSIPs();

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] min-h-[90vh] max-h-[95vh] overflow-hidden shadow-2xl">
                {/* Header with Close Button */}
                <div className="flex justify-between items-center p-6 border-b border-transparent bg-black/20">
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Active SIPs */}
                            <div className="bg-slate-800/40 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-semibold text-slate-400">Active SIPs</h3>
                                    <Activity className="w-5 h-5 text-blue-400" />
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{activeSIPsList.length}</p>
                                <p className="text-green-400 text-xs">Currently running</p>
                            </div>

                            {/* Completed SIPs */}
                            <div className="bg-slate-800/40 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-semibold text-slate-400">Completed SIPs</h3>
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{completedSIPsList.length}</p>
                                <p className="text-emerald-400 text-xs">Finalized</p>
                            </div>

                            {/* Total Installments Paid */}
                            <div className="bg-slate-800/40 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-semibold text-slate-400">Installments Paid</h3>
                                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">
                                    {activeSIPs.reduce((sum, sip) => sum + sip.installmentsDone, 0)}
                                </p>
                                <p className="text-cyan-400 text-xs">
                                    of {activeSIPs.reduce((sum, sip) => sum + sip.totalInstallments, 0)} total
                                </p>
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
                                <p className="text-green-400 text-xs">Total deposited</p>
                            </div>
                        </div>

                        {/* Filter Tabs & Search */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex gap-2">
                                {(['all', 'active', 'completed'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterStatus === status
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-700/40'
                                            }`}
                                    >
                                        {status === 'all' ? `All (${activeSIPs.length})` : status === 'active' ? `Active (${activeSIPsList.length})` : `Completed (${completedSIPsList.length})`}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full md:w-72">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by token or pool name..."
                                    className="w-full bg-slate-800/40 text-white placeholder-slate-500 pl-10 pr-4 py-2 rounded-lg text-sm border border-white/10 focus:border-blue-500/50 outline-none transition-all"
                                />
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
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                                                    <Image src={avaxLogo} alt="AVAX" width={48} height={48} className="rounded-full" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{sip.tokenName}</h3>
                                                    <p className="text-slate-400 text-sm">Pool: {sip.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sip.active
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {sip.active ? '● Active' : '● Completed'}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                                                    {sip.frequencyLabel}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-5">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-400">Execution Progress</span>
                                                <span className="text-cyan-400 font-semibold">{sip.progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="bg-black/40 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(sip.progress, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Financial Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Total Deposited</p>
                                                <p className="text-white font-bold text-lg">{parseFloat(sip.totalAmount).toFixed(4)}</p>
                                                <p className="text-slate-500 text-xs">AVAX</p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Amount Paid Out</p>
                                                <p className="text-green-400 font-bold text-lg">{parseFloat(sip.executedAmount).toFixed(4)}</p>
                                                <p className="text-slate-500 text-xs">AVAX</p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Remaining</p>
                                                <p className="text-orange-400 font-bold text-lg">{parseFloat(sip.remainingAmount).toFixed(4)}</p>
                                                <p className="text-slate-500 text-xs">AVAX</p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Per Installment</p>
                                                <p className="text-cyan-400 font-bold text-lg">{parseFloat(sip.amountPerInterval).toFixed(4)}</p>
                                                <p className="text-slate-500 text-xs">AVAX</p>
                                            </div>
                                        </div>

                                        {/* Installment & Time Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Installments Done</p>
                                                <p className="text-white font-bold text-lg">
                                                    {sip.installmentsDone} <span className="text-slate-500 text-sm">/ {sip.totalInstallments}</span>
                                                </p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Remaining</p>
                                                <p className="text-yellow-400 font-bold text-lg">{sip.remainingInstallments}</p>
                                                <p className="text-slate-500 text-xs">installments</p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Next Execution</p>
                                                <p className={`font-semibold text-sm ${sip.canExecute ? 'text-green-400' : 'text-slate-300'}`}>
                                                    {sip.nextExecution}
                                                </p>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs mb-1">Maturity Date</p>
                                                <p className={`font-semibold text-sm ${sip.canFinalize ? 'text-orange-400' : 'text-slate-300'}`}>
                                                    {sip.maturityDate}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {sip.active && (
                                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                                <button
                                                    onClick={() => onExecute?.(sip.id)}
                                                    disabled={executeLoading || !sip.canExecute}
                                                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${sip.canExecute
                                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                                        : 'bg-gray-600/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                                                        }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    </svg>
                                                    {executeLoading && selectedPool === sip.id ? 'Executing...' : sip.canExecute ? 'Execute Next Installment' : 'Not Yet Due'}
                                                </button>
                                                <button
                                                    onClick={() => onFinalize?.(sip.id)}
                                                    disabled={finalizeLoading || !sip.canFinalize}
                                                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${sip.canFinalize
                                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                                                        : 'bg-gray-600/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                                                        }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {finalizeLoading && selectedPool === sip.id ? 'Finalizing...' : sip.canFinalize ? 'Finalize & Withdraw' : 'Not Matured'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Status indicators */}
                                        {sip.active && (
                                            <div className="flex gap-3 mt-3">
                                                {sip.canExecute && (
                                                    <span className="text-green-400 text-xs flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                                        Ready to execute
                                                    </span>
                                                )}
                                                {sip.canFinalize && (
                                                    <span className="text-orange-400 text-xs flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                                        Matured — ready to finalize
                                                    </span>
                                                )}
                                            </div>
                                        )}
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
