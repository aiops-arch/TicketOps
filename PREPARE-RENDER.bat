@echo off
setlocal
cd /d "%~dp0"

echo.
echo TicketOps Render Preparation
echo ============================
echo Render deployment is GitHub-based for this project.
echo This script verifies the local build and prints the Render settings.
echo.

call npm.cmd run build:web
if errorlevel 1 exit /b 1

echo.
echo render.yaml is ready.
echo.
echo Render Web Service settings:
echo   Runtime: Node
echo   Build Command: npm install ^&^& npm run build:web
echo   Start Command: npm start
echo.
echo Required Render environment variables:
echo   NODE_ENV=production
echo   REQUIRE_SUPABASE=true
echo   SUPABASE_URL=your Supabase project URL
echo   SUPABASE_SERVICE_ROLE_KEY=your Supabase service role key
echo.
echo After GitHub push, connect this repo in Render or use the Render Blueprint.
echo Then copy the Render URL into Vercel as TICKETOPS_API_BASE.
endlocal
