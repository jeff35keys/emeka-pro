import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../services/apiService';
import { DOCTOR_SPECIALIZATIONS } from '../constants/doctorSpecializations';
import '../styles/DoctorList.css';

function DoctorListPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: '',
    minRating: 0
  });

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.minRating) params.minRating = filters.minRating;

      const response = await doctorService.getAllDoctors(params);
      if (response.data.success) {
        setDoctors(response.data.doctors || response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <div className="loading">Loading doctors...</div>;
  }

  return (
    <div className="doctor-list-page container">
      <h1>Find Your Doctor</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Specialization:</label>
          <select name="specialization" value={filters.specialization} onChange={handleFilterChange}>
            <option value="">All Specializations</option>
            {DOCTOR_SPECIALIZATIONS.map(specialization => (
              <option key={specialization} value={specialization}>{specialization}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="doctors-grid">
        {doctors.length > 0 ? (
          doctors.map(doctor => (
            <div key={doctor._id || doctor.id} className="doctor-card">
              <h3>{doctor.firstName || doctor.first_name} {doctor.lastName || doctor.last_name}</h3>
              <p className="specialization">{doctor.specialization}</p>
              <p className="hospital">{doctor.hospital}</p>
              <p className="experience">Experience: {doctor.yearsOfExperience || doctor.years_of_experience} years</p>
              <div className="rating">
                <span>Rating: {doctor.rating || 'No ratings yet'}</span>
              </div>
              <p className="fee">Fee: NGN {Number(doctor.consultationFee || doctor.consultation_fee || 0).toLocaleString()}</p>
              <Link to={`/doctors/${doctor._id || doctor.id}`} className="view-btn">View Profile</Link>
            </div>
          ))
        ) : (
          <p className="no-results">No doctors found matching your criteria</p>
        )}
      </div>
    </div>
  );
}

export default DoctorListPage;
