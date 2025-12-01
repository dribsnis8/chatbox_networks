@echo off
echo Starting server...

REM Start the server
start cmd /k "node server/server.js"

timeout /t 2 >nul

echo Opening index.html in Chrome (normal)...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "%cd%\client\index.html"

echo Opening index.html in Chrome Incognito...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --incognito "%cd%\client\index.html"

pause
