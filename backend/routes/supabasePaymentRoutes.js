const express = require('express');
const router = express.Router();
const { verifySupabaseToken, getUserRole, authorize } = require('../middleware/supabaseAuth');
const paymentController = require('../controllers/supabasePaymentController');

// Record payments - Bank Transfer and Cryptocurrency only (patient)
router.post('/bank-transfer', verifySupabaseToken, getUserRole, authorize('patient'), paymentController.recordBankTransfer);
router.post('/crypto', verifySupabaseToken, getUserRole, authorize('patient'), paymentController.recordCryptoPayment);

// Get payment history (patient)
router.get('/history', verifySupabaseToken, getUserRole, authorize('patient'), paymentController.getPaymentHistory);

// Admin routes for verification
router.put('/:paymentId/verify-transfer', verifySupabaseToken, getUserRole, authorize('doctor', 'admin'), paymentController.verifyBankTransfer);
router.get('/analytics', verifySupabaseToken, getUserRole, authorize('admin'), paymentController.getPaymentAnalytics);

module.exports = router;
