$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\app\page.tsx"
$content = Get-Content $filePath -Raw

# Define the old header (what's currently there)
$oldHeader = @'
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
'@

# Define the new header (with navigation buttons)
$newHeader = @'
      <header className="bg-black/80 backdrop-blur-md px-6 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold">
            <img src="/logo-text.png" alt="ONCHAINSIP" className="h-8 md:h-12" />
            <span className="text-xs text-slate-400">v1.0 • Avalanche Fuji Testnet</span>
          </div>

          {/* Navigation Buttons */}
          {isConnected && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDashboard(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h2v8H3v-8zm6-4h2v12H9V9zm6-6h2v18h-2V3z" />
                </svg>
                Dashboard
              </button>

              <button
                onClick={() => setShowCryptoModal(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Crypto Price
              </button>

              <button
                onClick={() => setShowManageSIP(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </button>

              <button
                onClick={() => setShowProfileModal(true)}
                disabled={!isAvaxFuji}
                className={`px-4 py-2 rounded-lg text-sm font-normal transition-all flex items-center gap-2 ${isAvaxFuji ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
            </div>
          )}

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
'@

# Replace the content
$newContent = $content -replace [regex]::Escape($oldHeader), $newHeader

# Save the file
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Navbar restored successfully!"
