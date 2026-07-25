"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, formatDate, formatNumber, formatPercentage } from "../lib/crypto/format";
import type { CryptoData } from "../lib/crypto/types";
import { useCryptoPrices } from "../hooks/crypto/useCryptoPrices";
import { useCoinDetails } from "../hooks/crypto/useCoinDetails";
import { useCryptoSearch } from "../hooks/crypto/useCryptoSearch";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { CryptoDataRow as Row, PercentageBadge as PctBadge } from "./crypto/CryptoDisplay";

interface CryptoPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/*interface CryptoData {
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
    sparkline_in_7d: { price: number[] } | null;
}

interface CoinDetails {
    id: string;
    symbol: string;
    name: string;
    description: { en: string };
    links: { homepage: string[]; blockchain_site: string[] };
    image: { thumb: string; small: string; large: string };
    market_cap_rank: number;
    community_data: {
        twitter_followers: number | null;
        reddit_subscribers: number | null;
    };
    market_data: {
        current_price: { usd: number };
        price_change_percentage_1h_in_currency: { usd: number };
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        price_change_percentage_30d: number;
        price_change_percentage_1y: number;
        market_cap: { usd: number };
        market_cap_change_percentage_24h: number;
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
        market_cap_fdv_ratio: number | null;
        fully_diluted_valuation: { usd: number | null };
        total_value_locked: { usd: number | null } | null;
        price_change_24h: number;
        high_24h: { usd: number };
        low_24h: { usd: number };
    };
}

interface CryptoPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
}
*/

// ---- FORMATTING HELPERS ----
const fmt$ = formatCurrency;
const fmtN = formatNumber;
const fmtPct = formatPercentage;
const fmtDate = formatDate;

// Terminal row component

export default function CryptoPriceModal({ isOpen, onClose }: CryptoPriceModalProps) {
    const { cryptoData, loading, error, refetch: fetchCryptoData } = useCryptoPrices(isOpen);
    const { searchQuery, setSearchQuery, filteredData } = useCryptoSearch(cryptoData);

    const [selectedCoin, setSelectedCoin] = useState<CryptoData | null>(null);
    const { coinDetails, detailLoading, detailError, fetchCoinDetails, resetCoinDetails } = useCoinDetails();

    useLockBodyScroll(isOpen);

    const handleCoinClick = (coin: CryptoData) => { setSelectedCoin(coin); fetchCoinDetails(coin.id); };
    const handleBack = () => { setSelectedCoin(null); resetCoinDetails(); };

    const formatPrice = (price: number) =>
        price >= 1 ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${price.toFixed(4)}`;

    if (!isOpen) return null;

    const sparkline = selectedCoin?.sparkline_in_7d?.price?.map((price, i) => ({ value: price, i })) || [];
    const is7dPos = (selectedCoin?.price_change_percentage_7d_in_currency ?? 0) >= 0;
    const chartColor = is7dPos ? "#10b981" : "#ef4444";
    const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] min-h-[90vh] max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">

                <div className="flex justify-between items-center p-6 border-b border-transparent bg-black/20 shrink-0">
                    <div className="flex items-center gap-3">
                        {selectedCoin && (
                            <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        {selectedCoin ? (
                            <div className="flex items-center gap-3">
                                <img src={selectedCoin.image} alt={selectedCoin.name} className="w-8 h-8 rounded-full" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        {selectedCoin.name}
                                        <span className="text-sm font-medium px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase">{selectedCoin.symbol}</span>
                                    </h2>
                                    {coinDetails && <p className="text-xs text-slate-400">Rank #{coinDetails.market_cap_rank}</p>}
                                </div>
                            </div>
                        ) : (
                            <h2 className="text-3xl font-bold text-white">Cryptocurrency Prices</h2>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl font-bold transition-colors">×</button>
                </div>

                {/* ── DETAIL VIEW ── */}
                {selectedCoin ? (
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                        {detailLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                                    <span className="text-zinc-600 font-mono text-xs animate-pulse">LOADING MARKET DATA...</span>
                                </div>
                            </div>
                        ) : detailError ? (
                            <div className="flex items-center justify-center h-48 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <p className="text-red-500 font-mono text-sm">[ERROR] {detailError}</p>
                            </div>
                        ) : coinDetails ? (
                            <>
                                {/* TOP ROW — price ticker + quick stats */}
                                <div className="grid grid-cols-12 gap-3">
                                    {/* Big price block */}
                                    <div className="col-span-12 md:col-span-3 bg-black/60 rounded-xl p-4 flex flex-col justify-between border border-white/[0.04]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <img src={coinDetails.image.small} alt={coinDetails.name} className="w-6 h-6 rounded-full" />
                                            <span className="text-zinc-400 font-mono text-sm tracking-widest">{coinDetails.name.toUpperCase()} · USD</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-mono text-4xl font-bold tracking-tight">{fmt$(coinDetails.market_data.current_price.usd)}</p>
                                            <PctBadge v={coinDetails.market_data.price_change_percentage_24h} />
                                            <span className="text-zinc-600 font-mono text-[12px] ml-1">24H</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-zinc-600 font-mono text-[11px] tracking-widest mb-0.5">24H HIGH</p>
                                                <p className="text-emerald-400 font-mono text-sm">{fmt$(coinDetails.market_data.high_24h?.usd)}</p>
                                            </div>
                                            <div>
                                                <p className="text-zinc-600 font-mono text-[11px] tracking-widest mb-0.5">24H LOW</p>
                                                <p className="text-red-400 font-mono text-sm">{fmt$(coinDetails.market_data.low_24h?.usd)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sparkline chart */}
                                    <div className="col-span-12 md:col-span-9 bg-black/60 rounded-xl p-4 border border-white/[0.04]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-zinc-600 font-mono text-[13px] tracking-widest">7D PRICE CHART</span>
                                            <PctBadge v={coinDetails.market_data.price_change_percentage_7d} />
                                        </div>
                                        <div className="w-full h-36">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={sparkline} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="termGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                                                            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="i" hide />
                                                    <YAxis domain={["auto", "auto"]} hide />
                                                    <Tooltip
                                                        contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: "6px", color: "#fff", fontSize: "11px", fontFamily: "monospace" }}
                                                        formatter={(v: any) => [`$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "USD"]}
                                                        labelFormatter={() => ""}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={1.5} fill="url(#termGrad)" isAnimationActive={false} dot={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* DATA PANELS GRID */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                                    {/* Panel: Market Data */}
                                    <div className="bg-black/60 rounded-xl p-4 border border-white/[0.04]">
                                        <p className="text-[12px] tracking-[0.2em] text-zinc-500 font-mono mb-3 uppercase">Market Data</p>
                                        <Row label="Market Cap" value={fmt$(coinDetails.market_data.market_cap.usd)} />
                                        <Row label="Mkt Cap Chg 24h" value={<PctBadge v={coinDetails.market_data.market_cap_change_percentage_24h} />} />
                                        <Row label="Volume 24h" value={fmt$(coinDetails.market_data.total_volume.usd)} />
                                        <Row label="Vol / Mkt Cap" value={fmt$((coinDetails.market_data.total_volume.usd / coinDetails.market_data.market_cap.usd) * 100, 4).replace("$", "")} valueClass="text-white font-mono" />
                                        <Row label="FDV" value={coinDetails.market_data.fully_diluted_valuation?.usd ? fmt$(coinDetails.market_data.fully_diluted_valuation.usd) : "N/A"} />
                                    </div>

                                    {/* Panel: Price Changes */}
                                    <div className="bg-black/60 rounded-xl p-4 border border-white/[0.04]">
                                        <p className="text-[12px] tracking-[0.2em] text-zinc-500 font-mono mb-3 uppercase">Price Performance</p>
                                        <Row label="1h Change" value={<PctBadge v={coinDetails.market_data.price_change_percentage_1h_in_currency?.usd} />} />
                                        <Row label="24h Change" value={<PctBadge v={coinDetails.market_data.price_change_percentage_24h} />} />
                                        <Row label="7d Change" value={<PctBadge v={coinDetails.market_data.price_change_percentage_7d} />} />
                                        <Row label="30d Change" value={<PctBadge v={coinDetails.market_data.price_change_percentage_30d} />} />
                                        <Row label="1y Change" value={<PctBadge v={coinDetails.market_data.price_change_percentage_1y} />} />
                                    </div>

                                    {/* Panel: Supply */}
                                    <div className="bg-black/60 rounded-xl p-4 border border-white/[0.04]">
                                        <p className="text-[12px] tracking-[0.2em] text-zinc-500 font-mono mb-3 uppercase">Supply</p>
                                        <Row label="Circulating" value={fmtN(coinDetails.market_data.circulating_supply)} />
                                        <Row label="Total" value={fmtN(coinDetails.market_data.total_supply)} />
                                        <Row label="Max" value={coinDetails.market_data.max_supply ? fmtN(coinDetails.market_data.max_supply) : "∞"} />
                                        {coinDetails.market_data.max_supply && (
                                            <div className="mt-3">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-zinc-600 font-mono text-[12px] tracking-widest uppercase">% Mined</span>
                                                    <span className="text-white font-mono text-[13px]">
                                                        {((coinDetails.market_data.circulating_supply / coinDetails.market_data.max_supply) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-900 rounded-full h-[3px]">
                                                    <div className="bg-emerald-500 h-[3px] rounded-full" style={{ width: `${Math.min((coinDetails.market_data.circulating_supply / coinDetails.market_data.max_supply) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Panel: ATH / ATL */}
                                    <div className="bg-black/60 rounded-xl p-4 border border-white/[0.04]">
                                        <p className="text-[12px] tracking-[0.2em] text-zinc-500 font-mono mb-3 uppercase">All-Time Records</p>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between items-end mb-0.5">
                                                    <span className="text-[13px] tracking-widest text-zinc-500 font-mono uppercase">ATH</span>
                                                    <PctBadge v={coinDetails.market_data.ath_change_percentage.usd} />
                                                </div>
                                                <p className="text-white font-mono text-base font-bold">{fmt$(coinDetails.market_data.ath.usd)}</p>
                                                <p className="text-zinc-600 font-mono text-[12px]">{fmtDate(coinDetails.market_data.ath_date.usd)}</p>
                                            </div>
                                            <div className="w-full h-px bg-white/5" />
                                            <div>
                                                <div className="flex justify-between items-end mb-0.5">
                                                    <span className="text-[13px] tracking-widest text-zinc-500 font-mono uppercase">ATL</span>
                                                    <PctBadge v={coinDetails.market_data.atl_change_percentage.usd} />
                                                </div>
                                                <p className="text-white font-mono text-base font-bold">{fmt$(coinDetails.market_data.atl.usd)}</p>
                                                <p className="text-zinc-600 font-mono text-[12px]">{fmtDate(coinDetails.market_data.atl_date.usd)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Panel: Market Pulse — terminal data */}
                                    {(() => {
                                        const md = coinDetails.market_data;
                                        const perf = [
                                            { label: "1H", v: md.price_change_percentage_1h_in_currency?.usd },
                                            { label: "24H", v: md.price_change_percentage_24h },
                                            { label: "7D",  v: md.price_change_percentage_7d },
                                            { label: "30D", v: md.price_change_percentage_30d },
                                            { label: "1Y",  v: md.price_change_percentage_1y },
                                        ];
                                        const maxAbs = Math.max(...perf.map(p => Math.abs(p.v ?? 0)), 1);
                                        const athPct = md.ath?.usd ? Math.min((md.current_price.usd / md.ath.usd) * 100, 100) : 0;
                                        const volCapRatio = md.total_volume?.usd && md.market_cap?.usd
                                            ? (md.total_volume.usd / md.market_cap.usd * 100).toFixed(2)
                                            : "N/A";
                                        const pressure = (() => {
                                            const h = md.price_change_percentage_1h_in_currency?.usd ?? 0;
                                            const d = md.price_change_percentage_24h ?? 0;
                                            if (h > 1 && d > 2) return { txt: "STRONG BUY ▲▲", cls: "text-emerald-400" };
                                            if (h > 0 && d > 0) return { txt: "BULLISH ▲", cls: "text-emerald-500" };
                                            if (h < -1 && d < -2) return { txt: "STRONG SELL ▼▼", cls: "text-red-400" };
                                            if (h < 0 && d < 0) return { txt: "BEARISH ▼", cls: "text-red-500" };
                                            return { txt: "NEUTRAL ─", cls: "text-zinc-400" };
                                        })();
                                        return (
                                            <div className="bg-black/60 rounded-xl p-3 border border-white/[0.04]">
                                                <p className="text-[11px] tracking-[0.2em] text-zinc-500 font-mono mb-2 uppercase">Market Pulse</p>
                                                {/* Performance bar chart */}
                                                <div className="space-y-[5px] mb-2">
                                                    {perf.map(({ label, v }) => {
                                                        const pct = v ?? 0;
                                                        const pos = pct >= 0;
                                                        const barW = `${Math.min((Math.abs(pct) / maxAbs) * 100, 100)}%`;
                                                        return (
                                                            <div key={label} className="flex items-center gap-2">
                                                                <span className="text-zinc-600 font-mono text-[10px] w-7 shrink-0">{label}</span>
                                                                <div className="flex-1 h-[4px] bg-zinc-900 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${pos ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: barW }} />
                                                                </div>
                                                                <span className={`font-mono text-[11px] w-14 text-right shrink-0 ${pos ? "text-emerald-400" : "text-red-400"}`}>
                                                                    {v == null ? "N/A" : `${pos ? "+" : ""}${pct.toFixed(2)}%`}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {/* ATH proximity bar */}
                                                <div className="mb-2">
                                                    <div className="flex justify-between mb-0.5">
                                                        <span className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase">vs ATH</span>
                                                        <span className="text-zinc-300 font-mono text-[11px]">{athPct.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-900 rounded-full h-[4px]">
                                                        <div className="bg-amber-400 h-[4px] rounded-full" style={{ width: `${athPct}%` }} />
                                                    </div>
                                                </div>
                                                {/* Key metrics */}
                                                <div className="border-t border-white/5 pt-2 space-y-[4px]">
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Vol / Cap</span>
                                                        <span className="text-white font-mono text-[12px]">{volCapRatio}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Pressure</span>
                                                        <span className={`font-mono text-[11px] ${pressure.cls}`}>{pressure.txt}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Panel: Quick Snapshot */}
                                    <div className="bg-black/60 rounded-xl p-4 border border-white/[0.04]">
                                        <p className="text-[12px] tracking-[0.2em] text-zinc-500 font-mono mb-3 uppercase">Snapshot</p>
                                        <Row label="Symbol" value={coinDetails.symbol.toUpperCase()} />
                                        <Row label="CMC Rank" value={`#${coinDetails.market_cap_rank}`} />
                                        <Row label="24h Price Δ" value={fmt$(coinDetails.market_data.price_change_24h)} valueClass={`font-mono text-[12px] ${coinDetails.market_data.price_change_24h >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                                        <Row label="FDV / Mkt Ratio"
                                            value={coinDetails.market_data.market_cap_fdv_ratio != null
                                                ? coinDetails.market_data.market_cap_fdv_ratio.toFixed(4)
                                                : "N/A"} />
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                ) : (
                    /* ── LIST VIEW ── */
                    <>
                        <div className="p-4 border-b border-transparent bg-black/20 shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search coins or tokens..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                />
                                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                            {loading && cryptoData.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-2 border-zinc-800 border-t-cyan-500 rounded-full animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="p-6">
                                    <div className="bg-red-500/10 border border-red-500/20 px-4 py-4 rounded-xl text-center font-mono">
                                        <p className="text-red-400 text-sm">[ERROR] {error}</p>
                                        <button onClick={fetchCryptoData} className="mt-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded text-xs font-mono transition-colors">RETRY</button>
                                    </div>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="flex items-center justify-center py-20 font-mono text-zinc-600 text-sm">
                                    No results for "{searchQuery}"
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
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
                                                const pc1h = coin.price_change_percentage_1h_in_currency ?? 0;
                                                const pc24h = coin.price_change_percentage_24h ?? 0;
                                                const pc7d = coin.price_change_percentage_7d_in_currency ?? 0;
                                                const chartData = coin.sparkline_in_7d?.price?.map((price, i) => ({ value: price, i })) || [];
                                                const clr = pc7d >= 0 ? "#10b981" : "#ef4444";
                                                return (
                                                    <tr key={`${coin.id}-${index}`}
                                                        className="border-b border-white/5 hover:bg-white/10 hover:backdrop-blur-sm transition-all cursor-pointer"
                                                        onClick={() => handleCoinClick(coin)}>
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
                                                        <td className="px-4 py-2 text-right text-white font-semibold">{formatPrice(coin.current_price)}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <span className={`font-semibold ${pc1h >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                                {pc1h === 0 ? "N/A" : <>{pc1h >= 0 ? "+" : ""}{pc1h.toFixed(2)}%</>}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <span className={`font-semibold ${pc24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                                {pc24h === 0 ? "N/A" : <>{pc24h >= 0 ? "+" : ""}{pc24h.toFixed(2)}%</>}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <span className={`font-semibold ${pc7d >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                                {pc7d === 0 ? "N/A" : <>{pc7d >= 0 ? "+" : ""}{pc7d.toFixed(2)}%</>}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="w-32 h-12 mx-auto">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                                                                        <defs>
                                                                            <linearGradient id={`g-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                                <stop offset="0%" stopColor={clr} stopOpacity={0.3} />
                                                                                <stop offset="100%" stopColor={clr} stopOpacity={0} />
                                                                            </linearGradient>
                                                                        </defs>
                                                                        <YAxis domain={["auto", "auto"]} hide />
                                                                        <Area type="monotone" dataKey="value" stroke={clr} strokeWidth={1.5} fill={`url(#g-${coin.id})`} isAnimationActive={false} dot={false} />
                                                                    </AreaChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-slate-300">${Math.round(coin.market_cap).toLocaleString()}</td>
                                                        <td className="px-4 py-2 text-right text-slate-300">${Math.round(coin.total_volume).toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
