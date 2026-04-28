@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo TicketOps GitHub Publish
echo ========================
echo This script builds the web bundle, commits local changes, and pushes to GitHub.
echo Render can auto-deploy from GitHub after this push if your Render service is connected.
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not available in PATH.
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd is not available in PATH.
  exit /b 1
)

call npm.cmd run build:web
if errorlevel 1 exit /b 1

if not exist ".git" (
  git init -b main
  if errorlevel 1 exit /b 1
)

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  echo.
  set /p GITHUB_REMOTE=Paste your GitHub repository URL:
  if "%GITHUB_REMOTE%"=="" (
    echo No GitHub URL provided. Stopping.
    exit /b 1
  )
  git remote add origin "%GITHUB_REMOTE%"
  if errorlevel 1 exit /b 1
)

echo.
git status --short
echo.
echo This will stage all non-ignored project changes.
set /p CONFIRM=Type PUBLISH to continue:
if /I not "%CONFIRM%"=="PUBLISH" (
  echo Cancelled.
  exit /b 0
)

set /p COMMIT_MSG=Commit message [Deploy TicketOps free stack]:
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Deploy TicketOps free stack

git add -A
if errorlevel 1 exit /b 1

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 exit /b 1
) else (
  echo Nothing new to commit.
)

for /f "usebackq delims=" %%b in (`git branch --show-current`) do set BRANCH=%%b
if "%BRANCH%"=="" set BRANCH=main

git push -u origin "%BRANCH%"
if errorlevel 1 exit /b 1

echo.
echo Published to GitHub branch: %BRANCH%
echo Next: confirm Render auto-deploy and Vercel auto-deploy in their dashboards.
endlocal
