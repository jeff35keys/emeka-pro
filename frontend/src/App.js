import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorPatientAppointmentsPage from './pages/DoctorPatientAppointmentsPage';
import DoctorAppointmentDetailPage from './pages/DoctorAppointmentDetailPage';
import DoctorAvailabilityPage from './pages/DoctorAvailabilityPage';
import DoctorListPage from './pages/DoctorListPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PaymentPage from './pages/PaymentPage';
import NotificationCenter from './pages/NotificationCenter';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, token, refreshToken) => {
    if (!userData || !token) {
      return;
    }

    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const defaultPath = user?.role === 'doctor'
    ? '/dashboard'
    : user?.role === 'admin'
      ? '/admin'
      : '/dashboard';

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to={user ? defaultPath : '/login'} />} />
        <Route path="/home" element={<Navigate to={user ? defaultPath : '/login'} />} />
        <Route path="/doctors" element={<DoctorListPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to={defaultPath} /> : <LoginPage onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to={defaultPath} /> : <RegisterPage onRegister={handleLogin} />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              {user?.role === 'doctor'
                ? <DoctorDashboardPage user={user} />
                : user?.role === 'admin'
                  ? <AdminDashboard />
                  : <DashboardPage user={user} />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/book-appointment/:doctorId" 
          element={<ProtectedRoute user={user} requiredRole="patient"><BookAppointmentPage user={user} /></ProtectedRoute>} 
        />
        <Route
          path="/doctor/appointments"
          element={<ProtectedRoute user={user} requiredRole="doctor"><DoctorPatientAppointmentsPage /></ProtectedRoute>}
        />
        <Route 
          path="/appointments" 
          element={<ProtectedRoute user={user}><AppointmentsPage user={user} /></ProtectedRoute>} 
        />
        <Route 
          path="/notifications" 
          element={<ProtectedRoute user={user}><NotificationCenter /></ProtectedRoute>} 
        />
        <Route
          path="/doctor/appointments/:appointmentId"
          element={<ProtectedRoute user={user} requiredRole="doctor"><DoctorAppointmentDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/doctor/availability"
          element={<ProtectedRoute user={user} requiredRole="doctor"><DoctorAvailabilityPage /></ProtectedRoute>}
        />
        <Route 
          path="/payment/:appointmentId" 
          element={<ProtectedRoute user={user}><PaymentPage user={user} /></ProtectedRoute>} 
        />
        <Route 
          path="/admin" 
          element={<ProtectedRoute user={user} requiredRole="admin"><AdminDashboard /></ProtectedRoute>} 
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to={user ? defaultPath : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
