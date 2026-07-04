import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../services/apiService';
import '../styles/Dashboard.css';

const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString();
};

const getPatient = (appointment) => appointment.patient || appointment.patients || appointment.patientId || {};

const getPatientName = (appointment) => {
  const patient = getPatient(appointment);
  const firstName = patient.firstName || patient.first_name || patient.users?.first_name || '';
  const lastName = patient.lastName || patient.last_name || patient.users?.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Patient';
};

const getPatientValue = (appointment, key, fallback = 'Not provided') => {
  const patient = getPatient(appointment);
  return patient[key] || patient.users?.[key] || fallback;
};

const getPatientContact = (appointment) => {
  const patient = getPatient(appointment);
  return patient.phoneNumber || patient.phone_number || patient.users?.phone_number || 'Not provided';
};

function DoctorPatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await doctorService.getDoctorAppointments();
      if (response.data.success) {
        setAppointments(response.data.appointments || response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => (
    filter === 'all'
      ? appointments
      : appointments.filter(appointment => appointment.status === filter)
  ), [appointments, filter]);

  if (loading) {
    return <div className="loading">Loading patient appointments...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading-row">
        <div>
          <h1>Patient Appointments</h1>
          <p className="dashboard-subtitle">Patient details for appointments booked with you</p>
        </div>
        <Link to="/dashboard" className="action-btn compact">Back to Dashboard</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters compact-filters">
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All ({appointments.length})
        </button>
        <button type="button" className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>
          Scheduled
        </button>
        <button type="button" className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
          Completed
        </button>
        <button type="button" className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>
          Cancelled
        </button>
      </div>

      <div className="dashboard-section">
        <h2>Patient Details</h2>
        {filteredAppointments.length > 0 ? (
          <div className="table-scroll">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => {
                  const id = appointment._id || appointment.id;
                  return (
                    <tr key={id}>
                      <td>{getPatientName(appointment)}</td>
                      <td>
                        <div>{getPatientContact(appointment)}</div>
                        <div className="muted-text">{getPatientValue(appointment, 'email')}</div>
                      </td>
                      <td>{formatDate(appointment.appointmentDate || appointment.appointment_date)}</td>
                      <td>{appointment.startTime || appointment.start_time} - {appointment.endTime || appointment.end_time}</td>
                      <td>{appointment.reason || 'Not provided'}</td>
                      <td>{formatCurrency(appointment.consultationFee || appointment.consultation_fee)}</td>
                      <td><span className={`status ${appointment.status}`}>{appointment.status}</span></td>
                      <td><Link to={`/appointments/${id}`} className="small-link">Details</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No patient appointment records found.</p>
        )}
      </div>
    </div>
  );
}

export default DoctorPatientAppointmentsPage;
