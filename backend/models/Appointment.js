const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  startTime: {
    type: String, // HH:MM format
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String, // HH:MM format
    required: [true, 'End time is required']
  },
  duration: {
    type: Number,
    default: 30, // minutes
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required']
  },
  notes: String,
  consultationFee: {
    type: Number,
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockExpiresAt: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for quick searches
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });

// Method to check if appointment can be modified
appointmentSchema.methods.canModify = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  return appointmentDateTime > new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours before
};

module.exports = mongoose.model('Appointment', appointmentSchema);
