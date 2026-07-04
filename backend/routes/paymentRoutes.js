const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Payment Routes
router.post('/create', verifyToken, paymentController.createPayment);

// Cash Payment
router.post('/cash', verifyToken, authorize('patient', 'admin'), paymentController.recordCashPayment);

// Bank Transfer
router.post('/bank-transfer', verifyToken, authorize('patient'), paymentController.recordBankTransfer);

// Cryptocurrency Payment
router.post('/crypto', verifyToken, authorize('patient'), paymentController.recordCryptoPayment);

// Verification (Admin)
router.put('/:paymentId/verify-transfer', verifyToken, authorize('admin'), paymentController.verifyBankTransfer);

// Payment History and Analytics
router.get('/history', verifyToken, paymentController.getPaymentHistory);
router.get('/analytics', verifyToken, authorize('admin'), paymentController.getPaymentAnalytics);

module.exports = router;
