import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import '../styles/Dashboard.css';

function NotificationCenter({ user, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (notificationId) => {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notification');
    }
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading-row">
        <div>
          <h1>Notifications</h1>
          <p className="dashboard-subtitle">Recent updates for your appointments and payments</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 ? (
        <p className="no-data">No notifications yet.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}>
              <div>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span className="muted">{new Date(notification.created_at).toLocaleString()}</span>
              </div>
              {!notification.is_read && (
                <button className="action-btn compact" onClick={() => markRead(notification.id)}>
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
