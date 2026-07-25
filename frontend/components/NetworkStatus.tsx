"use client";

export default function NetworkStatus({ isAvaxFuji }: { isAvaxFuji: boolean }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
      <div className={`w-2 h-2 rounded-full ${isAvaxFuji ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm">{isAvaxFuji ? 'Avalanche Fuji Testnet' : 'Wrong Network'}</span>
    </div>
  );
}
