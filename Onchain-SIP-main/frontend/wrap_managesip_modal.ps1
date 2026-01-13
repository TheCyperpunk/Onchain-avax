$filePath = "c:\Users\sangeeth karunakaran\Downloads\Onchain-avax\Onchain-SIP-main\frontend\components\ManageSIP.tsx"
$lines = Get-Content $filePath
$newLines = @()
$inserted = $false

for($i=0; $i -lt $lines.Count; $i++) {
    # Check if we're at the return statement (line 45)
    if($lines[$i] -match '^\s*return \(' -and -not $inserted) {
        # Add the modal wrapper before the existing content
        $newLines += '    if (!isOpen) return null;'
        $newLines += ''
        $newLines += '    return ('
        $newLines += '        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">'
        $newLines += '            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl w-[95vw] max-w-[1600px] min-h-[90vh] max-h-[95vh] overflow-hidden border border-white/20 shadow-2xl">'
        $newLines += '                {/* Header with Close Button */}'
        $newLines += '                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">'
        $newLines += '                    <h2 className="text-3xl font-bold text-white">Manage SIPs</h2>'
        $newLines += '                    <button'
        $newLines += '                        onClick={onClose}'
        $newLines += '                        className="text-slate-400 hover:text-white text-3xl font-bold transition-colors"'
        $newLines += '                    >'
        $newLines += '                        ×'
        $newLines += '                    </button>'
        $newLines += '                </div>'
        $newLines += ''
        $newLines += '                {/* Scrollable Content */}'
        $newLines += '                <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 100px)" }}>'
        $inserted = $true
        # Skip the original return ( line
        continue
    }
    
    $newLines += $lines[$i]
}

# Now we need to close the modal wrapper divs at the end
# Find the last closing div and add our closing divs before the final closing parenthesis
$finalLines = @()
for($i=0; $i -lt $newLines.Count; $i++) {
    $finalLines += $newLines[$i]
    # Check if this is near the end (last few lines) and we find the closing div
    if($i -gt ($newLines.Count - 5) -and $newLines[$i] -match '^\s*\);$') {
        # Insert closing divs before this line
        $finalLines[$finalLines.Count - 1] = '                </div>'
        $finalLines += '            </div>'
        $finalLines += '        </div>'
        $finalLines += '    );'
        break
    }
}

# Add any remaining lines
for($j=$i+1; $j -lt $newLines.Count; $j++) {
    $finalLines += $newLines[$j]
}

Set-Content -Path $filePath -Value $finalLines
Write-Host "ManageSIP modal wrapper added successfully!"
