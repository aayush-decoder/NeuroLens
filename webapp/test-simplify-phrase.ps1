# Test /api/simplify-phrase endpoint

$apiUrl = "https://aleta-stairless-nguyet.ngrok-free.dev/api/simplify-phrase"

# Test case
$paragraph = "In a rapidly evolving technological landscape, organizations must continuously adapt to new challenges while maintaining efficiency and innovation. Artificial intelligence is transforming industries by enabling smarter decision-making, automating repetitive tasks, and enhancing user experiences. However, successful implementation requires careful planning, ethical considerations, and a deep understanding of both the technology and its potential impact on society."

$phrase = "successful implementation requires careful planning, ethical considerations, and a deep understanding"

Write-Host "Testing /api/simplify-phrase..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Paragraph:" -ForegroundColor Yellow
Write-Host $paragraph -ForegroundColor Gray
Write-Host ""
Write-Host "Phrase to simplify:" -ForegroundColor Yellow
Write-Host "`"$phrase`"" -ForegroundColor White
Write-Host "Length: $($phrase.Length) characters" -ForegroundColor Gray
Write-Host ""

$body = @{
    paragraph = $paragraph
    phrase = $phrase
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Method POST `
        -Uri $apiUrl `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Original Phrase:" -ForegroundColor Cyan
    Write-Host "`"$($response.originalPhrase)`"" -ForegroundColor White
    Write-Host "Length: $($response.originalLength) characters" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Simplified Phrase:" -ForegroundColor Cyan
    Write-Host "`"$($response.simplifiedPhrase)`"" -ForegroundColor White
    Write-Host "Length: $($response.simplifiedLength) characters" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Explanation:" -ForegroundColor Cyan
    Write-Host $response.explanation -ForegroundColor White
    Write-Host ""
    Write-Host "Metadata:" -ForegroundColor Yellow
    Write-Host "Source: $($response.source)" -ForegroundColor Gray
    $lengthChange = $response.simplifiedLength - $response.originalLength
    $percentChange = [math]::Round((($response.simplifiedLength / $response.originalLength - 1) * 100), 1)
    Write-Host "Length change: $lengthChange characters ($percentChange%)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
