# Quick Reference Guide

## 🚀 Quick Start

### Windows
```bash
start-all.bat
```

### macOS/Linux
```bash
./start-all.sh
```

Then open:
- Patient: http://localhost:3000
- Doctor: http://localhost:3001

---

## 📁 Project Structure

```
emeka pro/
├── backend/
│   ├── controllers/
│   │   ├── authController.js          ← Doctor registration updated
│   │   ├── supabasePaymentController.js ← Payment methods simplified
│   │   └── ...
│   ├── models/
│   │   ├── Doctor.js
│   │   ├── Payment.js
│   │   └── ...
│   └── server.js
│
├── frontend/                           ← Patient Portal (Port 3000)
│   ├── src/
│   │   ├── App.js                      ← Doctor routes removed
│   │   ├── pages/
│   │   │   ├── LoginPage.js            ← Patient login
│   │   │   ├── RegisterPage.js         ← Patient registration
│   │   │   ├── PaymentPage.js          ← Only bank/crypto
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── Navbar.js               ← Doctor links removed
│   │   └── services/
│   │       └── apiService.js
│   └── package.json
│
├── doctor-frontend/                    ← Doctor Portal (Port 3001) ⭐ NEW
│   ├── src/
│   │   ├── App.js                      ← Doctor-only routing
│   │   ├── pages/
│   │   │   ├── DoctorLoginPage.js      ← Doctor login ⭐ NEW
│   │   │   ├── DoctorRegisterPage.js   ← With bank details ⭐ NEW
│   │   │   └── DoctorDashboardPage.js  ← Dashboard ⭐ NEW
│   │   ├── components/
│   │   │   ├── Navbar.js               ⭐ NEW
│   │   │   └── ProtectedRoute.js       ⭐ NEW
│   │   ├── services/
│   │   │   └── apiService.js           ⭐ NEW
│   │   └── styles/
│   │       ├── Auth.css                ⭐ NEW
│   │       ├── Navbar.css              ⭐ NEW
│   │       └── Dashboard.css           ⭐ NEW
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── start-all.bat                       ⭐ NEW
├── start-patient.bat                   ⭐ NEW
├── start-doctor.bat                    ⭐ NEW
├── start-all.sh                        ⭐ NEW
├── start-patient.sh                    ⭐ NEW
├── start-doctor.sh                     ⭐ NEW
├── SETUP_GUIDE.md                      ⭐ NEW
├── IMPLEMENTATION_SUMMARY.md           ⭐ NEW
└── README.md                           ← Updated
```

---

## 🔑 Key Changes

### 1. Doctor Registration (Backend)
**File**: `backend/controllers/authController.js`
```javascript
// NEW: Doctor registration now requires bank details
const { accountNumber, bankName, accountName } = req.body;

// Validation
if (!accountNumber || !bankName || !accountName) {
  return res.status(400).json({
    message: 'Bank account details are required for doctors'
  });
}

// Store in database
await supabaseAdmin.from('doctors').insert({
  account_number: accountNumber,
  bank_name: bankName,
  account_name: accountName
});
```

### 2. Payment Methods (Frontend)
**File**: `frontend/src/pages/PaymentPage.js`
```javascript
// CHANGED: Only two payment methods now
const paymentMethod = 'bank_transfer' OR 'cryptocurrency';

// Removed:
// - 'cash'
// - 'credit_card' (Stripe)
```

### 3. Doctor Portal App
**File**: `doctor-frontend/src/App.js`
```javascript
// NEW: Doctor-only routing
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute user={user} requiredRole="doctor">
      <DoctorDashboardPage user={user} />
    </ProtectedRoute>
  } 
/>
```

### 4. Startup Scripts
**Files**: `start-all.bat`, `start-doctor.bat`, etc.
```bash
# Automatically:
# 1. Install dependencies if needed
# 2. Start services on correct ports
# 3. Show startup URLs
```

---

## 🌐 URLs Reference

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| Patient Frontend | http://localhost:3000 | 3000 | Patient portal |
| Doctor Frontend | http://localhost:3001 | 3001 | Doctor portal |
| Backend API | http://localhost:5000 | 5000 | API server |
| Database | Varies | - | MongoDB/Supabase |

---

## 📊 Data Flow

### Patient Booking Appointment
```
Patient Portal (3000)
    ↓
API: POST /api/appointments/create
    ↓
Backend (5000)
    ↓
Database (MongoDB/Supabase)
```

### Doctor Checking Payments
```
Doctor Portal (3001)
    ↓
API: GET /api/payments/history
    ↓
Backend (5000)
    ↓
Database (MongoDB/Supabase)
```

### Patient Making Payment
```
Patient Portal (3000)
    ↓
API: POST /api/payments/bank-transfer
  OR POST /api/payments/crypto
    ↓
Backend (5000)
    ↓
Database (Stores payment record)
    ↓
Doctor Portal (3001) - Views payment
```

---

## 🛠️ Maintenance Tasks

### Add New Doctor Specialization
**File**: `doctor-frontend/src/constants/doctorSpecializations.js`
```javascript
export const DOCTOR_SPECIALIZATIONS = [
  'Existing Specialization',
  'NEW Specialization'  // Add here
];
```

### Update API Base URL
**Files**: `.env` in both `frontend/` and `doctor-frontend/`
```env
REACT_APP_API_URL=http://localhost:5000/api  # For development
# or
REACT_APP_API_URL=https://api.production.com  # For production
```

### Change Payment Methods
**File**: `backend/config/database.sql`
```sql
-- Update enum type
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cryptocurrency', 'new_method');

-- Update in payments table
ALTER TABLE payments MODIFY payment_method payment_method;
```

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` in backend `.env`
- [ ] Set strong database password
- [ ] Enable HTTPS for production
- [ ] Configure CORS properly
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Enable rate limiting on API

---

## 🧪 Testing Scenarios

### Test 1: Patient Registration & Appointment Booking
1. Go to http://localhost:3000
2. Register as patient
3. Browse doctors
4. Book appointment
5. Make payment (bank transfer)

### Test 2: Doctor Registration & Dashboard
1. Go to http://localhost:3001
2. Register as doctor
   - Fill professional details
   - **Fill bank account details**
3. Login
4. View dashboard
5. Check appointments

### Test 3: Payment Verification
1. Patient makes payment
2. Doctor sees payment in portal
3. Doctor verifies payment
4. Status changes from pending to verified

---

## 🚨 Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution**: Change PORT in `.env`
```env
PORT=3002  # Use different port
```

### Issue: Cannot connect to backend
**Solution**: Check backend is running
```bash
# Should see: "Server running on http://localhost:5000"
```

### Issue: Database connection error
**Solution**: Verify `MONGODB_URI` or Supabase credentials in `.env`

### Issue: Doctor login fails
**Solution**: Ensure account has `role: 'doctor'` in database

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | System overview |
| SETUP_GUIDE.md | Complete setup instructions |
| IMPLEMENTATION_SUMMARY.md | What was implemented |
| doctor-frontend/README.md | Doctor portal details |
| backend/README.md | Backend documentation |

---

## 🎯 Key Features Summary

### Patient Features
✅ Register and login
✅ Browse doctors
✅ Book appointments
✅ Pay via bank transfer or crypto
✅ View appointment history

### Doctor Features
✅ Register with bank details
✅ Login to portal
✅ View dashboard
✅ Manage appointments
✅ Receive payments to bank account

### Payment Features
✅ Bank transfer payment
✅ Cryptocurrency payment (BTC, ETH, USDT)
✅ Payment verification
✅ Payment history tracking

---

## 🔗 API Integration Examples

### Register as Doctor
```javascript
const payload = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'secure123',
  role: 'doctor',
  specialization: 'Cardiology',
  licenseNumber: 'MD/2024/001',
  consultationFee: 5000,
  accountNumber: '1234567890',      // ⭐ Required
  bankName: 'Access Bank',           // ⭐ Required
  accountName: 'John Doe'            // ⭐ Required
};

await authService.register(payload);
```

### Record Bank Transfer Payment
```javascript
const payment = {
  appointmentId: 'apt-123',
  bankName: 'GTBank',
  accountNumber: '0987654321',
  transactionReference: 'TRF-001'
};

await paymentService.recordBankTransfer(payment);
```

### Record Crypto Payment
```javascript
const payment = {
  appointmentId: 'apt-123',
  coinType: 'Bitcoin',
  walletAddress: '1A1z7agoat...',
  transactionHash: '0x1234...',
  amountInCrypto: '0.0005'
};

await paymentService.recordCryptoPayment(payment);
```

---

## 📞 Support

**Need Help?**
1. Check SETUP_GUIDE.md for detailed instructions
2. Review IMPLEMENTATION_SUMMARY.md for what changed
3. Check backend/frontend README files
4. Review error messages in console/terminal
5. Check browser DevTools (F12) for frontend errors

---

## ✨ Summary

The system now has:
- ✅ Separate patient and doctor portals
- ✅ Doctor registration with bank details
- ✅ Simplified payment system (bank + crypto only)
- ✅ Secure role-based access
- ✅ Ready for production deployment

**Start developing now:**
```bash
# Windows
start-all.bat

# macOS/Linux
./start-all.sh
```

Enjoy! 🎉
