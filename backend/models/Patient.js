const mongoose = require('mongoose');
const User = require('./User');

const patientSchema = new mongoose.Schema({
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  allergies: {
    type: String,
    default: ''
  },
  insuranceProvider: String,
  insurancePolicyNumber: String,
  preferredDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  appointmentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  paymentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  totalAppointments: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = User.discriminator('patient', patientSchema);
