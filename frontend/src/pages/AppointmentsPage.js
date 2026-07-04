import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appointmentService, paymentService } from '../services/apiService';
import '../styles/Appointments.css';

function AppointmentsPage({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ newDate: '', newTime: '' });
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await appointmentService.getMyAppointments();
      if (response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (searchParams.get('payment') === 'success' && sessionId) {
      paymentService.confirmStripeCheckout({ sessionId })
        .finally(() => {
          setSearchParams({});
          fetchAppointments();
        });
      return;
    }

    fetchAppointments();
  }, [searchParams, setSearchParams, fetchAppointments]);

  const handleRescheduleInput = (event) => {
    setRescheduleData({
      ...rescheduleData,
      [event.target.name]: event.target.value
    });
  };

  const submitRescheduleRequest = async (appointmentId) => {
    setRescheduleError('');
    setRescheduleMessage('');

    if (!rescheduleData.newDate || !rescheduleData.newTime) {
      setRescheduleError('Please choose a new date and time to request a reschedule.');
      return;
    }

    try {
      const response = await appointmentService.rescheduleAppointment(appointmentId, {
        newDate: rescheduleData.newDate,
        newTime: rescheduleData.newTime
      });

      if (response.data.success) {
        setRescheduleMessage('Your reschedule request has been submitted successfully.');
        setRescheduleAppointmentId(null);
        setRescheduleData({ newDate: '', newTime: '' });
        fetchAppointments();
      }
    } catch (err) {
      setRescheduleError(err.response?.data?.message || 'Unable to submit reschedule request');
    }
  };

  const getFilteredAppointments = () => {
    if (filter === 'all') return appointments;
    return appointments.filter(apt => apt.status === filter);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#3498db',
      completed: '#27ae60',
      cancelled: '#e74c3c',
      'no-show': '#f39c12'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="appointments-page">
      <h1>My Appointments</h1>

      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({appointments.length})
        </button>
        <button 
          className={filter === 'scheduled' ? 'active' : ''}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {rescheduleError && <div className="error-message">{rescheduleError}</div>}
      {rescheduleMessage && <div className="success-message">{rescheduleMessage}</div>}
      <div className="appointments-list">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appointment => {
            const id = appointment._id || appointment.id;
            const isPendingReschedule = appointment.reschedule_request_status === 'pending';
            return (
              <div key={id} className="appointment-card">
                <div className="appointment-header">
                  <h3>
                    {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                  </h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(appointment.status) }}
                  >
                    {appointment.status}
                  </span>
                </div>

                <div className="appointment-details">
                  <p><strong>Specialization:</strong> {appointment.doctorId?.specialization}</p>
                  <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {appointment.startTime} - {appointment.endTime}</p>
                  <p><strong>Reason:</strong> {appointment.reason}</p>
                  <p><strong>Fee:</strong> ₦{appointment.consultationFee}</p>
                  {appointment.reschedule_request_status && (
                    <p><strong>Reschedule:</strong> {appointment.reschedule_request_status}</p>
                  )}
                </div>

                <div className="appointment-actions">
                  {appointment.status === 'scheduled' && !isPendingReschedule && (
                    <>
                      <button className="edit-btn" onClick={() => {
                        setRescheduleAppointmentId(id);
                        setRescheduleData({ newDate: '', newTime: '' });
                        setRescheduleError('');
                        setRescheduleMessage('');
                      }}>
                        Request Reschedule
                      </button>
                      <button className="cancel-btn" onClick={async () => {
                        try {
                          await appointmentService.cancelAppointment(id);
                          fetchAppointments();
                        } catch (err) {
                          setRescheduleError(err.response?.data?.message || 'Unable to cancel appointment');
                        }
                      }}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {rescheduleAppointmentId === id && (
                  <div className="reschedule-form">
                    <h4>Request New Schedule</h4>
                    <label>
                      New Date
                      <input
                        type="date"
                        name="newDate"
                        value={rescheduleData.newDate}
                        onChange={handleRescheduleInput}
                      />
                    </label>
                    <label>
                      New Time
                      <input
                        type="time"
                        name="newTime"
                        value={rescheduleData.newTime}
                        onChange={handleRescheduleInput}
                      />
                    </label>
                    <button
                      type="button"
                      className="action-btn compact"
                      onClick={() => submitRescheduleRequest(id)}
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      className="cancel-btn compact"
                      onClick={() => setRescheduleAppointmentId(null)}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="no-appointments">No appointments found</p>
        )}
      </div>
    </div>
  );
}

export default AppointmentsPage;
