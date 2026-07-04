const { supabaseAdmin } = require('../config/supabase');

const mapDoctor = (doctor) => doctor ? ({
  ...doctor,
  _id: doctor.id,
  firstName: doctor.users?.first_name || doctor.user?.first_name || '',
  lastName: doctor.users?.last_name || doctor.user?.last_name || '',
  email: doctor.users?.email || doctor.user?.email || '',
  phoneNumber: doctor.users?.phone_number || doctor.user?.phone_number || '',
  specialization: doctor.specialization,
  consultationFee: doctor.consultation_fee,
  consultationDuration: doctor.consultation_duration
}) : null;

const mapPatient = (patient) => patient ? ({
  ...patient,
  _id: patient.id,
  firstName: patient.users?.first_name || patient.first_name || '',
  lastName: patient.users?.last_name || patient.last_name || '',
  email: patient.users?.email || patient.email || '',
  phoneNumber: patient.users?.phone_number || patient.phone_number || '',
  dateOfBirth: patient.date_of_birth,
  medicalHistory: patient.medical_history,
  totalAppointments: patient.total_appointments,
  totalSpent: patient.total_spent
}) : null;

const mapAppointment = (appointment) => ({
  ...appointment,
  _id: appointment.id,
  doctorId: mapDoctor(appointment.doctors),
  patientId: mapPatient(appointment.patients) || appointment.patient_id,
  patient: mapPatient(appointment.patients),
  appointmentDate: appointment.appointment_date,
  startTime: appointment.start_time,
  endTime: appointment.end_time,
  consultationFee: appointment.consultation_fee,
  paymentStatus: appointment.payment_status,
  payments: appointment.payments || []
});

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DEFAULT_AVAILABILITY = [{
  start_time: '09:00',
  end_time: '17:00'
}];

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

const hydrateAppointments = async (appointments = []) => {
  if (appointments.length === 0) return [];

  const doctorIds = appointments.map(appointment => appointment.doctor_id);
  const patientIds = appointments.map(appointment => appointment.patient_id);
  const appointmentIds = appointments.map(appointment => appointment.id);

  const [doctorsResult, patientsResult, paymentsResult] = await Promise.all([
    supabaseAdmin.from('doctors').select('*').in('id', [...new Set(doctorIds.filter(Boolean))]),
    supabaseAdmin.from('patients').select('*').in('id', [...new Set(patientIds.filter(Boolean))]),
    supabaseAdmin.from('payments').select('*').in('appointment_id', [...new Set(appointmentIds.filter(Boolean))])
  ]);

  if (doctorsResult.error) throw doctorsResult.error;
  if (patientsResult.error) throw patientsResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const usersById = await fetchUsersByIds([...doctorIds, ...patientIds]);
  const doctorsById = indexById((doctorsResult.data || []).map(doctor => ({
    ...doctor,
    users: usersById[doctor.id]
  })));
  const patientsById = indexById((patientsResult.data || []).map(patient => ({
    ...patient,
    users: usersById[patient.id]
  })));
  const paymentsByAppointmentId = (paymentsResult.data || []).reduce((acc, payment) => {
    acc[payment.appointment_id] = acc[payment.appointment_id] || [];
    acc[payment.appointment_id].push(payment);
    return acc;
  }, {});

  return appointments.map(appointment => mapAppointment({
    ...appointment,
    doctors: doctorsById[appointment.doctor_id],
    patients: patientsById[appointment.patient_id],
    payments: paymentsByAppointmentId[appointment.id] || []
  }));
};

// Get current user's appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: false });

    query = role === 'doctor'
      ? query.eq('doctor_id', userId)
      : query.eq('patient_id', userId);

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const appointments = await hydrateAppointments(data || []);

    res.status(200).json({
      success: true,
      data: appointments,
      appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create appointment
exports.createAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, appointmentDate, startTime, reason } = req.body;

    if (!doctorId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, and start time are required'
      });
    }

    // Check if doctor exists and get consultation duration
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('consultation_duration, consultation_fee')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date(appointmentDate);
    start.setHours(hours, minutes);

    const endDate = new Date(start);
    endDate.setMinutes(endDate.getMinutes() + doctor.consultation_duration);

    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    // Check for existing appointment at same time
    const { data: existingAppt } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointmentDate)
      .eq('start_time', startTime)
      .eq('status', 'scheduled');

    if (existingAppt && existingAppt.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment with lock
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        duration: doctor.consultation_duration,
        reason,
        consultation_fee: doctor.consultation_fee,
        status: 'scheduled',
        is_locked: true,
        lock_expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      })
      .select()
      .single();

    if (appointmentError) {
      return res.status(400).json({
        success: false,
        message: appointmentError.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: mapAppointment(appointment),
      appointment: mapAppointment(appointment)
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    // Get doctor availability for the date
    const dayOfWeekIndex = new Date(`${date}T00:00:00`).getDay();

    const { data: availability, error: availabilityError } = await supabaseAdmin
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId);

    if (availabilityError) {
      return res.status(400).json({
        success: false,
        message: availabilityError.message
      });
    }

    let schedule = (availability || [])
      .map(slot => ({ ...slot, day_of_week: normalizeDayOfWeek(slot.day_of_week) }))
      .filter(slot => slot.day_of_week !== null)
      .filter(slot => slot.day_of_week === dayOfWeekIndex);

    if (schedule.length === 0) {
      const { count, error: countError } = await supabaseAdmin
        .from('doctor_availability')
        .select('id', { count: 'exact', head: true })
        .eq('doctor_id', doctorId);

      if (countError) {
        return res.status(400).json({
          success: false,
          message: countError.message
        });
      }

      if (count && count > 0) {
        return res.status(200).json({
          success: true,
          data: [],
          availableSlots: [],
          message: 'Doctor not available on this date'
        });
      }

      schedule = DEFAULT_AVAILABILITY;
    }

    // Get booked appointments for the date
    const { data: bookedAppointments } = await supabaseAdmin
      .from('appointments')
      .select('start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('status', 'scheduled');

    const slots = [];
    const duration = 30; // minutes

    // Generate available slots
    schedule.forEach(slot => {
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);

      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMin);

      const endTime = new Date(date);
      endTime.setHours(endHour, endMin);

      while (currentTime < endTime) {
        const slotStart = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);
        const slotEndStr = `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`;

        // Check if slot is booked
        const isBooked = bookedAppointments?.some(apt =>
          apt.start_time === slotStart && apt.end_time === slotEndStr
        );

        if (!isBooked) {
          slots.push({
            time: slotStart,
            endTime: slotEndStr,
            available: true
          });
        }

        currentTime.setMinutes(currentTime.getMinutes() + duration);
      }
    });

    res.status(200).json({
      success: true,
      data: slots,
      availableSlots: slots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get appointment details
exports.getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const [appointment] = await hydrateAppointments([data]);

    res.status(200).json({
      success: true,
      data: appointment,
      appointment
    });
  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;

    // Get appointment
    const { data: appointment, error: getError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('patient_id', patientId)
      .single();

    if (getError || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if cancellation is allowed (24 hours before)
    const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const hoursUntilAppointment = (appointmentTime - new Date()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be cancelled 24 hours before the scheduled time'
      });
    }

    // Update appointment status
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Notify doctor about cancellation
    try {
      const notificationController = require('./supabaseNotificationController');
      await notificationController.createNotification({
        userId: data.doctor_id,
        title: 'Appointment Cancelled',
        message: `A patient cancelled the appointment scheduled on ${data.appointment_date}.`,
        type: 'appointment_cancelled',
        relatedAppointmentId: appointmentId
      });
    } catch (notifyErr) {
      console.error('Failed to create cancellation notification:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: data
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reschedule appointment request (patient only)
exports.rescheduleAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required to request a reschedule'
      });
    }

    // Get current appointment
    const { data: currentAppt, error: currentError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('patient_id', patientId)
      .single();

    if (currentError || !currentAppt) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const [hours, minutes] = newTime.split(':').map(Number);
    const endDate = new Date(newDate);
    endDate.setHours(hours + Math.floor((minutes + currentAppt.duration) / 60), (minutes + currentAppt.duration) % 60);
    const newEndTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        reschedule_request_status: 'pending',
        reschedule_requested_date: newDate,
        reschedule_requested_time: newTime,
        reschedule_requested_end_time: newEndTime,
        reschedule_requested_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Notify doctor of the reschedule request
    const doctorNotification = require('./supabaseNotificationController');
    await doctorNotification.createNotification({
      userId: currentAppt.doctor_id,
      title: 'Reschedule Request',
      message: `Patient requested to reschedule appointment on ${newDate} at ${newTime}.`,
      type: 'reschedule_request',
      relatedAppointmentId: appointmentId
    });

    res.status(200).json({
      success: true,
      message: 'Reschedule request submitted. Your doctor will review it shortly.',
      data: data
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve or deny reschedule request (doctor only)
exports.handleRescheduleApproval = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;
    const { approvalStatus } = req.body;

    if (!['approved', 'denied'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Approval status must be approved or denied'
      });
    }

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('doctor_id', doctorId)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const updatePayload = {
      reschedule_request_status: approvalStatus,
      reschedule_reviewed_at: new Date(),
      updated_at: new Date()
    };

    if (approvalStatus === 'approved') {
      updatePayload.appointment_date = appointment.reschedule_requested_date;
      updatePayload.start_time = appointment.reschedule_requested_time;
      updatePayload.end_time = appointment.reschedule_requested_end_time;
      updatePayload.status = 'scheduled';
      updatePayload.reschedule_request_status = 'approved';
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    const notificationController = require('./supabaseNotificationController');
    await notificationController.createNotification({
      userId: appointment.patient_id,
      title: approvalStatus === 'approved' ? 'Reschedule Approved' : 'Reschedule Denied',
      message: approvalStatus === 'approved'
        ? `Your appointment has been rescheduled to ${appointment.reschedule_requested_date} at ${appointment.reschedule_requested_time}.`
        : 'Your reschedule request was denied. Please choose another slot.',
      type: approvalStatus === 'approved' ? 'reschedule_approved' : 'reschedule_denied',
      relatedAppointmentId: appointmentId
    });

    res.status(200).json({
      success: true,
      message: `Reschedule request ${approvalStatus} successfully`,
      data: data
    });
  } catch (error) {
    console.error('Handle reschedule approval error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Complete appointment
exports.completeAppointment = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;
    const { notes } = req.body;

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'completed',
        notes,
        updated_at: new Date()
      })
      .eq('id', appointmentId)
      .eq('doctor_id', doctorId)
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
      message: 'Appointment marked as complete',
      data: data
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
