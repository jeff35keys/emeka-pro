import React, { useState, useEffect } from 'react';
import { adminService, paymentService } from '../services/apiService';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const dashResponse = await adminService.getDashboard();
      const paymentResponse = await paymentService.getPaymentAnalytics();

      if (dashResponse.data.success) {
        setDashboard(dashResponse.data.dashboard);
      }
      if (paymentResponse.data.success) {
        setPayments(paymentResponse.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Users</h3>
          <p className="value">{dashboard?.totalUsers || 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Doctors</h3>
          <p className="value">{dashboard?.totalDoctors || 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Appointments</h3>
          <p className="value">{dashboard?.totalAppointments || 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Revenue</h3>
          <p className="value">₦{payments?.totalRevenue || 0}</p>
        </div>
      </div>

      <div className="section">
        <h2>Appointment Statistics</h2>
        <div className="stat-boxes">
          <div className="stat-box completed">
            <h4>Completed</h4>
            <p>{dashboard?.appointmentStats?.completed || 0}</p>
          </div>
          <div className="stat-box pending">
            <h4>Pending</h4>
            <p>{dashboard?.appointmentStats?.pending || 0}</p>
          </div>
          <div className="stat-box cancelled">
            <h4>Cancelled</h4>
            <p>{dashboard?.appointmentStats?.cancelled || 0}</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Payment Methods Distribution</h2>
        {payments?.paymentMethodStats && (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Count</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.paymentMethodStats.map(stat => (
                <tr key={stat._id}>
                  <td>{stat._id || 'Unknown'}</td>
                  <td>{stat.count}</td>
                  <td>₦{stat.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="quick-links">
        <a href="/admin/users" className="link-btn">Manage Users</a>
        <a href="/admin/appointments" className="link-btn">View All Appointments</a>
        <a href="/admin/reports" className="link-btn">View Reports</a>
      </div>
    </div>
  );
}

export default AdminDashboard;
