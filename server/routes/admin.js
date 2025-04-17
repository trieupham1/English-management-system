// server/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Import other controllers needed for admin routes
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController');

// Apply authentication middleware to all routes
router.use(protect);
// Ensure only admin can access these routes
router.use(authorize('admin'));

// ======================================================
// DASHBOARD ROUTES
// ======================================================
router.get('/dashboard/stats', adminController.getSystemStats);
router.get('/dashboard/activities', adminController.getRecentActivities);
router.get('/dashboard/learning-progress', adminController.getLearningProgressReports);
router.get('/dashboard/progress-summary', adminController.generateProgressSummary);
router.get('/dashboard/analytics', adminController.getSystemAnalytics);

// ======================================================
// USER MANAGEMENT ROUTES (Quản lý nhân sự)
// ======================================================
// General user routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Staff management routes
router.get('/staff', adminController.getStaffInformation);
router.get('/staff/schedules', adminController.getStaffWorkSchedules);

// ======================================================
// STUDENT MANAGEMENT ROUTES
// ======================================================
router.get('/students', adminController.getAllUsers, (req, res) => {
    res.json({
        ...res.locals.data,
        data: res.locals.data.data.filter(user => user.role === 'student')
    });
});

// ======================================================
// TEACHER MANAGEMENT ROUTES
// ======================================================
router.get('/teachers', adminController.getAllUsers, (req, res) => {
    res.json({
        ...res.locals.data,
        data: res.locals.data.data.filter(user => user.role === 'teacher')
    });
});

// ======================================================
// COURSE MANAGEMENT ROUTES
// ======================================================
router.get('/courses', adminController.getAllCourses);
router.post('/courses', courseController.createCourse);
router.get('/courses/:id', adminController.getCourseById);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// ======================================================
// LESSON MANAGEMENT ROUTES
// ======================================================
router.get('/courses/:courseId/lessons', lessonController.getLessons);
router.post('/courses/:courseId/lessons', lessonController.createLesson);
router.get('/lessons/:id', lessonController.getLessonById);
router.put('/lessons/:id', lessonController.updateLesson);
router.delete('/lessons/:id', lessonController.deleteLesson);

// ======================================================
// ASSIGNMENT MANAGEMENT ROUTES
// ======================================================
router.get('/assignments', async (req, res) => {
    try {
        const { courseId, status, studentId } = req.query;
        
        // Create filter
        const filter = {};
        if (courseId) filter.courseId = courseId;
        if (status) filter.status = status;
        if (studentId) filter.userId = studentId;
        
        // Fetch assignments
        const Assignment = require('../models/Assignment');
        const assignments = await Assignment.find(filter)
            .populate('userId', 'fullName email')
            .populate('courseId', 'title courseCode')
            .populate('lessonId', 'title')
            .sort({ submissionDate: -1 });
        
        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments',
            error: error.message
        });
    }
});

// ======================================================
// SYSTEM SETTINGS ROUTES
// ======================================================
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// ======================================================
// CHATBOT MANAGEMENT ROUTES (Cải thiện hệ thống)
// ======================================================
router.get('/chatbot/messages', async (req, res) => {
    try {
        const ChatbotMessage = require('../models/ChatbotMessage');
        const messages = await ChatbotMessage.find()
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(100);
            
        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching chatbot messages',
            error: error.message
        });
    }
});

router.put('/chatbot/update', adminController.updateChatbot);

// ======================================================
// REPORTING ROUTES
// ======================================================
router.get('/reports/students', async (req, res) => {
    try {
        // Generate student report
        const User = require('../models/User');
        const Assignment = require('../models/Assignment');
        
        // Get all students
        const students = await User.find({ role: 'student' }).select('-password');
        
        // For each student, get assignment data
        const studentData = [];
        
        for (const student of students) {
            const assignments = await Assignment.find({ userId: student._id });
            
            const submittedCount = assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length;
            const gradedCount = assignments.filter(a => a.status === 'graded').length;
            
            let totalScore = 0;
            let scoreCount = 0;
            
            assignments.forEach(assignment => {
                if (assignment.status === 'graded' && assignment.score !== undefined) {
                    totalScore += (assignment.score / assignment.maxScore) * 100;
                    scoreCount++;
                }
            });
            
            const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
            
            studentData.push({
                id: student._id,
                name: student.fullName,
                email: student.email,
                joinDate: student.createdAt,
                totalAssignments: assignments.length,
                submittedAssignments: submittedCount,
                completionRate: assignments.length > 0 ? (submittedCount / assignments.length) * 100 : 0,
                averageScore
            });
        }
        
        res.status(200).json({
            success: true,
            count: studentData.length,
            data: studentData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating student report',
            error: error.message
        });
    }
});

router.get('/reports/courses', async (req, res) => {
    try {
        // Generate course report
        const Course = require('../models/Course');
        const Lesson = require('../models/Lesson');
        const Assignment = require('../models/Assignment');
        
        // Get all courses
        const courses = await Course.find()
            .populate('teacher', 'fullName email');
            
        // For each course, get detailed information
        const courseData = [];
        
        for (const course of courses) {
            // Get lessons for this course
            const lessons = await Lesson.find({ courseId: course._id });
            
            // Get assignments for this course
            const assignments = await Assignment.find({ courseId: course._id });
            
            // Calculate statistics
            const studentCount = course.students ? course.students.length : 0;
            const assignmentCount = assignments.length;
            const submissionCount = assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length;
            const submissionRate = assignmentCount > 0 ? (submissionCount / assignmentCount) * 100 : 0;
            
            courseData.push({
                id: course._id,
                title: course.title,
                code: course.courseCode,
                status: course.status,
                teacher: course.teacher ? course.teacher.fullName : 'Unassigned',
                students: studentCount,
                lessons: lessons.length,
                assignments: assignmentCount,
                submissionRate: submissionRate.toFixed(2) + '%',
                createdAt: course.createdAt
            });
        }
        
        res.status(200).json({
            success: true,
            count: courseData.length,
            data: courseData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating course report',
            error: error.message
        });
    }
});

router.get('/reports/assignments', async (req, res) => {
    try {
        // Generate assignment report
        const Assignment = require('../models/Assignment');
        
        // Get all assignments
        const assignments = await Assignment.find()
            .populate('userId', 'fullName')
            .populate('courseId', 'title courseCode')
            .populate('lessonId', 'title');
            
        // Calculate statistics
        const totalAssignments = assignments.length;
        const submittedCount = assignments.filter(a => a.status === 'submitted').length;
        const gradedCount = assignments.filter(a => a.status === 'graded').length;
        const pendingCount = assignments.filter(a => a.status === 'pending').length;
        
        // Calculate average scores
        let totalScore = 0;
        let scoreCount = 0;
        
        assignments.forEach(assignment => {
            if (assignment.status === 'graded' && assignment.score !== undefined) {
                totalScore += (assignment.score / assignment.maxScore) * 100;
                scoreCount++;
            }
        });
        
        const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;
        
        // Format assignment data
        const assignmentData = assignments.map(assignment => ({
            id: assignment._id,
            title: assignment.title,
            student: assignment.userId ? assignment.userId.fullName : 'Unknown',
            course: assignment.courseId ? assignment.courseId.title : 'Unknown',
            courseCode: assignment.courseId ? assignment.courseId.courseCode : 'Unknown',
            lesson: assignment.lessonId ? assignment.lessonId.title : 'Unknown',
            status: assignment.status,
            score: assignment.score,
            maxScore: assignment.maxScore,
            submissionDate: assignment.submissionDate,
            dueDate: assignment.dueDate
        }));
        
        res.status(200).json({
            success: true,
            stats: {
                total: totalAssignments,
                submitted: submittedCount,
                graded: gradedCount,
                pending: pendingCount,
                averageScore: averageScore.toFixed(2) + '%'
            },
            count: assignmentData.length,
            data: assignmentData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating assignment report',
            error: error.message
        });
    }
});

// ======================================================
// RECEPTIONIST FEATURES (Chức năng của Nhân viên tiếp tân)
// ======================================================

/**
 * Student registration management
 * Quản lý thông tin học viên: Đăng ký học viên mới, cập nhật thông tin cá nhân
 */
router.post('/receptionist/register-student', async (req, res) => {
    try {
        const { fullName, email, phone, address, courseIds } = req.body;
        
        // Validate required fields
        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name and email'
            });
        }
        
        const User = require('../models/User');
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Create student account with random password
        const randomPassword = Math.random().toString(36).slice(-8);
        
        const newStudent = new User({
            fullName,
            email,
            phone,
            address,
            role: 'student',
            password: randomPassword, // This would be hashed by the User model
            status: 'active'
        });
        
        await newStudent.save();
        
        // Enroll in courses if provided
        if (courseIds && courseIds.length > 0) {
            const Course = require('../models/Course');
            
            for (const courseId of courseIds) {
                await Course.findByIdAndUpdate(
                    courseId,
                    { 
                        $push: { 
                            students: { 
                                studentId: newStudent._id,
                                enrollmentDate: new Date()
                            } 
                        } 
                    }
                );
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: {
                student: {
                    id: newStudent._id,
                    fullName: newStudent.fullName,
                    email: newStudent.email
                },
                tempPassword: randomPassword
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering student',
            error: error.message
        });
    }
});

/**
 * Class schedule management
 * Hỗ trợ vận hành: Xếp lớp, theo dõi số buổi học
 */
router.get('/receptionist/class-schedule', async (req, res) => {
    try {
        const { date } = req.query;
        
        // Get the date to check (today if not provided)
        const checkDate = date ? new Date(date) : new Date();
        const dayOfWeek = getDayOfWeek(checkDate).toLowerCase();
        
        const Course = require('../models/Course');
        
        // Find all active courses with classes on this day
        const courses = await Course.find({
            status: 'active',
            schedule: {
                $elemMatch: {
                    day: dayOfWeek
                }
            }
        }).populate('teacher', 'fullName email phone');
        
        // Format the schedule data
        const scheduleData = [];
        
        courses.forEach(course => {
            const todaySchedules = course.schedule.filter(
                scheduleItem => scheduleItem.day.toLowerCase() === dayOfWeek
            );
            
            todaySchedules.forEach(scheduleItem => {
                scheduleData.push({
                    courseId: course._id,
                    courseTitle: course.title,
                    courseCode: course.courseCode,
                    startTime: scheduleItem.startTime,
                    endTime: scheduleItem.endTime,
                    location: scheduleItem.location || 'Not specified',
                    teacher: course.teacher ? course.teacher.fullName : 'Unassigned',
                    teacherContact: course.teacher ? (course.teacher.phone || course.teacher.email) : 'N/A',
                    studentCount: course.students ? course.students.length : 0
                });
            });
        });
        
        // Sort by start time
        scheduleData.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        res.status(200).json({
            success: true,
            date: checkDate,
            dayOfWeek: getDayOfWeek(checkDate),
            count: scheduleData.length,
            data: scheduleData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving class schedule',
            error: error.message
        });
    }
});

// Helper function for day of week
function getDayOfWeek(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

module.exports = router;