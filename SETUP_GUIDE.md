# Complete Setup Guide - Doctor Appointment System

This guide walks you through setting up the entire Doctor Appointment System with both patient and doctor frontends.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users                                 │
├─────────────────────────────────────────────────────────┤
│  Patients        │           Doctors          │  Admin   │
│ (port 3000)      │        (port 3001)        │          │
└────────┬──────────┴────────────┬──────────────┴──────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Backend API         │
         │   (port 5000)         │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Database            │
         │   (MongoDB/Supabase)  │
         └───────────────────────┘
```

## Prerequisites

### Required Software
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MongoDB** OR Supabase account (for database)
- **Git** (optional, for version control)

### Recommended Tools
- **Visual Studio Code** (text editor)
- **Postman** (for API testing)
- **MongoDB Compass** (if using local MongoDB)

## Step-by-Step Installation

### Step 1: Clone/Download the Project

```bash
# If using git
git clone <your-repo-url>
cd emeka\ pro

# Or navigate to your project folder
cd "path/to/emeka pro"
```

### Step 2: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
# On Windows:
copy .env.example .env

# On macOS/Linux:
cp .env.example .env

# Open .env and update these values:
# - MONGODB_URI or Supabase credentials
# - JWT_SECRET (use a random string)
# - PORT=5000

# Start backend server
npm run dev
```

**✅ Backend running on:** `http://localhost:5000`

### Step 3: Set Up Patient Frontend

```bash
# Navigate to patient frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create .env file
# Windows:
copy .env.example .env

# macOS/Linux:
cp .env.example .env

# Update .env:
# REACT_APP_API_URL=http://localhost:5000/api
# PORT=3000

# Start development server
npm start
```

**✅ Patient portal running on:** `http://localhost:3000`

### Step 4: Set Up Doctor Frontend

```bash
# Navigate to doctor frontend directory (from root)
cd doctor-frontend

# Install dependencies
npm install

# Create .env file
# Windows:
copy .env.example .env

# macOS/Linux:
cp .env.example .env

# Update .env:
# REACT_APP_API_URL=http://localhost:5000/api
# PORT=3001

# Start development server
npm start
```

**✅ Doctor portal running on:** `http://localhost:3001`

## Quick Start (Using Startup Scripts)

### Windows Users

```bash
# From root directory
# Start all services at once
start-all.bat

# Or start individually
start-patient.bat   # Patient portal only
start-doctor.bat    # Doctor portal only
```

### macOS/Linux Users

```bash
# From root directory
# Start all services at once
./start-all.sh

# Or start individually
./start-patient.sh   # Patient portal only
./start-doctor.sh    # Doctor portal only
```

## Accessing the System

Once everything is running:

| Application | URL | Purpose |
|------------|-----|---------|
| **Patient Portal** | http://localhost:3000 | Patients book appointments and make payments |
| **Doctor Portal** | http://localhost:3001 | Doctors manage appointments |
| **Backend API** | http://localhost:5000 | API endpoints |
| **API Documentation** | http://localhost:5000/api/docs | Swagger API docs (if enabled) |

## Initial Testing

### Test Patient Flow

1. Go to `http://localhost:3000`
2. Click "Patient Register"
3. Fill in:
   - Name, email, password
   - Date of birth, gender
4. Click "Create Account"
5. Login with your credentials
6. Browse doctors and book an appointment

### Test Doctor Flow

1. Go to `http://localhost:3001`
2. Click "Doctor Register"
3. Fill in:
   - **Personal Info**: Name, email, password
   - **Professional Info**: Specialization, license number, fee
   - **Bank Details**: Bank name, account number, account holder name
4. Click "Create Doctor Account"
5. Login with your credentials
6. View your dashboard

### Test Payment

1. As a patient, book an appointment
2. Click "Pay Now"
3. Choose payment method:
   - **Bank Transfer**: Enter bank details and wait for confirmation
   - **Cryptocurrency**: Enter wallet address and transaction hash

## Database Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB locally (follow MongoDB docs)
# Default connection string:
MONGODB_URI=mongodb://localhost:27017/doctor-appointments
```

### Option 2: MongoDB Atlas (Cloud)

```bash
# 1. Sign up at https://www.mongodb.com/cloud/atlas
# 2. Create a cluster
# 3. Get your connection string
# 4. Update .env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-appointments
```

### Option 3: Supabase (PostgreSQL)

```bash
# 1. Sign up at https://supabase.com
# 2. Create a project
# 3. Get your credentials
# 4. Update .env:
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

## Environment Variables Reference

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/doctor-appointments
# OR Supabase
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key

# Authentication
JWT_SECRET=your_random_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Payment (optional)
STRIPE_SECRET_KEY=your_stripe_key

# Frontend URLs
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Patient Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
PORT=3000
```

### Doctor Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
PORT=3001
```

## Troubleshooting

### Port Already in Use

```bash
# Windows - Kill process on port
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux - Kill process on port
lsof -ti:3000 | xargs kill -9
```

### Cannot Connect to Backend

1. Verify backend is running: `http://localhost:5000`
2. Check `.env` files have correct `REACT_APP_API_URL`
3. Verify CORS is configured in backend
4. Check network/firewall settings

### Database Connection Error

```bash
# Check MongoDB is running
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### Module Not Found Error

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port 3000/3001 Already in Use

Update the PORT in the respective `.env` file:

```env
# Patient frontend
PORT=3002

# Doctor frontend
PORT=3003
```

## Production Deployment

### Build for Production

```bash
# Patient frontend
cd frontend
npm run build

# Doctor frontend
cd doctor-frontend
npm run build

# Backend
cd backend
npm run build  # if applicable
```

### Environment Setup for Production

```env
# Backend
NODE_ENV=production
FRONTEND_URL=https://yourapp.com

# Frontend
REACT_APP_API_URL=https://api.yourapp.com
```

### Deployment Options

- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Database**: MongoDB Atlas, AWS RDS, Supabase

## API Documentation

### Authentication Endpoints

```bash
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
PUT /api/auth/profile
```

### Doctor Endpoints

```bash
GET /api/doctors                    # Get all doctors
GET /api/doctors/:id                # Get doctor details
GET /api/doctors/profile            # Get logged-in doctor profile
PUT /api/doctors/profile            # Update doctor profile
PUT /api/doctors/availability       # Update availability
GET /api/doctors/appointments/list  # Get doctor's appointments
```

### Appointment Endpoints

```bash
POST /api/appointments/create                      # Create appointment
GET /api/appointments/available-slots              # Get available slots
GET /api/appointments/:id                          # Get appointment details
PUT /api/appointments/:id/cancel                   # Cancel appointment
PUT /api/appointments/:id/reschedule              # Reschedule appointment
PUT /api/appointments/:id/complete                # Mark as complete
```

### Payment Endpoints

```bash
POST /api/payments/bank-transfer    # Record bank transfer
POST /api/payments/crypto           # Record crypto payment
GET /api/payments/history           # Get payment history
```

## Development Tips

### Useful npm Scripts

```bash
# Development
npm start        # Start dev server
npm run dev      # Start with hot reload

# Production
npm run build    # Build for production
npm run build:prod  # Build with optimizations

# Testing
npm test         # Run tests
npm run test:coverage  # Run tests with coverage

# Linting
npm run lint     # Run ESLint
npm run lint:fix # Fix linting issues
```

### Debug Mode

Set `NODE_ENV=debug` or use Chrome DevTools:
- Press `F12` to open Developer Tools
- Go to **Sources** tab to set breakpoints
- Use **Console** tab to debug JavaScript

### API Testing with Postman

1. Open Postman
2. Create a collection "Doctor Appointment System"
3. Add requests for each endpoint:
   - Set `Authorization` header: `Bearer {token}`
   - Test different scenarios

## Support & Documentation

- **Main README**: See [README.md](./README.md)
- **Doctor Frontend**: See [doctor-frontend/README.md](./doctor-frontend/README.md)
- **Backend Documentation**: See [backend/README.md](./backend/README.md) (if exists)

## Next Steps

1. ✅ Set up all three components (backend, patient frontend, doctor frontend)
2. 🔐 Configure authentication and JWT secrets
3. 📊 Set up database (MongoDB or Supabase)
4. 💳 Configure payment methods (bank transfer, crypto)
5. 📧 Set up email notifications (optional)
6. 🚀 Deploy to production

## Key Features to Explore

### Patients
- Browse and filter doctors by specialization
- View doctor availability in real-time
- Book appointments with multiple time slots
- Make payments via bank transfer or crypto
- View appointment history
- Receive appointment reminders

### Doctors
- Complete professional profile with license
- Set availability and working hours
- View patient queue
- Manage patient appointments
- Receive payments directly to bank account
- Track consultation history

### Admin (if enabled)
- System statistics dashboard
- User management
- Appointment oversight
- Revenue analytics
- Payment verification

## Security Checklist

- [ ] Change `JWT_SECRET` to a random string
- [ ] Enable HTTPS for production
- [ ] Configure CORS properly
- [ ] Set strong database passwords
- [ ] Enable rate limiting on API
- [ ] Add input validation everywhere
- [ ] Enable CSRF protection
- [ ] Regular security audits

## Performance Optimization

- Enable caching on frontend
- Use CDN for static files
- Optimize database queries with indexes
- Implement pagination for lists
- Use lazy loading for images
- Minify CSS and JavaScript

## Additional Resources

- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Express.js Documentation](https://expressjs.com)
- [Supabase Documentation](https://supabase.com/docs)

---

**Questions?** Check the troubleshooting section or review the individual README files in each directory.

**Ready to start?** Follow the Quick Start section above!
