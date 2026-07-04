# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                   (React.js Frontend)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   HomePage   │  │ DoctorList   │  │   Payment    │            │
│  │              │  │   Dashboard  │  │   Dashboard  │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  LoginPage   │  │ BookAppt     │  │  Admin Panel │            │
│  │ RegisterPage │  │ Appointments │  │              │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTP/REST (Axios)
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                   API GATEWAY                                    │
│           (Express.js + Middleware)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Middleware Stack:                                  │        │
│  │  • Request Logger                                   │        │
│  │  • CORS Handler                                     │        │
│  │  • JSON Parser                                      │        │
│  │  • Auth Validator (JWT)                             │        │
│  │  • Input Validator (Email, Password, etc.)         │        │
│  │  • Error Handler                                    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼────────┐ ┌──┴─────────┐ ┌─┴──────────┐
│   Auth Routes   │ │Doctor Routes│ │Appt Routes │
└────────┬────────┘ └──┬─────────┘ └─┬──────────┘
         │             │             │
         │   ┌─────────┴─────────┐   │
         │   │                   │   │
    ┌────▼───▼────────────────┬──▼─────────┬───────────────┐
    │   Auth Controller       │Doctor      │Payment        │
    │   • register()          │Controller  │Controller     │
    │   • login()             │ • search() │ • record()    │
    │   • getProfile()        │ • getById()│ • verify()    │
    │   • updateProfile()     │ • update() │ • getHistory()│
    │   • changePassword()    │            │ • analytics() │
    └────┬───────────────────┬┴────────────┴───────────────┘
         │                   │
         │   ┌───────────────┘
         │   │
         │   ▼
         │  ┌──────────────────────────────────┐
         │  │ Patient Controller               │
         │  │ • getProfile()                   │
         │  │ • updateProfile()                │
         │  │ • getAppointments()              │
         │  │ • getPayments()                  │
         │  └──────────────────────────────────┘
         │
         └──────────────────────┬────────────────────────────┐
                                │                            │
                 ┌──────────────┴────────────────┐           │
                 │                               │           │
         ┌───────▼────────────┐       ┌──────────▼──────────┐
         │ Appointment Model  │       │ Admin Controller    │
         │ • Double-booking   │       │ • getDashboard()    │
         │   prevention       │       │ • getAllUsers()     │
         │ • Slot locking     │       │ • getAllAppts()     │
         │ • Status tracking  │       │ • getReports()      │
         └───────────────────┘       └─────────────────────┘
                 │
                 │
         ┌───────▼────────────────────────────────┐
         │      MongoDB Database                  │
         ├────────────────────────────────────────┤
         │                                        │
         │  Collections:                         │
         │  ├─ users (Discriminator pattern)    │
         │  │  ├─ patients (extended)            │
         │  │  └─ doctors (extended)             │
         │  ├─ appointments                      │
         │  ├─ payments                          │
         │  └─ indexes for optimization          │
         │                                        │
         │  Indexes:                             │
         │  • (patientId, status)                │
         │  • (doctorId, appointmentDate)       │
         │  • (appointmentDate, status)         │
         │  • (paymentStatus)                   │
         │                                        │
         └────────────────────────────────────────┘
```

## Data Flow Diagrams

### Authentication Flow
```
User Input
    ▼
┌─────────────────────────┐
│ Register/Login Form     │
└────────────┬────────────┘
             ▼
┌─────────────────────────────────────┐
│ Send Credentials to /auth/register  │
│           or /auth/login             │
└────────────┬────────────────────────┘
             ▼
┌─────────────────────────────────────┐
│ authController.register()           │
│  1. Validate input                  │
│  2. Check email unique              │
│  3. Hash password (bcryptjs)        │
│  4. Save to MongoDB                 │
│  5. Generate JWT token              │
└────────────┬────────────────────────┘
             ▼
┌─────────────────────────────────────┐
│ Return token + user data            │
│ Store in localStorage               │
└─────────────────────────────────────┘
```

### Appointment Booking Flow
```
Patient Selects Doctor & Date
    ▼
┌──────────────────────────────────┐
│ GET /appointments/available-slots│
│ Check doctor's availability      │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Display available time slots     │
│ Patient selects time             │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ POST /appointments/create        │
│ Validate appointment date/time   │
│ Check for conflicts              │
│ Lock slot (10 min expiration)    │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Create appointment record        │
│ Update patient history           │
│ Generate booking confirmation    │
└────────────┬─────────────────────┘
             ▼
┌──────────────────────────────────┐
│ Redirect to Payment Page         │
│ Display amount due               │
└──────────────────────────────────┘
```

### Payment Processing Flow
```
Patient Selects Payment Method
    ▼
    ├─── CASH ──────────────────────────┐
    │    ├─ Display payment receipt       │
    │    ├─ POST /payments/cash          │
    │    └─ Mark appointment ready       │
    │                                    │
    ├─── BANK TRANSFER ─────────────────┤
    │    ├─ Display bank details         │
    │    ├─ POST /payments/bank-transfer │
    │    ├─ Upload proof image           │
    │    ├─ Set status: pending review   │
    │    └─ Admin verifies later         │
    │                                    │
    └─── CRYPTOCURRENCY ───────────────┘
         ├─ Display wallet address
         ├─ Specify coin type (BTC/ETH)
         ├─ POST /payments/crypto
         ├─ Enter transaction hash
         └─ Track blockchain confirmations

             ▼
    ┌──────────────────────┐
    │ Payment Complete     │
    │ Appointment Booked   │
    │ Confirmation Sent    │
    └──────────────────────┘
```

## Component Hierarchy

```
App
├─ Navbar (Navigation)
└─ Router
   ├─ HomePage (public)
   ├─ LoginPage (public)
   ├─ RegisterPage (public)
   ├─ DoctorListPage (public)
   ├─ DoctorDetailPage (public)
   │
   ├─ ProtectedRoute
   │  ├─ DashboardPage (patient/doctor)
   │  ├─ BookAppointmentPage (patient)
   │  ├─ AppointmentsPage (patient/doctor)
   │  ├─ PaymentPage (patient)
   │  └─ AdminDashboard (admin only)
   │
   └─ 404 Fallback
```

## Security Layers

```
┌─────────────────────────────────────┐
│  1. HTTPS/TLS (Transport Layer)     │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  2. CORS Validation                 │
│     (Origin checking)               │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  3. Request Body Validation         │
│     (Email, Phone, Password format) │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  4. JWT Authentication              │
│     (Token verification)            │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  5. Role-Based Authorization        │
│     (RBAC middleware)               │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  6. Business Logic Validation       │
│     (Date range, slot availability) │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│  7. Database Query Execution        │
│     (Index optimization)            │
└─────────────────────────────────────┘
```

## Database Schema Relationships

```
                    User (Base Schema)
                   /    |    \
                  /     |     \
           Patient    Doctor   Admin
             / \       / \
            /   \     /   \
      appts  payments appts histories


Relationships:

Patient ──┐
          ├─→ Appointment ←── Doctor
          │                    ↓
          └─→ Payment ←────────┘

Appointment ──→ Payment
Patient ───────→ Doctor (preferredDoctor)
Doctor ────────→ Hospital
Patient ───────→ EmergencyContact (embedded)
Doctor ────────→ Availability[] (embedded)
```

## Deployment Architecture

```
┌────────────────────────────────────┐
│   Development Environment          │
├────────────────────────────────────┤
│ Frontend: npm start                │
│ Backend: npm run dev               │
│ Database: MongoDB local            │
└────────────────────────────────────┘

                ▼ docker-compose up

┌────────────────────────────────────┐
│   Docker Container Architecture    │
├────────────────────────────────────┤
│ ┌──────────────┐                  │
│ │   Frontend   │                  │
│ │   Container  │──┐               │
│ └──────────────┘  │               │
│                   │               │
│ ┌──────────────┐  │               │
│ │   Backend    │──┼─────────┐     │
│ │   Container  │  │         │     │
│ └──────────────┘  │         │     │
│                   │         │     │
│ ┌──────────────┐  │         │     │
│ │   MongoDB    │◄─┴────┐    │     │
│ │   Container  │       │    │     │
│ └──────────────┘       │    │     │
│                        ▼    ▼     │
│                  docker-compose.yml
└────────────────────────────────────┘

                ▼ Deploy to cloud

┌────────────────────────────────────┐
│   Production Environment           │
├────────────────────────────────────┤
│ Frontend: Vercel                   │
│ Backend: Heroku / AWS              │
│ Database: MongoDB Atlas            │
│ CDN: CloudFlare / AWS CloudFront   │
└────────────────────────────────────┘
```

## API Request/Response Pattern

```
Request:
┌─────────────────────────────────────┐
│ POST /api/appointments/create       │
│ Headers:                            │
│ - Authorization: Bearer <token>     │
│ - Content-Type: application/json    │
│ Body:                               │
│ {                                   │
│   "doctorId": "...",                │
│   "appointmentDate": "2024-07-01",  │
│   "startTime": "10:00",             │
│   "reason": "Checkup"               │
│ }                                   │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│ Process Request:                    │
│ 1. Verify JWT token                 │
│ 2. Validate appointment date        │
│ 3. Check doctor availability        │
│ 4. Prevent double-booking           │
│ 5. Create appointment record        │
│ 6. Update related documents         │
└─────────────────────────────────────┘
              ▼
Response (Success):
┌─────────────────────────────────────┐
│ Status: 201 Created                 │
│ {                                   │
│   "success": true,                  │
│   "message": "Appointment created", │
│   "data": {                         │
│     "appointmentId": "...",         │
│     "patientId": "...",             │
│     "doctorId": "...",              │
│     "appointmentDate": "2024-07-01",│
│     "startTime": "10:00",           │
│     "endTime": "10:30",             │
│     "fee": 50,                      │
│     "status": "scheduled"           │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

Response (Error):
┌─────────────────────────────────────┐
│ Status: 400/401/403/500             │
│ {                                   │
│   "success": false,                 │
│   "message": "Error description"    │
│ }                                   │
└─────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: June 22, 2024
