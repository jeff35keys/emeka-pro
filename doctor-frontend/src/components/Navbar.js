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
          <h1>🏥 Doctor Portal</h1>
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
              <Link to="/availability" className="nav-link" onClick={closeMenu}>Availability</Link>
              <Link to="/appointments" className="nav-link" onClick={closeMenu}>Appointments</Link>
              <Link to="/notifications" className="nav-link" onClick={closeMenu}>Notifications</Link>

              <div className="user-menu">
                <span className="user-name">Dr. {user.firstName} {user.lastName}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="nav-link register-btn" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
