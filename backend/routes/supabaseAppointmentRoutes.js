const express = require('express');
const router = express.Router();
const { verifySupabaseToken, getUserRole, authorize } = require('../middleware/supabaseAuth');
const appointmentController = require('../controllers/supabaseAppointmentController');

// Get available slots (public)
router.get('/available-slots', appointmentController.getAvailableSlots);

// Get current user's appointments
router.get('/', verifySupabaseToken, getUserRole, appointmentController.getMyAppointments);

// Get appointment details (authenticated)
router.get('/:appointmentId', verifySupabaseToken, appointmentController.getAppointmentDetails);

// Create appointment (patient only)
router.post('/create', verifySupabaseToken, getUserRole, authorize('patient'), appointmentController.createAppointment);

// Cancel appointment (patient only)
router.put('/:appointmentId/cancel', verifySupabaseToken, getUserRole, authorize('patient'), appointmentController.cancelAppointment);

// Reschedule appointment (patient only)
router.put('/:appointmentId/reschedule', verifySupabaseToken, getUserRole, authorize('patient'), appointmentController.rescheduleAppointment);

// Doctor approves or denies reschedule requests
router.put('/:appointmentId/reschedule-approval', verifySupabaseToken, getUserRole, authorize('doctor'), appointmentController.handleRescheduleApproval);

// Complete appointment (doctor only)
router.put('/:appointmentId/complete', verifySupabaseToken, getUserRole, authorize('doctor'), appointmentController.completeAppointment);

module.exports = router;
