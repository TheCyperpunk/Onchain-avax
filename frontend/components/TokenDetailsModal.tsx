import React, { useState, useEffect } from 'react';
import { X, Globe, TrendingUp, AlertCircle, Search, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface TokenDetailsModalProps {
    coinId: string;
    onClose: () => void;
}

interface CoinDetails {
    id: string;
    symbol: string;
    name: string;
    description: { en: string };
    links: {
        homepage: string[];
        blockchain_site: string[];
    };
    image: {
        thumb: string;
        small: string;
        large: string;
    };
    market_cap_rank: number;
    market_data: {
        current_price: { usd: number };
        price_change_percentage_24h: number;
        market_cap: { usd: number };
        total_volume: { usd: number };
        circulating_supply: number;
        total_supply: number | null;
        max_supply: number | null;
        ath: { usd: number };
        ath_change_percentage: { usd: number };
        ath_date: { usd: string };
        atl: { usd: number };
        atl_change_percentage: { usd: number };
        atl_date: { usd: string };
    };
}

const TokenDetailsModal: React.FC<TokenDetailsModalProps> = ({ coinId, onClose }) => {
    const [details, setDetails] = useState<CoinDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!coinId) return;

            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`/api/crypto-details/${coinId}`);
                setDetails(response.data);
            } catch (err: any) {
                console.error("Error fetching coin details:", err);
                setError(err.response?.data?.error || "Failed to load coin details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [coinId]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const formatCurrency = (value: number | undefined | null) => {
        if (value === undefined || value === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: value >= 1 ? 2 : 6
        }).format(value);
    };

    const formatNumber = (value: number | undefined | null) => {
        if (value === undefined || value === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse"></div>
                        ) : details ? (
                            <img src={details.image.small} alt={details.name} className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-slate-500" />
                            </div>
                        )}
                        <div>
                            {loading ? (
                                <div className="h-6 w-32 bg-slate-800 rounded animate-pulse mb-1"></div>
                            ) : details ? (
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    {details.name}
                                    <span className="text-sm font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                                        {details.symbol}
                                    </span>
                                </h2>
                            ) : (
                                <h2 className="text-xl font-bold text-white">Token Details</h2>
                            )}
                            {details?.market_cap_rank && (
                                <p className="text-xs text-slate-400">Rank #{details.market_cap_rank}</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="space-y-6">
                            {/* Loading State Skeletons */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                        <div className="h-4 w-16 bg-slate-700 rounded animate-pulse mb-2"></div>
                                        <div className="h-6 w-24 bg-slate-700 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-800 space-y-3">
                                <div className="h-4 w-1/4 bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-4 w-full bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-4 w-full bg-slate-700 rounded animate-pulse"></div>
                                <div className="h-4 w-2/3 bg-slate-700 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center bg-red-500/10 rounded-xl border border-red-500/20 p-6">
                            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : details ? (
                        <div className="space-y-6">

                            {/* Price & Primary Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Price</p>
                                    <p className="text-xl font-bold text-white tracking-tight">
                                        {formatCurrency(details.market_data.current_price.usd)}
                                    </p>
                                    <p className={`text-sm mt-1 flex items-center font-medium ${details.market_data.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {details.market_data.price_change_percentage_24h > 0 ? '+' : ''}
                                        {details.market_data.price_change_percentage_24h?.toFixed(2)}%
                                    </p>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Market Cap</p>
                                    <p className="text-lg font-bold text-white">
                                        {formatCurrency(details.market_data.market_cap.usd)}
                                    </p>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">24h Volume</p>
                                    <p className="text-lg font-bold text-white">
                                        {formatCurrency(details.market_data.total_volume.usd)}
                                    </p>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Circulating Supply</p>
                                    <p className="text-lg font-bold text-white truncate" title={formatNumber(details.market_data.circulating_supply)}>
                                        {formatNumber(details.market_data.circulating_supply)}
                                        <span className="text-xs text-slate-500 ml-1 uppercase">{details.symbol}</span>
                                    </p>
                                    {details.market_data.max_supply && (
                                        <div className="w-full bg-slate-700 rounded-full h-1 mt-2">
                                            <div
                                                className="bg-cyan-500 h-1 rounded-full"
                                                style={{ width: `${Math.min((details.market_data.circulating_supply / details.market_data.max_supply) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detailed Stats Grid */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/50">
                                        <h3 className="text-sm font-semibold text-slate-200">Historical Extremes</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">All-Time High</p>
                                                <p className="text-lg text-white font-medium">{formatCurrency(details.market_data.ath.usd)}</p>
                                                <p className="text-xs text-slate-500">{formatDate(details.market_data.ath_date.usd)}</p>
                                            </div>
                                            <p className={`text-sm font-medium ${details.market_data.ath_change_percentage.usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {details.market_data.ath_change_percentage.usd?.toFixed(2)}%
                                            </p>
                                        </div>
                                        <div className="w-full h-px bg-slate-700/50"></div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">All-Time Low</p>
                                                <p className="text-lg text-white font-medium">{formatCurrency(details.market_data.atl.usd)}</p>
                                                <p className="text-xs text-slate-500">{formatDate(details.market_data.atl_date.usd)}</p>
                                            </div>
                                            <p className={`text-sm font-medium ${details.market_data.atl_change_percentage.usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {details.market_data.atl_change_percentage.usd > 0 ? '+' : ''}
                                                {details.market_data.atl_change_percentage.usd?.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/50">
                                        <h3 className="text-sm font-semibold text-slate-200">Supply Information</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Circulating Supply</span>
                                            <span className="text-white font-medium">{formatNumber(details.market_data.circulating_supply)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Total Supply</span>
                                            <span className="text-white font-medium">{formatNumber(details.market_data.total_supply)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Max Supply</span>
                                            <span className="text-white font-medium">{formatNumber(details.market_data.max_supply) || '∞'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {details.description?.en && (
                                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-5">
                                    <h3 className="text-sm font-semibold text-slate-200 mb-3">About {details.name}</h3>
                                    <div
                                        className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none prose-a:text-cyan-400 hover:prose-a:text-cyan-300"
                                        dangerouslySetInnerHTML={{ __html: details.description.en || 'No description available.' }}
                                    />
                                </div>
                            )}

                            {/* Links */}
                            <div className="flex flex-wrap gap-3">
                                {details.links.homepage[0] && (
                                    <a
                                        href={details.links.homepage[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
                                    >
                                        <Globe size={16} className="text-cyan-400" />
                                        Website
                                        <ExternalLink size={14} className="text-slate-400 ml-1" />
                                    </a>
                                )}
                                {details.links.blockchain_site[0] && (
                                    <a
                                        href={details.links.blockchain_site[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
                                    >
                                        <Search size={16} className="text-cyan-400" />
                                        Explorer
                                        <ExternalLink size={14} className="text-slate-400 ml-1" />
                                    </a>
                                )}
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(51, 65, 85, 0.8);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(71, 85, 105, 1);
                }
            `}</style>
        </div>
    );
};

export default TokenDetailsModal;
