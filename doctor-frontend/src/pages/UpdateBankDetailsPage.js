import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import '../styles/Auth.css';

function UpdateBankDetailsPage({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bankName: user?.bankName || '',
    accountNumber: user?.accountNumber || '',
    accountName: user?.accountName || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validation
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      setError('All bank details are required');
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.put('/doctors/bank-details', {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName
      });

      if (response.data.success) {
        setMessage('Bank details updated successfully!');
        // Update localStorage
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Update Bank Details</h1>
        <p className="auth-subtitle">Update your bank account information for receiving payments</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="bankName">Bank Name *</label>
            <input
              id="bankName"
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              placeholder="e.g., Access Bank"
              required
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
              placeholder="10-digit account number"
              required
              pattern="[0-9]+"
              maxLength="20"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountName">Account Holder Name *</label>
            <input
              id="accountName"
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="Name on bank account"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Bank Details'}
          </button>
        </form>

        <p className="auth-footer">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#f39c12', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to Dashboard
          </button>
        </p>
      </div>
    </div>
  );
}

export default UpdateBankDetailsPage;
