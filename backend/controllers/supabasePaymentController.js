const { supabaseAdmin } = require('../config/supabase');

const getAuthenticatedUserId = (req) => req.user?.id || req.userId;
const getAuthenticatedRole = (req) => req.user?.role || req.userRole;

const getAppointmentForPayment = async (appointmentId, patientId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('id, patient_id, doctor_id, consultation_fee, payment_status')
    .eq('id', appointmentId)
    .eq('patient_id', patientId)
    .single();

  if (error || !data) {
    throw new Error('Appointment not found');
  }

  return data;
};

// Record bank transfer
exports.recordBankTransfer = async (req, res) => {
  try {
    const patientId = getAuthenticatedUserId(req);
    const { appointmentId, amount, bankName, accountNumber, transactionReference } = req.body;

    if (!appointmentId || !bankName || !transactionReference) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const appointment = await getAppointmentForPayment(appointmentId, patientId);
    const transactionId = `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: appointment.doctor_id,
        amount: parseFloat(amount || appointment.consultation_fee),
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        transaction_id: transactionId,
        bank_name: bankName,
        bank_account_number: accountNumber,
        bank_transaction_reference: transactionReference,
        bank_verification_status: 'pending'
      })
      .select()
      .single();

    await supabaseAdmin
      .from('appointments')
      .update({ payment_status: 'pending', updated_at: new Date() })
      .eq('id', appointmentId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    // Notify doctor that a patient has initiated a bank transfer for their appointment
    try {
      const notificationController = require('./supabaseNotificationController');
      await notificationController.createNotification({
        userId: appointment.doctor_id,
        title: 'Payment Initiated',
        message: `A patient initiated a bank transfer for appointment on ${appointment.appointment_date}.`,
        type: 'payment_initiated',
        relatedAppointmentId: appointmentId
      });
    } catch (notifyErr) {
      console.error('Failed to create payment-initiated notification:', notifyErr);
    }

    res.status(201).json({
      success: true,
      message: 'Bank transfer recorded successfully. Awaiting verification.',
      data: data
    });
  } catch (error) {
    console.error('Record bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Record cryptocurrency payment
exports.recordCryptoPayment = async (req, res) => {
  try {
    const patientId = getAuthenticatedUserId(req);
    const { appointmentId, amount, coinType, walletAddress, transactionHash, amountInCrypto, exchangeRate } = req.body;

    if (!appointmentId || !coinType || !walletAddress || !transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const appointment = await getAppointmentForPayment(appointmentId, patientId);
    const transactionId = `CRYPTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: appointment.doctor_id,
        amount: parseFloat(amount || appointment.consultation_fee),
        payment_method: 'cryptocurrency',
        payment_status: 'pending',
        transaction_id: transactionId,
        crypto_coin_type: coinType,
        crypto_wallet_address: walletAddress,
        crypto_transaction_hash: transactionHash,
        crypto_amount: parseFloat(amountInCrypto),
        crypto_exchange_rate: parseFloat(exchangeRate),
        crypto_confirmations: 0
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    // Notify doctor about crypto payment initiation
    try {
      const notificationController = require('./supabaseNotificationController');
      await notificationController.createNotification({
        userId: appointment.doctor_id,
        title: 'Crypto Payment Initiated',
        message: `A patient initiated a crypto payment for appointment on ${appointment.appointment_date}.`,
        type: 'payment_initiated',
        relatedAppointmentId: appointmentId
      });
    } catch (notifyErr) {
      console.error('Failed to create crypto payment notification:', notifyErr);
    }

    res.status(201).json({
      success: true,
      message: 'Crypto payment recorded. Confirmations pending.',
      data: data
    });
  } catch (error) {
    console.error('Record crypto payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const patientId = getAuthenticatedUserId(req);
    const { status, method } = req.query;

    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        appointments!payments_appointment_id_fkey(
          id,
          appointment_date,
          start_time,
          doctors!appointments_doctor_id_fkey(
            id,
            users!doctors_id_fkey(first_name, last_name)
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('payment_status', status);
    }

    if (method) {
      query = query.eq('payment_method', method);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify bank transfer (Admin)
exports.verifyBankTransfer = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { verificationStatus } = req.body;

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Verification status must be "verified" or "rejected"'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        bank_verification_status: verificationStatus,
        bank_verified_by: getAuthenticatedUserId(req),
        bank_verified_at: new Date(),
        payment_status: verificationStatus === 'verified' ? 'completed' : 'failed',
        updated_at: new Date()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (data?.appointment_id) {
      await supabaseAdmin
        .from('appointments')
        .update({
          payment_status: verificationStatus === 'verified' ? 'completed' : 'failed',
          updated_at: new Date()
        })
        .eq('id', data.appointment_id);
    }

    // Notify patient about verification result
    try {
      const notificationController = require('./supabaseNotificationController');
      await notificationController.createNotification({
        userId: data.patient_id,
        title: verificationStatus === 'verified' ? 'Payment Verified' : 'Payment Rejected',
        message: verificationStatus === 'verified'
          ? 'Your bank transfer has been verified and payment is complete.'
          : 'Your bank transfer verification failed. Please check the reference and try again.',
        type: verificationStatus === 'verified' ? 'payment_verified' : 'payment_failed',
        relatedAppointmentId: data.appointment_id
      });
    } catch (notifyErr) {
      console.error('Failed to create payment verification notification:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: `Payment ${verificationStatus} successfully`,
      data: data
    });
  } catch (error) {
    console.error('Verify bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get payment analytics (Admin)
exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('payment_analytics')
      .select('*');

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Calculate totals
    const totalRevenue = data?.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0) || 0;
    const byMethod = {};

    data?.forEach(row => {
      if (!byMethod[row.payment_method]) {
        byMethod[row.payment_method] = {
          method: row.payment_method,
          total: 0,
          count: 0
        };
      }
      byMethod[row.payment_method].total += parseFloat(row.total_amount || 0);
      byMethod[row.payment_method].count += row.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        byMethod: Object.values(byMethod),
        dailyBreakdown: data
      }
    });
  } catch (error) {
    console.error('Get payment analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
