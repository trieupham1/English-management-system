// server/controllers/adminController.js
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const LessonMaterial = require('../models/LessonMaterial');
const Assignment = require('../models/Assignment');
const Settings = require('../models/Settings');
const ChatbotMessage = require('../models/ChatbotMessage');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * DASHBOARD & SYSTEM MONITORING
 */

/**
 * Get system statistics for dashboard
 */
exports.getSystemStats = async (req, res) => {
    try {
        // Count total students
        const totalStudents = await User.countDocuments({ role: 'student' });
        
        // Count total teachers
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        
        // Count active courses
        const activeCourses = await Course.countDocuments({ status: 'active' });
        
        // Count total lessons
        const totalLessons = await Lesson.countDocuments();
        
        // Count total assignments
        const totalAssignments = await Assignment.countDocuments();
        
        // Count pending students (assuming studentInfo field exists in User model)
        const pendingStudents = await User.countDocuments({
            role: 'student',
            status: 'pending'
        });
        
        // Count today's classes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayClasses = await Course.countDocuments({
            status: 'active',
            schedule: {
                $elemMatch: {
                    day: getDayOfWeek(today).toLowerCase()
                }
            }
        });
        
        // Get recent user registrations
        const newUsers = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                activeCourses,
                totalLessons,
                totalAssignments,
                pendingStudents,
                todayClasses,
                newUsers,
                systemHealth: {
                    databaseStatus: 'healthy',
                    serverStatus: 'operational'
                }
            }
        });
        
    } catch (error) {
        console.error('Error getting system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving system statistics',
            error: error.message
        });
    }
};

/**
 * Get recent activities
 */
exports.getRecentActivities = async (req, res) => {
    try {
        // Since we don't have an Activity model, we'll combine recent actions from other models
        const activities = [];
        
        // Get recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName email role createdAt');
            
        recentUsers.forEach(user => {
            activities.push({
                type: 'user',
                description: `New ${user.role} registered: ${user.fullName}`,
                timestamp: user.createdAt
            });
        });
        
        // Get recent assignments
        const recentAssignments = await Assignment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('courseId', 'title')
            .populate('userId', 'fullName');
            
        recentAssignments.forEach(assignment => {
            const courseName = assignment.courseId ? assignment.courseId.title : 'Unknown Course';
            const userName = assignment.userId ? assignment.userId.fullName : 'Unknown User';
            
            activities.push({
                type: 'assignment',
                description: `Assignment submitted for ${courseName} by ${userName}`,
                timestamp: assignment.createdAt
            });
        });
        
        // Get recent course updates
        const recentCourses = await Course.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title updatedAt');
            
        recentCourses.forEach(course => {
            activities.push({
                type: 'course',
                description: `Course updated: ${course.title}`,
                timestamp: course.updatedAt
            });
        });
        
        // Get recent lesson materials
        const recentMaterials = await LessonMaterial.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('lessonId', 'title');
            
        recentMaterials.forEach(material => {
            const lessonName = material.lessonId ? material.lessonId.title : 'Unknown Lesson';
            
            activities.push({
                type: 'material',
                description: `New material added to ${lessonName}: ${material.title}`,
                timestamp: material.createdAt
            });
        });
        
        // Sort all activities by timestamp
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Return top 10 most recent activities
        res.status(200).json({
            success: true,
            data: activities.slice(0, 10)
        });
        
    } catch (error) {
        console.error('Error getting activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recent activities',
            error: error.message
        });
    }
};

/**
 * LEARNING PROGRESS REPORTS (Giám sát hệ thống: Báo cáo tiến độ học tập)
 */

/**
 * Get learning progress reports
 */
exports.getLearningProgressReports = async (req, res) => {
    try {
        const { courseId, studentId, timeframe } = req.query;
        
        // Since there's no dedicated Report model, we'll use Assignment data
        // to generate progress reports
        
        // Build filter object
        const filter = {};
        
        if (courseId) {
            filter.courseId = mongoose.Types.ObjectId(courseId);
        }
        
        if (studentId) {
            filter.userId = mongoose.Types.ObjectId(studentId);
        }
        
        // Apply timeframe filter if provided
        if (timeframe) {
            const startDate = getTimeframeStartDate(timeframe);
            if (startDate) {
                filter.submissionDate = { $gte: startDate };
            }
        }
        
        // Fetch assignment data
        const assignments = await Assignment.find(filter)
            .populate('userId', 'fullName email')
            .populate('courseId', 'title courseCode')
            .populate('lessonId', 'title order')
            .sort({ submissionDate: -1 });
            
        // Process the data to create progress reports
        const progressData = {};
        
        assignments.forEach(assignment => {
            if (!assignment.courseId || !assignment.userId) return;
            
            const courseId = assignment.courseId._id.toString();
            const studentId = assignment.userId._id.toString();
            
            // Initialize course data if not exists
            if (!progressData[courseId]) {
                progressData[courseId] = {
                    courseTitle: assignment.courseId.title,
                    courseCode: assignment.courseId.courseCode,
                    students: {}
                };
            }
            
            // Initialize student data if not exists
            if (!progressData[courseId].students[studentId]) {
                progressData[courseId].students[studentId] = {
                    studentName: assignment.userId.fullName,
                    studentEmail: assignment.userId.email,
                    assignments: [],
                    averageScore: 0,
                    completedAssignments: 0,
                    totalAssignments: 0
                };
            }
            
            // Add assignment data
            progressData[courseId].students[studentId].assignments.push({
                title: assignment.title,
                score: assignment.score,
                maxScore: assignment.maxScore,
                submissionDate: assignment.submissionDate,
                status: assignment.status,
                lessonTitle: assignment.lessonId ? assignment.lessonId.title : 'N/A'
            });
            
            // Update completion stats
            if (assignment.status === 'graded') {
                progressData[courseId].students[studentId].completedAssignments++;
                progressData[courseId].students[studentId].totalAssignments++;
            } else if (assignment.status === 'submitted' || assignment.status === 'pending') {
                progressData[courseId].students[studentId].totalAssignments++;
            }
        });
        
        // Calculate average scores for each student
        Object.keys(progressData).forEach(courseId => {
            Object.keys(progressData[courseId].students).forEach(studentId => {
                const student = progressData[courseId].students[studentId];
                let totalScore = 0;
                let scoredAssignments = 0;
                
                student.assignments.forEach(assignment => {
                    if (assignment.status === 'graded' && assignment.score !== undefined) {
                        totalScore += (assignment.score / assignment.maxScore) * 100;
                        scoredAssignments++;
                    }
                });
                
                student.averageScore = scoredAssignments > 0 ? totalScore / scoredAssignments : 0;
                student.completionRate = student.totalAssignments > 0 
                    ? (student.completedAssignments / student.totalAssignments) * 100 
                    : 0;
            });
        });
        
        res.status(200).json({
            success: true,
            timeframe: timeframe || 'all',
            data: progressData
        });
        
    } catch (error) {
        console.error('Error getting learning progress reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving learning progress reports',
            error: error.message
        });
    }
};

/**
 * Generate learning progress summary
 */
exports.generateProgressSummary = async (req, res) => {
    try {
        const { timeframe } = req.query;
        
        // Set default timeframe if not provided
        const period = timeframe || 'month';
        const startDate = getTimeframeStartDate(period);
        
        // Get all active courses
        const courses = await Course.find({ status: 'active' });
        
        // Initialize summary data
        const summaryData = {
            totalCourses: courses.length,
            totalStudents: 0,
            averageCompletionRate: 0,
            averageScore: 0,
            courseStats: [],
            studentProgress: {
                excellent: 0,  // > 90%
                good: 0,       // 75-90%
                average: 0,    // 60-75%
                needsHelp: 0   // < 60%
            }
        };
        
        // For each course, calculate progress statistics
        for (const course of courses) {
            // Get all assignments for this course in the given timeframe
            const assignmentFilter = { 
                courseId: course._id,
                status: 'graded'
            };
            
            if (startDate) {
                assignmentFilter.submissionDate = { $gte: startDate };
            }
            
            const assignments = await Assignment.find(assignmentFilter);
            
            if (assignments.length === 0) continue;
            
            // Get unique students in this course
            const studentIds = [...new Set(assignments.map(a => a.userId.toString()))];
            
            // Calculate course statistics
            let totalScore = 0;
            let totalMaxScore = 0;
            
            assignments.forEach(assignment => {
                if (assignment.score !== undefined && assignment.maxScore > 0) {
                    totalScore += assignment.score;
                    totalMaxScore += assignment.maxScore;
                }
            });
            
            const averageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
            
            // Get completion rate
            // This is simplified - in a real app, you'd need to know the total expected assignments
            // Here we're just using the ratio of graded assignments to total assignments
            const totalCourseAssignments = await Assignment.countDocuments({ 
                courseId: course._id,
                submissionDate: startDate ? { $gte: startDate } : { $exists: true }
            });
            
            const completionRate = totalCourseAssignments > 0 
                ? (assignments.length / totalCourseAssignments) * 100 
                : 0;
            
            // Add to course stats
            summaryData.courseStats.push({
                courseId: course._id,
                courseTitle: course.title,
                courseCode: course.courseCode,
                studentsCount: studentIds.length,
                averageScore,
                completionRate
            });
            
            // Add to global stats
            summaryData.totalStudents += studentIds.length;
        }
        
        // Calculate overall averages
        if (summaryData.courseStats.length > 0) {
            let totalCompletionRate = 0;
            let totalScore = 0;
            
            summaryData.courseStats.forEach(course => {
                totalCompletionRate += course.completionRate;
                totalScore += course.averageScore;
            });
            
            summaryData.averageCompletionRate = totalCompletionRate / summaryData.courseStats.length;
            summaryData.averageScore = totalScore / summaryData.courseStats.length;
            
            // Sort courses by performance
            summaryData.courseStats.sort((a, b) => {
                // Sort by average score
                return b.averageScore - a.averageScore;
            });
        }
        
        // Categorize student progress
        // Get all students
        const students = await User.find({ role: 'student', isActive: true });
        
        for (const student of students) {
            // Get all assignments for this student
            const studentAssignments = await Assignment.find({
                userId: student._id,
                status: 'graded',
                submissionDate: startDate ? { $gte: startDate } : { $exists: true }
            });
            
            if (studentAssignments.length === 0) continue;
            
            // Calculate average score
            let totalScore = 0;
            let totalMaxScore = 0;
            
            studentAssignments.forEach(assignment => {
                if (assignment.score !== undefined && assignment.maxScore > 0) {
                    totalScore += assignment.score;
                    totalMaxScore += assignment.maxScore;
                }
            });
            
            const avgScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
            
            // Categorize student progress
            if (avgScore >= 90) {
                summaryData.studentProgress.excellent++;
            } else if (avgScore >= 75) {
                summaryData.studentProgress.good++;
            } else if (avgScore >= 60) {
                summaryData.studentProgress.average++;
            } else {
                summaryData.studentProgress.needsHelp++;
            }
        }
        
        res.status(200).json({
            success: true,
            timeframe: period,
            data: summaryData
        });
        
    } catch (error) {
        console.error('Error generating progress summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating learning progress summary',
            error: error.message
        });
    }
};

/**
 * PERSONNEL MANAGEMENT (Quản lý nhân sự: Xem thông tin nhân viên, lịch làm việc)
 */

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        
        // Create filter object
        const filter = {};
        
        // Add role filter if provided
        if (role) {
            filter.role = role;
        }
        
        // Add status filter if provided
        if (status) {
            filter.status = status;
        }
        
        // Add search filter if provided
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Fetch users with filters
        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
        
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving users',
            error: error.message
        });
    }
};

/**
 * Get staff information
 */
exports.getStaffInformation = async (req, res) => {
    try {
        // Get all staff members (admin, teacher, receptionist)
        const staffFilter = {
            role: { $in: ['admin', 'teacher', 'receptionist'] },
            isActive: true
        };
        
        const staffMembers = await User.find(staffFilter)
            .select('-password')
            .sort({ role: 1, fullName: 1 });
            
        // For each staff member, get additional information
        const staffData = [];
        
        for (const staff of staffMembers) {
            const staffInfo = {
                _id: staff._id,
                fullName: staff.fullName,
                email: staff.email,
                role: staff.role,
                phone: staff.phone,
                joinDate: staff.createdAt,
                lastActive: staff.lastActive || staff.updatedAt
            };
            
            // For teachers, get assigned courses
            if (staff.role === 'teacher') {
                const assignedCourses = await Course.find({ teacher: staff._id })
                    .select('title courseCode status schedule');
                    
                staffInfo.assignedCourses = assignedCourses;
                staffInfo.activeCourseCount = assignedCourses.filter(c => c.status === 'active').length;
            }
            
            staffData.push(staffInfo);
        }
        
        res.status(200).json({
            success: true,
            count: staffData.length,
            data: staffData
        });
        
    } catch (error) {
        console.error('Error getting staff information:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving staff information',
            error: error.message
        });
    }
};

/**
 * Get staff work schedules
 */
exports.getStaffWorkSchedules = async (req, res) => {
    try {
        const { staffId, weekStartDate } = req.query;
        
        // Set default week start date to current week if not provided
        let startDate;
        if (weekStartDate) {
            startDate = new Date(weekStartDate);
        } else {
            startDate = new Date();
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            startDate = new Date(startDate.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
        }
        
        // Calculate end date (7 days from start date)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        // Build filter to get teachers
        const teacherFilter = { role: 'teacher', isActive: true };
        
        if (staffId) {
            teacherFilter._id = mongoose.Types.ObjectId(staffId);
        }
        
        // Get all teachers (or specific teacher if staffId is provided)
        const teachers = await User.find(teacherFilter)
            .select('_id fullName email');
            
        // Initialize schedules object with days of the week
        const weekSchedule = {
            startDate: startDate,
            endDate: endDate,
            teachers: {}
        };
        
        // For each teacher, get their courses and create schedule
        for (const teacher of teachers) {
            // Get courses taught by this teacher
            const courses = await Course.find({ 
                teacher: teacher._id,
                status: 'active'
            }).select('title courseCode schedule');
            
            // Create teacher entry in the schedule
            weekSchedule.teachers[teacher._id] = {
                teacherId: teacher._id,
                fullName: teacher.fullName,
                email: teacher.email,
                weeklySchedule: {},
                courses: courses.map(c => ({
                    courseId: c._id,
                    title: c.title,
                    courseCode: c.courseCode
                }))
            };
            
            // Initialize empty schedule for each day
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + i);
                const dateString = currentDate.toISOString().split('T')[0];
                const dayName = getDayOfWeek(currentDate).toLowerCase();
                
                weekSchedule.teachers[teacher._id].weeklySchedule[dateString] = {
                    date: currentDate,
                    dayName: getDayOfWeek(currentDate),
                    classes: []
                };
                
                // Find courses scheduled for this day
                courses.forEach(course => {
                    if (course.schedule && Array.isArray(course.schedule)) {
                        course.schedule.forEach(scheduleItem => {
                            if (scheduleItem.day.toLowerCase() === dayName) {
                                weekSchedule.teachers[teacher._id].weeklySchedule[dateString].classes.push({
                                    courseId: course._id,
                                    courseTitle: course.title,
                                    courseCode: course.courseCode,
                                    startTime: scheduleItem.startTime,
                                    endTime: scheduleItem.endTime,
                                    location: scheduleItem.location || 'Not specified'
                                });
                            }
                        });
                    }
                });
                
                // Sort classes by start time
                weekSchedule.teachers[teacher._id].weeklySchedule[dateString].classes.sort((a, b) => {
                    return a.startTime.localeCompare(b.startTime);
                });
            }
        }
        
        res.status(200).json({
            success: true,
            data: weekSchedule
        });
        
    } catch (error) {
        console.error('Error getting staff work schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving staff work schedules',
            error: error.message
        });
    }
};

/**
 * SYSTEM IMPROVEMENT (Cải thiện hệ thống: Phân tích dữ liệu, cập nhật chatbot)
 */

/**
 * Get system analytics
 */
exports.getSystemAnalytics = async (req, res) => {
    try {
        const { timeframe } = req.query;
        
        // Set default timeframe if not provided
        const period = timeframe || 'month';
        const startDate = getTimeframeStartDate(period);
        
        // User analytics
        const userAnalytics = await getUserAnalytics(startDate);
        
        // Course analytics
        const courseAnalytics = await getCourseAnalytics(startDate);
        
        // Assignment analytics
        const assignmentAnalytics = await getAssignmentAnalytics(startDate);
        
        // System usage analytics (using chatbot messages as an indicator)
        const systemUsageAnalytics = await getSystemUsageAnalytics(startDate);
        
        res.status(200).json({
            success: true,
            timeframe: period,
            data: {
                userAnalytics,
                courseAnalytics,
                assignmentAnalytics,
                systemUsageAnalytics
            }
        });
        
    } catch (error) {
        console.error('Error getting system analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving system analytics',
            error: error.message
        });
    }
};

/**
 * Update chatbot system
 */
exports.updateChatbot = async (req, res) => {
    try {
        const { intents, responses, settings } = req.body;
        
        // Since we only have ChatbotMessage model and not a dedicated Chatbot model,
        // we'll store configurations in the Settings model
        
        // Update chatbot settings in the Settings collection
        let systemSettings = await Settings.findOne();
        
        if (!systemSettings) {
            // Create settings if they don't exist
            systemSettings = new Settings({
                systemName: 'Learning Management System',
                chatbot: {
                    enabled: true,
                    welcomeMessage: 'Welcome to our Learning Platform! How can I help you today?',
                    intents: [],
                    responses: []
                }
            });
        }
        
        // Update settings
        if (!systemSettings.chatbot) {
            systemSettings.chatbot = {};
        }
        
        // Update intents if provided
        if (intents && Array.isArray(intents)) {
            systemSettings.chatbot.intents = intents;
        }
        
        // Update responses if provided
        if (responses && Array.isArray(responses)) {
            systemSettings.chatbot.responses = responses;
        }
        
        // Update general chatbot settings
        if (settings) {
            Object.keys(settings).forEach(key => {
                systemSettings.chatbot[key] = settings[key];
            });
        }
        
        // Set last updated timestamp
        systemSettings.chatbot.lastUpdated = new Date();
        
        // Save settings
        await systemSettings.save();
        
        res.status(200).json({
            success: true,
            message: 'Chatbot system updated successfully',
            lastUpdated: systemSettings.chatbot.lastUpdated
        });
        
    } catch (error) {
        console.error('Error updating chatbot system:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating chatbot system',
            error: error.message
        });
    }
};

/**
 * USER MANAGEMENT
 */

/**
 * Get user details by ID
 */
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Validate the user ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Find the user by ID
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Get additional user-related data based on role
        let additionalData = {};
        
        if (user.role === 'student') {
            // Get enrolled courses for students
            const enrolledCourses = await Course.find({
                'students.studentId': userId
            }).select('title courseCode schedule teacher status');
            
            // Get assignments for this student
            const assignments = await Assignment.find({ userId })
                .sort({ submissionDate: -1 })
                .populate('courseId', 'title courseCode')
                .populate('lessonId', 'title');
            
            additionalData = {
                enrolledCourses,
                assignments,
                completedAssignments: assignments.filter(a => a.status === 'graded').length,
                pendingAssignments: assignments.filter(a => a.status === 'submitted' || a.status === 'pending').length
            };
            
        } else if (user.role === 'teacher') {
            // Get courses taught by the teacher
            const teachingCourses = await Course.find({ teacher: userId })
                .select('title courseCode schedule status');
            
            // Get assignments to grade
            const pendingAssignments = await Assignment.find({
                courseId: { $in: teachingCourses.map(c => c._id) },
                status: 'submitted'
            })
            .populate('userId', 'fullName')
            .populate('courseId', 'title');
            
            additionalData = {
                teachingCourses,
                pendingAssignments,
                activeCourseCount: teachingCourses.filter(c => c.status === 'active').length,
                inactiveCourseCount: teachingCourses.filter(c => c.status !== 'active').length
            };
        }
        
        res.status(200).json({
            success: true,
            data: {
                user,
                ...additionalData
            }
        });
        
    } catch (error) {
        console.error('Error getting user details:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user details',
            error: error.message
        });
    }
};

/**
 * Update user by ID
 */
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updateData = req.body;
        
        // Validate the user ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Remove sensitive fields that shouldn't be updated directly
        delete updateData.password;
        
        // Find the user and update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
        
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

/**
 * Delete user by ID
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Validate the user ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Find the user first to get details
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Perform cleanup based on user role
        if (user.role === 'student') {
            // Remove student from courses
            await Course.updateMany(
                { 'students.studentId': userId },
                { $pull: { students: { studentId: userId } } }
            );
            
            // Remove student assignments
            await Assignment.deleteMany({ userId });
            
        } else if (user.role === 'teacher') {
            // Update courses to remove teacher reference
            await Course.updateMany(
                { teacher: userId },
                { $set: { teacher: null, status: 'inactive' } }
            );
        }
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

/**
 * COURSE MANAGEMENT
 */

/**
 * Get all courses with filters
 */
exports.getAllCourses = async (req, res) => {
    try {
        const { status, teacher, search } = req.query;
        
        // Create filter object
        const filter = {};
        
        // Add status filter if provided
        if (status) {
            filter.status = status;
        }
        
        // Add teacher filter if provided
        if (teacher) {
            filter.teacher = teacher;
        }
        
        // Add search filter if provided
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Fetch courses with filters
        const courses = await Course.find(filter)
            .populate('teacher', 'fullName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
        
    } catch (error) {
        console.error('Error getting courses:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving courses',
            error: error.message
        });
    }
};

/**
 * Get course details by ID
 */
exports.getCourseById = async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Validate the course ID format
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }
        
        // Find the course by ID
        const course = await Course.findById(courseId)
            .populate('teacher', 'fullName email')
            .populate({
                path: 'students.studentId',
                select: 'fullName email username'
            });
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Get lessons for this course
        const lessons = await Lesson.find({ courseId })
            .sort({ order: 1 });
            
        // Get materials for this course
        const materials = await LessonMaterial.find({ 
            lessonId: { $in: lessons.map(lesson => lesson._id) } 
        }).populate('lessonId', 'title');
        
        // Get assignments for this course
        const assignments = await Assignment.find({ courseId })
            .populate('lessonId', 'title')
            .populate('userId', 'fullName email');
            
        // Count students and compile statistics
        const studentCount = course.students ? course.students.length : 0;
        const assignmentStats = {
            total: assignments.length,
            submitted: assignments.filter(a => a.status === 'submitted').length,
            graded: assignments.filter(a => a.status === 'graded').length,
            pending: assignments.filter(a => a.status === 'pending').length
        };
        
        res.status(200).json({
            success: true,
            data: {
                course,
                lessons,
                materials,
                assignments,
                stats: {
                    studentCount,
                    lessonCount: lessons.length,
                    materialCount: materials.length,
                    assignmentStats
                }
            }
        });
        
    } catch (error) {
        console.error('Error getting course details:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving course details',
            error: error.message
        });
    }
};

/**
 * Update course by ID
 */
exports.updateCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const updateData = req.body;
        
        // Validate the course ID format
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }
        
        // Find the course and update
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('teacher', 'fullName email');
        
        if (!updatedCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourse
        });
        
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
};

/**
 * Delete course by ID
 */
exports.deleteCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Validate the course ID format
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }
        
        // Find the course first to get details
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Get all lessons for this course
        const lessons = await Lesson.find({ courseId });
        const lessonIds = lessons.map(lesson => lesson._id);
        
        // Delete associated data
        // 1. Delete lesson materials
        await LessonMaterial.deleteMany({ 
            lessonId: { $in: lessonIds } 
        });
        
        // 2. Delete lessons
        await Lesson.deleteMany({ courseId });
        
        // 3. Delete assignments
        await Assignment.deleteMany({ courseId });
        
        // 4. Delete the course
        await Course.findByIdAndDelete(courseId);
        
        res.status(200).json({
            success: true,
            message: 'Course and all associated data deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
};

/**
 * SYSTEM SETTINGS
 */

/**
 * Get system settings
 */
exports.getSystemSettings = async (req, res) => {
    try {
        // Get system settings
        let settings = await Settings.findOne();
        
        // If no settings exist, create default settings
        if (!settings) {
            settings = await Settings.create({
                systemName: 'Learning Management System',
                adminEmail: 'admin@example.com',
                allowRegistration: true,
                maintenanceMode: false,
                academicTerms: {
                    current: 'Spring 2025',
                    available: ['Fall 2024', 'Spring 2025', 'Summer 2025']
                },
                notificationSettings: {
                    emailNotifications: true,
                    systemNotifications: true
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: settings
        });
        
    } catch (error) {
        console.error('Error getting system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving system settings',
            error: error.message
        });
    }
};

/**
 * Update system settings
 */
exports.updateSystemSettings = async (req, res) => {
    try {
        const updateData = req.body;
        
        // Get existing settings or create if not exist
        let settings = await Settings.findOne();
        
        if (!settings) {
            // Create with default values and then update
            settings = await Settings.create({
                systemName: 'Learning Management System',
                adminEmail: 'admin@example.com',
                allowRegistration: true,
                maintenanceMode: false,
                academicTerms: {
                    current: 'Spring 2025',
                    available: ['Fall 2024', 'Spring 2025', 'Summer 2025']
                },
                notificationSettings: {
                    emailNotifications: true,
                    systemNotifications: true
                }
            });
        }
        
        // Update settings
        Object.keys(updateData).forEach(key => {
            settings[key] = updateData[key];
        });
        
        // Save updated settings
        await settings.save();
        
        res.status(200).json({
            success: true,
            message: 'System settings updated successfully',
            data: settings
        });
        
    } catch (error) {
        console.error('Error updating system settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating system settings',
            error: error.message
        });
    }
};

/**
 * HELPER FUNCTIONS
 */

// Get day of week name from date
function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// Get day index from day name
function getDayIndex(dayName) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.indexOf(dayName.toLowerCase()) + 1; // 1-based (Monday = 1)
}

// Get start date based on timeframe
function getTimeframeStartDate(timeframe) {
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(now.setMonth(now.getMonth() - 1)); // Default to month
    }
    
    return startDate;
}

// Get user analytics
async function getUserAnalytics(startDate) {
    // User registration statistics
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate }
    });
    
    // User role distribution
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });
    const receptionists = await User.countDocuments({ role: 'receptionist' });
    
    // Active vs inactive users
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // User registration trend (by month)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const usersByMonth = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1
            }
        }
    ]);
    
    // Format the monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const registrationTrend = usersByMonth.map(item => ({
        month: monthNames[item._id.month - 1],
        year: item._id.year,
        count: item.count
    }));
    
    return {
        totalUsers,
        newUsers,
        roleDistribution: {
            students,
            teachers,
            admins,
            receptionists
        },
        activityStatus: {
            active: activeUsers,
            inactive: inactiveUsers
        },
        registrationTrend
    };
}

// Get course analytics
async function getCourseAnalytics(startDate) {
    // Course statistics
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'active' });
    const inactiveCourses = await Course.countDocuments({ status: { $ne: 'active' } });
    const newCourses = await Course.countDocuments({
        createdAt: { $gte: startDate }
    });
    
    // Get most popular courses (by student count)
    const popularCourses = await Course.find()
        .sort({ 'students.length': -1 })
        .limit(5)
        .select('title courseCode students')
        .populate('teacher', 'fullName');
        
    // Format popular courses data
    const formattedPopularCourses = popularCourses.map(course => ({
        courseId: course._id,
        title: course.title,
        courseCode: course.courseCode,
        teacher: course.teacher ? course.teacher.fullName : 'Unassigned',
        studentCount: course.students ? course.students.length : 0
    }));
    
    // Course creation trend (by month)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const coursesByMonth = await Course.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1
            }
        }
    ]);
    
    // Format the monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const creationTrend = coursesByMonth.map(item => ({
        month: monthNames[item._id.month - 1],
        year: item._id.year,
        count: item.count
    }));
    
    return {
        totalCourses,
        activeCourses,
        inactiveCourses,
        newCourses,
        popularCourses: formattedPopularCourses,
        creationTrend
    };
}

// Get assignment analytics
async function getAssignmentAnalytics(startDate) {
    // Assignment statistics
    const totalAssignments = await Assignment.countDocuments();
    const submittedAssignments = await Assignment.countDocuments({ status: 'submitted' });
    const gradedAssignments = await Assignment.countDocuments({ status: 'graded' });
    const pendingAssignments = await Assignment.countDocuments({ status: 'pending' });
    
    // Recent assignment submissions
    const recentSubmissions = await Assignment.find({ status: 'submitted' })
        .sort({ submissionDate: -1 })
        .limit(10)
        .populate('userId', 'fullName')
        .populate('courseId', 'title')
        .select('title submissionDate userId courseId');
        
    // Format recent submissions
    const formattedSubmissions = recentSubmissions.map(assignment => ({
        assignmentId: assignment._id,
        title: assignment.title,
        student: assignment.userId ? assignment.userId.fullName : 'Unknown Student',
        course: assignment.courseId ? assignment.courseId.title : 'Unknown Course',
        submissionDate: assignment.submissionDate
    }));
    
    // Assignment submission trend (by day for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const submissionsByDay = await Assignment.aggregate([
        {
            $match: {
                submissionDate: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$submissionDate' },
                    month: { $month: '$submissionDate' },
                    day: { $dayOfMonth: '$submissionDate' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1,
                '_id.day': 1
            }
        }
    ]);
    
    // Format the daily data
    const submissionTrend = submissionsByDay.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        count: item.count
    }));
    
    return {
        totalAssignments,
        statusDistribution: {
            submitted: submittedAssignments,
            graded: gradedAssignments,
            pending: pendingAssignments
        },
        recentSubmissions: formattedSubmissions,
        submissionTrend
    };
}

// Get system usage analytics
async function getSystemUsageAnalytics(startDate) {
    // Chatbot usage statistics (if ChatbotMessage model exists)
    let chatbotMessages = 0;
    let recentMessages = [];
    
    if (mongoose.models.ChatbotMessage) {
        chatbotMessages = await ChatbotMessage.countDocuments({
            createdAt: { $gte: startDate }
        });
        
        // Get recent messages
        recentMessages = await ChatbotMessage.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'fullName');
            
        // Format recent messages
        recentMessages = recentMessages.map(message => ({
            messageId: message._id,
            user: message.userId ? message.userId.fullName : 'Anonymous User',
            message: message.userMessage,
            response: message.botResponse,
            timestamp: message.createdAt
        }));
    }
    
    // System login statistics (placeholder - would need login tracking)
    const loginStats = {
        totalLogins: 0,
        uniqueUsers: 0,
        averageSessionDuration: '0 minutes',
        peakHours: []
    };
    
    // Feature usage statistics (placeholder)
    const featureUsage = {
        mostUsedFeatures: [
            { name: 'Assignments', usage: '35%' },
            { name: 'Course Materials', usage: '25%' },
            { name: 'Chatbot', usage: '20%' },
            { name: 'User Profiles', usage: '15%' },
            { name: 'Course Registration', usage: '5%' }
        ]
    };
    
    return {
        chatbotStats: {
            totalMessages: chatbotMessages,
            recentMessages
        },
        loginStats,
        featureUsage
    };
}