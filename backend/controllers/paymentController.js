const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// Create Payment Record
exports.createPayment = async (req, res) => {
  try {
    const { appointmentId, amount, paymentMethod } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const payment = new Payment({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: amount || appointment.consultationFee,
      paymentMethod,
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });

    await payment.save();

    // Link payment to appointment
    appointment.payment = payment._id;
    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Payment record created',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Record Cash Payment
exports.recordCashPayment = async (req, res) => {
  try {
    const { appointmentId, amount, receivedBy } = req.body;

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.paymentStatus = 'completed';
    payment.cashDetails = {
      receivedBy,
      receivedAt: new Date(),
      receipt: `RECEIPT${Date.now()}`
    };
    payment.paidAt = new Date();

    await payment.save();

    // Update appointment payment status
    await Appointment.findByIdAndUpdate(
      appointmentId,
      { 'payment.paymentStatus': 'completed' }
    );

    res.status(200).json({
      success: true,
      message: 'Cash payment recorded successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Record Bank Transfer
exports.recordBankTransfer = async (req, res) => {
  try {
    const { appointmentId, bankName, accountNumber, transactionReference, proofImage } = req.body;

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.paymentStatus = 'pending'; // Pending verification
    payment.bankTransferDetails = {
      bankName,
      accountNumber,
      transactionReference,
      proofImage,
      verificationStatus: 'pending'
    };

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Bank transfer recorded - pending verification',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Record Cryptocurrency Payment
exports.recordCryptoPayment = async (req, res) => {
  try {
    const { appointmentId, coinType, walletAddress, transactionHash, amountInCrypto, exchangeRate } = req.body;

    const payment = await Payment.findOne({ appointmentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    payment.paymentStatus = 'pending'; // Pending blockchain confirmation
    payment.cryptoDetails = {
      coinType,
      walletAddress,
      transactionHash,
      amountInCrypto,
      exchangeRate,
      confirmations: 0
    };

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Cryptocurrency payment recorded - awaiting confirmations',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Bank Transfer (Admin)
exports.verifyBankTransfer = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { verificationStatus, verifiedBy } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        'bankTransferDetails.verificationStatus': verificationStatus,
        'bankTransferDetails.verifiedBy': verifiedBy,
        'bankTransferDetails.verifiedAt': new Date(),
        paymentStatus: verificationStatus === 'verified' ? 'completed' : 'failed',
        paidAt: verificationStatus === 'verified' ? new Date() : null
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment ${verificationStatus} successfully`,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.paymentStatus = status;

    const payments = await Payment.find(filter)
      .populate('appointmentId')
      .populate('patientId')
      .populate('doctorId')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Payment Analytics
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({ paymentStatus: 'completed' });
    const pendingPayments = await Payment.countDocuments({ paymentStatus: 'pending' });
    
    const paymentMethodStats = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = await Payment.aggregate([
      {
        $match: { paymentStatus: 'completed' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalPayments,
        completedPayments,
        pendingPayments,
        paymentMethodStats,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
