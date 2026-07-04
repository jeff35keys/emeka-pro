const Patient = require('../models/Patient');

// Get All Patients (Admin only)
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select('-password')
      .populate('appointmentHistory')
      .populate('paymentHistory')
      .limit(50);

    res.status(200).json({
      success: true,
      count: patients.length,
      patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Patient Profile
exports.getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id || req.userId)
      .select('-password')
      .populate('appointmentHistory')
      .populate('paymentHistory')
      .populate('preferredDoctor');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Patient Profile
exports.updatePatientProfile = async (req, res) => {
  try {
    const { dateOfBirth, gender, address, emergencyContact, medicalHistory, allergies } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.userId,
      {
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        medicalHistory,
        allergies,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Patient Appointments
exports.getPatientAppointments = async (req, res) => {
  try {
    const patient = await Patient.findById(req.userId)
      .populate({
        path: 'appointmentHistory',
        populate: { path: 'doctorId' }
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      appointments: patient.appointmentHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Patient Payment History
exports.getPatientPayments = async (req, res) => {
  try {
    const patient = await Patient.findById(req.userId)
      .populate('paymentHistory');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      payments: patient.paymentHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
