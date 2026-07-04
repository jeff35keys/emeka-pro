const express = require('express');
const doctorController = require('../controllers/doctorController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public Routes
router.get('/', doctorController.getAllDoctors);
router.get('/search', doctorController.searchDoctors);
router.get('/:id', doctorController.getDoctorById);

// Doctor Protected Routes
router.get('/profile/:id?', verifyToken, doctorController.getDoctorProfile);
router.put('/profile', verifyToken, authorize('doctor'), doctorController.updateDoctorProfile);
router.get('/schedule/:id?', doctorController.getDoctorSchedule);
router.put('/availability', verifyToken, authorize('doctor'), doctorController.updateAvailability);
router.get('/appointments/list', verifyToken, authorize('doctor'), doctorController.getDoctorAppointments);

module.exports = router;
