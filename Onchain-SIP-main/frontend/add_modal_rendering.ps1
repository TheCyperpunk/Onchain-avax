$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\app\page.tsx"
$content = Get-Content $filePath -Raw

# Find the closing </div> before </main>
$searchText = '      </main>
    </div>
  );
}'

# Add modal rendering before the closing div
$replacement = @'
      </main>

      {/* Modal Components */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-7xl">
            <button
              onClick={() => setShowDashboard(false)}
              className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
              <Dashboard
                totalSIPs={displaySIPs.length}
                totalInvested={totalPortfolioValue}
                activeSIPs={displaySIPs.map((sip, index) => {
                  const formatted = formatSIPData(sip);
                  return {
                    id: sip.poolName || `sip-${index}`,
                    tokenName: 'AVAX',
                    totalInvested: formatted?.totalAmount || '0',
                    currentValue: formatted?.executedAmount || '0',
                    progress: formatted?.progress || 0,
                    nextExecution: formatted?.nextExecution?.toLocaleDateString() || 'N/A',
                    status: 'active' as const
                  };
                })}
              />
            </div>
          </div>
        </div>
      )}

      {showCryptoModal && (
        <CryptoPriceModal onClose={() => setShowCryptoModal(false)} />
      )}

      {showManageSIP && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-7xl">
            <button
              onClick={() => setShowManageSIP(false)}
              className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
              <ManageSIP
                totalValue={totalPortfolioValue}
                activeSIPs={displaySIPs.map((sip, index) => {
                  const formatted = formatSIPData(sip);
                  return {
                    id: sip.poolName || `sip-${index}`,
                    tokenName: 'AVAX',
                    totalInvested: formatted?.totalAmount || '0',
                    currentValue: formatted?.executedAmount || '0',
                    progress: formatted?.progress || 0,
                    nextExecution: formatted?.nextExecution?.toLocaleDateString() || 'N/A',
                    status: 'active' as const
                  };
                })}
              />
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}'@

$newContent = $content.Replace($searchText, $replacement)
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Modal rendering added successfully!"
