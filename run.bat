@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 20 LTS or newer from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo Starting Dino Dodge multiplayer server...
start "Dino Dodge Server" cmd /k npm run server

echo Starting Dino Dodge game...
npm run dev
