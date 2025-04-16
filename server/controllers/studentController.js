const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .select('-__v');
        
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single student
exports.getStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
        if (!student || student.role !== 'student') {
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
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create a new student
exports.createStudent = async (req, res) => {
    try {
        // Check if student with this email already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Generate student ID
        const studentId = 'ST' + Math.floor(10000 + Math.random() * 90000);
        
        // Create student
        const student = await User.create({
            ...req.body,
            role: 'student',
            studentInfo: {
                ...req.body.studentInfo,
                studentId
            }
        });
        
        res.status(201).json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update a student
exports.updateStudent = async (req, res) => {
    try {
        // Prevent role change
        if (req.body.role && req.body.role !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change role'
            });
        }
        
        const student = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
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
            data: student
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Remove student from all enrolled courses
        if (student.studentInfo && student.studentInfo.courses) {
            for (const courseId of student.studentInfo.courses) {
                await Course.findByIdAndUpdate(
                    courseId,
                    { $pull: { students: { student: student._id } } }
                );
            }
        }
        
        // Delete student submissions from assignments
        await Assignment.updateMany(
            { 'submissions.student': student._id },
            { $pull: { submissions: { student: student._id } } }
        );
        
        // Delete the student
        await student.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get student's courses
exports.getStudentCourses = async (req, res) => {
    try {
        const student = await User.findById(req.params.id)
            .select('studentInfo.courses')
            .populate({
                path: 'studentInfo.courses',
                select: 'name description level category schedule startDate endDate teacher status',
                populate: {
                    path: 'teacher',
                    select: 'fullName email'
                }
            });
        
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            count: student.studentInfo.courses.length,
            data: student.studentInfo.courses
        });
    } catch (error) {
        console.error('Error fetching student courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get student's assignments
exports.getStudentAssignments = async (req, res) => {
    try {
        // First get all courses the student is enrolled in
        const student = await User.findById(req.params.id)
            .select('studentInfo.courses');
            
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Get all assignments for these courses
        const assignments = await Assignment.find({
            course: { $in: student.studentInfo.courses }
        }).populate('course', 'name').populate('lesson', 'title');
        
        // Add submission status for the student
        const assignmentsWithStatus = assignments.map(assignment => {
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === req.params.id
            );
            
            return {
                _id: assignment._id,
                title: assignment.title,
                description: assignment.description,
                course: assignment.course,
                lesson: assignment.lesson,
                dueDate: assignment.dueDate,
                totalPoints: assignment.totalPoints,
                submissionStatus: submission ? 'Submitted' : 'Not Submitted',
                grade: submission && submission.grade ? submission.grade : null,
                feedback: submission && submission.feedback ? submission.feedback : null,
                isLate: submission && submission.isLate ? true : false
            };
        });
        
        res.status(200).json({
            success: true,
            count: assignmentsWithStatus.length,
            data: assignmentsWithStatus
        });
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get student's progress
exports.getStudentProgress = async (req, res) => {
    try {
        const student = await User.findById(req.params.id)
            .select('studentInfo.courses');
            
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Get courses with progress information
        const courses = await Course.find({
            _id: { $in: student.studentInfo.courses }
        }).select('name level category startDate endDate');
        
        // Get assignments and calculate completion
        const courseProgress = await Promise.all(courses.map(async (course) => {
            // Get all assignments for this course
            const assignments = await Assignment.find({ course: course._id });
            
            // Count total assignments
            const totalAssignments = assignments.length;
            
            // Count completed assignments
            const completedAssignments = assignments.reduce((count, assignment) => {
                const submission = assignment.submissions.find(
                    sub => sub.student.toString() === req.params.id && sub.grade
                );
                return submission ? count + 1 : count;
            }, 0);
            
            // Calculate progress percentage
            const progressPercentage = totalAssignments > 0
                ? Math.round((completedAssignments / totalAssignments) * 100)
                : 0;
            
            return {
                _id: course._id,
                name: course.name,
                level: course.level,
                category: course.category,
                startDate: course.startDate,
                endDate: course.endDate,
                totalAssignments,
                completedAssignments,
                progressPercentage
            };
        }));
        
        res.status(200).json({
            success: true,
            data: courseProgress
        });
    } catch (error) {
        console.error('Error fetching student progress:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update student attendance
exports.updateAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, date, status } = req.body;
        
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Check if student is enrolled in the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        const enrollment = course.students.find(
            s => s.student.toString() === studentId
        );
        
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Student not enrolled in this course'
            });
        }
        
        // Initialize attendance array if it doesn't exist
        if (!enrollment.attendance) {
            enrollment.attendance = [];
        }
        
        // Find existing attendance record for this date
        const attendanceIndex = enrollment.attendance.findIndex(
            a => new Date(a.date).toDateString() === new Date(date).toDateString()
        );
        
        if (attendanceIndex !== -1) {
            // Update existing record
            enrollment.attendance[attendanceIndex].status = status;
        } else {
            // Add new record
            enrollment.attendance.push({
                date,
                status
            });
        }
        
        // Update attendance percentage
        const totalClasses = enrollment.attendance.length;
        const presentClasses = enrollment.attendance.filter(
            a => a.status === 'present'
        ).length;
        
        enrollment.attendancePercentage = totalClasses > 0
            ? Math.round((presentClasses / totalClasses) * 100)
            : 0;
        
        await course.save();
        
        res.status(200).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get pending student registrations
exports.getPendingRegistrations = async (req, res) => {
    try {
        const pendingStudents = await User.find({
            role: 'student',
            'studentInfo.status': 'pending'
        }).select('-password');
        
        res.status(200).json({
            success: true,
            count: pendingStudents.length,
            data: pendingStudents
        });
    } catch (error) {
        console.error('Error fetching pending registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Approve student registration
exports.approveRegistration = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        
        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        student.studentInfo.status = 'active';
        await student.save();
        
        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Error approving registration:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = exports;