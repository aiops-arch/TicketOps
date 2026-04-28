@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo TicketOps Supabase Setup
echo ========================
echo This script links your local project to Supabase and pushes the database schema.
echo You need your Supabase project ref from the Supabase dashboard URL.
echo Example project ref: abcdefghijklmnopqrst
echo.

where supabase >nul 2>nul
if errorlevel 1 (
  echo Supabase CLI is not installed or not available in PATH.
  echo Install it first, then run this file again:
  echo npm install -g supabase
  echo.
  echo Fallback: open Supabase SQL Editor and paste supabase\schema.sql manually.
  exit /b 1
)

if not exist "supabase\migrations" mkdir "supabase\migrations"
copy /Y "supabase\schema.sql" "supabase\migrations\20260428000000_ticketops_schema.sql" >nul

set /p PROJECT_REF=Supabase project ref:
if "%PROJECT_REF%"=="" (
  echo No project ref provided. Stopping.
  exit /b 1
)

supabase login
if errorlevel 1 exit /b 1

supabase link --project-ref "%PROJECT_REF%"
if errorlevel 1 exit /b 1

supabase db push
if errorlevel 1 exit /b 1

echo.
echo Supabase schema pushed successfully.
echo Now add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Render environment variables.
endlocal
