import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService, doctorService, paymentService } from '../services/apiService';
import '../styles/Dashboard.css';

const formatCurrency = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const getAmountPaid = (appointment) => {
  const payments = Array.isArray(appointment.payments) ? appointment.payments : [];
  const completedPayment = payments.find(payment => (
    payment.payment_status === 'completed' || payment.paymentStatus === 'completed' || payment.bank_verification_status === 'verified'
  ));

  if (completedPayment) {
    return Number(completedPayment.amount || 0);
  }

  const isPaid = appointment.paymentStatus === 'completed' || appointment.payment_status === 'completed';
  return isPaid ? Number(appointment.consultationFee || appointment.consultation_fee || 0) : 0;
};

const getPatientName = (appointment) => {
  const patient = appointment.patients || appointment.patient || appointment.patientId || {};
  const user = patient.users || patient.user || {};
  const firstName = patient.firstName || patient.first_name || user.first_name || '';
  const lastName = patient.lastName || patient.last_name || user.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Patient';
};

const getPaymentSummary = (appointment) => {
  const payments = Array.isArray(appointment.payments) ? appointment.payments : [];
  const completedPayment = payments.find(payment => (
    payment.payment_status === 'completed' || payment.paymentStatus === 'completed' || payment.bank_verification_status === 'verified'
  ));
  const pendingTransfer = payments.find(payment => payment.payment_method === 'bank_transfer' && payment.payment_status !== 'completed');
  const payment = completedPayment || pendingTransfer || payments[0] || null;

  if (!payment) {
    return {
      amount: 0,
      label: 'Pending',
      status: 'pending',
      pendingTransfer: false,
      reference: ''
    };
  }

  const paymentMethod = payment.payment_method || payment.paymentMethod || 'cash';
  const methodLabel = paymentMethod === 'bank_transfer'
    ? 'Bank transfer'
    : paymentMethod === 'credit_card'
      ? 'Card'
      : paymentMethod === 'cash'
        ? 'Cash'
        : 'Other';
  const isCompleted = payment.payment_status === 'completed' || payment.bank_verification_status === 'verified';

  return {
    amount: Number(payment.amount || 0),
    label: methodLabel,
    status: isCompleted ? 'completed' : 'pending',
    pendingTransfer: paymentMethod === 'bank_transfer' && !isCompleted,
    reference: payment.bank_transaction_reference || payment.transaction_reference || payment.transaction_id || '',
    paymentId: payment.id
  };
};

function DoctorDashboardPage({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [appointmentsResponse, statsResponse] = await Promise.all([
        appointmentService.getMyAppointments(),
        doctorService.getDoctorStats().catch(() => null)
      ]);

      if (appointmentsResponse.data.success) {
        setAppointments(appointmentsResponse.data.appointments || appointmentsResponse.data.data || []);
      }

      if (statsResponse?.data?.success) {
        setStats(statsResponse.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const completeAppointment = async (appointmentId) => {
    try {
      await appointmentService.completeAppointment(appointmentId, { notes: 'Completed by doctor' });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete appointment');
    }
  };

  const confirmTransfer = async (paymentId) => {
    try {
      await paymentService.verifyBankTransfer(paymentId, { verificationStatus: 'verified' });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm transfer');
    }
  };

  const dashboardStats = useMemo(() => {
    const booked = appointments.length;
    const scheduled = appointments.filter(appointment => appointment.status === 'scheduled').length;
    const completed = appointments.filter(appointment => appointment.status === 'completed').length;
    const totalPaid = appointments.reduce((sum, appointment) => sum + getAmountPaid(appointment), 0);

    return {
      booked,
      scheduled,
      completed,
      totalPaid: stats?.totalEarnings ?? totalPaid
    };
  }, [appointments, stats]);

  if (loading) {
    return <div className="loading">Loading doctor dashboard...</div>;
  }

  return (
    <div className="dashboard-page doctor-dashboard">
      <div className="dashboard-heading-row">
        <div>
          <h1>Doctor Dashboard</h1>
          <p className="dashboard-subtitle">Dr. {user?.firstName} {user?.lastName}</p>
        </div>
        <Link to="/availability" className="action-btn compact">Manage Availability</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Patient Bookings</h3>
          <p className="stat-number">{dashboardStats.booked}</p>
        </div>
        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <p className="stat-number">{dashboardStats.scheduled}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Appointments</h3>
          <p className="stat-number">{dashboardStats.completed}</p>
        </div>
        <div className="stat-card">
          <h3>Total Amount Paid</h3>
          <p className="stat-number currency">{formatCurrency(dashboardStats.totalPaid)}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Patient Appointment Records</h2>
        {appointments.length > 0 ? (
          <div className="table-scroll">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appointment => {
                  const id = appointment._id || appointment.id;
                  const paymentSummary = getPaymentSummary(appointment);
                  return (
                    <tr key={id}>
                      <td>{getPatientName(appointment)}</td>
                      <td>{new Date(appointment.appointmentDate || appointment.appointment_date).toLocaleDateString()}</td>
                      <td>{appointment.startTime || appointment.start_time} - {appointment.endTime || appointment.end_time}</td>
                      <td>{formatCurrency(getAmountPaid(appointment))}</td>
                      <td>
                        <div className="payment-cell">
                          <span className={`payment-pill ${paymentSummary.status}`}>{paymentSummary.label}</span>
                          {paymentSummary.reference && <div className="payment-meta">Ref: {paymentSummary.reference}</div>}
                          {paymentSummary.pendingTransfer && (
                            <button
                              type="button"
                              className="action-btn mini"
                              onClick={() => confirmTransfer(paymentSummary.paymentId)}
                            >
                              Confirm Received
                            </button>
                          )}
                        </div>
                      </td>
                      <td><span className={`status ${appointment.status}`}>{appointment.status}</span></td>
                      <td className="table-actions">
                        <Link to={`/appointments/${id}`} className="small-link">Details</Link>
                        {appointment.status === 'scheduled' && (
                          <button
                            type="button"
                            className="action-btn mini"
                            onClick={() => completeAppointment(id)}
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No patient appointments yet.</p>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboardPage;
