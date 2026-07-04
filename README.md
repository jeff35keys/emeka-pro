# Doctor Appointment Booking System

A full-stack web application for managing doctor appointments with support for multiple payment methods and role-based access control.

## Tech Stack

- **Frontend**: React.js, React Router, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Cash, Bank Transfer, Cryptocurrency support

## Features

### Patient Features
- Register and create patient profile
- Search and browse doctors by specialization
- View doctor availability and schedules
- Book appointments with real-time slot availability
- Cancel or reschedule appointments
- Multiple payment method support (cash, bank transfer, crypto)
- View appointment history
- Receive appointment reminders

### Doctor Features
- Register and complete professional profile
- Manage availability and schedules
- View patient queue and appointments
- Update appointment status
- Track appointment history
- Manage consultation fees

### Administrator Features
- User and doctor management
- System-wide appointment oversight
- Payment verification and tracking
- Revenue analytics and reports
- System performance monitoring

## Project Structure

```
doctor-appointment-system/
├── backend/
│   ├── models/           # MongoDB schemas
│   ├── controllers/       # Business logic
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth, validation, errors
│   ├── config/           # Configuration files
│   ├── server.js         # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── styles/       # CSS files
│   │   ├── App.js        # Root component
│   │   └── index.js      # Entry point
│   ├── public/           # Static files
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```bash
cp .env.example .env
```

4. Update .env with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/doctor-appointments
JWT_SECRET=your_secret_key
PORT=5000
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

This system has **two separate frontend applications** for patients and doctors:

#### Patient Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```
REACT_APP_API_URL=http://localhost:5000/api
PORT=3000
```

4. Start the development server:
```bash
npm start
```

The patient portal will run on `http://localhost:3000`

#### Doctor Frontend

1. Navigate to doctor-frontend directory:
```bash
cd doctor-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
```
REACT_APP_API_URL=http://localhost:5000/api
PORT=3001
```

4. Start the development server:
```bash
npm start
```

The doctor portal will run on `http://localhost:3001`

#### Running Both Frontends (Windows)

Use the startup scripts from the root directory:

```bash
# Start both frontends and install dependencies
start-all.bat

# Or start individually
start-patient.bat   # Patient portal on port 3000
start-doctor.bat    # Doctor portal on port 3001
```

#### Running Both Frontends (macOS/Linux)

```bash
# Start both frontends and install dependencies
./start-all.sh

# Or start individually
./start-patient.sh   # Patient portal on port 3000
./start-doctor.sh    # Doctor portal on port 3001
```

### Frontend Applications Overview

| Portal | URL | Users | Purpose |
|--------|-----|-------|---------|
| **Patient Portal** | `http://localhost:3000` | Patients | Book appointments, make payments, view appointment history |
| **Doctor Portal** | `http://localhost:3001` | Doctors | Manage appointments, set availability, receive payments |
| **Backend API** | `http://localhost:5000` | Both | Shared API for all operations |

**Why Two Frontends?**
- Prevents random individuals from registering as doctors
- Provides role-specific UI and features
- Better security and access control
- Cleaner user experience for each user type

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/search` - Search doctors
- `PUT /api/doctors/profile` - Update doctor profile
- `PUT /api/doctors/availability` - Update availability

### Appointments
- `POST /api/appointments/create` - Create appointment
- `GET /api/appointments/available-slots` - Get available slots
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `PUT /api/appointments/:id/reschedule` - Reschedule appointment
- `PUT /api/appointments/:id/complete` - Mark as complete

### Payments
- `POST /api/payments/create` - Create payment record
- `POST /api/payments/cash` - Record cash payment
- `POST /api/payments/bank-transfer` - Record bank transfer
- `POST /api/payments/crypto` - Record cryptocurrency payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/analytics` - Get payment analytics

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/reports/revenue` - Revenue reports

## Database Models

### User (Base Schema)
- firstName, lastName
- email (unique)
- password (hashed)
- phoneNumber
- role (patient, doctor, admin)
- isActive, isVerified

### Patient (extends User)
- dateOfBirth, gender
- address
- emergencyContact
- medicalHistory, allergies
- appointmentHistory
- paymentHistory

### Doctor (extends User)
- specialization
- licenseNumber
- yearsOfExperience
- hospital, department
- consultationFee, consultationDuration
- availability
- rating, totalRatings
- appointments

### Appointment
- patientId, doctorId
- appointmentDate, startTime, endTime
- status (scheduled, completed, cancelled, no-show)
- reason, consultationFee
- isLocked (for slot management)

### Payment
- appointmentId, patientId, doctorId
- amount, paymentMethod
- paymentStatus
- Details for each payment method:
  - Cash: receivedBy, receipt
  - Bank Transfer: bankName, transactionReference, proofImage, verificationStatus
  - Crypto: coinType, walletAddress, transactionHash

## Key Features Implementation

### Real-Time Slot Locking
Prevents double-booking by implementing a lock mechanism on appointment slots during the booking process.

### Role-Based Access Control (RBAC)
Users have different permissions based on their role (patient, doctor, admin).

### Multi-Channel Payment Tracking
Supports cash, bank transfer, and cryptocurrency payments with verification workflows.

### Responsive Design
Mobile-friendly interface that works on desktop, tablet, and mobile devices.

## Usage

### As a Patient
1. Register on the platform
2. Search for doctors by specialization
3. View doctor details and availability
4. Book an appointment
5. Choose a payment method
6. Receive confirmation and reminders

### As a Doctor
1. Register with medical credentials
2. Set your availability and schedule
3. View patient appointments
4. Update appointment status
5. Track earnings

### As an Administrator
1. Access admin dashboard
2. Manage users and doctors
3. Monitor appointments
4. Verify payments
5. View system reports

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- Error handling and logging
- Secure payment data handling

## Testing

Run tests with:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Backend Deployment (Heroku)
```bash
cd backend
heroku create your-app-name
git push heroku main
```

### Frontend Deployment (Vercel)
```bash
cd frontend
npm run build
vercel
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use for educational and commercial purposes

## Support

For issues and questions, please contact support@doctorappointment.com

## Acknowledgments

Built for Ozoro Community Hospital - Improving Healthcare Delivery Through Technology
#   e m e k a - b a c k e n d  
 