"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { useSIPContract, formatSIPData, generatePoolName, getTotalPortfolioValue, getTotalExecutedAmount } from "../hooks/useSIPContract";

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

  // Force use of recovered pool name for this session
  const RECOVERED_POOL = 'sip_ECE386_1756552715';

  const [isHydrated, setIsHydrated] = useState(false);
  const [showSIPForm, setShowSIPForm] = useState(false);
  const [currentPool, setCurrentPool] = useState(RECOVERED_POOL);
  const [txStatus, setTxStatus] = useState("");
  const [selectedSIPPool, setSelectedSIPPool] = useState<string>("");

  // SIP form states with proper types
  const [totalInvestment, setTotalInvestment] = useState(0.2);
  const [maturity, setMaturity] = useState("6");
  const [frequencies, setFrequencies] = useState<FrequencyOption[]>([]);
  const [selectedFreq, setSelectedFreq] = useState<SelectedFreq | null>(null);
  const [errors, setErrors] = useState("");

  const isAvaxFuji = chainId === 43113;

  const { useCreateNativeSIP, useGetAllUserSIPs, useExecuteSIP, useFinalizeSIP } = useSIPContract();

  // Get user's all SIP plans (updated to use the new hook)
  const { allSIPs, isLoading: sipsLoading, error: sipsError, refetch: refetchAllSIPs, hasActiveSIPs } = useGetAllUserSIPs(address);

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

  // Generate unique pool name for new SIPs
  useEffect(() => {
    if (address && !hasActiveSIPs) {
      let pool = currentPool;
      if (!pool || pool === 'default') {
        pool = generatePoolName(address, Date.now());
        setCurrentPool(pool);
        if (typeof window !== 'undefined') {
          localStorage.setItem('onchain_sip_last_pool', pool);
        }
      }
    }
  }, [address, hasActiveSIPs]);

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
    canExecute: canExecuteContract
  } = useExecuteSIP(selectedSIPPool);

  const {
    finalizeSIP,
    isLoading: finalizeLoading,
    isSuccess: finalizeSuccess,
    canFinalize: canFinalizeContract
  } = useFinalizeSIP(selectedSIPPool);

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
      setTxStatus("Creating SIP plan...");
      // Only generate a new pool name if there are already active SIPs
      let pool = currentPool;
      if (hasActiveSIPs) {
        pool = generatePoolName(address || "", Date.now());
        setCurrentPool(pool);
        if (typeof window !== 'undefined') {
          localStorage.setItem('onchain_sip_last_pool', pool);
        }
      }
      createSIP?.();
    } catch (err) {
      console.error("Error creating SIP:", err);
      setErrors("Failed to create SIP");
      setTxStatus("");
    }
  };

  const handleExecuteSIP = async (poolName: string) => {
    if (!canExecuteContract) return;
    try {
      setSelectedSIPPool(poolName);
      setTxStatus("Executing SIP interval...");
      executeSIP?.();
    } catch (err) {
      console.error("Error executing SIP:", err);
      setTxStatus("");
    }
  };

  const handleFinalizeSIP = async (poolName: string) => {
    if (!canFinalizeContract) return;
    try {
      setSelectedSIPPool(poolName);
      setTxStatus("Finalizing SIP...");
      finalizeSIP?.();
    } catch (err) {
      console.error("Error finalizing SIP:", err);
      setTxStatus("");
    }
  };

  // Success handling
  useEffect(() => {
    if (createSuccess) {
      setShowSIPForm(false);
      setTxStatus("SIP created successfully!");
      refetchAllSIPs();
      setTimeout(() => setTxStatus(""), 5000);
    }
  }, [createSuccess]);

  useEffect(() => {
    if (executeSuccess) {
      setTxStatus("SIP executed successfully!");
      refetchAllSIPs();
      setTimeout(() => setTxStatus(""), 5000);
    }
  }, [executeSuccess]);

  useEffect(() => {
    if (finalizeSuccess) {
      setTxStatus("SIP finalized successfully!");
      refetchAllSIPs();
      setTimeout(() => setTxStatus(""), 5000);
    }
  }, [finalizeSuccess]);

  // Error handling
  useEffect(() => {
    if (createError) {
      setTxStatus(`Error: ${createError.message}`);
      setTimeout(() => setTxStatus(""), 5000);
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
  const totalPortfolioValue = getTotalPortfolioValue(allSIPs);
  const totalExecutedAmount = getTotalExecutedAmount(allSIPs);

  return (
    <div className="min-h-screen bg-black text-white font-sans" style={{ backgroundImage: "url('/background.gif')", backgroundSize: "600px", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md px-6 py-2">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold">
            <img src="/logo-text.png" alt="ONCHAINSIP" className="h-8 md:h-12" />
            <span className="hidden md:inline text-xs text-slate-400 ml-2">v1.0 • Avalanche Fuji Testnet</span>
          </div>

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

      {/* Transaction Status */}
      {txStatus && (
        <div className={`px-6 py-3 text-center ${txStatus.includes('Error') ? 'bg-red-500/20 border border-red-500 text-red-500' : 'bg-green-500/20 border border-green-500 text-green-500'}`}>
          {txStatus}
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
                  Contract Address: 0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b
                </p>
              </div>
            )}

            {/* Portfolio Summary */}
            {hasActiveSIPs && (
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Portfolio Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Invested</p>
                    <p className="text-2xl font-bold text-green-500">{totalPortfolioValue} AVAX</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Executed</p>
                    <p className="text-2xl font-bold text-blue-500">{totalExecutedAmount} AVAX</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Active SIPs</p>
                    <p className="text-2xl font-bold text-yellow-500">{allSIPs.length}</p>
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
                onClick={() => refetchAllSIPs()}
                disabled={!isAvaxFuji}
                className={`px-6 py-2 rounded-xl text-base font-bold transition-all ${isAvaxFuji ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' : 'bg-gray-600/50 text-white cursor-not-allowed'}`}
              >
                🔄 Refresh SIPs
              </button>
            </div>

            {/* All SIP Plans Display */}
            <div className="bg-black/60 rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl mb-5">Your SIP Plans</h2>
              {/* Debugging output for pool names and errors */}
              <div style={{ color: 'yellow', fontSize: '12px', marginBottom: '8px' }}>
                <div>Current Pool: {currentPool}</div>
                <div>Address: {address}</div>
                <div>All SIPs: {JSON.stringify(allSIPs)}</div>
                {sipsError && <div style={{ color: 'red' }}>SIP Error: {sipsError.message}</div>}
              </div>

              {sipsLoading ? (
                <div className="text-center py-10 text-slate-400">
                  <p>Loading SIP plans...</p>
                </div>
              ) : sipsError ? (
                <div className="bg-red-500/20 border border-red-500 px-3 py-3 rounded-lg mb-5">
                  <p className="text-red-500 text-sm font-medium">Error loading SIPs: {sipsError.message}</p>
                  <button onClick={refetchAllSIPs} className="bg-white/10 text-white border border-white/20 px-5 py-3 rounded-lg text-sm font-semibold mt-2 hover:bg-white/20">
                    🔄 Retry
                  </button>
                </div>
              ) : allSIPs.length > 0 ? (
                <div className="grid gap-6">
                  {allSIPs.map((sip, index) => {
                    const formattedPlan = formatSIPData(sip);
                    if (!formattedPlan) return null;

                    return (
                      <div key={`${sip.poolName}-${index}`} className="bg-black/40 p-5 rounded-xl border border-white/10 mb-4">
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                          <h3 className="text-lg font-semibold">SIP Plan #{index + 1}</h3>
                          <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">Pool: {sip.poolName}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-black/30 h-2 rounded mb-5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded transition-all duration-300"
                            style={{ width: `${formattedPlan.progress}%` }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                          <div className="flex flex-col">
                            <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                            <p className="text-lg font-bold text-green-500">
                              {formattedPlan.totalAmount} AVAX
                            </p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-gray-400 text-sm mb-1">Per Interval</p>
                            <p className="text-lg font-bold text-blue-500">
                              {formattedPlan.amountPerInterval} AVAX
                            </p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-gray-400 text-sm mb-1">Executed</p>
                            <p className="text-lg font-bold text-yellow-500">
                              {formattedPlan.executedAmount} AVAX
                            </p>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-gray-400 text-sm mb-1">Remaining</p>
                            <p className="text-lg font-bold text-slate-400">
                              {formattedPlan.remainingAmount} AVAX
                            </p>
                          </div>
                        </div>

                        {/* Time Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 bg-black/20 p-4 rounded-lg">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Next Execution</p>
                            <p className={`text-sm font-medium ${formattedPlan.canExecute ? 'text-green-400' : 'text-slate-400'}`}>
                              {formattedPlan.nextExecution.toLocaleDateString()} at {formattedPlan.nextExecution.toLocaleTimeString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Maturity</p>
                            <p className={`text-sm font-medium ${formattedPlan.canFinalize ? 'text-green-400' : 'text-slate-400'}`}>
                              {formattedPlan.maturity.toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Frequency</p>
                            <p className="text-sm font-medium text-slate-300">Every {formattedPlan.frequencyDays} days</p>
                          </div>
                        </div>

                        {/* Action Buttons for this SIP */}
                        <div className="flex gap-3 flex-wrap items-center">
                          <button
                            onClick={() => handleExecuteSIP(sip.poolName || '')}
                            disabled={!isAvaxFuji || executeLoading || !formattedPlan.canExecute}
                            className={`px-5 py-3 rounded-lg text-sm font-semibold ${(!isAvaxFuji || !formattedPlan.canExecute) ? 'bg-gray-600/50 text-white cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'}`}
                          >
                            {executeLoading && selectedSIPPool === sip.poolName ? 'Executing...' : 'Execute SIP'}
                          </button>

                          <button
                            onClick={() => handleFinalizeSIP(sip.poolName || '')}
                            disabled={!isAvaxFuji || finalizeLoading || !formattedPlan.canFinalize}
                            className={`px-5 py-3 rounded-lg text-sm font-semibold ${(!isAvaxFuji || !formattedPlan.canFinalize) ? 'bg-gray-600/50 text-white cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'}`}
                          >
                            {finalizeLoading && selectedSIPPool === sip.poolName ? 'Finalizing...' : 'Finalize SIP'}
                          </button>

                          <div className="flex items-center gap-2 ml-auto">
                            {formattedPlan.canExecute && (
                              <span className="text-green-400 text-sm">● Ready to Execute</span>
                            )}
                            {formattedPlan.canFinalize && (
                              <span className="text-yellow-400 text-sm">● Matured</span>
                            )}
                            {!formattedPlan.canExecute && !formattedPlan.canFinalize && (
                              <span className="text-slate-400 text-sm">● Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-lg mb-2">No SIP Plans Found</p>
                  <p className="text-sm">
                    {!isAvaxFuji
                      ? "Connect to Avalanche Fuji Testnet to view your SIPs"
                      : "Create your first SIP plan to get started with automated crypto investing"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* SIP Creation Form Modal */}
            {showSIPForm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
                <div className="bg-slate-900/95 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10">
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
                    <div className="bg-gradient-to-r from-orange-600/20 to-orange-700/20 rounded-xl p-4 border border-orange-500/30">
                      <select
                        className="w-full bg-black/40 border-none text-white text-lg font-semibold outline-none cursor-pointer px-2 py-2 rounded-lg"
                      >
                        <option value="avax" className="bg-gray-800 text-white py-2">
                          🔺 AVAX - Avalanche
                        </option>
                        <option value="eth" className="bg-gray-800 text-white py-2">
                          ⟠ ETH - Ethereum Sepolia
                        </option>
                        <option value="bnb" className="bg-gray-800 text-white py-2">
                          🟡 BNB - BSC Testnet
                        </option>
                        <option value="matic" className="bg-gray-800 text-white py-2">
                          🟣 MATIC - Polygon Mumbai
                        </option>
                        <option value="arb" className="bg-gray-800 text-white py-2">
                          🔵 ARB - Arbitrum Sepolia
                        </option>
                        <option value="op" className="bg-gray-800 text-white py-2">
                          🔴 OP - Optimism Sepolia
                        </option>
                        <option value="ftm" className="bg-gray-800 text-white py-2">
                          👻 FTM - Fantom Testnet
                        </option>
                        <option value="base" className="bg-gray-800 text-white py-2">
                          🔷 BASE - Base Sepolia
                        </option>
                        <option value="celo" className="bg-gray-800 text-white py-2">
                          🟢 CELO - Celo Alfajores
                        </option>
                        <option value="zksync" className="bg-gray-800 text-white py-2">
                          ⚡ ZK - zkSync Sepolia
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-600/20 to-orange-700/20 px-4 py-4 rounded-xl border border-orange-500/30 mb-6">
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
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedFreq?.label === f.label ? 'bg-blue-500/20 border-blue-500' : 'bg-black/20 border-transparent'}`}
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
                      className="flex-1 bg-white/10 text-white border border-white/20 px-4 py-4 rounded-xl text-base font-semibold hover:bg-white/20"
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
    </div>
  );
}
