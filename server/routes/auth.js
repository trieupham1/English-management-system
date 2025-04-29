// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (authentication required)
router.get('/current', protect, authController.getCurrentUser);
router.post('/logout', protect, authController.logout);
router.put('/change-password', protect, authController.changePassword);

// Role-specific routes
router.post('/student/register', 
    authorize('manager'), 
    authController.registerStudent
);

router.post('/teacher/register', 
    authorize('manager'), 
    authController.registerTeacher
);

router.post('/manager/register', 
    authorize('manager'), 
    authController.registerManager
);

module.exports = router;