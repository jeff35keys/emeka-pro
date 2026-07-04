import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/apiService';
import '../styles/Auth.css';

function DoctorLoginPage({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      if (response.data.success) {
        const user = response.data.user || response.data.data;
        
        // Verify the user is a doctor
        if (user.role !== 'doctor') {
          setError('This login is only for doctors. Please use the patient portal.');
          return;
        }

        const token = response.data.token || response.data.data?.token;
        const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;

        onLogin(user, token, refreshToken);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container doctor-login">
        <div className="auth-header">
          <h2>Doctor Login</h2>
          <p>Access your professional dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn auth-btn">
            {loading ? 'Logging in...' : 'Doctor Login'}
          </button>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
            <p className="back-link"><Link to="/">Back to Home</Link></p>
          </div>
        </form>

        <div className="info-box">
          <h4>⚠️ Doctor Portal Only</h4>
          <p>This portal is exclusively for medical professionals. If you're a patient, please visit the main application.</p>
        </div>
      </div>
    </div>
  );
}

export default DoctorLoginPage;
