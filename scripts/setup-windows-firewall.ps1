# Sree MK Food Court - Windows Firewall Rule Configurator
# Run this PowerShell script as Administrator once on the restaurant laptop.

Write-Host "=============================================================" -ForegroundColor Yellow
Write-Host " Sree MK Food Court - Configuring Windows Firewall for Wi-Fi" -ForegroundColor Yellow
Write-Host "=============================================================" -ForegroundColor Yellow

$Port = 3001
$RuleName = "Sree MK Food Court Offline Menu Server"

try {
    # Check if rule exists
    $existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Firewall rule already exists. Updating port $Port..." -ForegroundColor Cyan
        Remove-NetFirewallRule -DisplayName $RuleName
    }

    New-NetFirewallRule -DisplayName $RuleName `
                        -Direction Inbound `
                        -LocalPort $Port `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Private,Domain `
                        -Description "Allows restaurant diners on local Wi-Fi to scan QR code and open menu without internet."

    Write-Host "`n[SUCCESS] Port $Port opened for local Wi-Fi diners!" -ForegroundColor Green
    Write-Host "Diners connected to the restaurant Wi-Fi can now scan the QR code and load the menu instantly." -ForegroundColor Green
} catch {
    Write-Host "`n[ERROR] Failed to set firewall rule: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure to Run PowerShell as Administrator." -ForegroundColor Red
}

Read-Host "`nPress Enter to exit"
