# Supabase Implementation Checklist

## Pre-Implementation ✅

- [ ] Review SUPABASE_IMPLEMENTATION.md
- [ ] Review SUPABASE_VS_MONGODB.md
- [ ] Understand new architecture
- [ ] Understand PostgreSQL schema
- [ ] Review API changes

## Setup Phase

### Supabase Account & Project
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project
  - [ ] Name: `doctor-appointment-system`
  - [ ] Database password: Strong (save it)
  - [ ] Region: Close to users
- [ ] Wait for project initialization (3-5 min)
- [ ] Save connection string

### Get Credentials
- [ ] Go to Settings → API
- [ ] Copy `Project URL` → `SUPABASE_URL`
- [ ] Copy `anon public key` → `SUPABASE_ANON_KEY`
- [ ] Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Store credentials securely

## Database Setup

### Create Schema
- [ ] Open Supabase SQL Editor
- [ ] Create new query
- [ ] Copy entire `backend/config/database.sql`
- [ ] Paste into SQL Editor
- [ ] Run query
- [ ] Verify no errors

### Verify Tables
In **Table Editor**, verify these exist:
- [ ] users
- [ ] patients
- [ ] doctors
- [ ] doctor_availability
- [ ] doctor_breaktimes
- [ ] appointments
- [ ] payments
- [ ] payment_history
- [ ] ratings
- [ ] notifications
- [ ] audit_logs

### Verify Indexes
- [ ] All 15 indexes created
- [ ] Check performance stats

### Verify RLS Policies
In **Authentication → Policies**:
- [ ] users_select_own
- [ ] patients_select_own
- [ ] doctors_select_own
- [ ] doctors_select_public
- [ ] appointments_select_own
- [ ] appointments_select_doctor
- [ ] payments_select_own
- [ ] notifications_select_own

## Backend Configuration

### Setup Environment
- [ ] Copy `backend/.env.supabase.example` → `backend/.env`
- [ ] Set `SUPABASE_URL`
- [ ] Set `SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `NODE_ENV=development`
- [ ] Set `PORT=5000`
- [ ] Set `FRONTEND_URL=http://localhost:3000`

### Install Dependencies
```bash
cd backend
npm install @supabase/supabase-js
```
- [ ] Installation successful
- [ ] Check package.json updated

### Verify Configuration
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] See: "✅ Supabase connected successfully"
- [ ] See: "Server running on port 5000"

### Test Backend API
Register user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890",
    "role": "patient"
  }'
```
- [ ] Returns 201 Created
- [ ] Returns user object with token

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
- [ ] Returns 200 OK
- [ ] Returns token and user data

## Frontend Configuration

### Setup Environment
- [ ] Copy `frontend/.env.supabase.example` → `frontend/.env`
- [ ] Set `REACT_APP_API_URL=http://localhost:5000/api`
- [ ] Set `REACT_APP_SUPABASE_URL` (from Supabase)
- [ ] Set `REACT_APP_SUPABASE_ANON_KEY` (from Supabase)

### Install Dependencies
```bash
cd frontend
npm install
```
- [ ] Installation successful

### Start Frontend
```bash
npm start
```
- [ ] Frontend starts at http://localhost:3000
- [ ] No console errors
- [ ] Page loads successfully

### Update Imports (if needed)
- [ ] Check pages use `supabaseApiService`
- [ ] Verify token stored in localStorage
- [ ] Check Authorization header in requests

## Feature Testing

### Authentication Tests
- [ ] Register new patient account
  - Email, password set correctly
  - Patient table populated
  - Token returned
- [ ] Register new doctor account
  - License number required
  - Specialization set
  - Doctor table populated
- [ ] Login with email/password
  - Returns valid token
  - Token has correct claims
- [ ] Profile update works
  - User can update name
  - Doctor can update specialization
- [ ] Password change works
  - Old password validation
  - New password accepted

### Doctor Tests
- [ ] List all doctors
  - Returns doctor list
  - Filters work (specialization, fee, rating)
  - Pagination works
- [ ] Get doctor details
  - Shows all info
  - Shows availability
  - Shows appointments
- [ ] Search doctors
  - Specialization filter works
  - Fee filter works
  - Rating filter works
- [ ] Update doctor profile (doctor only)
  - Specialization can change
  - Consultation fee can change
  - Bio can be updated
- [ ] Update availability (doctor only)
  - Can set weekly schedule
  - Can set break times

### Appointment Tests
- [ ] Get available slots
  - Returns time slots
  - Respects doctor availability
  - Excludes booked slots
  - 30-minute intervals
- [ ] Create appointment (patient only)
  - Appointment created
  - Slot locked
  - Payment page redirects
  - Can't double-book
- [ ] View appointment details
  - Shows doctor info
  - Shows patient info
  - Shows appointment time
  - Shows amount due
- [ ] Cancel appointment (patient only)
  - 24-hour window enforced
  - Status changes to cancelled
  - Error if too late
- [ ] Reschedule appointment (patient only)
  - New time available
  - Conflicts prevented
  - Status updates
- [ ] Complete appointment (doctor only)
  - Status → completed
  - Notes saved
  - Patient can't edit

### Payment Tests
- [ ] Record cash payment
  - Amount recorded
  - Status → completed
  - Receipt generated
- [ ] Record bank transfer
  - Transaction reference saved
  - Status → pending
  - Amount pending verification
- [ ] Record crypto payment
  - Coin type saved
  - Wallet address saved
  - Transaction hash saved
  - Confirmations tracked
- [ ] Get payment history
  - Shows all patient payments
  - Filters by status
  - Filters by method
- [ ] Verify bank transfer (admin only)
  - Can mark verified
  - Can mark rejected
  - Status updates correctly

### Admin Tests
- [ ] View dashboard
  - Shows total users
  - Shows total appointments
  - Shows total revenue
- [ ] View all users
  - Lists all users
  - Shows role
  - Filtering works
- [ ] View all appointments
  - Lists all appointments
  - Date filtering works
  - Status filtering works
- [ ] View revenue reports
  - Shows by date
  - Shows by payment method
  - Shows totals

## Security Tests

### Authentication Security
- [ ] Can't access protected routes without token
- [ ] Invalid token rejected
- [ ] Expired token rejected
- [ ] Wrong role rejected (403)
- [ ] Patient can't access doctor routes
- [ ] Doctor can't access admin routes

### Data Isolation (RLS)
- [ ] Patient A can't see Patient B appointments
- [ ] Doctor A can't see Doctor B data
- [ ] Patient can't see other patient payments
- [ ] Users can only edit their own data

### Input Validation
- [ ] Email format validated
- [ ] Password minimum 6 chars
- [ ] Phone number format validated
- [ ] Dates must be future
- [ ] Negative amounts rejected

## Performance Testing

### Response Times
- [ ] Registration: < 2 sec
- [ ] Login: < 1 sec
- [ ] List doctors: < 1 sec
- [ ] Get available slots: < 1 sec
- [ ] Create appointment: < 2 sec
- [ ] Get appointments: < 1 sec

### Database Performance
- [ ] Query plans optimized
- [ ] No N+1 queries
- [ ] Indexes being used
- [ ] No slow queries in logs

## Browser Compatibility
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] Mobile browsers

## Final Verification

### Supabase Dashboard
- [ ] No errors in logs
- [ ] Connection stats normal
- [ ] Queries performing well
- [ ] Storage usage acceptable
- [ ] No RLS violations

### Backend Logs
- [ ] No error messages
- [ ] Supabase connected confirmed
- [ ] All routes accessible
- [ ] Token verification working

### Frontend
- [ ] No console errors
- [ ] No network errors
- [ ] UI responsive
- [ ] All pages load

## Production Preparation

- [ ] Update FRONTEND_URL for production domain
- [ ] Configure production environment variables
- [ ] Set up monitoring/logging
- [ ] Configure backup schedule
- [ ] Enable 2FA in Supabase
- [ ] Document deployment steps
- [ ] Create runbooks
- [ ] Plan disaster recovery

## Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] Architecture documented
- [ ] Database schema documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide complete
- [ ] Runbooks created

## Sign-Off

- [ ] All tests passing
- [ ] All features working
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Team trained
- [ ] Ready for deployment

---

## Issues Found & Resolved

### Issue 1: [Describe]
**Status**: ✅ Resolved / ⏳ Pending  
**Solution**: [Solution]

### Issue 2: [Describe]
**Status**: ✅ Resolved / ⏳ Pending  
**Solution**: [Solution]

---

**Checklist Completed By**: _______________  
**Date**: _______________  
**Sign-Off**: _______________

---

**Project Status**: Ready for Production ✅
