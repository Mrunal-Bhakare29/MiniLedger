@echo off
REM Double-click or run from CMD. Password is typed in the PowerShell prompt, not here.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-databases.ps1"
pause
