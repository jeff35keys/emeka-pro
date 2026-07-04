const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateEmail, validatePassword, validatePhoneNumber } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public Routes
router.post('/register', validateEmail, validatePassword, validatePhoneNumber, authController.register);
router.post('/login', validateEmail, authController.login);

// Protected Routes
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, validateEmail, validatePhoneNumber, authController.updateProfile);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
