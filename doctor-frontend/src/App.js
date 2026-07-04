import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';

// Pages
import DoctorLoginPage from './pages/DoctorLoginPage';
import DoctorRegisterPage from './pages/DoctorRegisterPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorAvailabilityPage from './pages/DoctorAvailabilityPage';
import DoctorAppointmentDetailPage from './pages/DoctorAppointmentDetailPage';
import DoctorPatientAppointmentsPage from './pages/DoctorPatientAppointmentsPage';
import NotificationCenter from './pages/NotificationCenter';
import UpdateBankDetailsPage from './pages/UpdateBankDetailsPage';
import DoctorListPage from './pages/DoctorListPage';
import DoctorDetailPage from './pages/DoctorDetailPage';

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
        const parsedUser = JSON.parse(userData);
        // Only allow doctors in this portal
        if (parsedUser.role === 'doctor') {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, token, refreshToken) => {
    if (!userData || !token) return;

    if (userData.role !== 'doctor') {
      alert('This portal is for doctors only');
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
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        {/* Home routes */}
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />

        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <DoctorLoginPage onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <DoctorRegisterPage onRegister={handleLogin} />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorDashboardPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/availability" 
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorAvailabilityPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorPatientAppointmentsPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/appointments/:appointmentId" 
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorAppointmentDetailPage user={user} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <NotificationCenter user={user} userRole="doctor" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bank-details" 
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <UpdateBankDetailsPage user={user} />
            </ProtectedRoute>
          } 
        />
        {/* Doctors listing/detail (copied from patient frontend for UI grid) */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors/:id"
          element={
            <ProtectedRoute user={user} requiredRole="doctor">
              <DoctorDetailPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
