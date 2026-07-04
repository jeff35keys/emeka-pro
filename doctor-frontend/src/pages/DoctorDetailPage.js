import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doctorService } from '../services/apiService';
import '../styles/DoctorDetail.css';

function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDoctorDetails = useCallback(async () => {
    try {
      setLoading(true);
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

  if (loading) return <div className="loading">Loading doctor details...</div>;

  if (!doctor) return <div className="error">Doctor not found</div>;

  return (
    <div className="doctor-detail-page container">
      <div className="doctor-header page-card">
        <h1>{doctor.firstName || doctor.first_name} {doctor.lastName || doctor.last_name}</h1>
        <p className="specialization">{doctor.specialization}</p>
        <p className="bio">{doctor.bio}</p>
      </div>

      <div className="doctor-main">
        <div className="doctor-info page-card">
          <h3>About</h3>
          <p><strong>Hospital:</strong> {doctor.hospital}</p>
          <p><strong>Department:</strong> {doctor.department}</p>
          <p><strong>Experience:</strong> {doctor.yearsOfExperience || doctor.years_of_experience} years</p>
          <p><strong>Consultation Fee:</strong> NGN {Number(doctor.consultationFee || doctor.consultation_fee || 0).toLocaleString()}</p>
        </div>

        <div className="doctor-actions page-card">
          <h3>Availability & Actions</h3>
          <p className="muted">Use the booking flow to schedule an appointment with this doctor.</p>
        </div>
      </div>
    </div>
  );
}

export default DoctorDetailPage;
