param(
    [int]$Port = 5001
)

Write-Host "Starting http-server on port $Port..." -ForegroundColor Cyan
npx http-server -p $Port .
