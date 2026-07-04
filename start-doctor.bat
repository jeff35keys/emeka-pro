@echo off
REM Start doctor frontend only

echo Starting Doctor Frontend...
echo.

if not exist "doctor-frontend\node_modules" (
    echo Installing dependencies...
    cd doctor-frontend
    call npm install
    cd ..
)

cd doctor-frontend
call npm start
