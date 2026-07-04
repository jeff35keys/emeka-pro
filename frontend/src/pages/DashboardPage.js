import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services/apiService';
import '../styles/Dashboard.css';

function DashboardPage({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await appointmentService.getMyAppointments();
      if (response.data.success) {
        const appts = response.data.appointments;
        setAppointments(appts.slice(0, 5)); // Show latest 5
        setUpcomingCount(appts.filter(a => a.status === 'scheduled').length);
        setCompletedCount(appts.filter(a => a.status === 'completed').length);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <h1>Welcome, {user.firstName}!</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <p className="stat-number">{upcomingCount}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Appointments</h3>
          <p className="stat-number">{completedCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p className="stat-number">{appointments.length}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Appointments</h2>
        {appointments.length > 0 ? (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt._id || apt.id}>
                  <td>{apt.doctorId?.firstName} {apt.doctorId?.lastName}</td>
                  <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                  <td>{apt.startTime}</td>
                  <td><span className={`status ${apt.status}`}>{apt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">No appointments yet. <Link to="/doctors">Book one now!</Link></p>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/doctors" className="action-btn">Find Doctor</Link>
        <Link to="/appointments" className="action-btn">View All Appointments</Link>
      </div>
    </div>
  );
}

export default DashboardPage;
