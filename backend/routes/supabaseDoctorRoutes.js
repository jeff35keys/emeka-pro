const express = require('express');
const router = express.Router();
const { verifySupabaseToken, getUserRole, authorize } = require('../middleware/supabaseAuth');
const doctorController = require('../controllers/supabaseDoctorController');

// Public routes
router.get('/', doctorController.getAllDoctors);
router.get('/search', doctorController.searchDoctors);

// Protected routes - Doctor only
router.put('/profile', verifySupabaseToken, getUserRole, authorize('doctor'), doctorController.updateDoctorProfile);
router.put('/bank-details', verifySupabaseToken, getUserRole, authorize('doctor'), doctorController.updateDoctorBankDetails);
router.put('/availability', verifySupabaseToken, getUserRole, authorize('doctor'), doctorController.updateAvailability);
router.get('/appointments/list', verifySupabaseToken, getUserRole, authorize('doctor'), doctorController.getDoctorAppointments);
router.get('/schedule/:id', verifySupabaseToken, getUserRole, authorize('doctor', 'admin'), doctorController.getDoctorAppointments);
router.get('/stats', verifySupabaseToken, getUserRole, authorize('doctor'), doctorController.getDoctorStats);

router.get('/:id', doctorController.getDoctorById);

module.exports = router;
