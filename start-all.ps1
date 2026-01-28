Write-Host "Backend baslatiliyor..."
Start-Process powershell -ArgumentList "cd C:\Projeler\ajans\backend; npm run dev"

Write-Host "Frontend baslatiliyor..."
Start-Process powershell -ArgumentList "cd C:\Projeler\ajans\frontent; npm run dev"

Start-Sleep -Seconds 5

Write-Host "Cloudflare Tunnel baslatiliyor..."
cloudflared tunnel run ajans-tunnel
