const { supabaseAdmin } = require('../config/supabase');

const mapDoctor = (doctor) => ({
  ...doctor,
  _id: doctor.id,
  firstName: doctor.users?.first_name || '',
  lastName: doctor.users?.last_name || '',
  email: doctor.users?.email || '',
  phoneNumber: doctor.users?.phone_number || '',
  avatarUrl: doctor.users?.avatar_url || '',
  licenseNumber: doctor.license_number,
  yearsOfExperience: doctor.years_of_experience,
  consultationFee: doctor.consultation_fee,
  consultationDuration: doctor.consultation_duration,
  isAvailable: doctor.is_available
});

const indexById = (rows = []) => (
  rows.reduce((acc, row) => {
    if (row?.id) acc[row.id] = row;
    return acc;
  }, {})
);

const fetchUsersByIds = async (ids) => {
  const uniqueIds = [...new Set((ids || []).filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, first_name, last_name, email, phone_number, avatar_url')
    .in('id', uniqueIds);

  if (error) throw error;
  return indexById(data);
};

const attachUsersToDoctors = async (doctors = []) => {
  const usersById = await fetchUsersByIds(doctors.map(doctor => doctor.id));
  return doctors.map(doctor => ({
    ...doctor,
    users: usersById[doctor.id]
  }));
};

const mapPatient = (patient) => patient ? ({
  ...patient,
  _id: patient.id,
  firstName: patient.users?.first_name || '',
  lastName: patient.users?.last_name || '',
  email: patient.users?.email || '',
  phoneNumber: patient.users?.phone_number || '',
  dateOfBirth: patient.date_of_birth,
  medicalHistory: patient.medical_history,
  totalAppointments: patient.total_appointments,
  totalSpent: patient.total_spent
}) : null;

const hydrateDoctorAppointments = async (appointments = []) => {
  if (appointments.length === 0) return [];

  const patientIds = appointments.map(appointment => appointment.patient_id);
  const appointmentIds = appointments.map(appointment => appointment.id);

  const [patientsResult, paymentsResult] = await Promise.all([
    supabaseAdmin.from('patients').select('*').in('id', [...new Set(patientIds.filter(Boolean))]),
    supabaseAdmin.from('payments').select('*').in('appointment_id', [...new Set(appointmentIds.filter(Boolean))])
  ]);

  if (patientsResult.error) throw patientsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const usersById = await fetchUsersByIds(patientIds);
  const patientsById = indexById((patientsResult.data || []).map(patient => ({
    ...patient,
    users: usersById[patient.id]
  })));
  const paymentsByAppointmentId = (paymentsResult.data || []).reduce((acc, payment) => {
    acc[payment.appointment_id] = acc[payment.appointment_id] || [];
    acc[payment.appointment_id].push(payment);
    return acc;
  }, {});

  return appointments.map(appointment => ({
    ...appointment,
    _id: appointment.id,
    patient: mapPatient(patientsById[appointment.patient_id]),
    patientId: mapPatient(patientsById[appointment.patient_id]),
    appointmentDate: appointment.appointment_date,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
    consultationFee: appointment.consultation_fee,
    paymentStatus: appointment.payment_status,
    payments: paymentsByAppointmentId[appointment.id] || []
  }));
};

// Get all doctors with optional filters
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization, minRating, rating, maxFee, isAvailable, page = 1, limit = 50 } = req.query;
    const minimumRating = minRating || rating;

    let query = supabaseAdmin
      .from('doctors')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }

    if (minimumRating) {
      query = query.gte('rating', parseFloat(minimumRating));
    }

    if (maxFee) {
      query = query.lte('consultation_fee', parseFloat(maxFee));
    }

    if (isAvailable === 'true') {
      query = query.eq('is_available', true);
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const doctors = await attachUsersToDoctors(data || []);

    res.status(200).json({
      success: true,
      data: doctors.map(mapDoctor),
      doctors: doctors.map(mapDoctor),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Get all doctors error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const { data: availability, error: availabilityError } = await supabaseAdmin
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', id);

    if (availabilityError) {
      return res.status(400).json({
        success: false,
        message: availabilityError.message
      });
    }

    const [doctor] = await attachUsersToDoctors([{ ...data, doctor_availability: availability || [] }]);

    res.status(200).json({
      success: true,
      data: mapDoctor(doctor),
      doctor: mapDoctor(doctor)
    });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const { specialization, name, fee, rating } = req.query;

    let query = supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('is_available', true);

    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }

    if (fee) {
      query = query.lte('consultation_fee', parseFloat(fee));
    }

    if (rating) {
      query = query.gte('rating', parseFloat(rating));
    }

    const { data, error } = await query.limit(20);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const doctors = await attachUsersToDoctors(data || []);

    res.status(200).json({
      success: true,
      data: doctors.map(mapDoctor),
      doctors: doctors.map(mapDoctor)
    });
  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { specialization, bio, education, consultation_fee, hospital, department } = req.body;

    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update({
        specialization,
        bio,
        education,
        consultation_fee: parseFloat(consultation_fee),
        hospital,
        department,
        updated_at: new Date()
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor bank details
exports.updateDoctorBankDetails = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { bank_name, bankName, account_number, accountNumber, account_name, accountName } = req.body;

    const updatePayload = {
      updated_at: new Date()
    };

    if (bank_name || bankName) updatePayload.bank_name = bank_name || bankName;
    if (account_number || accountNumber) updatePayload.account_number = account_number || accountNumber;
    if (account_name || accountName) updatePayload.account_name = account_name || accountName;

    const { data, error } = await supabaseAdmin
      .from('doctors')
      .update(updatePayload)
      .eq('id', doctorId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data
    });
  } catch (error) {
    console.error('Update doctor bank details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor availability
exports.updateAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability must be an array'
      });
    }

    // Delete existing availability
    await supabaseAdmin
      .from('doctor_availability')
      .delete()
      .eq('doctor_id', doctorId);

    const DAY_NAME_TO_INDEX = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    const normalizeDayOfWeek = (dayOfWeek) => {
      if (typeof dayOfWeek === 'number') {
        return Number.isInteger(dayOfWeek) ? dayOfWeek : null;
      }
      if (typeof dayOfWeek === 'string') {
        const normalized = dayOfWeek.trim().toLowerCase();
        if (DAY_NAME_TO_INDEX.hasOwnProperty(normalized)) {
          return DAY_NAME_TO_INDEX[normalized];
        }
        const parsed = parseInt(normalized, 10);
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    // Insert new availability
    const availabilityData = availability.map(slot => {
      const normalizedDay = normalizeDayOfWeek(slot.dayOfWeek);
      return {
        doctor_id: doctorId,
        day_of_week: normalizedDay,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: true
      };
    });

    const { error } = await supabaseAdmin
      .from('doctor_availability')
      .insert(availabilityData);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, date } = req.query;

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('appointment_date', date);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const appointments = await hydrateDoctorAppointments(data || []);

    res.status(200).json({
      success: true,
      data: appointments,
      appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor earnings/statistics
exports.getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('doctor_stats')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Get total earnings
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('doctor_id', doctorId)
      .eq('payment_status', 'completed');

    const totalEarnings = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

    res.status(200).json({
      success: true,
      data: {
        ...data,
        totalEarnings: totalEarnings
      }
    });
  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
