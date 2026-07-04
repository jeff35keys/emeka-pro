const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Create Appointment with Slot Locking
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, startTime, endTime, reason, consultationFee } = req.body;
    const patientId = req.userId;

    // Validate appointment date
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for slot conflicts (Lock mechanism)
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
      },
      startTime,
      status: { $in: ['scheduled', 'completed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment with lock
    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      reason,
      consultationFee: consultationFee || doctor.consultationFee,
      duration: doctor.consultationDuration,
      isLocked: true,
      lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes lock
    });

    await appointment.save();

    // Add to patient's appointment history
    await Patient.findByIdAndUpdate(
      patientId,
      { $push: { appointmentHistory: appointment._id } },
      { new: true }
    );

    // Add to doctor's appointments
    await Doctor.findByIdAndUpdate(
      doctorId,
      { $push: { appointments: appointment._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment,
      lockExpiresAt: appointment.lockExpiresAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Available Slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get booked appointments for the date
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: date,
      status: { $in: ['scheduled', 'completed'] }
    });

    const bookedSlots = bookedAppointments.map(apt => apt.startTime);

    // Generate available slots (example: 9 AM to 5 PM, 30-minute slots)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = doctor.consultationDuration || 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!bookedSlots.includes(timeString)) {
          availableSlots.push(timeString);
        }
      }
    }

    res.status(200).json({
      success: true,
      availableSlots,
      doctorId,
      date
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel Appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be modified
    if (!appointment.canModify()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled within 24 hours'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reschedule Appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate, startTime, endTime } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!appointment.canModify()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be rescheduled within 24 hours'
      });
    }

    // Check for slot conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      appointmentDate,
      startTime,
      _id: { $ne: appointmentId },
      status: { $in: ['scheduled', 'completed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'The selected time slot is already booked'
      });
    }

    appointment.appointmentDate = appointmentDate;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = 'rescheduled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Appointment Details
exports.getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId')
      .populate('doctorId')
      .populate('payment');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark Appointment as Complete
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: 'completed',
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed',
      appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
