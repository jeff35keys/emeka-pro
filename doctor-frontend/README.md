# Doctor Frontend Portal

This is a dedicated frontend application for medical professionals to access their appointment management dashboard.

## Overview

The Doctor Frontend is a separate React application that runs on **port 3001** (different from the patient portal on port 3000). Both frontends connect to the same backend API but provide role-specific interfaces.

### Key Differences from Patient Portal

- **Dedicated Portal**: Only doctors can access `/doctor-frontend`
- **Doctor-Only Features**: Appointment management, availability scheduling, and consultation fee management
- **Separate Routes**: Doctor login/register have their own independent URLs
- **Same Backend**: Uses the same backend API as the patient portal but with doctor-specific endpoints

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

```bash
cd doctor-frontend
npm install
```

### Configuration

Create a `.env` file in the `doctor-frontend` directory:

```
REACT_APP_API_URL=http://localhost:5000/api
PORT=3001
```

### Running the Application

**Start Doctor Frontend Only:**
```bash
npm start
```
The application will open on `http://localhost:3001`

**Or use the startup script from root:**
```bash
# Windows
start-doctor.bat

# macOS/Linux
./start-doctor.sh
```

## Features

### Authentication
- **Doctor Registration**: New doctors register with professional credentials
  - Medical specialization
  - License number
  - Years of experience
  - Hospital/Clinic name
  - Consultation fee
  - **Bank Account Details** (Required)
    - Bank name
    - Account number
    - Account name

- **Doctor Login**: Secure login with email and password

### Dashboard
- View total appointments
- Specialization information
- Consultation fee display
- List of upcoming appointments

### Payment Information
- Doctors can view payments received
- Bank transfer verification status
- Cryptocurrency payment confirmations

## Project Structure

```
doctor-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   └── ProtectedRoute.js
│   ├── pages/
│   │   ├── DoctorLoginPage.js
│   │   ├── DoctorRegisterPage.js
│   │   └── DoctorDashboardPage.js
│   ├── services/
│   │   └── apiService.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── Auth.css
│   │   ├── Navbar.css
│   │   └── Dashboard.css
│   ├── constants/
│   │   └── doctorSpecializations.js
│   ├── App.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## API Integration

The doctor frontend communicates with the backend API endpoints:

### Auth Endpoints
- `POST /api/auth/register` - Doctor registration
- `POST /api/auth/login` - Doctor login
- `GET /api/auth/profile` - Get doctor profile

### Doctor Endpoints
- `GET /api/doctors/profile` - Get doctor profile
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/appointments/list` - Get doctor's appointments
- `GET /api/doctors/stats` - Get doctor statistics

### Appointment Endpoints
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/complete` - Mark appointment as complete

## Security

- **Authentication**: JWT token-based authentication
- **Role-Based Access**: Only users with `role: 'doctor'` can access this portal
- **Protected Routes**: Dashboard and other features require authentication
- **Token Storage**: Tokens stored in localStorage with automatic request inclusion

## Styling

The application uses:
- CSS custom properties for theming
- Responsive design (mobile-friendly)
- Doctor-themed colors (orange/gold accent: `#f39c12`)
- Consistent UI with the main application

### Color Scheme
- Primary: `#007bff` (Blue)
- Doctor Accent: `#f39c12` (Orange/Gold)
- Danger: `#dc3545` (Red)
- Success: `#28a745` (Green)

## Deployment

To build the application for production:

```bash
npm run build
```

This creates a `build/` directory with optimized production files.

### Environment Setup for Production
```
REACT_APP_API_URL=https://api.yourdomain.com
PORT=3001
```

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running on `http://localhost:5000`
- Check `.env` file has correct `REACT_APP_API_URL`
- Verify CORS is enabled on the backend

### Login fails
- Ensure you're using a doctor account (role: 'doctor')
- Patient accounts cannot access the doctor portal
- Check that backend is accessible

### Port 3001 already in use
- Change PORT in `.env` file
- Or kill the process using port 3001

## Integration with Patient Frontend

Both frontends are part of the same application system:

- **Patient Portal**: `http://localhost:3000`
- **Doctor Portal**: `http://localhost:3001`
- **Backend API**: `http://localhost:5000`

They share:
- Same database
- Same API backend
- User authentication system (role-based)

## Bank Account Details

When doctors register, they must provide bank details:
- **Why?**: Payments from patients are transferred to doctor's bank account
- **Storage**: Securely stored in the database
- **Use**: Used for payment processing and verification

## Payment Methods

Supported payment methods for patients paying doctors:
1. **Bank Transfer**: Direct bank-to-bank transfer
2. **Cryptocurrency**: Bitcoin, Ethereum, USDT support

## Support & Help

For issues or questions:
1. Check the [main README](../README.md)
2. Review backend API documentation
3. Check browser console for error messages
4. Ensure all environment variables are set

## License

This project is part of the Doctor Appointment System. See main LICENSE file.
