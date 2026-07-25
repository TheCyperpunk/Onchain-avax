"use client";

interface PortfolioSummaryProps {
  totalPortfolioValue: string;
  totalExecutedAmount: string;
  totalSIPs: number;
}

export default function PortfolioSummary({
  totalPortfolioValue,
  totalExecutedAmount,
  totalSIPs,
}: PortfolioSummaryProps) {
  return (
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
          <p className="text-2xl font-bold text-green-500">{totalSIPs}</p>
        </div>
      </div>
    </div>
  );
}
