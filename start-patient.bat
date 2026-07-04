@echo off
REM Start patient frontend only

echo Starting Patient Frontend...
echo.

if not exist "frontend\node_modules" (
    echo Installing dependencies...
    cd frontend
    call npm install
    cd ..
)

cd frontend
call npm start
