import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user ? '/dashboard' : '/login'} className="navbar-brand">
          <h1>Doctor Appointment System</h1>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
              {user.role === 'doctor' ? (
                <>
                  <Link to="/doctor/availability" className="nav-link" onClick={closeMenu}>Availability</Link>
                  <Link to="/doctor/appointments" className="nav-link" onClick={closeMenu}>Patient Appointments</Link>
                  <Link to="/notifications" className="nav-link" onClick={closeMenu}>Notifications</Link>
                </>
              ) : (
                <>
                  <Link to="/doctors" className="nav-link" onClick={closeMenu}>Find Doctors</Link>
                  <Link to="/appointments" className="nav-link" onClick={closeMenu}>My Appointments</Link>
                  <Link to="/notifications" className="nav-link" onClick={closeMenu}>Notifications</Link>
                </>
              )}
              
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link admin" onClick={closeMenu}>Admin</Link>
              )}

              <div className="user-menu">
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/doctors" className="nav-link" onClick={closeMenu}>Find Doctors</Link>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Patient Login</Link>
              <Link to="/register" className="nav-link register-btn" onClick={closeMenu}>Patient Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
