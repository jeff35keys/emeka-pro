const { supabaseAdmin } = require('../config/supabase');

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization, minRating, isAvailable } = req.query;

    let query = supabaseAdmin
      .from('doctors')
      .select('*, users(first_name, last_name, email, phone_number, avatar_url)');

    if (specialization) {
      query = query.eq('specialization', specialization);
    }

    if (isAvailable) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    const { data: doctors, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Filter by rating if specified
    let filteredDoctors = doctors;
    if (minRating) {
      filteredDoctors = doctors.filter(doc => doc.rating >= parseFloat(minRating));
    }

    res.status(200).json({
      success: true,
      data: filteredDoctors,
      count: filteredDoctors.length
    });
  } catch (error) {
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

    const { data: doctor, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        users(first_name, last_name, email, phone_number, avatar_url),
        doctor_availability(*),
        appointments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search doctors
exports.searchDoctors = async (req, res) => {
  try {
    const { specialization, fee, rating } = req.query;

    let query = supabaseAdmin
      .from('doctors')
      .select('*, users(first_name, last_name, email, phone_number)');

    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }

    const { data: doctors, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    let results = doctors;

    if (fee) {
      results = results.filter(doc => doc.consultation_fee <= parseFloat(fee));
    }

    if (rating) {
      results = results.filter(doc => doc.rating >= parseFloat(rating));
    }

    res.status(200).json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor profile
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.userId;

    const { data: doctor, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        *,
        users(first_name, last_name, email, phone_number)
      `)
      .eq('id', doctorId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { bio, education, consultationFee, consultationDuration } = req.body;

    const { data: updated, error } = await supabaseAdmin
      .from('doctors')
      .update({
        bio,
        education,
        consultation_fee: consultationFee,
        consultation_duration: consultationDuration
      })
      .eq('id', doctorId)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor availability
exports.updateAvailability = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;

    const normalizeDayOfWeek = (value) => {
      if (typeof value === 'number') {
        return Number.isInteger(value) ? value : null;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        const days = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6
        };
        return days[normalized] ?? (Number.isInteger(parseInt(normalized, 10)) ? parseInt(normalized, 10) : null);
      }
      return null;
    };

    const normalizedDay = normalizeDayOfWeek(dayOfWeek);

    // Delete existing availability for this day
    await supabaseAdmin
      .from('doctor_availability')
      .delete()
      .eq('doctor_id', doctorId)
      .eq('day_of_week', normalizedDay);

    // Insert new availability
    const { data: availability, error } = await supabaseAdmin
      .from('doctor_availability')
      .insert({
        doctor_id: doctorId,
        day_of_week: normalizedDay,
        start_time: startTime,
        end_time: endTime,
        is_available: isAvailable
      })
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: availability[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor's schedule
exports.getDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: availability, error } = await supabaseAdmin
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', id)
      .order('day_of_week');

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { status } = req.query;

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients(*, users(first_name, last_name, email, phone_number))
      `)
      .eq('doctor_id', doctorId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query.order('appointment_date');

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
