import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService, appointmentService, doctorService } from '../services/apiService';
import '../styles/Payment.css';

function PaymentPage({ user }) {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    transactionReference: ''
  });

  const fetchAppointmentDetails = useCallback(async () => {
    try {
      const response = await appointmentService.getAppointmentDetails(appointmentId);
      if (response.data.success) {
        const apt = response.data.appointment || response.data.data;
        setAppointment(apt);
        
        // Fetch doctor details to get bank information
        if (apt.doctorId) {
          try {
            const doctorId = apt.doctorId.id || apt.doctorId;
            const doctorRes = await doctorService.getDoctorById(doctorId);
            if (doctorRes.data.success) {
              const resolvedDoctor = doctorRes.data.doctor || doctorRes.data.data;
              setDoctorDetails(resolvedDoctor);
              // Pre-fill bank transfer fields with doctor's account info
              setFormData(prev => ({
                ...prev,
                bankName: resolvedDoctor?.bankName || resolvedDoctor?.bank_name || '',
                accountNumber: resolvedDoctor?.accountNumber || resolvedDoctor?.account_number || ''
              }));
            }
          } catch (err) {
            console.log('Note: Could not fetch doctor details, continue with manual entry');
          }
        }
      }
    } catch (error) {
      setError('Failed to load appointment details');
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [fetchAppointmentDetails]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await paymentService.recordBankTransfer({
        appointmentId,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        transactionReference: formData.transactionReference
      });

      if (response.data.success) {
        alert('Bank transfer recorded. Please wait for verification.');
        navigate('/appointments');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return <div className="loading">Loading payment page...</div>;
  }

  return (
    <div className="payment-page">
      <h1>Complete Payment</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="payment-container">
        <div className="appointment-summary">
          <h2>Appointment Details</h2>
          <p><strong>Doctor:</strong> {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</p>
          <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {appointment.startTime}</p>
          <p className="amount"><strong>Amount Due:</strong> ₦{appointment.consultationFee}</p>
        </div>

        <div className="transfer-account-card">
          <h3>Bank Transfer Account</h3>
          <p>Send the consultation fee to this account. After the transfer is completed, return here and submit the reference so the doctor can confirm it.</p>
          <ul>
            <li><strong>Bank:</strong> {doctorDetails?.bankName || 'To be provided'}</li>
            <li><strong>Account Name:</strong> {doctorDetails?.accountName || appointment.doctorId?.firstName + ' ' + appointment.doctorId?.lastName}</li>
            <li><strong>Account Number:</strong> {doctorDetails?.accountNumber || '****'}</li>
          </ul>
          <p className="transfer-reference">Use reference: <strong>{appointmentId}</strong></p>
        </div>

        <div className="payment-methods">
          <h2>Bank Transfer Payment</h2>

          <form onSubmit={handlePaymentSubmit} className="payment-form">
            <div className="method-form">
              <div className="info-box">
                <p>✓ Doctor's bank account details are pre-filled below. Please verify and proceed with the transfer.</p>
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  readOnly
                  placeholder="Doctor's bank"
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  readOnly
                  placeholder="Doctor's account number"
                />
              </div>

              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName || (appointment.doctorId?.firstName + ' ' + appointment.doctorId?.lastName)}
                  readOnly
                  placeholder="Doctor's account name"
                />
              </div>

              <div className="form-group">
                <label>Transaction Reference Number *</label>
                <input
                  type="text"
                  name="transactionReference"
                  value={formData.transactionReference}
                  onChange={handleChange}
                  required
                  placeholder="Transaction reference/receipt number"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
