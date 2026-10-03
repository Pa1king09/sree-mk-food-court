@echo off
netsh advfirewall firewall add rule name="Sree MK Food Court Port 3001" dir=in action=allow protocol=TCP localport=3001 profile=any
echo Firewall rule for Sree MK Food Court Port 3001 added successfully!
pause
