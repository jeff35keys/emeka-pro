const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, authorize } = require('../middleware/authMiddleware');
const { validateAppointmentDate } = require('../middleware/validationMiddleware');

const router = express.Router();

// Appointment Routes
router.post('/create', verifyToken, authorize('patient'), validateAppointmentDate, appointmentController.createAppointment);
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/:appointmentId', appointmentController.getAppointmentDetails);

// Patient Appointment Management
router.put('/:appointmentId/cancel', verifyToken, appointmentController.cancelAppointment);
router.put('/:appointmentId/reschedule', verifyToken, validateAppointmentDate, appointmentController.rescheduleAppointment);

// Doctor Appointment Management
router.put('/:appointmentId/complete', verifyToken, authorize('doctor'), appointmentController.completeAppointment);

module.exports = router;
