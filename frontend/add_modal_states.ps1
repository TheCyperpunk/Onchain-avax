$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\app\page.tsx"
$content = Get-Content $filePath -Raw

# Find the line with errors state
$searchText = '  const [errors, setErrors] = useState("");'

# Add modal state variables after it
$replacement = @'
  const [errors, setErrors] = useState("");

  // Modal state variables
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showManageSIP, setShowManageSIP] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
'@

$newContent = $content.Replace($searchText, $replacement)
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Modal state variables added successfully!"
