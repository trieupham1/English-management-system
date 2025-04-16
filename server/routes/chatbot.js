const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect, authorize } = require('../middleware/auth');

// Get chat history for a user
router.get('/history/:userId', protect, chatbotController.getChatHistory);

// Save a chat message
router.post('/message/:userId', protect, chatbotController.saveMessage);

// Process a user message and generate a response
router.post('/process/:userId', protect, chatbotController.processMessage);

// Clear chat history
router.delete('/history/:userId', protect, chatbotController.clearChatHistory);

// Train chatbot with new responses (admin/manager only)
router.post('/train', protect, authorize('manager'), chatbotController.trainChatbot);

// Get FAQ responses
router.get('/faq', chatbotController.getFAQResponses);

// Get chatbot statistics (admin/manager only)
router.get('/stats', protect, authorize('manager'), chatbotController.getChatbotStats);

module.exports = router;