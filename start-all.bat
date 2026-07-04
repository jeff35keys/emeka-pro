@echo off
REM Start both patient and doctor frontend applications

echo Starting Doctor Appointment System...
echo.

REM Check if node_modules exists in both folders
if not exist "frontend\node_modules" (
    echo Installing patient frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

if not exist "doctor-frontend\node_modules" (
    echo Installing doctor frontend dependencies...
    cd doctor-frontend
    call npm install
    cd ..
)

echo.
echo ==========================================
echo Starting Patient Frontend on port 3000...
echo ==========================================
cd frontend
start cmd /k npm start
cd ..

timeout /t 3

echo.
echo ==========================================
echo Starting Doctor Frontend on port 3001...
echo ==========================================
cd doctor-frontend
start cmd /k npm start

echo.
echo ==========================================
echo Both frontends are starting!
echo ==========================================
echo Patient Frontend: http://localhost:3000
echo Doctor Frontend:  http://localhost:3001
echo.
echo Backend should be running on http://localhost:5000
echo ==========================================
