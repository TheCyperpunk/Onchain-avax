"use client";

import Confetti from "react-confetti";

interface TransactionStatusOverlayProps {
  message: string | null;
  isSuccess: boolean;
  width: number;
  height: number;
}

export default function TransactionStatusOverlay({ message, isSuccess, width, height }: TransactionStatusOverlayProps) {
  if (!message || !isSuccess) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] pointer-events-none">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />
      </div>
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out animate-in slide-in-from-top-4 fade-in">
        <div className="relative">
          <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-[90%] h-full bg-[#8e8e8e] rounded-xl -z-20" />
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-[95%] h-full bg-[#a3a3a3] rounded-xl -z-10" />
          <div className="bg-[#b5b5b5] rounded-xl p-3 min-w-[280px] max-w-sm flex flex-col gap-1 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-white text-emerald-500 shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-gray-800 text-xs font-bold uppercase tracking-wider">SUCCESS</span>
              </div>
              <span className="text-gray-600 text-[10px] font-medium mt-0.5">Just now</span>
            </div>
            <div className="pt-0.5 pl-1"><p className="text-gray-900 font-bold text-sm">{message}</p></div>
          </div>
        </div>
      </div>
    </>
  );
}
