import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appointmentService } from '../services/apiService';
import '../styles/Dashboard.css';

const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString();
};

const patientName = (appointment) => {
  const patient = appointment?.patient || appointment?.patients || appointment?.patientId || {};
  const user = patient.users || patient.user || {};
  const firstName = patient.firstName || patient.first_name || user.first_name || '';
  const lastName = patient.lastName || patient.last_name || user.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Patient';
};

const patientValue = (appointment, key, fallback = 'Not provided') => {
  const patient = appointment?.patient || appointment?.patients || appointment?.patientId || {};
  const user = patient.users || patient.user || {};
  return patient[key] || user[key] || fallback;
};

const patientPhone = (appointment) => (
  patientValue(appointment, 'phone_number', '') ||
  patientValue(appointment, 'phoneNumber', '') ||
  'Not provided'
);

function DoctorAppointmentDetailPage() {
  const { appointmentId } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointmentDetails(appointmentId);
      if (response.data.success) {
        setAppointment(response.data.appointment || response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  if (loading) {
    return <div className="loading">Loading appointment details...</div>;
  }

  if (error) {
    return <div className="dashboard-page"><div className="error-message">{error}</div></div>;
  }

  if (!appointment) {
    return <div className="dashboard-page"><p className="no-data">Appointment not found.</p></div>;
  }

  const payment = Array.isArray(appointment.payments) ? appointment.payments[0] : appointment.payment;
  const amountPaid = payment?.amount || (appointment.paymentStatus === 'completed' || appointment.payment_status === 'completed' ? appointment.consultationFee || appointment.consultation_fee : 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading-row">
        <div>
          <h1>Patient Appointment Detail</h1>
          <p className="dashboard-subtitle">{patientName(appointment)}</p>
        </div>
        <Link to="/dashboard" className="action-btn compact">Back to Dashboard</Link>
      </div>

      <div className="detail-grid">
        <section className="dashboard-section">
          <h2>Appointment</h2>
          <dl className="detail-list">
            <dt>Date</dt>
            <dd>{formatDate(appointment.appointmentDate || appointment.appointment_date)}</dd>
            <dt>Time</dt>
            <dd>{appointment.startTime || appointment.start_time} - {appointment.endTime || appointment.end_time}</dd>
            <dt>Status</dt>
            <dd><span className={`status ${appointment.status}`}>{appointment.status}</span></dd>
            <dt>Reason</dt>
            <dd>{appointment.reason || 'Not provided'}</dd>
            <dt>Doctor Notes</dt>
            <dd>{appointment.notes || 'No notes yet'}</dd>
          </dl>
        </section>

        <section className="dashboard-section">
          <h2>Payment</h2>
          <dl className="detail-list">
            <dt>Consultation Fee</dt>
            <dd>{formatCurrency(appointment.consultationFee || appointment.consultation_fee)}</dd>
            <dt>Amount Paid</dt>
            <dd>{formatCurrency(amountPaid)}</dd>
            <dt>Payment Status</dt>
            <dd>{appointment.paymentStatus || appointment.payment_status || payment?.payment_status || 'pending'}</dd>
            <dt>Payment Method</dt>
            <dd>{payment?.payment_method || payment?.paymentMethod || 'Not recorded'}</dd>
          </dl>
        </section>
      </div>

      <section className="dashboard-section">
        <h2>Patient Record</h2>
        <dl className="detail-list two-column">
          <dt>Phone</dt>
          <dd>{patientPhone(appointment)}</dd>
          <dt>Email</dt>
          <dd>{patientValue(appointment, 'email')}</dd>
          <dt>Gender</dt>
          <dd>{patientValue(appointment, 'gender')}</dd>
          <dt>Date of Birth</dt>
          <dd>{formatDate(patientValue(appointment, 'date_of_birth', ''))}</dd>
          <dt>Medical History</dt>
          <dd>{Array.isArray(patientValue(appointment, 'medical_history', [])) ? patientValue(appointment, 'medical_history', []).join(', ') || 'Not provided' : patientValue(appointment, 'medical_history')}</dd>
          <dt>Allergies</dt>
          <dd>{Array.isArray(patientValue(appointment, 'allergies', [])) ? patientValue(appointment, 'allergies', []).join(', ') || 'Not provided' : patientValue(appointment, 'allergies')}</dd>
        </dl>
      </section>
    </div>
  );
}

export default DoctorAppointmentDetailPage;
