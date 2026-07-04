const express = require('express');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

const router = express.Router();

// Admin Dashboard
router.get('/dashboard', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const totalPayments = await Payment.countDocuments();
    
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const pendingAppointments = await Appointment.countDocuments({ status: 'scheduled' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        totalPayments,
        appointmentStats: {
          completed: completedAppointments,
          pending: pendingAppointments,
          cancelled: cancelledAppointments
        },
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Manage Users
router.get('/users', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').limit(100);
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Deactivate User
router.put('/users/:userId/deactivate', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// View All Appointments
router.get('/appointments', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId')
      .populate('doctorId')
      .sort({ appointmentDate: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// System Reports
router.get('/reports/revenue', verifyToken, authorize('admin'), async (req, res) => {
  try {
    const monthlyRevenue = await Payment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
