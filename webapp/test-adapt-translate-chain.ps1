# PowerShell script: Chain /api/adapt → /api/translate
# Usage:
#   .\test-adapt-translate-chain.ps1
#   .\test-adapt-translate-chain.ps1 -Language french
#   .\test-adapt-translate-chain.ps1 -Language spanish

param(
    [string]$Language = "hindi"
)

$baseUrl = "https://aleta-stairless-nguyet.ngrok-free.dev"

$inputText = "In a rapidly evolving technological landscape, organizations must continuously adapt to new challenges while maintaining efficiency and innovation. Artificial intelligence is transforming industries by enabling smarter decision-making, automating repetitive tasks, and enhancing user experiences. However, successful implementation requires careful planning, ethical considerations, and a deep understanding of both the technology and its potential impact on society. Teams that collaborate effectively and embrace learning are more likely to thrive in such dynamic environments."

Write-Host "🔄 Step 1: Calling /api/adapt..." -ForegroundColor Cyan
Write-Host "Input text length: $($inputText.Length)" -ForegroundColor Gray
Write-Host ""

# Step 1: Call /api/adapt
$adaptBody = @{
    text = $inputText
    strugglingParagraphs = @(0)
} | ConvertTo-Json

try {
    $adaptResponse = Invoke-RestMethod -Uri "$baseUrl/api/adapt" -Method Post -Body $adaptBody -ContentType "application/json"
    
    Write-Host "✅ Step 1 Complete: /api/adapt" -ForegroundColor Green
    Write-Host "Modified text length: $($adaptResponse.modifiedText.Length)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 Adapted text preview:" -ForegroundColor Yellow
    Write-Host $adaptResponse.modifiedText.Substring(0, [Math]::Min(300, $adaptResponse.modifiedText.Length)) -ForegroundColor White
    Write-Host "..." -ForegroundColor Gray
    Write-Host ""
    Write-Host ("─" * 80) -ForegroundColor DarkGray
    Write-Host ""

    # Step 2: Call /api/translate with the adapted text
    Write-Host "🔄 Step 2: Calling /api/translate (language: $Language)..." -ForegroundColor Cyan
    Write-Host ""

    $translateBody = @{
        text = $adaptResponse.modifiedText
        language = $Language
    } | ConvertTo-Json

    $translateResponse = Invoke-RestMethod -Uri "$baseUrl/api/translate" -Method Post -Body $translateBody -ContentType "application/json"

    Write-Host "✅ Step 2 Complete: /api/translate" -ForegroundColor Green
    Write-Host "Language: $($translateResponse.language)" -ForegroundColor Gray
    Write-Host "Translations applied: $($translateResponse.translationsApplied)" -ForegroundColor Gray
    Write-Host ""
    Write-Host ("─" * 80) -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "🎯 FINAL OUTPUT:" -ForegroundColor Magenta
    Write-Host ""
    Write-Host $translateResponse.translatedText -ForegroundColor White
    Write-Host ""
    Write-Host ("─" * 80) -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "✨ Pipeline completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
