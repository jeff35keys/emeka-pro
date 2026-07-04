const express = require('express');
const router = express.Router();
const { verifySupabaseToken, getUserRole, authorize } = require('../middleware/supabaseAuth');
const notificationController = require('../controllers/supabaseNotificationController');

router.get('/', verifySupabaseToken, getUserRole, notificationController.getNotifications);
router.put('/:notificationId/read', verifySupabaseToken, getUserRole, notificationController.markAsRead);

module.exports = router;
