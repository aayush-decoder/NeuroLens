# PowerShell script to test /api/categorize endpoint

$baseUrl = "http://localhost:3000"

Write-Host "Testing /api/categorize endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Political and Military words
Write-Host "Test 1: Mixed categories" -ForegroundColor Yellow
$body1 = @{
    words = @("sovereignty", "militia", "archipelago", "harassment", "jurisdiction")
} | ConvertTo-Json

$response1 = Invoke-RestMethod -Uri "$baseUrl/api/categorize" -Method Post -Body $body1 -ContentType "application/json"
Write-Host "Input words: sovereignty, militia, archipelago, harassment, jurisdiction" -ForegroundColor Gray
Write-Host "Source: $($response1.source)" -ForegroundColor $(if ($response1.source -eq "ai") { "Green" } else { "Yellow" })
Write-Host "Categories:" -ForegroundColor White
$response1.categories.PSObject.Properties | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Value -join ', ')" -ForegroundColor Cyan
}
Write-Host ""

# Test 2: Unknown words (should go to Other)
Write-Host "Test 2: Unknown words" -ForegroundColor Yellow
$body2 = @{
    words = @("technology", "innovation", "algorithm", "database")
} | ConvertTo-Json

$response2 = Invoke-RestMethod -Uri "$baseUrl/api/categorize" -Method Post -Body $body2 -ContentType "application/json"
Write-Host "Input words: technology, innovation, algorithm, database" -ForegroundColor Gray
Write-Host "Source: $($response2.source)" -ForegroundColor $(if ($response2.source -eq "ai") { "Green" } else { "Yellow" })
Write-Host "Categories:" -ForegroundColor White
$response2.categories.PSObject.Properties | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Value -join ', ')" -ForegroundColor Cyan
}
Write-Host ""

# Test 3: Large batch
Write-Host "Test 3: Large batch (15 words)" -ForegroundColor Yellow
$body3 = @{
    words = @(
        "sovereignty", "diplomatic", "militia", "combat",
        "archipelago", "maritime", "harassment", "vulnerability",
        "jurisdiction", "impunity", "sanctions", "insurgency",
        "coastal", "detention", "coercion"
    )
} | ConvertTo-Json

$response3 = Invoke-RestMethod -Uri "$baseUrl/api/categorize" -Method Post -Body $body3 -ContentType "application/json"
Write-Host "Input: 15 mixed words" -ForegroundColor Gray
Write-Host "Source: $($response3.source)" -ForegroundColor $(if ($response3.source -eq "ai") { "Green" } else { "Yellow" })
Write-Host "Words processed: $($response3.wordsProcessed)" -ForegroundColor Gray
Write-Host "Categories:" -ForegroundColor White
$response3.categories.PSObject.Properties | ForEach-Object {
    Write-Host "  $($_.Name) ($($_.Value.Count)): $($_.Value -join ', ')" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Green
