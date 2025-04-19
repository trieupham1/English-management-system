const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect, authorize } = require('../middleware/auth');

// Student-only routes
// Get chat history for a student
router.get('/history/:userId', protect, authorize('student'), chatbotController.getChatHistory);

// Save a chat message
router.post('/message/:userId', protect, authorize('student'), chatbotController.saveMessage);

// Process a user message and generate a response
router.post('/process/:userId', protect, authorize('student'), chatbotController.processMessage);

// Clear chat history
router.delete('/history/:userId', protect, authorize('student'), chatbotController.clearChatHistory);

// Admin/teacher routes
// Get chatbot statistics (admin/manager/teacher only)
router.get('/stats', protect, authorize('manager', 'teacher'), chatbotController.getChatbotStats);

module.exports = router;