#!/bin/bash

# Start patient frontend only

echo "Starting Patient Frontend on port 3000..."
cd frontend
npm install &> /dev/null
npm start
