# PowerShell script to set Vertex AI secret from GitHub Secret
# This script helps you set the GCP_SERVICE_ACCOUNT_KEY secret in Firebase Secret Manager
# 
# Usage:
#   1. Get your service account JSON from GitHub Secrets (GCP_SERVICE_ACCOUNT_KEY)
#   2. Run this script: .\scripts\set-vertex-ai-secret.ps1
#   3. Paste the JSON when prompted

Write-Host "Setting GCP_SERVICE_ACCOUNT_KEY secret in Firebase Secret Manager..." -ForegroundColor Cyan
Write-Host ""
Write-Host "You'll need to paste your service account JSON from GitHub Secret: GCP_SERVICE_ACCOUNT_KEY" -ForegroundColor Yellow
Write-Host ""

# Check if firebase CLI is installed
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: Firebase CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Cyan
$firebaseUser = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  You may need to login first. Run: firebase login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting secret..." -ForegroundColor Cyan
Write-Host "When prompted, paste your service account JSON and press Enter" -ForegroundColor Yellow
Write-Host ""

# Set the secret (interactive mode)
firebase functions:secrets:set GCP_SERVICE_ACCOUNT_KEY --project campus-connect-sistc

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Secret set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can deploy the function:" -ForegroundColor Cyan
    Write-Host "  firebase deploy --only functions:generateVertexAIResponse --project campus-connect-sistc" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to set secret. Please check:" -ForegroundColor Red
    Write-Host "  1. You're logged in: firebase login" -ForegroundColor Yellow
    Write-Host "  2. You have permission to set secrets in the project" -ForegroundColor Yellow
    Write-Host "  3. The JSON is valid" -ForegroundColor Yellow
}
