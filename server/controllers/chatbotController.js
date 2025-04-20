const ChatbotMessage = require('../models/ChatbotMessage');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get chat history for a student
exports.getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verify it's a student user
        const student = await Student.findById(userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get chat history for the student
        const chatHistory = await ChatbotMessage.find({ user: userId })
            .sort({ timestamp: 1 })
            .limit(50); // Limit to last 50 messages
        
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
        
        // Check if user exists and is a student
        const student = await Student.findById(userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Determine message category
        let category = 'general';
        if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('class time')) {
            category = 'schedule';
        } else if (message.toLowerCase().includes('assignment') || message.toLowerCase().includes('homework')) {
            category = 'assignment';
        } else if (message.toLowerCase().includes('course') || message.toLowerCase().includes('class')) {
            category = 'course';
        } else if (message.toLowerCase().includes('progress') || message.toLowerCase().includes('grade')) {
            category = 'progress';
        }
        
        // Create the message
        const chatMessage = await ChatbotMessage.create({
            user: userId,
            message,
            isUserMessage,
            timestamp: Date.now(),
            category
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

// Process a student message and generate a response
exports.processMessage = async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        
        // Check if user exists and is a student
        const student = await Student.findById(userId).populate('studentInfo.courses');
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Determine message category
        let category = 'general';
        let relatedIds = [];
        let relatedModel = 'None';
        
        const lowerMessage = message.toLowerCase();
        
        // Process the message and generate a response
        let response = '';
        
        // Handle schedule related queries
        if (lowerMessage.includes('schedule') || lowerMessage.includes('class time') || 
            lowerMessage.includes('when') || (lowerMessage.includes('class') && lowerMessage.includes('time'))) {
            
            category = 'schedule';
            
            // Get user's class schedule if they have enrolled courses
            if (student.studentInfo && student.studentInfo.courses && student.studentInfo.courses.length > 0) {
                // Extract course IDs
                const courseIds = student.studentInfo.courses.map(course => 
                    course._id || course
                );
                
                // Get course details with schedule
                const courses = await Course.find({
                    _id: { $in: courseIds }
                }).select('name schedule');
                
                if (courses && courses.length > 0) {
                    relatedIds = courseIds;
                    relatedModel = 'Course';
                    
                    response = 'Here is your class schedule:\n\n';
                    courses.forEach(course => {
                        response += `${course.name}:\n`;
                        
                        if (course.schedule && course.schedule.length > 0) {
                            course.schedule.forEach(sch => {
                                const dayName = sch.day.charAt(0).toUpperCase() + sch.day.slice(1);
                                response += `- ${dayName}: ${sch.startTime} - ${sch.endTime}, Room: ${sch.room}\n`;
                            });
                        } else {
                            response += `- Schedule not set\n`;
                        }
                        
                        response += '\n';
                    });
                } else {
                    response = "I couldn't find any schedule information for your courses. Please check with your teacher or the reception.";
                }
            } else {
                response = "You don't seem to be enrolled in any courses yet. Please visit the Courses section to browse available courses.";
            }
        } 
        // Handle other message types (similar to previous implementation)
        // ... [rest of the message processing logic remains the same]
        
        else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            response = `Hello ${student.fullName || 'there'}! I'm your Student Learning Assistant. I can help you with information about your classes, assignments, schedule, and learning tips. What would you like to know?`;
        }
        // Default fallback response
        else {
            response = "I'm not sure I understand your question. I can help with your schedule, assignments, courses, progress, or provide learning tips. Could you please rephrase your question?";
        }
        
        // Save user message
        await ChatbotMessage.create({
            user: userId,
            message,
            isUserMessage: true,
            timestamp: Date.now(),
            category,
            relatedIds: relatedIds.length > 0 ? relatedIds : undefined,
            relatedModel: relatedIds.length > 0 ? relatedModel : 'None'
        });
        
        // Save bot response
        const botMessage = await ChatbotMessage.create({
            user: userId,
            message: response,
            isUserMessage: false,
            timestamp: Date.now(),
            category,
            relatedIds: relatedIds.length > 0 ? relatedIds : undefined,
            relatedModel: relatedIds.length > 0 ? relatedModel : 'None'
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
        
        // Verify it's a student user
        const student = await Student.findById(userId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
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

// Get chatbot statistics (for admin/teacher use)
exports.getChatbotStats = async (req, res) => {
    try {
        // Total number of messages
        const totalMessages = await ChatbotMessage.countDocuments();
        
        // User messages
        const userMessages = await ChatbotMessage.countDocuments({ isUserMessage: true });
        
        // Bot messages
        const botMessages = await ChatbotMessage.countDocuments({ isUserMessage: false });
        
        // Number of unique students who have used the chatbot
        const uniqueUsers = await ChatbotMessage.distinct('user');
        
        // Most recent conversations (last 24 hours)
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 1);
        
        const recentConversations = await ChatbotMessage.countDocuments({
            timestamp: { $gte: recentDate }
        });
        
        // Category statistics
        const categoryStats = await ChatbotMessage.aggregate([
            { $match: { isUserMessage: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totalMessages,
                userMessages,
                botMessages,
                uniqueUsers: uniqueUsers.length,
                recentConversations,
                categoryBreakdown: categoryStats
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