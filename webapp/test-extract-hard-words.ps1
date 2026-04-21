# Test /api/extract-hard-words endpoint

$text = "In a rapidly evolving technological landscape, organizations must continuously adapt to new challenges while maintaining efficiency and innovation. Artificial intelligence is transforming industries by enabling smarter decision-making, automating repetitive tasks, and enhancing user experiences. However, successful implementation requires careful planning, ethical considerations, and a deep understanding of both the technology and its potential impact on society."

$body = @{
    text = $text
} | ConvertTo-Json

Write-Host "Testing /api/extract-hard-words..." -ForegroundColor Cyan
Write-Host "Text length: $($text.Length) characters" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Method POST `
        -Uri "https://aleta-stairless-nguyet.ngrok-free.dev/api/extract-hard-words" `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Source: $($response.source)" -ForegroundColor Yellow
    Write-Host "Count: $($response.count)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Hard words found:" -ForegroundColor Cyan
    $response.hardWords | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
} catch {
    Write-Host "✗ Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
