const express = require('express');
const patientController = require('../controllers/patientController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Patient Routes
router.get('/all', verifyToken, authorize('admin'), patientController.getAllPatients);
router.get('/profile/:id?', verifyToken, patientController.getPatientProfile);
router.put('/profile', verifyToken, patientController.updatePatientProfile);
router.get('/appointments', verifyToken, patientController.getPatientAppointments);
router.get('/payments', verifyToken, patientController.getPatientPayments);

module.exports = router;
