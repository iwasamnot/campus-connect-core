# PowerShell script to commit and push changes to GitHub
# Usage: .\scripts\commit-and-push.ps1 "Your commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "Checking git status..." -ForegroundColor Cyan
$status = git status --short

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

Write-Host "Staging all changes..." -ForegroundColor Cyan
git add -A

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m $CommitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "Failed to push to GitHub." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Failed to commit changes." -ForegroundColor Red
    exit 1
}

