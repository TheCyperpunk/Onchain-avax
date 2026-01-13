$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\app\page.tsx"
$content = Get-Content $filePath -Raw

$oldText = '<ProfileModal onClose={() => setShowProfileModal(false)} />'
$newText = @'
<ProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
          totalSIPs={allSIPs.length} 
          totalInvested={totalPortfolioValue} 
          totalExecuted={totalExecutedAmount} 
        />
'@

$content = $content.Replace($oldText, $newText)
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "ProfileModal props fixed successfully!"
