const ChatbotMessage = require('../models/ChatbotMessage');
const User = require('../models/User');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Get chat history for a user
exports.getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const chatHistory = await ChatbotMessage.find({ user: userId })
            .sort({ timestamp: 1 });
        
        res.status(200).json({
            success: true,
            count: chatHistory.length,
            data: chatHistory
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Save a chat message
exports.saveMessage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { message, isUserMessage } = req.body;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const chatMessage = await ChatbotMessage.create({
            user: userId,
            message,
            isUserMessage,
            timestamp: Date.now()
        });
        
        res.status(201).json({
            success: true,
            data: chatMessage
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Process a user message and generate a response
exports.processMessage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Save user message
        await ChatbotMessage.create({
            user: userId,
            message,
            isUserMessage: true,
            timestamp: Date.now()
        });
        
        // Process the message and generate a response
        let response = '';
        
        // Simple keyword-based response generator
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            response = `Hello ${user.fullName}! How can I help you today?`;
        } else if (lowerMessage.includes('class') && lowerMessage.includes('schedule')) {
            // Get user's class schedule
            if (user.role === 'student' && user.studentInfo && user.studentInfo.courses.length > 0) {
                const courses = await Course.find({
                    _id: { $in: user.studentInfo.courses }
                }).select('name schedule');
                
                response = 'Here is your class schedule:\n\n';
                courses.forEach(course => {
                    response += `${course.name}:\n`;
                    course.schedule.forEach(sch => {
                        response += `- ${sch.day.charAt(0).toUpperCase() + sch.day.slice(1)}: ${sch.startTime} - ${sch.endTime}, Room: ${sch.room}\n`;
                    });
                    response += '\n';
                });
            } else if (user.role === 'teacher' && user.teacherInfo && user.teacherInfo.classes.length > 0) {
                const courses = await Course.find({
                    _id: { $in: user.teacherInfo.classes }
                }).select('name schedule');
                
                response = 'Here is your teaching schedule:\n\n';
                courses.forEach(course => {
                    response += `${course.name}:\n`;
                    course.schedule.forEach(sch => {
                        response += `- ${sch.day.charAt(0).toUpperCase() + sch.day.slice(1)}: ${sch.startTime} - ${sch.endTime}, Room: ${sch.room}\n`;
                    });
                    response += '\n';
                });
            } else {
                response = "I don't have any schedule information for you at the moment.";
            }
        } else if (lowerMessage.includes('assignment') || lowerMessage.includes('homework')) {
            if (user.role === 'student') {
                response = "To check your assignments, please go to the 'Assignments' section in your student dashboard.";
            } else if (user.role === 'teacher') {
                response = "To manage assignments, please go to the 'Assignments' section in your teacher dashboard.";
            } else {
                response = "I can't provide assignment information for your user role.";
            }
        } else if (lowerMessage.includes('course') || lowerMessage.includes('class')) {
            if (user.role === 'student' && user.studentInfo && user.studentInfo.courses.length > 0) {
                const courses = await Course.find({
                    _id: { $in: user.studentInfo.courses }
                }).select('name level teacher')
                .populate('teacher', 'fullName');
                
                response = 'You are currently enrolled in the following courses:\n\n';
                courses.forEach(course => {
                    response += `- ${course.name} (${course.level}), Teacher: ${course.teacher.fullName}\n`;
                });
            } else if (user.role === 'teacher' && user.teacherInfo && user.teacherInfo.classes.length > 0) {
                const courses = await Course.find({
                    _id: { $in: user.teacherInfo.classes }
                }).select('name level');
                
                response = 'You are currently teaching the following courses:\n\n';
                courses.forEach(course => {
                    response += `- ${course.name} (${course.level})\n`;
                });
            } else {
                response = "I don't have any course information for you at the moment.";
            }
        } else if (lowerMessage.includes('help')) {
            response = `I can help you with information about:
- Your class schedule
- Your courses
- Assignments
- General questions about the English Learning Center

What would you like to know about?`;
        } else {
            response = "I'm sorry, I don't understand your question. Can you please rephrase or ask something else?";
        }
        
        // Save bot response
        const botMessage = await ChatbotMessage.create({
            user: userId,
            message: response,
            isUserMessage: false,
            timestamp: Date.now()
        });
        
        res.status(200).json({
            success: true,
            data: botMessage
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Clear chat history
exports.clearChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        await ChatbotMessage.deleteMany({ user: userId });
        
        res.status(200).json({
            success: true,
            message: 'Chat history cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Train chatbot with new responses (for admin use)
exports.trainChatbot = async (req, res) => {
    try {
        const { keywords, response } = req.body;
        
        // In a real implementation, this would add entries to a knowledge base
        // that the chatbot uses to generate responses. Here, we'll simulate this
        // with a success response.
        
        // Normally, you would save this to a ChatbotTraining model or similar
        res.status(200).json({
            success: true,
            message: 'Chatbot trained successfully',
            data: { keywords, response }
        });
    } catch (error) {
        console.error('Error training chatbot:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get FAQ responses
exports.getFAQResponses = async (req, res) => {
    try {
        // In a real implementation, this would fetch from a database
        // Here, we'll return some hardcoded FAQs
        const faqs = [
            {
                question: "What are the center's operating hours?",
                answer: "Our center is open Monday to Friday from 8:00 AM to 8:00 PM, and Saturday from 9:00 AM to 5:00 PM. We are closed on Sundays and public holidays."
            },
            {
                question: "How do I enroll in a course?",
                answer: "To enroll in a course, please visit our receptionist desk or log in to your student account and go to the 'Courses' section."
            },
            {
                question: "How can I check my progress?",
                answer: "Students can check their progress by logging into their account and visiting the 'Progress' section in the dashboard."
            },
            {
                question: "What payment methods do you accept?",
                answer: "We accept cash, credit/debit cards, and bank transfers. For installment plans, please speak with our reception staff."
            },
            {
                question: "How do I reset my password?",
                answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page."
            }
        ];
        
        res.status(200).json({
            success: true,
            count: faqs.length,
            data: faqs
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get chatbot statistics
exports.getChatbotStats = async (req, res) => {
    try {
        // Total number of messages
        const totalMessages = await ChatbotMessage.countDocuments();
        
        // User messages
        const userMessages = await ChatbotMessage.countDocuments({ isUserMessage: true });
        
        // Bot messages
        const botMessages = await ChatbotMessage.countDocuments({ isUserMessage: false });
        
        // Number of unique users who have used the chatbot
        const uniqueUsers = await ChatbotMessage.distinct('user');
        
        // Most recent conversations (last 24 hours)
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 1);
        
        const recentConversations = await ChatbotMessage.countDocuments({
            timestamp: { $gte: recentDate }
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalMessages,
                userMessages,
                botMessages,
                uniqueUsers: uniqueUsers.length,
                recentConversations
            }
        });
    } catch (error) {
        console.error('Error fetching chatbot stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = exports;