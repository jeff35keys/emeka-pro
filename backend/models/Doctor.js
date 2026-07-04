const mongoose = require('mongoose');
const User = require('./User');

const doctorSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: ['General Practice', 'Cardiology', 'Pediatrics', 'Dermatology', 'Gynecology', 'Orthopedics', 'Neurology', 'Psychiatry', 'Internal Medicine', 'Surgery']
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: 0
  },
  hospital: {
    type: String,
    required: [true, 'Hospital/Clinic name is required']
  },
  department: String,
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: 0
  },
  consultationDuration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  bio: String,
  education: {
    type: String,
    default: ''
  },
  certifications: [{
    name: String,
    issuer: String,
    year: Number
  }],
  availability: [{
    dayOfWeek: {
      type: Number, // 0 = Sunday, 6 = Saturday
      min: 0,
      max: 6
    },
    startTime: String, // HH:MM format
    endTime: String,
    isAvailable: Boolean
  }],
  breaktimes: [{
    date: Date,
    startTime: String,
    endTime: String,
    reason: String
  }],
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalPatients: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for quick searches
doctorSchema.index({ specialization: 1, isAvailable: 1 });
doctorSchema.index({ hospital: 1, department: 1 });

module.exports = User.discriminator('doctor', doctorSchema);
