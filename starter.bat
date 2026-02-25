@echo off

set CHROME_PATH="C:\Users\Lawrenzo\AppData\Local\Chromium\Application\chrome.exe"

REM === Window 1 (Primary Monitor) ===
start "" %CHROME_PATH% ^
--new-window ^
--window-position=0,0 ^
--window-size=1920,1080 ^
--autoplay-policy=no-user-gesture-required ^
--kiosk ^
--user-data-dir="C:\chromium-profile-1" ^
http://localhost:3000

timeout /t 2 >nul

REM === Window 2 (Second Monitor) ===
start "" %CHROME_PATH% ^
--new-window ^
--window-position=1920,0 ^
--window-size=1920,1080 ^
--autoplay-policy=no-user-gesture-required ^
--kiosk ^
--user-data-dir="C:\chromium-profile-2" ^
http://localhost:3000/second


@REM if above window
--window-position=0,-1080
@REM @ if not 100% scale
--force-device-scale-factor=1