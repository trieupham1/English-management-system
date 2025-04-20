const Student = require('../models/Student');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
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

// Get a single student by ID
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
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
        // Check if student with this email or username already exists
        const existingStudent = await Student.findOne({ 
            $or: [
                { email: req.body.email },
                { username: req.body.username }
            ]
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email or username already exists'
            });
        }
        
        // Generate unique student ID
        const studentId = 'ST' + Math.floor(10000 + Math.random() * 90000);
        
        // Create student with default status as pending
        const studentData = {
            ...req.body,
            studentInfo: {
                ...req.body.studentInfo,
                studentId: studentId,
                status: 'pending',
                enrollmentDate: new Date()
            }
        };

        const student = await Student.create(studentData);
        
        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: {
                student: student.toJSON(),
                studentId: studentId
            }
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering student',
            error: error.message
        });
    }
};

// Update student profile
exports.updateStudent = async (req, res) => {
    try {
        const { studentInfo, ...updateData } = req.body;
        
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            {
                ...updateData,
                studentInfo: {
                    ...studentInfo,
                    updatedAt: new Date()
                }
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Student profile updated successfully',
            data: student
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating student profile',
            error: error.message
        });
    }
};

// Delete student account
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Remove student from all courses
        await Course.updateMany(
            { 'students.student': student._id },
            { $pull: { students: { student: student._id } } }
        );
        
        // Remove student's assignments
        await Assignment.deleteMany({ 'submissions.student': student._id });
        
        res.status(200).json({
            success: true,
            message: 'Student account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting student account',
            error: error.message
        });
    }
};

// Get student's courses
exports.getStudentCourses = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate({
                path: 'studentInfo.courses',
                select: 'name description level category startDate endDate teacher'
            });
        
        if (!student) {
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
            message: 'Error retrieving student courses',
            error: error.message
        });
    }
};

// Get student's assignments
exports.getStudentAssignments = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        const assignments = await Assignment.find({
            'course': { $in: student.studentInfo.courses }
        }).populate('course', 'name');
        
        // Annotate assignments with submission status
        const assignmentsWithStatus = assignments.map(assignment => {
            const submission = assignment.submissions.find(
                sub => sub.student.toString() === student._id.toString()
            );
            
            return {
                _id: assignment._id,
                title: assignment.title,
                course: assignment.course,
                dueDate: assignment.dueDate,
                status: submission ? 'Submitted' : 'Not Submitted',
                grade: submission ? submission.grade : null
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
            message: 'Error retrieving student assignments',
            error: error.message
        });
    }
};

// Get student's progress
exports.getStudentProgress = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('studentInfo.courses');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Calculate progress for each course
        const courseProgress = await Promise.all(
            student.studentInfo.courses.map(async (course) => {
                const assignments = await Assignment.find({ course: course._id });
                
                const totalAssignments = assignments.length;
                const completedAssignments = assignments.filter(assignment => 
                    assignment.submissions.some(
                        sub => sub.student.toString() === student._id.toString() && sub.grade
                    )
                ).length;
                
                const progressPercentage = totalAssignments > 0
                    ? Math.round((completedAssignments / totalAssignments) * 100)
                    : 0;
                
                return {
                    courseId: course._id,
                    courseName: course.name,
                    totalAssignments,
                    completedAssignments,
                    progressPercentage
                };
            })
        );
        
        res.status(200).json({
            success: true,
            data: courseProgress
        });
    } catch (error) {
        console.error('Error fetching student progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving student progress',
            error: error.message
        });
    }
};

// Approve student registration
exports.approveRegistration = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        student.studentInfo.status = 'active';
        await student.save();
        
        res.status(200).json({
            success: true,
            message: 'Student registration approved',
            data: student
        });
    } catch (error) {
        console.error('Error approving registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving student registration',
            error: error.message
        });
    }
};

module.exports = exports;