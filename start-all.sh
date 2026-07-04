#!/bin/bash

# Start both patient and doctor frontend applications
echo "Starting Doctor Appointment System..."
echo ""

# Check if node_modules exists in both folders
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing patient frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "doctor-frontend/node_modules" ]; then
    echo "Installing doctor frontend dependencies..."
    cd doctor-frontend
    npm install
    cd ..
fi

echo ""
echo "=========================================="
echo "Starting Patient Frontend on port 3000..."
echo "=========================================="
cd frontend
npm start &
PATIENT_PID=$!

sleep 3

echo ""
echo "=========================================="
echo "Starting Doctor Frontend on port 3001..."
echo "=========================================="
cd ../doctor-frontend
npm start &
DOCTOR_PID=$!

echo ""
echo "=========================================="
echo "Both frontends are starting!"
echo "=========================================="
echo "Patient Frontend: http://localhost:3000"
echo "Doctor Frontend:  http://localhost:3001"
echo ""
echo "Backend should be running on http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $PATIENT_PID $DOCTOR_PID
