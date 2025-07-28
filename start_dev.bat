@echo off
title Server Starter

echo Checking for existing server processes...

taskkill /F /FI "WINDOWTITLE eq Frontend (Vite)*" /T > nul
taskkill /F /FI "WINDOWTITLE eq Backend (Node)*" /T > nul

echo Starting frontend server (Vite) in a new window...
start "Frontend (Vite)" /D "CNA_APP" cmd /k "npm run dev"

echo Starting backend server (Node) in a new window...
start "Backend (Node)" /D "backend" cmd /k "npm start"

echo Successful!!!
