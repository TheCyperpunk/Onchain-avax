"use client";

import type { ReactNode } from "react";
import { formatPercentage } from "../../lib/crypto/format";

export function CryptoDataRow({ label, value, valueClass = "text-white font-mono" }: { label: string; value: ReactNode; valueClass?: string }) {
  return <div className="flex justify-between items-center py-[7px] border-b border-white/5 last:border-0"><span className="text-[13px] tracking-widest text-zinc-500 uppercase font-mono">{label}</span><span className={`text-[14px] ${valueClass}`}>{value}</span></div>;
}

export function PercentageBadge({ v }: { v: number | undefined | null }) {
  const { txt, pos } = formatPercentage(v);
  return <span className={`font-mono text-[14px] ${pos ? "text-emerald-400" : "text-red-400"}`}>{txt}</span>;
}
