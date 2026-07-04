#!/bin/bash

# Start doctor frontend only

echo "Starting Doctor Frontend on port 3001..."
cd doctor-frontend
npm install &> /dev/null
npm start
