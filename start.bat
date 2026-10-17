@echo off
cd /d "%~dp0"
title GRE Practice Simulator (keep this window open)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  pause
  exit /b 1
)

if not exist "node_modules\vite" (
  echo Installing dependencies - one time only, needs internet...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist "dist\index.html" (
  echo Building the site - one time only...
  node scripts\release.mjs
  if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
  )
)

node server\server.mjs --open
pause
