"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { useSIPContract, formatSIPData, generatePoolName, getTotalPortfolioValue, getTotalExecutedAmount } from "../hooks/useSIPContract";
import Dashboard from "../components/Dashboard";
import CryptoPriceModal from "../components/CryptoPriceModal";
import ManageSIP from "../components/ManageSIP";
import ProfileModal from "../components/ProfileModal";
import TransactionSIPs from "../components/TransactionSIPs";
import TokenSelector from "../components/TokenSelector";
import { RefreshCw } from "lucide-react";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

// Define proper TypeScript interfaces
interface FrequencyOption {
  label: string;
  sipAmount: number;
  intervals: number;
  frequencySeconds: number;
}

interface SelectedFreq {
  label: string;
  sipAmount: number;
  intervals: number;
  frequencySeconds: number;
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();

  const [isHydrated, setIsHydrated] = useState(false);
  const [showSIPForm, setShowSIPForm] = useState(false);
  const [currentPool, setCurrentPool] = useState("");
  const [txStatus, setTxStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedSIPPool, setSelectedSIPPool] = useState<string>("");
  const [sipRefreshKey, setSipRefreshKey] = useState(0);

  const { width, height } = useWindowSize();

  // SIP form states with proper types
  const [totalInvestment, setTotalInvestment] = useState(0.2);
  const [maturity, setMaturity] = useState("6");
  const [frequencies, setFrequencies] = useState<FrequencyOption[]>([]);
  const [selectedFreq, setSelectedFreq] = useState<SelectedFreq | null>(null);
  const [errors, setErrors] = useState("");

  // Modal state variables
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showManageSIP, setShowManageSIP] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isAvaxFuji = chainId === 43113;

  const { useCreateNativeSIP, useGetAllUserSIPs, useExecuteSIP, useFinalizeSIP } = useSIPContract();

  // Get user's all SIP plans from contract calls
  const { allSIPs, isLoading: sipsLoading, error: sipsError, refetch: refetchAllSIPs, hasActiveSIPs } = useGetAllUserSIPs(address);

  // Use allSIPs directly
  const finalSIPs = allSIPs;
  const finalLoading = sipsLoading;

  const maturityOptions = [
    { value: "6", label: "6 months" },
    { value: "12", label: "1 year" },
    { value: "24", label: "2 years" },
    { value: "36", label: "3 years" },
    { value: "48", label: "4 years" },
    { value: "60", label: "5 years" },
  ];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Generate unique pool name for new SIPs — always generate a fresh one
  // Generate when the form opens so the hook has the correct pool name
  useEffect(() => {
    if (address && showSIPForm) {
      const pool = generatePoolName(address, Date.now());
      setCurrentPool(pool);
    }
  }, [address, showSIPForm]);

  const validateInputs = () => {
    if (totalInvestment < 0.2) return "Minimum investment is 0.2 AVAX";
    if (!selectedFreq) return "Please select a frequency";
    if (isHydrated && !isAvaxFuji && isConnected) return "Please switch to Avalanche Fuji Testnet";
    return "";
  };

  const calculateFrequencies = () => {
    const months = parseInt(maturity);
    const total = parseFloat(totalInvestment.toString());

    if (isNaN(total) || total < 0.2) {
      setFrequencies([]);
      setSelectedFreq(null);
      setErrors("Enter a valid amount (≥ 0.2 AVAX)");
      return;
    }

    const possibleFrequencies = [
      {
        label: "Weekly",
        intervals: Math.floor(months * 4.33),
        minDuration: 1,
        frequencySeconds: 7 * 24 * 3600
      },
      {
        label: "Monthly",
        intervals: months,
        minDuration: 1,
        frequencySeconds: 30 * 24 * 3600
      },
      {
        label: "Quarterly",
        intervals: Math.floor(months / 3),
        minDuration: 3, // Allow quarterly from 3 months
        frequencySeconds: 90 * 24 * 3600
      },
      // ADD: Yearly frequency for longer tenures
      {
        label: "Yearly",
        intervals: Math.floor(months / 12),
        minDuration: 12, // Only for 1+ year tenures
        frequencySeconds: 365 * 24 * 3600
      },
    ];

    const valid: FrequencyOption[] = possibleFrequencies
      .filter(f => months >= f.minDuration)
      .map((f) => ({
        label: f.label,
        sipAmount: parseFloat((total / f.intervals).toFixed(4)),
        intervals: f.intervals,
        frequencySeconds: f.frequencySeconds
      }))
      .filter((f) => f.sipAmount >= 0.006 && f.intervals >= 2 && isFinite(f.sipAmount));

    setFrequencies(valid);
    setSelectedFreq(valid[0] || null);
    setErrors(valid.length === 0 ? "No valid frequency options for this amount and duration." : "");
  };


  useEffect(() => {
    if (showSIPForm) {
      calculateFrequencies();
    }
  }, [totalInvestment, maturity, showSIPForm]);

  useEffect(() => {
    if (isHydrated && showSIPForm) {
      const error = validateInputs();
      setErrors(error);
    }
  }, [selectedFreq, isAvaxFuji, isConnected, totalInvestment, isHydrated, showSIPForm]);

  // Smart contract interactions
  const {
    createSIP,
    isLoading: createLoading,
    isSuccess: createSuccess,
    error: createError,
    canCreate
  } = useCreateNativeSIP(
    currentPool,
    selectedFreq?.sipAmount?.toString() || "0",
    selectedFreq?.frequencySeconds || 0,
    Math.floor(Date.now() / 1000) + (parseInt(maturity) * 30 * 24 * 3600),
    address || "0x0000000000000000000000000000000000000000",
    totalInvestment.toString()
  );

  const {
    executeSIP,
    isLoading: executeLoading,
    isSuccess: executeSuccess,
  } = useExecuteSIP();

  const {
    finalizeSIP,
    isLoading: finalizeLoading,
    isSuccess: finalizeSuccess,
  } = useFinalizeSIP();

  const handleCreateSIP = async () => {
    const error = validateInputs();
    if (error) {
      setErrors(error);
      return;
    }

    if (!canCreate) {
      setErrors("Contract interaction not ready. Please check your inputs.");
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('onchain_sip_last_pool', currentPool);
      }
      createSIP?.();
    } catch (err) {
      console.error("Error creating SIP:", err);
      setErrors("Failed to create SIP");
    }
  };

  const handleExecuteSIP = async (poolName: string) => {
    if (!poolName) return;
    try {
      setSelectedSIPPool(poolName);
      executeSIP?.(poolName);
    } catch (err) {
      console.error("Error executing SIP:", err);
    }
  };

  const handleFinalizeSIP = async (poolName: string) => {
    if (!poolName) return;
    try {
      setSelectedSIPPool(poolName);
      finalizeSIP?.(poolName);
    } catch (err) {
      console.error("Error finalizing SIP:", err);
    }
  };

  // Success handling
  useEffect(() => {
    if (createSuccess) {
      setShowSIPForm(false);
      setTxStatus({ message: "SIP created successfully!", type: 'success' });
      refetchAllSIPs();
      setTimeout(() => setTxStatus(null), 5000);
    }
  }, [createSuccess]);

  useEffect(() => {
    if (executeSuccess) {
      setTxStatus({ message: "SIP executed successfully!", type: 'success' });
      refetchAllSIPs();
      setTimeout(() => setTxStatus(null), 5000);
    }
  }, [executeSuccess]);

  useEffect(() => {
    if (finalizeSuccess) {
      setTxStatus({ message: "SIP finalized successfully!", type: 'success' });
      refetchAllSIPs();
      setTimeout(() => setTxStatus(null), 5000);
    }
  }, [finalizeSuccess]);

  // Error handling
  useEffect(() => {
    if (createError) {
      setTxStatus({ message: `Error: ${createError.message}`, type: 'error' });
      setTimeout(() => setTxStatus(null), 5000);
    }
  }, [createError]);

  // Debugging: Log current pool and all pool names
  useEffect(() => {
    if (address) {
      console.log('Current pool name for creation:', currentPool);
    }
  }, [address, currentPool]);

  useEffect(() => {
    if (allSIPs) {
      console.log('Fetched all SIPs:', allSIPs);
    }
    if (sipsError) {
      console.error('SIP fetch error:', sipsError);
    }
  }, [allSIPs, sipsError]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white" style={{ backgroundImage: "url('/background.gif')", backgroundSize: "600px", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
        <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate portfolio totals
  const totalPortfolioValue = getTotalPortfolioValue(finalSIPs);
  const totalExecutedAmount = getTotalExecutedAmount(finalSIPs);

  return (
    <div className="min-h-screen bg-black text-white font-sans" style={{ backgroundImage: "url('/background.gif')", backgroundSize: "600px", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md px-6 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold">
            <img src="/logo-text.png" alt="ONCHAINSIP" className="h-8 md:h-12" />
            <span className="text-xs text-slate-400">v1.0 • Avalanche Fuji Testnet</span>
          </div>

          {/* Navigation Buttons */}
          {isConnected && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDashboard(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h2v8H3v-8zm6-4h2v12H9V9zm6-6h2v18h-2V3z" />
                </svg>
                Dashboard
              </button>

              <button
                onClick={() => setShowCryptoModal(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Crypto Price
              </button>

              <button
                onClick={() => setShowManageSIP(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </button>

              <button
                onClick={() => setShowProfileModal(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isAvaxFuji ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">
                  {isAvaxFuji ? 'Avalanche Fuji Testnet' : 'Wrong Network'}
                </span>
              </div>
            )}
            <ConnectButton
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
              chainStatus={{
                smallScreen: 'icon',
                largeScreen: 'full',
              }}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </header>

      {/* Confetti Animation */}
      {txStatus && txStatus.type === 'success' && (
        <div className="fixed inset-0 z-[110] pointer-events-none">
          <Confetti 
            width={width} 
            height={height} 
            recycle={false} 
            numberOfPieces={500}
            gravity={0.15}
          />
        </div>
      )}

      {/* Stacked Toast Notification */}
      {txStatus && txStatus.type === 'success' && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out animate-in slide-in-from-top-4 fade-in">
          <div className="relative">
            {/* Background stacked layers for the "multiple notifications" effect */}
            <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-[90%] h-full bg-[#8e8e8e] rounded-xl -z-20"></div>
            <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-[95%] h-full bg-[#a3a3a3] rounded-xl -z-10"></div>
            
            {/* Main top toast card */}
            <div className="bg-[#b5b5b5] rounded-xl p-3 min-w-[280px] max-w-sm flex flex-col gap-1 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Icon area */}
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-white text-emerald-500 shadow-sm`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-800 text-xs font-bold uppercase tracking-wider">
                      SUCCESS
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 text-[10px] font-medium mt-0.5">Just now</span>
                </div>
              </div>

              <div className="pt-0.5 pl-1">
                <p className="text-gray-900 font-bold text-sm">
                  {txStatus.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-6 py-12 max-w-6xl mx-auto">
        {!isConnected ? (
          /* Welcome Screen */
          <div className="text-center max-w-2xl mx-auto pt-24 pb-12">
            <h1 className="text-5xl font-extrabold mb-4 text-white" style={{ fontFamily: 'Zentry, sans-serif' }}>
              BUILD WEALTH WITH CRYPTO SIPS
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Automate your crypto investments with systematic investment plans
            </p>

            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 text-white px-8 py-2 rounded-3xl text-lg font-bold transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] hover:-translate-y-1 hover:scale-105"
                >
                  START INVESTING ON CRYPTO
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        ) : (
          /* Dashboard */
          <div className="grid gap-8">

            {/* Network Warning */}
            {!isAvaxFuji && (
              <div className="bg-red-500/20 border border-red-500 px-4 py-4 rounded-xl text-center">
                <p className="text-red-500 font-bold">
                  Please switch to Avalanche Fuji Testnet to use OnchainSIP
                </p>
                <p className="text-red-300 text-sm mt-2">
                  Contract Address: 0x094bf41C9aD82016972F3Ae0F3aE5Ab217174a95
                </p>
              </div>
            )}

            {/* Portfolio Summary */}
            {hasActiveSIPs && (
              <div className="bg-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Invested</p>
                    <p className="text-2xl font-bold text-green-500">{totalPortfolioValue} AVAX</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Executed</p>
                    <p className="text-2xl font-bold text-green-500">{totalExecutedAmount} AVAX</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Active SIPs</p>
                    <p className="text-2xl font-bold text-green-500">{finalSIPs.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowSIPForm(true)}
                disabled={!isAvaxFuji}
                className={`px-6 py-2 rounded-xl text-base font-bold transition-all duration-300 ${isAvaxFuji ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.8)]' : 'bg-gray-600/50 text-white cursor-not-allowed'}`}
              >
                + Create New SIP
              </button>

              <button
                onClick={() => { refetchAllSIPs(); setSipRefreshKey(k => k + 1); }}
                disabled={!isAvaxFuji}
                className={`px-6 py-2 rounded-xl text-base font-bold transition-all ${isAvaxFuji ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' : 'bg-gray-600/50 text-white cursor-not-allowed'}`}
              >
                <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh SIPs</span>
              </button>
            </div>

            {/* All SIP Plans Display */}
            <div className="bg-black/60 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl mb-5">Your SIP Plans</h2>
              <TransactionSIPs
                userAddress={address}
                onExecute={handleExecuteSIP}
                onFinalize={handleFinalizeSIP}
                executeLoading={executeLoading}
                finalizeLoading={finalizeLoading}
                selectedPool={selectedSIPPool}
                refreshKey={sipRefreshKey}
              />
            </div>

            {/* SIP Creation Form Modal */}
            {showSIPForm && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
                <div className="bg-slate-900/95 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Create SIP Plan</h3>
                    <button
                      onClick={() => setShowSIPForm(false)}
                      className="text-slate-400 text-2xl hover:text-white p-1"
                    >
                      ×
                    </button>
                  </div>

                  {/* Asset Display */}
                  {/* Token Selection Dropdown */}
                  <div className="mb-5">
                    <label className="block mb-2 text-gray-300 font-medium">
                      Select Token
                    </label>
                    <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-xl p-3">
                      <TokenSelector />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 px-4 py-4 rounded-xl mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-300 text-sm mb-1">Investment Asset</p>
                        <p className="text-yellow-300 text-xl font-bold">AVAX</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p className="text-gray-300 text-sm mb-1">Network</p>
                        <p className="text-lg font-semibold">Avalanche Fuji Testnet</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Investment */}
                  <div className="mb-5">
                    <label className="block mb-2 text-gray-300 font-medium">
                      Total Investment Amount
                    </label>
                    <div className="bg-black/20 rounded-xl p-4">
                      <input
                        type="number"
                        min={0.2}
                        step={0.1}
                        placeholder="0.2"
                        value={totalInvestment}
                        onChange={(e) => setTotalInvestment(Number(e.target.value))}
                        className="w-full bg-transparent border-none text-white text-2xl font-semibold outline-none"
                      />
                      <p className="text-gray-600 text-xs mt-1">Minimum: 0.2 AVAX</p>
                    </div>
                  </div>

                  {/* Maturity Period */}
                  <div className="mb-5">
                    <label className="block mb-2 text-gray-300 font-medium">
                      Investment Duration
                    </label>
                    <div className="bg-black/20 rounded-xl p-4">
                      <select
                        value={maturity}
                        onChange={(e) => setMaturity(e.target.value)}
                        className="w-full bg-transparent border-none text-white text-lg font-semibold outline-none cursor-pointer"
                      >
                        {maturityOptions.map((option) => (
                          <option key={option.value} value={option.value} style={{ background: '#374151' }}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Error Display */}
                  {errors && (
                    <div className="bg-red-500/20 border border-red-500 px-3 py-3 rounded-lg mb-5">
                      <p className="text-red-500 text-sm font-medium">{errors}</p>
                    </div>
                  )}

                  {/* Frequency Options */}
                  {frequencies.length > 0 && !errors && (
                    <div className="mb-5">
                      <label className="block mb-2 text-gray-300 font-medium">
                        Choose SIP Frequency
                      </label>
                      <div className="flex flex-col gap-2">
                        {frequencies.map((f) => (
                          <label
                            key={f.label}
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${selectedFreq?.label === f.label ? 'bg-blue-500/20' : 'bg-black/20'}`}
                            onClick={() => setSelectedFreq(f)}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="frequency"
                                value={f.label}
                                checked={selectedFreq?.label === f.label}
                                onChange={() => setSelectedFreq(f)}
                                className="mr-3 w-4 h-4 accent-blue-500"
                              />
                              <div className="flex flex-col">
                                <span className="text-base font-semibold">{f.label}</span>
                                <p className="text-gray-400 text-sm m-0">{f.intervals} payments</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-green-500 m-0">
                                {f.sipAmount} AVAX
                              </p>
                              <p className="text-gray-400 text-xs m-0">per payment</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSIPForm(false)}
                      className="flex-1 bg-white/10 text-white px-4 py-4 rounded-xl text-base font-semibold hover:bg-white/20"
                    >
                      Cancel
                    </button>
                    {selectedFreq && !errors && (
                      <button
                        onClick={handleCreateSIP}
                        disabled={createLoading || !canCreate}
                        className={`flex-[2] px-4 py-4 rounded-xl text-base font-semibold ${(canCreate && !createLoading) ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800' : 'bg-gray-600/50 text-white cursor-not-allowed'}`}
                      >
                        {createLoading ? 'Creating...' : 'Create SIP Plan'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Components */}
      {showDashboard && (
        <Dashboard
          isOpen={showDashboard}
          onClose={() => setShowDashboard(false)}
          totalSIPs={finalSIPs.length}
          totalInvested={totalPortfolioValue}
          activeSIPs={finalSIPs.map((sip, index) => {
            const formatted = formatSIPData(sip);
            return {
              id: sip.poolName || `sip-${index}`,
              tokenName: "AVAX",
              totalInvested: formatted?.totalAmount || "0",
              currentValue: formatted?.executedAmount || "0",
              progress: formatted?.progress || 0,
              nextExecution: formatted?.nextExecution?.toLocaleDateString() || "N/A",
              status: sip.active ? "active" : "completed"
            };
          })}
        />
      )}

      {showCryptoModal && (
        <CryptoPriceModal isOpen={showCryptoModal} onClose={() => setShowCryptoModal(false)} />
      )}

      {showManageSIP && (
        <ManageSIP
          isOpen={showManageSIP}
          onClose={() => setShowManageSIP(false)}
          totalValue={totalPortfolioValue}
          onExecute={handleExecuteSIP}
          onFinalize={handleFinalizeSIP}
          executeLoading={executeLoading}
          finalizeLoading={finalizeLoading}
          selectedPool={selectedSIPPool}
          activeSIPs={finalSIPs.map((sip, index) => {
            const formatted = formatSIPData(sip);
            const totalAmt = Number(sip.totalAmount);
            const executedAmt = Number(sip.executedAmount);
            const perInterval = Number(sip.amountPerInterval);
            const installmentsDone = perInterval > 0 ? Math.floor(executedAmt / perInterval) : 0;
            const totalInstallments = perInterval > 0 ? Math.floor(totalAmt / perInterval) : 0;
            const frequencySeconds = Number(sip.frequency);
            const frequencyDays = frequencySeconds / (24 * 3600);

            let frequencyLabel = 'Custom';
            if (frequencyDays >= 365) frequencyLabel = 'Yearly';
            else if (frequencyDays >= 90) frequencyLabel = 'Quarterly';
            else if (frequencyDays >= 28) frequencyLabel = 'Monthly';
            else if (frequencyDays >= 7) frequencyLabel = 'Weekly';
            else if (frequencyDays >= 1) frequencyLabel = 'Daily';

            return {
              id: sip.poolName || `sip-${index}`,
              tokenName: "AVAX",
              totalAmount: formatted?.totalAmount || "0",
              executedAmount: formatted?.executedAmount || "0",
              remainingAmount: formatted?.remainingAmount || "0",
              amountPerInterval: formatted?.amountPerInterval || "0",
              installmentsDone,
              totalInstallments,
              remainingInstallments: totalInstallments - installmentsDone,
              frequencyLabel,
              progress: formatted?.progress || 0,
              nextExecution: formatted?.nextExecution?.toLocaleDateString() || "N/A",
              maturityDate: formatted?.maturity?.toLocaleDateString() || "N/A",
              active: sip.active,
              canExecute: formatted?.canExecute || false,
              canFinalize: formatted?.canFinalize || false,
            };
          })}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          totalSIPs={allSIPs.length}
          totalInvested={totalPortfolioValue}
          totalExecuted={totalExecutedAmount}
        />
      )}
    </div>
  );
}
