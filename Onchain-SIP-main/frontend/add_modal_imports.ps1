$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\app\page.tsx"
$content = Get-Content $filePath -Raw

# Add imports after the existing imports
$importSearch = 'import { useSIPContract, formatSIPData, generatePoolName, getTotalPortfolioValue, getTotalExecutedAmount } from "../hooks/useSIPContract";'
$importReplace = @'
import { useSIPContract, formatSIPData, generatePoolName, getTotalPortfolioValue, getTotalExecutedAmount } from "../hooks/useSIPContract";
import Dashboard from "../components/Dashboard";
import CryptoPriceModal from "../components/CryptoPriceModal";
import ManageSIP from "../components/ManageSIP";
import ProfileModal from "../components/ProfileModal";
'@

$content = $content.Replace($importSearch, $importReplace)
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Modal imports added successfully!"
