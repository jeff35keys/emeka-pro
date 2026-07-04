import React, { useState } from 'react';
import { doctorService } from '../services/apiService';
import '../styles/Dashboard.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function DoctorAvailabilityPage() {
  const [availability, setAvailability] = useState(
    DAYS.map(day => ({ dayOfWeek: day, startTime: '09:00', endTime: '17:00', enabled: true }))
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateSlot = (dayOfWeek, field, value) => {
    setAvailability(slots => slots.map(slot => (
      slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot
    )));
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const activeSlots = availability
        .filter(slot => slot.enabled)
        .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));

      await doctorService.updateAvailability({ availability: activeSlots });
      setMessage('Availability saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <h1>Manage Availability</h1>
      <p className="dashboard-subtitle">Set the days and hours patients can book with you.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form className="dashboard-section availability-form" onSubmit={saveAvailability}>
        {availability.map(slot => (
          <div className="availability-row" key={slot.dayOfWeek}>
            <label className="availability-day">
              <input
                type="checkbox"
                checked={slot.enabled}
                onChange={(event) => updateSlot(slot.dayOfWeek, 'enabled', event.target.checked)}
              />
              <span>{slot.dayOfWeek}</span>
            </label>
            <input
              type="time"
              value={slot.startTime}
              disabled={!slot.enabled}
              onChange={(event) => updateSlot(slot.dayOfWeek, 'startTime', event.target.value)}
            />
            <input
              type="time"
              value={slot.endTime}
              disabled={!slot.enabled}
              onChange={(event) => updateSlot(slot.dayOfWeek, 'endTime', event.target.value)}
            />
          </div>
        ))}

        <button type="submit" className="action-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </form>
    </div>
  );
}

export default DoctorAvailabilityPage;
