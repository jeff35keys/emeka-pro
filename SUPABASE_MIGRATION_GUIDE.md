# Supabase Migration Guide

This guide will help you migrate from MongoDB/JWT to Supabase Authentication and PostgreSQL.

## Prerequisites

- Supabase account (https://supabase.com)
- Node.js v14+
- PostgreSQL knowledge (basic)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: `doctor-appointment-system`
   - Database Password: Create a strong password
   - Region: Select closest to you
4. Wait for project to be created (3-5 minutes)
5. Save the connection string and credentials

## Step 2: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy and save:
   - `Project URL` (SUPABASE_URL)
   - `anon public key` (SUPABASE_ANON_KEY)
   - `service_role key` (SUPABASE_SERVICE_ROLE_KEY)

## Step 3: Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `backend/config/database.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Wait for all tables to be created

### Verification

After running SQL, you should see in **Table Editor**:
- users
- patients
- doctors
- doctor_availability
- doctor_breaktimes
- appointments
- payments
- payment_history
- ratings
- notifications
- audit_logs

## Step 4: Configure Environment Variables

### Backend Configuration

1. Copy `.env.supabase.example` to `.env`:
```bash
cp backend/.env.supabase.example backend/.env
```

2. Fill in the values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

1. Copy `.env.supabase.example` to `.env`:
```bash
cp frontend/.env.supabase.example frontend/.env
```

2. Fill in the values:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 5: Install Supabase Dependencies

```bash
cd backend
npm install @supabase/supabase-js
```

## Step 6: Update Backend Server

The Supabase-based routes are already created. Update your `server.js` to use them:

```javascript
const authRoutes = require('./routes/supabaseAuthRoutes');
const doctorRoutes = require('./routes/supabaseDoctorRoutes');
const appointmentRoutes = require('./routes/supabaseAppointmentRoutes');
const paymentRoutes = require('./routes/supabasePaymentRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
```

## Step 7: Enable Row Level Security (RLS)

RLS policies are already created in the SQL. To verify:

1. Go to **Authentication** → **Policies**
2. You should see policies for each table
3. Policies ensure users can only see their own data

## Step 8: Configure Email (Optional)

For sending appointment reminders:

1. Get SMTP credentials from Gmail/SendGrid
2. Add to `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## Step 9: Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Supabase connected successfully
Server running on port 5000
```

## Step 10: Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will start on http://localhost:3000

## Testing Authentication

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "role": "patient",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "password123"
  }'
```

## Database Schema Overview

### Users Table
- id (UUID, from auth)
- email (unique)
- first_name, last_name
- phone_number
- role (patient, doctor, admin)
- is_active, is_verified
- created_at, updated_at

### Patients Table (extends Users)
- id (UUID, PK)
- date_of_birth, gender
- address (JSONB)
- emergency_contact (JSONB)
- medical_history (text array)
- allergies (text array)
- insurance_provider, insurance_number
- preferred_doctor_id (FK)
- total_appointments, total_spent

### Doctors Table (extends Users)
- id (UUID, PK)
- license_number (unique)
- specialization (ENUM)
- years_of_experience
- hospital, department
- bio, education (JSONB array)
- consultation_fee, consultation_duration
- rating, total_ratings
- is_available

### Appointments Table
- id (UUID, PK)
- patient_id (FK), doctor_id (FK)
- appointment_date, start_time, end_time
- duration, reason
- consultation_fee
- status (ENUM)
- is_locked, lock_expires_at
- notes

### Payments Table
- id (UUID, PK)
- appointment_id (FK)
- patient_id (FK), doctor_id (FK)
- amount, payment_method (ENUM)
- payment_status (ENUM)
- transaction_id (unique)
- Method-specific fields (cash, bank, crypto)
- created_at, updated_at

## Indexes Created

All tables have indexes on frequently queried fields:
- users: email, role
- doctors: specialization, is_available
- appointments: patient_id, doctor_id, appointment_date, status
- payments: patient_id, doctor_id, payment_status

## Row Level Security Policies

Policies automatically restrict data access:
- Users can only view their own data
- Doctors can only see their appointments
- Patients can only see their appointments
- Public doctors list is visible to all

## API Endpoints (Updated)

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/change-password
- POST /api/auth/logout
- POST /api/auth/refresh-token

### Doctors
- GET /api/doctors
- GET /api/doctors/search
- GET /api/doctors/:id
- PUT /api/doctors/profile (doctor only)
- PUT /api/doctors/availability (doctor only)
- GET /api/doctors/stats (doctor only)

### Appointments
- GET /api/appointments/available-slots
- POST /api/appointments/create (patient only)
- GET /api/appointments/:appointmentId
- PUT /api/appointments/:appointmentId/cancel (patient only)
- PUT /api/appointments/:appointmentId/reschedule (patient only)
- PUT /api/appointments/:appointmentId/complete (doctor only)

### Payments
- POST /api/payments/cash (patient/admin)
- POST /api/payments/bank-transfer (patient)
- POST /api/payments/crypto (patient)
- GET /api/payments/history (patient)
- PUT /api/payments/:paymentId/verify-transfer (admin)
- GET /api/payments/analytics (admin)

## Troubleshooting

### "Missing Supabase configuration"
- Check .env file has all three keys
- Copy from Supabase Settings → API
- Restart backend

### "RLS violation"
- Ensure user is authenticated
- Check token is included in Authorization header
- Verify user role matches required role

### "Table not found"
- Verify SQL was executed completely
- Check database.sql was pasted correctly
- Try running SQL again

### "Token invalid"
- Ensure token is from recent login (not expired)
- Token expires in 1 hour by default
- Use refresh token to get new token

## Database Backups

Supabase automatically backs up daily. To manually backup:

1. Go to **Backups** in Supabase dashboard
2. Click **Create backup**
3. Backups are stored for 30 days

## Monitoring

Monitor your usage in Supabase dashboard:
- **Logs** → View query logs
- **Monitoring** → Database performance
- **Storage** → Database size

## Next Steps

1. Deploy backend to Heroku/Railway
2. Deploy frontend to Vercel
3. Set up CI/CD pipeline
4. Configure custom domain
5. Enable backups and monitoring
6. Set up monitoring alerts

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Project Repo: [Your GitHub URL]
- API Documentation: See README.md

---

**Version**: 2.0.0
**Last Updated**: June 22, 2026
**Status**: Ready for Production
