"use client";

import type { ReactNode } from "react";

interface HeaderNavButtonProps {
  isEnabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

export default function HeaderNavButton({ isEnabled, onClick, children }: HeaderNavButtonProps) {
  return <button onClick={onClick} disabled={!isEnabled} className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isEnabled ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}>{children}</button>;
}
