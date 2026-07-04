# Quick Start Guide - Doctor Appointment System

## Overview
This is a complete MERN stack application for managing doctor appointments with role-based access and multi-channel payment support.

## Quick Setup (5 minutes)

### Prerequisites
- Node.js installed
- MongoDB running locally or MongoDB Atlas connection

### Option 1: Local Development

#### Step 1: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on: `http://localhost:5000`

#### Step 2: Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Frontend runs on: `http://localhost:3000`

### Option 2: Docker Compose
```bash
docker-compose up --build
```

## First Time Usage

1. **Register as Patient**
   - Go to `/register`
   - Select "Patient" role
   - Fill in personal details
   - Create account

2. **Register as Doctor** (Optional)
   - Go to `/register`
   - Select "Doctor" role
   - Fill in medical credentials
   - Add consultation fee
   - Create account

3. **Book Appointment**
   - Go to `/doctors` to browse
   - Click on a doctor to view details
   - Click "Book Appointment"
   - Select date and time
   - Choose payment method
   - Complete payment

4. **Access Dashboard**
   - After login, visit `/dashboard`
   - View your appointments
   - Manage bookings

5. **Admin Access**
   - Register with admin credentials
   - Access `/admin` dashboard
   - View system statistics
   - Manage users and payments

## Default Test Credentials

### Test Patient Account
- Email: patient@test.com
- Password: password123

### Test Doctor Account
- Email: doctor@test.com
- Password: password123

### Test Admin Account
- Email: admin@test.com
- Password: password123

## Key Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Doctors
- `GET /api/doctors` - List all doctors
- `GET /api/doctors/:id` - Doctor details
- `GET /api/doctors/search?specialization=...` - Search doctors

### Appointments
- `POST /api/appointments/create` - Book appointment
- `GET /api/appointments/available-slots` - Check availability
- `PUT /api/appointments/:id/cancel` - Cancel appointment

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/cash` - Record cash payment
- `POST /api/payments/bank-transfer` - Record bank transfer
- `POST /api/payments/crypto` - Record crypto payment

## Features Checklist

✅ User Registration & Authentication
✅ Role-Based Access Control (Patient, Doctor, Admin)
✅ Doctor Profile & Availability Management
✅ Real-Time Appointment Booking
✅ Slot Locking (Prevents Double-Booking)
✅ Multiple Payment Methods:
  - Cash Payment
  - Bank Transfer with Verification
  - Cryptocurrency Support
✅ Appointment Management (View, Reschedule, Cancel)
✅ Admin Dashboard & Analytics
✅ Payment Tracking & Reports
✅ Responsive Design
✅ JWT Authentication
✅ MongoDB Integration
✅ Docker Support

## Troubleshooting

### Backend won't start
- Ensure MongoDB is running
- Check .env file is configured
- Check port 5000 is available

### Frontend won't start
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is available
- Clear browser cache

### Database Connection Error
- Verify MongoDB is running
- Check MONGODB_URI in .env
- For MongoDB Atlas: ensure IP whitelist is configured

### Payment Features Not Working
- Check Stripe keys in .env (for credit card)
- Ensure proper cryptocurrency wallet addresses

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Deployment

### Deploy to Heroku (Backend)
```bash
cd backend
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

### Deploy to Vercel (Frontend)
```bash
cd frontend
vercel
```

## Project Structure Overview

```
doctor-appointment-system/
├── backend/
│   ├── models/          - MongoDB schemas
│   ├── controllers/     - Business logic
│   ├── routes/          - API endpoints
│   ├── middleware/      - Auth, validation
│   ├── config/          - Settings
│   └── server.js        - Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  - React components
│   │   ├── pages/       - Page components
│   │   ├── services/    - API calls
│   │   └── styles/      - CSS files
│   ├── public/          - Static assets
│   └── package.json
│
└── docker-compose.yml   - Docker setup
```

## API Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication

Uses JWT (JSON Web Tokens). Include in headers:
```
Authorization: Bearer <token>
```

Tokens expire in 7 days.

## Security Notes

- All passwords are hashed with bcrypt
- Sensitive data is not exposed in API responses
- CORS enabled for frontend
- Input validation on all endpoints
- Database indexes for performance

## Next Steps

1. Customize styling to match your brand
2. Add email notifications
3. Implement SMS reminders
4. Add telemedicine integration
5. Setup payment gateway (Stripe)
6. Deploy to production

## Support

For issues or questions:
1. Check the README.md
2. Review error messages
3. Check browser console
4. Check server logs

## License

MIT License - Free for educational and commercial use

---

**Last Updated:** 2024
**Version:** 1.0.0
