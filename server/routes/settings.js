const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// Get all system settings
router.get('/', settingsController.getAllSettings);

// Update system settings (manager only)
router.put('/', protect, authorize('manager'), settingsController.updateSettings);

// Get system statistics (manager only)
router.get('/stats', protect, authorize('manager'), settingsController.getSystemStats);

// Update user settings
router.put('/user/:userId', protect, settingsController.updateUserSettings);

// Get user settings
router.get('/user/:userId', protect, settingsController.getUserSettings);

// Backup system data (manager only)
router.post('/backup', protect, authorize('manager'), settingsController.backupData);

// Get system logs (manager only)
router.get('/logs', protect, authorize('manager'), settingsController.getSystemLogs);

module.exports = router;