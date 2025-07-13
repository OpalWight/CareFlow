@echo off
title Server Starter

echo Starting frontend server (Vite) in a new window...
start "Frontend (Vite)" /D "CNA_APP" cmd /k "npm run dev"

echo Starting backend server (Node) in a new window...
start "Backend (Node)" /D "backend" cmd /k "npm start"

echo Successuful!!!
