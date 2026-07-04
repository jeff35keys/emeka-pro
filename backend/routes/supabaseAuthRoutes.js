const express = require('express');
const router = express.Router();
const { verifySupabaseToken, getUserRole, authorize, isAuthenticated } = require('../middleware/supabaseAuth');
const { validateEmail, validatePassword, validatePhoneNumber } = require('../middleware/validationMiddleware');
const authController = require('../controllers/supabaseAuthController');

// Public routes
router.post('/register', validateEmail, validatePassword, validatePhoneNumber, authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/repair-missing', verifySupabaseToken, getUserRole, authorize('admin'), authController.repairMissingUsers);

// Protected routes
router.get('/profile', verifySupabaseToken, getUserRole, authController.getProfile);
router.put('/profile', verifySupabaseToken, getUserRole, authController.updateProfile);
router.post('/change-password', verifySupabaseToken, getUserRole, authController.changePassword);
router.post('/logout', verifySupabaseToken, authController.logout);

module.exports = router;
