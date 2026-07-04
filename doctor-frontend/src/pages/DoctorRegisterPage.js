import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/apiService';
import { DOCTOR_SPECIALIZATIONS } from '../constants/doctorSpecializations';
import '../styles/Auth.css';

function DoctorRegisterPage({ onRegister }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    hospital: '',
    consultationFee: '',
    accountNumber: '',
    bankName: '',
    accountName: ''
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

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!formData.specialization || !formData.licenseNumber || !formData.consultationFee) {
      setError('Please fill in all doctor-specific fields');
      return false;
    }

    if (!formData.accountNumber || !formData.bankName || !formData.accountName) {
      setError('Please fill in all bank account details');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        role: 'doctor',
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        consultationFee: parseFloat(formData.consultationFee)
      };

      const response = await authService.register(submitData);
      if (response.data.success) {
        alert('Registration successful! You can now login with your credentials.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container doctor-register">
        <div className="auth-header">
          <h2>Doctor Registration</h2>
          <p>Create your professional account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Personal Information Section */}
          <fieldset className="form-section">
            <legend>Personal Information</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
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
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </fieldset>

          {/* Professional Information Section */}
          <fieldset className="form-section">
            <legend>Professional Information</legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="specialization">Specialization *</label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Specialization</option>
                  {DOCTOR_SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="licenseNumber">License Number *</label>
                <input
                  id="licenseNumber"
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., MD/2024/001234"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="yearsOfExperience">Years of Experience</label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  max="60"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hospital">Hospital/Clinic Name</label>
                <input
                  id="hospital"
                  type="text"
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleChange}
                  placeholder="Hospital or clinic name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="consultationFee">Consultation Fee (₦) *</label>
              <input
                id="consultationFee"
                type="number"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                required
                min="0"
                step="100"
                placeholder="e.g., 5000"
              />
            </div>
          </fieldset>

          {/* Bank Account Details Section */}
          <fieldset className="form-section">
            <legend>Bank Account Details</legend>
            <p className="section-hint">These details will be used to receive payments from patients</p>

            <div className="form-group">
              <label htmlFor="bankName">Bank Name *</label>
              <input
                id="bankName"
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
                placeholder="e.g., Access Bank, GTBank, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountNumber">Account Number *</label>
              <input
                id="accountNumber"
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                placeholder="10-digit account number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountName">Account Name *</label>
              <input
                id="accountName"
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                required
                placeholder="Name on bank account"
              />
            </div>
          </fieldset>

          <button type="submit" disabled={loading} className="submit-btn auth-btn">
            {loading ? 'Creating Account...' : 'Create Doctor Account'}
          </button>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
            <p className="back-link"><Link to="/">Back to Home</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DoctorRegisterPage;
