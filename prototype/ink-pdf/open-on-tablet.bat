@echo off
title Studio5 Ink & PDF Prototype
echo.
echo Studio5 will now be available to devices on the same Wi-Fi network.
echo Keep this window open while testing from the tablet.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0tools\serve.ps1" -BindAddress 0.0.0.0
