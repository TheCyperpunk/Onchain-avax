"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import axios from "axios";

interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_1h_in_currency: number | null;
    price_change_percentage_24h: number | null;
    price_change_percentage_7d_in_currency: number | null;
    market_cap: number;
    total_volume: number;
    sparkline_in_7d: {
        price: number[];
    } | null;
}

interface CryptoPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CryptoPriceModal({ isOpen, onClose }: CryptoPriceModalProps) {
    const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
    const [filteredData, setFilteredData] = useState<CryptoData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCryptoData = async () => {
        try {
            setLoading(true);

            // CoinGecko API has a max limit of 250 per page
            // Fetch 400 coins by making 2 requests (200 each page)
            // Fetch 400 coins from our internal API route
            // The API handles fetching 2 pages sequentially with caching
            const response = await axios.get("/api/crypto-prices");

            const allCoins = response.data;
            setCryptoData(allCoins);
            setFilteredData(allCoins);
            setError("");
        } catch (err: any) {
            console.error("Error fetching crypto data:", err);
            console.error("Error details:", {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
            });

            // Provide specific error messages based on error type
            if (err.response?.status === 429) {
                setError("Rate limit exceeded. Please wait 1-2 minutes and try again.");
            } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
                setError("Network error. Please check your internet connection.");
            } else if (err.response?.status === 403) {
                setError("API access denied. Please try again later.");
            } else if (err.message) {
                setError(`Failed to fetch data: ${err.message}`);
            } else {
                setError("Failed to fetch crypto data. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCryptoData();
            // Auto-refresh every 60 seconds (increased from 30s to reduce API calls)
            const interval = setInterval(fetchCryptoData, 60000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    // Filter crypto data based on search query
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredData(cryptoData);
        } else {
            const filtered = cryptoData.filter(
                (coin) =>
                    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchQuery, cryptoData]);

    const formatPrice = (price: number) => {
        if (price >= 1) {
            return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${price.toFixed(4)}`;
    };

    const formatMarketCap = (marketCap: number) => {
        return `$${Math.round(marketCap).toLocaleString()}`;
    };

    const formatVolume = (volume: number) => {
        return `$${Math.round(volume).toLocaleString()}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] min-h-[90vh] max-h-[95vh] overflow-hidden border border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                    <div>
                        <h2 className="text-3xl font-bold text-white">Cryptocurrency Prices</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-3xl font-bold transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search coins or tokens..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        />
                        <svg
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    {loading && cryptoData.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <div className="bg-red-500/20 backdrop-blur-md border border-red-500 px-4 py-4 rounded-xl text-center">
                                <p className="text-red-500 font-bold">{error}</p>
                                <button
                                    onClick={fetchCryptoData}
                                    className="mt-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <p className="text-slate-400 text-lg">No coins found matching "{searchQuery}"</p>
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="mt-3 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Clear Search
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-y-auto overflow-x-auto" style={{ maxHeight: 'calc(95vh - 230px)' }}>
                            <table className="w-full">
                                <thead className="bg-slate-800 backdrop-blur-md sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left px-4 py-1.5 text-slate-400 font-semibold text-sm">#</th>
                                        <th className="text-left px-4 py-1.5 text-slate-400 font-semibold text-sm">Coin</th>
                                        <th className="text-right px-4 py-1.5 text-slate-400 font-semibold text-sm">Price</th>
                                        <th className="text-right px-4 py-1.5 text-slate-400 font-semibold text-sm">1h %</th>
                                        <th className="text-right px-4 py-1.5 text-slate-400 font-semibold text-sm">24h %</th>
                                        <th className="text-right px-4 py-1.5 text-slate-400 font-semibold text-sm">7d %</th>
                                        <th className="text-center px-4 py-1.5 text-slate-400 font-semibold text-sm">Last 7 Days</th>
                                        <th className="text-right px-4 py-1.5 text-slate-400 font-semibold text-sm">Market Cap</th>
                                        <th className="text-right px-4 py-1.5 text-slate-400 font-semibold text-sm">Volume(24h)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((coin, index) => {
                                        // Handle null values for all price change percentages
                                        const priceChange1h = coin.price_change_percentage_1h_in_currency ?? 0;
                                        const priceChange24h = coin.price_change_percentage_24h ?? 0;
                                        const priceChange7d = coin.price_change_percentage_7d_in_currency ?? 0;
                                        const chartData = coin.sparkline_in_7d?.price?.map((price, i) => ({
                                            value: price,
                                            index: i,
                                        })) || [];

                                        return (
                                            <tr
                                                key={`${coin.id}-${index}`}
                                                className="border-b border-white/5 hover:bg-white/10 hover:backdrop-blur-sm transition-all"
                                            >
                                                <td className="px-4 py-2 text-slate-400 text-sm">{index + 1}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                                        <div>
                                                            <div className="text-white font-semibold">{coin.name}</div>
                                                            <div className="text-slate-400 text-sm uppercase">{coin.symbol}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-white font-semibold">
                                                    {formatPrice(coin.current_price)}
                                                </td>

                                                {/* 1h % */}
                                                <td className="px-4 py-2 text-right">
                                                    <span className={`font-semibold ${priceChange1h >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                        {priceChange1h === 0 ? "N/A" : (
                                                            <>
                                                                {priceChange1h >= 0 ? "+" : ""}
                                                                {priceChange1h.toFixed(2)}%
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* 24h % */}
                                                <td className="px-4 py-2 text-right">
                                                    <span className={`font-semibold ${priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                        {priceChange24h === 0 ? "N/A" : (
                                                            <>
                                                                {priceChange24h >= 0 ? "+" : ""}
                                                                {priceChange24h.toFixed(2)}%
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* 7d % */}
                                                <td className="px-4 py-2 text-right">
                                                    <span className={`font-semibold ${priceChange7d >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                        {priceChange7d === 0 ? "N/A" : (
                                                            <>
                                                                {priceChange7d >= 0 ? "+" : ""}
                                                                {priceChange7d.toFixed(2)}%
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* 7-day chart */}
                                                <td className="px-4 py-2">
                                                    <div className="w-32 h-12 mx-auto">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                                                                <defs>
                                                                    <linearGradient id={`gradient-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor={priceChange7d >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                                                                        <stop offset="100%" stopColor={priceChange7d >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <YAxis domain={['auto', 'auto']} hide={true} />
                                                                <Area
                                                                    type="monotone"
                                                                    dataKey="value"
                                                                    stroke={priceChange7d >= 0 ? "#10b981" : "#ef4444"}
                                                                    strokeWidth={1.5}
                                                                    fill={`url(#gradient-${coin.id})`}
                                                                    animationDuration={0}
                                                                    isAnimationActive={false}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right text-slate-300">
                                                    {formatMarketCap(coin.market_cap)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-slate-300">
                                                    {formatVolume(coin.total_volume)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
