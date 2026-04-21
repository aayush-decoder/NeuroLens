# PowerShell script to test /api/translate endpoint

$baseUrl = "http://localhost:3000"  # Change if your dev server runs on different port

Write-Host "Testing /api/translate endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic translation to Hindi (default)
Write-Host "Test 1: Basic Hindi translation" -ForegroundColor Yellow
$body1 = @{
    text = "The archipelago [group of islands] has sovereignty [supreme authority] over the territory."
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "$baseUrl/api/translate" -Method Post -Body $body1 -ContentType "application/json"
Write-Host "Input:  The archipelago [group of islands] has sovereignty [supreme authority]" -ForegroundColor Gray
Write-Host "Output: $($response1.translatedText)" -ForegroundColor Green
Write-Host "Translations applied: $($response1.translationsApplied)" -ForegroundColor Gray
Write-Host ""

# Test 2: Translation to French
Write-Host "Test 2: French translation" -ForegroundColor Yellow
$body2 = @{
    text = "The paramilitary [semi-military force] conducted operations."
    language = "french"
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "$baseUrl/api/translate" -Method Post -Body $body2 -ContentType "application/json"
Write-Host "Input:  The paramilitary [semi-military force] conducted operations." -ForegroundColor Gray
Write-Host "Output: $($response2.translatedText)" -ForegroundColor Green
Write-Host "Language: $($response2.language)" -ForegroundColor Gray
Write-Host ""

# Test 3: Long phrase (should NOT be translated - 5+ words)
Write-Host "Test 3: Long phrase (should skip translation)" -ForegroundColor Yellow
$body3 = @{
    text = "The concept [this is a very long explanation with many words] is complex."
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "$baseUrl/api/translate" -Method Post -Body $body3 -ContentType "application/json"
Write-Host "Input:  The concept [this is a very long explanation with many words] is complex." -ForegroundColor Gray
Write-Host "Output: $($response3.translatedText)" -ForegroundColor Green
Write-Host "Translations applied: $($response3.translationsApplied) (should be 0)" -ForegroundColor Gray
Write-Host ""

# Test 4: Multiple brackets
Write-Host "Test 4: Multiple brackets" -ForegroundColor Yellow
$body4 = @{
    text = "The archipelago [islands] has sovereignty [authority] and jurisdiction [legal power]."
    language = "hindi"
} | ConvertTo-Json

$response4 = Invoke-RestMethod -Uri "$baseUrl/api/translate" -Method Post -Body $body4 -ContentType "application/json"
Write-Host "Input:  The archipelago [islands] has sovereignty [authority] and jurisdiction [legal power]." -ForegroundColor Gray
Write-Host "Output: $($response4.translatedText)" -ForegroundColor Green
Write-Host "Translations applied: $($response4.translationsApplied)" -ForegroundColor Gray
Write-Host ""

# Test 5: No brackets (should return unchanged)
Write-Host "Test 5: No brackets (should return unchanged)" -ForegroundColor Yellow
$body5 = @{
    text = "This is a simple sentence without any brackets."
} | ConvertTo-Json

$response5 = Invoke-RestMethod -Uri "$baseUrl/api/translate" -Method Post -Body $body5 -ContentType "application/json"
Write-Host "Input:  This is a simple sentence without any brackets." -ForegroundColor Gray
Write-Host "Output: $($response5.translatedText)" -ForegroundColor Green
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Cyan
