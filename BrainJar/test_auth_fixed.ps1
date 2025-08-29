# Test the fixed authentication system
Write-Host "🧪 Testing FIXED Authentication System" -ForegroundColor Green

# Generate test credentials
$testEmail = "testuser$(Get-Random)@example.com"
$testUser = "testuser$(Get-Random)"
$testPassword = "password123"

Write-Host "📝 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Username: $testUser"
Write-Host "   Email: $testEmail"
Write-Host "   Password: $testPassword"

Write-Host ""
Write-Host "Step 1: Testing Signup" -ForegroundColor Cyan

$signupData = @{
    username = $testUser
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $signupResult = Invoke-RestMethod -Uri "http://localhost:8080/auth/signup" -Method POST -ContentType "application/json" -Body $signupData -TimeoutSec 10
    Write-Host "✅ Signup Successful!" -ForegroundColor Green
    Write-Host "   User ID: $($signupResult.id)"
    Write-Host "   Username: $($signupResult.username)"
    Write-Host "   Email: $($signupResult.email)"
} catch {
    Write-Host "❌ Signup Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Testing Login" -ForegroundColor Cyan

$loginData = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResult = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginData -TimeoutSec 10
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "   User ID: $($loginResult.user.id)"
    Write-Host "   Username: $($loginResult.user.username)"
    Write-Host "   Token Length: $($loginResult.token.Length) characters"
    Write-Host "   Token Preview: $($loginResult.token.Substring(0, [Math]::Min(30, $loginResult.token.Length)))..."
} catch {
    Write-Host "❌ Login Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 All Authentication Tests Passed!" -ForegroundColor Green
