const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

// Get Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalPatients = await User.countDocuments({ userType: 'patient' });
    const totalAppointments = await Appointment.countDocuments();
    
    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentStats = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAppointments,
        appointmentStats,
        paymentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get System Performance Metrics
exports.getSystemMetrics = async (req, res) => {
  try {
    // Average appointment per doctor
    const appointmentsPerDoctor = await Doctor.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'appointments'
        }
      },
      {
        $group: {
          _id: null,
          avgAppointments: { $avg: { $size: '$appointments' } },
          maxAppointments: { $max: { $size: '$appointments' } }
        }
      }
    ]);

    // Doctor utilization rate
    const doctorStats = await Doctor.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'appointments'
        }
      },
      {
        $addFields: {
          completedCount: {
            $size: {
              $filter: {
                input: '$appointments',
                as: 'apt',
                cond: { $eq: ['$$apt.status', 'completed'] }
              }
            }
          },
          totalCount: { $size: '$appointments' }
        }
      },
      {
        $group: {
          _id: null,
          avgUtilization: { $avg: { $divide: ['$completedCount', { $cond: [{ $eq: ['$totalCount', 0] }, 1, '$totalCount'] }] } }
        }
      }
    ]);

    // No-show rate
    const noShowRate = await Appointment.aggregate([
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          noShowCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          noShowRate: { $divide: ['$noShowCount', '$totalAppointments'] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        appointmentsPerDoctor: appointmentsPerDoctor[0] || {},
        doctorUtilization: doctorStats[0] || {},
        noShowRate: noShowRate[0] || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get System Health Status
exports.getSystemHealth = async (req, res) => {
  try {
    const dbHealth = await User.findOne().limit(1);
    
    res.status(200).json({
      success: true,
      health: {
        database: dbHealth ? 'Connected' : 'Disconnected',
        timestamp: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export System Data
exports.exportSystemData = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const appointments = await Appointment.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('patientId').populate('doctorId');

    const payments = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const users = await User.find().select('-password');

    const exportData = {
      exportDate: new Date(),
      period: { startDate, endDate },
      summary: {
        totalAppointments: appointments.length,
        totalPayments: payments.length,
        totalUsers: users.length
      },
      appointments,
      payments,
      users
    };

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
