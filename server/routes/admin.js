// server/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/auth');
const courseController = require('../controllers/courseController');
const studentController = require('../controllers/studentController');
const teacherController = require('../controllers/teacherController');
const mongoose = require('mongoose');

// Apply authentication middleware to all routes
router.use(protect);
// Ensure manager can access these routes
router.use(authorize('manager'));

// ======================================================
// DASHBOARD ROUTES
// ======================================================
// Updated to work with all your models
router.get('/stats', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Teacher = require('../models/Teacher');
        const Course = require('../models/Course');
        const Report = require('../models/Report');
        
        // Count documents from each collection
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalTeachers = await Teacher.countDocuments({ isActive: true });
        const activeCourses = await Course.countDocuments({ status: 'Active' });
        const newReports = await Report.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
        
        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                activeCourses,
                newReports
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system statistics',
            error: error.message
        });
    }
});

// Generate recent activities based on all models
router.get('/activities', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Teacher = require('../models/Teacher');
        const Course = require('../models/Course');
        const Report = require('../models/Report');
        
        // Get recent students
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(5);
            
        // Get recent teachers
        const recentTeachers = await Teacher.find()
            .sort({ createdAt: -1 })
            .limit(5);
            
        // Get recent courses
        const recentCourses = await Course.find()
            .sort({ createdAt: -1 })
            .limit(5);
            
        // Get recent reports
        const recentReports = await Report.find()
            .sort({ createdAt: -1 })
            .limit(5);
        
        // Combine and format activities
        const activities = [];
        
        // Add student registrations as activities
        recentStudents.forEach(student => {
            activities.push({
                type: 'user',
                description: `New student ${student.fullName} registered`,
                timestamp: student.createdAt
            });
        });
        
        // Add teacher registrations as activities
        recentTeachers.forEach(teacher => {
            activities.push({
                type: 'user',
                description: `New teacher ${teacher.fullName} joined`,
                timestamp: teacher.createdAt
            });
        });
        
        // Add course creations as activities
        recentCourses.forEach(course => {
            activities.push({
                type: 'course',
                description: `New course "${course.name}" created`,
                timestamp: course.createdAt
            });
        });
        
        // Add report generations as activities
        recentReports.forEach(report => {
            activities.push({
                type: 'system',
                description: `New report "${report.title}" generated`,
                timestamp: report.createdAt
            });
        });
        
        // Sort activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Return the 10 most recent activities
        const recentActivities = activities.slice(0, 10);
        
        res.status(200).json({
            success: true,
            data: recentActivities
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activities',
            error: error.message
        });
    }
});

// ======================================================
// STUDENT MANAGEMENT ROUTES
// ======================================================
// Get all students
// Update student's course
// Update student's course
router.put('/students/:id/course', async (req, res) => {
    const mongoose = require('mongoose');
    
    // Maximum number of retries for transaction
    const MAX_RETRIES = 3;
    
    // Function to perform the course update with retry logic
    async function updateStudentCourse(retryCount = 0) {
        let session;
        try {
            // Start a database session
            session = await mongoose.startSession();
            session.startTransaction();

            const Student = require('../models/Student');
            const Course = require('../models/Course');
            
            const studentId = req.params.id;
            const { courseId, level } = req.body;
            
            console.log('Received course update request:', { 
                studentId, 
                courseId, 
                level,
                retryCount 
            });
            
            // Validate inputs
            if (!courseId) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: 'Course ID is required'
                });
            }
            
            // Find the course
            const course = await Course.findById(courseId).session(session);
            if (!course) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }
            
            // Check if course is full
            if (course.students.length >= course.maxStudents) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    message: 'Course is already full'
                });
            }
            
            // Update student's course and level
            const student = await Student.findByIdAndUpdate(
                studentId,
                { 
                    'studentInfo.course': courseId,
                    'studentInfo.currentLevel': (level || course.level).toLowerCase(),
                    'studentInfo.status': 'placed'
                },
                { new: true, session }
            );
            
            if (!student) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            
            // Check if student is already in the course
            const studentIdStr = studentId.toString();
            const isStudentInCourse = course.students.some(
                id => id.toString() === studentIdStr
            );
            
            // Add student to course's students array if not already present
            if (!isStudentInCourse) {
                course.students.push(studentIdStr);
                await course.save({ session });
            }
            
            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            
            console.log('Student course updated successfully', student);
            
            return res.status(200).json({
                success: true,
                message: 'Student course updated successfully',
                data: student
            });
        } catch (error) {
            // Log the full error for debugging
            console.error('Detailed error updating student course:', error);
            
            // Ensure session is ended
            if (session) {
                try {
                    await session.abortTransaction();
                    session.endSession();
                } catch (sessionError) {
                    console.error('Error ending session:', sessionError);
                }
            }
            
            // Retry mechanism for write conflicts
            if (
                retryCount < MAX_RETRIES && 
                (error.message.includes('Write conflict') || 
                 error.message.includes('TransientTransactionError'))
            ) {
                console.log(`Retrying transaction (${retryCount + 1}/${MAX_RETRIES})`);
                
                // Wait a bit before retrying to reduce conflict
                await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
                
                return updateStudentCourse(retryCount + 1);
            }
            
            // If max retries reached or different error, return error response
            return res.status(500).json({
                success: false,
                message: 'Error updating student course',
                error: error.message,
                details: {
                    name: error.name,
                    stack: error.stack
                }
            });
        }
    }
    
    // Start the update process
    return updateStudentCourse();
});

// Remove student from course
router.delete('/students/:id/course', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const Student = require('../models/Student');
        const Course = require('../models/Course');
        
        const studentId = req.params.id;
        
        // Find the student
        const student = await Student.findById(studentId);
        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // If student is in a course, remove them
        if (student.studentInfo.course) {
            const course = await Course.findById(student.studentInfo.course);
            if (course) {
                // Remove student from course's students array
                course.students = course.students.filter(id => 
                    id.toString() !== studentId.toString()
                );
                await course.save({ session });
            }
        }
        
        // Update student's course information
        student.studentInfo.course = null;
        student.studentInfo.status = 'unplaced';
        student.studentInfo.currentLevel = 'beginner'; // Reset to default level
        
        await student.save({ session });
        
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
        
        res.status(200).json({
            success: true,
            message: 'Student removed from course successfully',
            data: student
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error removing student from course:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing student from course',
            error: error.message
        });
    }
});
router.get('/students', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const students = await Student.find().select('-password');
        
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
});

router.post('/students', adminController.createStudent);


// Get student by ID
router.get('/students/:id', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const student = await Student.findById(req.params.id).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching student',
            error: error.message
        });
    }
});
// Update student
router.put('/students/:id', async (req, res) => {
    try {
        const Student = require('../models/Student');
        
        // Log the request body for debugging
        console.log('Update request body:', req.body);
        
        // Use findOneAndUpdate with $set to only update specified fields
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },  // Use $set operator to only update specified fields
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating student',
            error: error.message
        });
    }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
    try {
        const Student = require('../models/Student');
        const student = await Student.findByIdAndDelete(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting student',
            error: error.message
        });
    }
});

// ======================================================
// TEACHER MANAGEMENT ROUTES
// ======================================================
// Get all teachers
router.get('/teachers', async (req, res) => {
    try {
        const Teacher = require('../models/Teacher');
        const teachers = await Teacher.find().select('-password');
        
        res.status(200).json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching teachers',
            error: error.message
        });
    }
});

router.post('/teachers', adminController.createTeacher);
// In your admin routes file

// Update teacher's courses
router.put('/teachers/:id/courses', async (req, res) => {
    try {
        const Teacher = require('../models/Teacher');
        const Course = require('../models/Course');
        
        const teacherId = req.params.id;
        const { courseIds } = req.body;
        
        if (!Array.isArray(courseIds)) {
            return res.status(400).json({
                success: false,
                message: 'Course IDs must be provided as an array'
            });
        }
        
        // First, unassign the teacher from all previous courses
        await Course.updateMany(
            { teacher: teacherId },
            { $unset: { teacher: '' } }
        );
        
        // Update courses to assign the new teacher
        await Course.updateMany(
            { _id: { $in: courseIds } },
            { $set: { teacher: teacherId } }
        );
        
        // Update teacher's classes
        const teacher = await Teacher.findByIdAndUpdate(
            teacherId, 
            { classes: courseIds }, 
            { new: true }
        );
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Teacher courses updated successfully',
            data: teacher
        });
    } catch (error) {
        console.error('Error updating teacher courses:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating teacher courses',
            error: error.message
        });
    }
});

// Get teacher by ID
router.get('/teachers/:id', async (req, res) => {
    try {
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findById(req.params.id).select('-password');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher',
            error: error.message
        });
    }
});

// Update teacher
router.put('/teachers/:id', async (req, res) => {
    try {
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Teacher updated successfully',
            data: teacher
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating teacher',
            error: error.message
        });
    }
});

// Delete teacher
router.delete('/teachers/:id', async (req, res) => {
    try {
        const Teacher = require('../models/Teacher');
        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Teacher deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting teacher',
            error: error.message
        });
    }
});



// ======================================================
// COURSE MANAGEMENT ROUTES
// ======================================================
// Get all courses
router.get('/courses', async (req, res) => {
    try {
        const Course = require('../models/Course');
        const courses = await Course.find().populate('teacher', 'fullName');
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
});

router.post('/courses', adminController.createCourse);

// Get course by ID
router.get('/courses/:id', async (req, res) => {
    try {
        const Course = require('../models/Course');
        const course = await Course.findById(req.params.id).populate('teacher', 'fullName');
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
});
router.put('/users/:id/status', adminController.toggleUserStatus);

// Update course
router.put('/courses/:id', async (req, res) => {
    try {
        const Course = require('../models/Course');
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
});

// Delete course
router.delete('/courses/:id', async (req, res) => {
    try {
        const Course = require('../models/Course');
        const course = await Course.findByIdAndDelete(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
});

// ======================================================
// REPORT MANAGEMENT ROUTES
// ======================================================
// Get all reports
router.get('/reports', async (req, res) => {
    try {
        const Report = require('../models/Report');
        
        // Fetch all reports, optionally filter by type
        const { type } = req.query;
        
        const query = type ? { type } : {};
        
        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .limit(50); // Limit to prevent overwhelming response
        
        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reports',
            error: error.message
        });
    }
});


// Create new report
router.post('/reports', async (req, res) => {
    try {
        const Report = require('../models/Report');
        const newReport = await Report.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: newReport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating report',
            error: error.message
        });
    }
});

// Get report by ID
router.get('/reports/:id', async (req, res) => {
    try {
        const Report = require('../models/Report');
        
        const report = await Report.findById(req.params.id)
            .populate('course', 'name')
            .populate('generatedBy', 'fullName');
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Increment view count
        report.viewCount += 1;
        await report.save();
        
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching report',
            error: error.message
        });
    }
});

// Update report
router.put('/reports/:id', async (req, res) => {
    try {
        const Report = require('../models/Report');
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Report updated successfully',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating report',
            error: error.message
        });
    }
});

// Delete report
router.delete('/reports/:id', async (req, res) => {
    try {
        const Report = require('../models/Report');
        const report = await Report.findByIdAndDelete(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // If there's a file, delete it as well
        if (report.file) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '../../uploads/reports', report.file);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting report',
            error: error.message
        });
    }
});

// In your admin routes file
router.get('/reports/:id/download', async (req, res) => {
    try {
        const Report = require('../models/Report');
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        if (!report.file) {
            return res.status(404).json({
                success: false,
                message: 'No file attached to this report'
            });
        }
        
        // Increment download count
        report.downloadCount += 1;
        await report.save();
        
        const path = require('path');
        const filePath = path.join(__dirname, '../../uploads/reports', report.file);
        
        res.download(filePath, report.file, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({
                    success: false,
                    message: 'Error downloading file',
                    error: err.message
                });
            }
        });
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({
            success: false,
            message: 'Error downloading report',
            error: error.message
        });
    }
});
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
// REPORTING ROUTES
// ======================================================
router.get('/reports/students', async (req, res) => {
    try {
        // Generate student report based on Student model
        const Student = require('../models/Student');
        const Assignment = require('../models/Assignment');
        
        // Get all students
        const students = await Student.find().select('-password');
        
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
        const Assignment = require('../models/Assignment');
        
        // Get all courses
        const courses = await Course.find()
            .populate('teacher', 'fullName email');
            
        // For each course, get detailed information
        const courseData = [];
        
        for (const course of courses) {
            // Get assignments for this course
            const assignments = await Assignment.find({ courseId: course._id });
            
            // Calculate statistics
            const studentCount = course.students ? course.students.length : 0;
            const assignmentCount = assignments.length;
            const submissionCount = assignments.filter(a => a.status === 'submitted' || a.status === 'graded').length;
            const submissionRate = assignmentCount > 0 ? (submissionCount / assignmentCount) * 100 : 0;
            
            courseData.push({
                id: course._id,
                title: course.name,
                code: course.courseCode || course._id.toString().substring(0, 6),
                status: course.status,
                teacher: course.teacher ? course.teacher.fullName : 'Unassigned',
                students: studentCount,
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


module.exports = router;