$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\app\page.tsx"
$content = Get-Content $filePath -Raw

# Find and replace the Dashboard modal section
$oldDashboard = @'
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
            <Dashboard
              totalSIPs={allSIPs.length}
              totalInvested={totalPortfolioValue}
              activeSIPs={allSIPs.map((sip, index) => {
                const formatted = formatSIPData(sip);
                return {
                  id: sip.poolName || `sip-${index}`,
                  tokenName: "AVAX",
                  totalInvested: formatted?.totalAmount || "0",
                  currentValue: formatted?.executedAmount || "0",
                  progress: formatted?.progress || 0,
                  nextExecution: formatted?.nextExecution?.toLocaleDateString() || "N/A",
                  status: "active" as const
                };
              })}
            />
          </div>
        </div>
      )}
'@

$newDashboard = @'
      {showDashboard && (
        <Dashboard
          isOpen={showDashboard}
          onClose={() => setShowDashboard(false)}
          totalSIPs={allSIPs.length}
          totalInvested={totalPortfolioValue}
          activeSIPs={allSIPs.map((sip, index) => {
            const formatted = formatSIPData(sip);
            return {
              id: sip.poolName || `sip-${index}`,
              tokenName: "AVAX",
              totalInvested: formatted?.totalAmount || "0",
              currentValue: formatted?.executedAmount || "0",
              progress: formatted?.progress || 0,
              nextExecution: formatted?.nextExecution?.toLocaleDateString() || "N/A",
              status: "active" as const
            };
          })}
        />
      )}
'@

$content = $content.Replace($oldDashboard, $newDashboard)
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Dashboard props in page.tsx updated successfully!"
