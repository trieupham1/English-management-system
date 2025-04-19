const ChatbotMessage = require('../models/ChatbotMessage');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get chat history for a student
exports.getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verify it's a student user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'This chatbot is only for student users'
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'This chatbot is only for student users'
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
        const user = await User.findById(userId).populate('studentInfo.courses');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'This chatbot is only for student users'
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
            if (user.studentInfo && user.studentInfo.courses && user.studentInfo.courses.length > 0) {
                // Extract course IDs
                const courseIds = user.studentInfo.courses.map(course => 
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
        // Handle assignment related queries
        else if (lowerMessage.includes('assignment') || lowerMessage.includes('homework') || 
                lowerMessage.includes('due') || lowerMessage.includes('deadline')) {
            
            category = 'assignment';
            
            // Get user's assignments if they have enrolled courses
            if (user.studentInfo && user.studentInfo.courses && user.studentInfo.courses.length > 0) {
                // Extract course IDs
                const courseIds = user.studentInfo.courses.map(course => 
                    course._id || course
                );
                
                // Get assignments for these courses
                const assignments = await Assignment.find({
                    course: { $in: courseIds },
                    dueDate: { $gte: new Date() } // Only upcoming assignments
                }).populate('course', 'name').sort({ dueDate: 1 });
                
                if (assignments && assignments.length > 0) {
                    relatedIds = assignments.map(a => a._id);
                    relatedModel = 'Assignment';
                    
                    response = 'Here are your upcoming assignments:\n\n';
                    assignments.forEach(assignment => {
                        const dueDate = new Date(assignment.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        });
                        
                        response += `- ${assignment.title} for ${assignment.course.name}\n`;
                        response += `  Due: ${dueDate}\n`;
                        if (assignment.description) {
                            response += `  ${assignment.description.substring(0, 50)}${assignment.description.length > 50 ? '...' : ''}\n`;
                        }
                        response += '\n';
                    });
                    
                    response += 'To view assignment details and submit your work, please go to the Assignments section.';
                } else {
                    // Check for past assignments
                    const pastAssignments = await Assignment.find({
                        course: { $in: courseIds },
                        dueDate: { $lt: new Date() }
                    }).countDocuments();
                    
                    if (pastAssignments > 0) {
                        response = "You don't have any upcoming assignments due right now. You can check your past assignments in the Assignments section.";
                    } else {
                        response = "You don't have any assignments yet. Check back later or ask your teacher for more information.";
                    }
                }
            } else {
                response = "You don't seem to be enrolled in any courses yet. Please visit the Courses section to browse available courses.";
            }
        } 
        // Handle course related queries
        else if (lowerMessage.includes('course') || lowerMessage.includes('enroll') || 
                (lowerMessage.includes('class') && !lowerMessage.includes('schedule'))) {
            
            category = 'course';
            
            // Get user's enrolled courses
            if (user.studentInfo && user.studentInfo.courses && user.studentInfo.courses.length > 0) {
                // Extract course IDs
                const courseIds = user.studentInfo.courses.map(course => 
                    course._id || course
                );
                
                // Get course details
                const courses = await Course.find({
                    _id: { $in: courseIds }
                }).populate('teacher', 'fullName');
                
                if (courses && courses.length > 0) {
                    relatedIds = courseIds;
                    relatedModel = 'Course';
                    
                    response = 'You are currently enrolled in these courses:\n\n';
                    courses.forEach(course => {
                        response += `- ${course.name}`;
                        if (course.level) {
                            response += ` (${course.level})`;
                        }
                        
                        if (course.teacher && course.teacher.fullName) {
                            response += `, Teacher: ${course.teacher.fullName}`;
                        }
                        
                        response += '\n';
                    });
                    
                    response += '\nTo view course details and materials, please go to the Courses section.';
                } else {
                    response = "I couldn't find information about your enrolled courses. Please check with reception.";
                }
            } else {
                response = "You don't seem to be enrolled in any courses yet. Please visit the Courses section to browse available courses.";
            }
        }
        // Handle progress related queries
        else if (lowerMessage.includes('progress') || lowerMessage.includes('grade') || 
                lowerMessage.includes('score') || lowerMessage.includes('performance')) {
            
            category = 'progress';
            
            // Get user's progress if they have enrolled courses
            if (user.studentInfo && user.studentInfo.courses && user.studentInfo.courses.length > 0 && 
                user.studentInfo.progress && Object.keys(user.studentInfo.progress).length > 0) {
                
                // Extract course IDs
                const courseIds = user.studentInfo.courses.map(course => 
                    course._id || course
                );
                
                // Get course details
                const courses = await Course.find({
                    _id: { $in: courseIds }
                }).select('name');
                
                if (courses && courses.length > 0) {
                    relatedIds = courseIds;
                    relatedModel = 'Course';
                    
                    response = 'Here is your current progress in your courses:\n\n';
                    
                    courses.forEach(course => {
                        const courseId = course._id.toString();
                        if (user.studentInfo.progress[courseId]) {
                            const progressPercent = user.studentInfo.progress[courseId];
                            response += `- ${course.name}: ${progressPercent}% complete\n`;
                        } else {
                            response += `- ${course.name}: No progress recorded yet\n`;
                        }
                    });
                    
                    response += '\nTo view detailed progress and grades, please go to the Progress section in your dashboard.';
                } else {
                    response = "I couldn't find information about your course progress. Please check the Progress section in your dashboard.";
                }
            } else {
                response = "I don't have any progress information for you yet. This may be because you're newly enrolled or haven't completed any assessments yet.";
            }
        }
        // Handle learning tips queries
        else if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || 
                lowerMessage.includes('improve') || lowerMessage.includes('study') || lowerMessage.includes('help me')) {
            
            response = "Here are some tips to improve your English learning:\n\n" +
                "1. Practice consistently for at least 15-30 minutes every day\n" +
                "2. Use the online resources in your course materials section\n" +
                "3. Join conversation practice sessions with classmates\n" +
                "4. Complete all assignments on time\n" +
                "5. Watch English videos and listen to podcasts to improve comprehension\n" +
                "6. Use vocabulary flashcards for regular review\n" +
                "7. Read English news articles daily\n\n" +
                "For specific help with your courses, please speak with your teachers during office hours.";
        }
        // Handle teacher contact information
        else if (lowerMessage.includes('teacher') || lowerMessage.includes('contact') || 
                lowerMessage.includes('instructor') || lowerMessage.includes('professor')) {
            
            // Get user's courses and teacher information
            if (user.studentInfo && user.studentInfo.courses && user.studentInfo.courses.length > 0) {
                // Extract course IDs
                const courseIds = user.studentInfo.courses.map(course => 
                    course._id || course
                );
                
                // Get course details with teachers
                const courses = await Course.find({
                    _id: { $in: courseIds }
                }).populate('teacher', 'fullName email officeHours');
                
                if (courses && courses.length > 0) {
                    relatedIds = courses.map(c => c.teacher._id).filter(id => id);
                    relatedModel = 'User';
                    
                    response = 'Here is how to contact your teachers:\n\n';
                    
                    // Create a map to avoid duplicates
                    const teacherMap = new Map();
                    
                    courses.forEach(course => {
                        if (course.teacher && course.teacher.fullName) {
                            const teacherId = course.teacher._id.toString();
                            
                            if (!teacherMap.has(teacherId)) {
                                const teacherInfo = {
                                    name: course.teacher.fullName,
                                    email: course.teacher.email || 'No email provided',
                                    officeHours: course.teacher.officeHours || 'No office hours specified',
                                    courses: [course.name]
                                };
                                
                                teacherMap.set(teacherId, teacherInfo);
                            } else {
                                // Add this course to existing teacher's courses
                                const teacherInfo = teacherMap.get(teacherId);
                                teacherInfo.courses.push(course.name);
                                teacherMap.set(teacherId, teacherInfo);
                            }
                        }
                    });
                    
                    // Generate response from the map
                    teacherMap.forEach(teacher => {
                        response += `- ${teacher.name}:\n`;
                        response += `  Email: ${teacher.email}\n`;
                        response += `  Office Hours: ${teacher.officeHours}\n`;
                        response += `  Courses: ${teacher.courses.join(', ')}\n\n`;
                    });
                    
                    response += 'You can also contact teachers through the Messages section in your dashboard.';
                } else {
                    response = "I couldn't find information about your teachers. Please check with reception.";
                }
            } else {
                response = "You don't seem to be enrolled in any courses yet, so I don't have teacher contact information to provide.";
            }
        }
        // Handle greeting
        else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            response = `Hello ${user.fullName || 'there'}! I'm your Student Learning Assistant. I can help you with information about your classes, assignments, schedule, and learning tips. What would you like to know?`;
        }
        // Handle help request
        else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            response = "I can help you with:\n\n" +
                "- Your class schedule and upcoming classes\n" +
                "- Information about your enrolled courses\n" +
                "- Updates on your assignments and due dates\n" +
                "- Your learning progress in each course\n" +
                "- Tips to improve your language learning\n" +
                "- Contact information for your teachers\n\n" +
                "What would you like to know about?";
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'This chatbot is only for student users'
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