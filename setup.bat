@echo off
REM Backend Setup
cd backend
echo Installing backend dependencies...
npm install

echo.
echo Backend installation complete!
echo.

cd ..
cd frontend
echo Installing frontend dependencies...
npm install

echo.
echo Frontend installation complete!
echo.
cd ..

echo.
echo ============================================
echo Setup complete! You can now start the servers:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm start
echo.
echo Terminal 2 (Frontend):  
echo   cd frontend
echo   npm start
echo ============================================
pause
