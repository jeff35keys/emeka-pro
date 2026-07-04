# Doctor Appointment System - Startup Script (PowerShell)
# Run: .\start-server.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Doctor Appointment System - Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm $npmVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Installing Dependencies" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Install backend dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Push-Location "backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend installation failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Pop-Location

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend installation failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Open Terminal 1 and run:" -ForegroundColor Yellow
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Open Terminal 2 and run:" -ForegroundColor Yellow
Write-Host "    cd frontend" -ForegroundColor Gray
Write-Host "    npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Update your .env files with Supabase credentials:" -ForegroundColor Yellow
Write-Host "    backend/.env" -ForegroundColor Gray
Write-Host "    frontend/.env" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "5️⃣  Frontend will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Happy coding! 🚀" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
