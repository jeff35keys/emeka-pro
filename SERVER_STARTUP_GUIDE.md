# Server Startup Guide

## Prerequisites
- Node.js installed (check: `node --version`)
- npm installed (check: `npm --version`)
- Supabase credentials (you'll add these later)

## ❌ Issue Detected
npm install seems to be hanging in the terminal. Follow these manual steps:

## 🚀 Option 1: Run Setup Script

1. **Navigate to project root:**
   ```
   cd c:\Users\USER\Desktop\emeka pro
   ```

2. **Run the setup script:**
   ```
   .\setup.bat
   ```
   
   This will:
   - Install backend dependencies
   - Install frontend dependencies
   - Show you how to start the servers

---

## 🚀 Option 2: Manual Setup

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 3: Update Backend Environment (.env)
Edit `backend/.env` and replace these placeholders with your Supabase credentials:

```
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

**To get credentials:**
1. Go to https://supabase.com
2. Create a new project (or use existing)
3. Go to Settings → API
4. Copy the values and paste into `.env`

### Step 4: Update Frontend Environment (.env)
Edit `frontend/.env` and replace:

```
REACT_APP_SUPABASE_URL=your_actual_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_actual_anon_key
```

---

## ▶️ Starting the Servers

### Terminal 1: Start Backend Server
```bash
cd backend
npm start
```

**Expected output:**
```
> doctor-appointment-backend@1.0.0 start
> node server.js

✅ Supabase connected successfully
Server running on port 5000
```

### Terminal 2: Start Frontend Server (New Terminal Window)
```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!
Compiled with warnings.

Local:            http://localhost:3000
```

---

## ✅ Verification

1. **Backend API Test:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Expected response:
   ```json
   {"status":"Server is running","timestamp":"2024-06-22..."}
   ```

2. **Frontend Access:**
   - Open: http://localhost:3000
   - You should see the application UI

---

## 🆘 Troubleshooting

### Issue: "Cannot find module 'express'"
- **Solution:** Run `npm install` in the backend directory first

### Issue: Supabase connection fails
- **Check:** Your `.env` file has correct credentials
- **Verify:** SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are filled

### Issue: Port 5000 already in use
- **Solution 1:** Kill process using port 5000
  ```bash
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```
- **Solution 2:** Change port in `backend/.env`
  ```
  PORT=5001
  ```

### Issue: npm install still hanging
- Try: `npm install --no-optional`
- Or: `npm install --legacy-peer-deps`

---

## 📋 File Structure After Setup

```
backend/
├── node_modules/          ← Created after npm install
├── .env                   ← Created (with your credentials)
├── server.js              ← Updated to use Supabase
├── config/
│   └── supabase.js       ← Supabase client
├── routes/
│   ├── supabaseAuthRoutes.js
│   ├── supabaseDoctorRoutes.js
│   ├── supabaseAppointmentRoutes.js
│   └── supabasePaymentRoutes.js
└── ...

frontend/
├── node_modules/          ← Created after npm install
├── .env                   ← Created (with URLs)
├── src/
│   └── services/
│       └── supabaseApiService.js
└── ...
```

---

## 🎯 Next Steps After Startup

1. ✅ Test authentication (register/login)
2. ✅ Test doctor listing
3. ✅ Test appointment booking
4. ✅ Test payments
5. ✅ Follow SUPABASE_IMPLEMENTATION_CHECKLIST.md for complete testing

---

**Need Help?** Check SUPABASE_MIGRATION_GUIDE.md or SUPABASE_IMPLEMENTATION_CHECKLIST.md
