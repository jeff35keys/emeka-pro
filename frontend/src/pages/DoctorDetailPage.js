import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doctorService } from '../services/apiService';
import '../styles/DoctorDetail.css';

function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctorDetails = useCallback(async () => {
    try {
      const response = await doctorService.getDoctorById(id);
      if (response.data.success) {
        setDoctor(response.data.doctor || response.data.data);
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  if (loading) {
    return <div className="loading">Loading doctor details...</div>;
  }

  if (!doctor) {
    return <div className="error">Doctor not found</div>;
  }

  return (
    <div className="doctor-detail-page">
      <div className="doctor-header">
        <h1>{doctor.firstName} {doctor.lastName}</h1>
        <p className="specialization">{doctor.specialization}</p>
        <div className="rating">⭐ {doctor.rating || 'New'}</div>
      </div>

      <div className="doctor-info">
        <div className="info-section">
          <h3>Professional Information</h3>
          <p><strong>Hospital/Clinic:</strong> {doctor.hospital}</p>
          <p><strong>Department:</strong> {doctor.department || 'Not specified'}</p>
          <p><strong>Experience:</strong> {doctor.yearsOfExperience} years</p>
          <p><strong>License Number:</strong> {doctor.licenseNumber}</p>
        </div>

        <div className="info-section">
          <h3>Consultation Details</h3>
          <p><strong>Consultation Fee:</strong> ₦{doctor.consultationFee}</p>
          <p><strong>Duration:</strong> {doctor.consultationDuration} minutes</p>
          <p><strong>Status:</strong> {doctor.isAvailable ? '✅ Available' : '❌ Not Available'}</p>
        </div>

        {doctor.bio && (
          <div className="info-section">
            <h3>About</h3>
            <p>{doctor.bio}</p>
          </div>
        )}

        {doctor.education && (
          <div className="info-section">
            <h3>Education</h3>
            <p>{doctor.education}</p>
          </div>
        )}
      </div>

      <Link to={`/book-appointment/${doctor._id || doctor.id}`} className="book-btn">Book Appointment</Link>
    </div>
  );
}

export default DoctorDetailPage;
