// components/TokenSelector.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface Token {
  value: string;
  name: string;
  logo: string;
}

const tokens: Token[] = [
  { value: 'avax', name: 'AVAX - Avalanche', logo: '/avalanche-avax-logo.png' },
  { value: 'btc', name: 'BTC - Bitcoin', logo: '/Bitcoin.svg.webp' },
  { value: 'eth', name: 'ETH - Ethereum', logo: '/Ethereum_Logo.png' },
  { value: 'sol', name: 'SOL - Solana', logo: '/solana-logo.png' }
];

export default function TokenSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(tokens[0]);

  const handleSelect = (token: Token) => {
    setSelectedToken(token);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selected Token Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800/80 border-none text-white text-sm font-semibold outline-none cursor-pointer px-4 py-2.5 rounded-lg flex items-center justify-between hover:bg-slate-700/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Image
            src={selectedToken.logo}
            alt={selectedToken.name}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span>{selectedToken.name}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg border border-slate-600/50 overflow-hidden z-50 shadow-xl">
          {tokens.map((token) => (
            <button
              key={token.value}
              onClick={() => handleSelect(token)}
              className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700/80 transition-colors text-left ${selectedToken.value === token.value ? 'bg-slate-700/50' : ''
                }`}
            >
              <Image
                src={token.logo}
                alt={token.name}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-white font-medium text-sm">{token.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
