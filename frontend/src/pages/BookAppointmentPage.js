import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentService, doctorService } from '../services/apiService';
import '../styles/BookAppointment.css';

function BookAppointmentPage({ user }) {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [formData, setFormData] = useState({
    appointmentDate: '',
    startTime: '',
    reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [slotMessage, setSlotMessage] = useState('');

  const fetchDoctorDetails = useCallback(async () => {
    try {
      const response = await doctorService.getDoctorById(doctorId);
      if (response.data.success) {
        setDoctor(response.data.doctor || response.data.data);
      }
    } catch (error) {
      setError('Failed to load doctor details');
    }
  }, [doctorId]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      setSlotsLoading(true);
      setSlotMessage('');
      const response = await appointmentService.getAvailableSlots(
        doctorId,
        formData.appointmentDate
      );
      if (response.data.success) {
        setAvailableSlots(response.data.availableSlots || response.data.data || []);
        setSlotMessage(response.data.message || '');
      }
    } catch (error) {
      setAvailableSlots([]);
      setSlotMessage(error.response?.data?.message || 'Failed to load available time slots');
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, formData.appointmentDate]);

  useEffect(() => {
    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots();
    }
  }, [formData.appointmentDate, fetchAvailableSlots]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(current => ({
      ...current,
      [name]: value,
      ...(name === 'appointmentDate' ? { startTime: '' } : {})
    }));

    if (name === 'appointmentDate') {
      setAvailableSlots([]);
      setSlotMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endTime = addMinutesToTime(formData.startTime, Number(doctor.consultationDuration || 30));
      const response = await appointmentService.createAppointment({
        doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        endTime,
        reason: formData.reason,
        consultationFee: doctor.consultationFee
      });

      if (response.data.success) {
        const appointment = response.data.appointment || response.data.data;
        navigate(`/payment/${appointment._id || appointment.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const addMinutesToTime = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  if (!doctor) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="book-appointment-page">
      <h1>Book Appointment with {doctor.firstName} {doctor.lastName}</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Appointment Date</label>
          <input
            type="date"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {formData.appointmentDate && slotsLoading && (
          <p className="slot-message">Loading available time slots...</p>
        )}

        {formData.appointmentDate && !slotsLoading && availableSlots.length > 0 && (
          <div className="form-group">
            <label>Time Slot</label>
            <select
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            >
              <option value="">Select a time slot</option>
              {availableSlots.map(slot => (
                <option key={slot.time || slot} value={slot.time || slot}>{slot.time || slot}</option>
              ))}
            </select>
          </div>
        )}

        {formData.appointmentDate && !slotsLoading && availableSlots.length === 0 && (
          <p className="slot-message">
            {slotMessage || 'No time slots are available for this date. Select another date or ask the doctor to update availability.'}
          </p>
        )}

        <div className="form-group">
          <label>Reason for Visit</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            placeholder="Describe your medical concern"
            rows="4"
          />
        </div>

        <div className="appointment-summary">
          <h3>Appointment Summary</h3>
          <p><strong>Doctor:</strong> {doctor.firstName} {doctor.lastName}</p>
          <p><strong>Specialization:</strong> {doctor.specialization}</p>
          <p><strong>Date:</strong> {formData.appointmentDate || 'Not selected'}</p>
          <p><strong>Time:</strong> {formData.startTime || 'Not selected'}</p>
          <p><strong>Fee:</strong> NGN {Number(doctor.consultationFee || 0).toLocaleString()}</p>
        </div>

        <button type="submit" disabled={loading || !formData.appointmentDate || !formData.startTime || !formData.reason} className="submit-btn">
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
}

export default BookAppointmentPage;
