# SilverLink: init repo and push to GitHub (run after installing Git for Windows)
# https://git-scm.com/download/win

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

$Remote = "https://github.com/MermaidLiu/THUMEM41-SilverLink.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "未找到 git。请先安装 Git for Windows 并重新打开终端。" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path ".git")) {
  git init
}

git add -A
$status = git status --porcelain
if (-not $status) {
  Write-Host "没有需要提交的更改。" -ForegroundColor Yellow
} else {
  git commit -m "Initial commit: SilverLink uni-app + FastAPI P0"
}

git branch -M main 2>$null

$hasOrigin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $Remote
} else {
  git remote set-url origin $Remote
}

Write-Host "正在推送到 origin/main …" -ForegroundColor Cyan
Write-Host "若提示登录，请使用 GitHub 账号或 Personal Access Token（HTTPS）。" -ForegroundColor Gray
git push -u origin main
