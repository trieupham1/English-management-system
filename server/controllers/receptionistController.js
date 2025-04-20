const Receptionist = require('../models/receptionist');
const Student = require('../models/Student');
const Course = require('../models/Course');
const jwt = require('jsonwebtoken');

// Get all receptionists
exports.getAllReceptionists = async (req, res) => {
    try {
        const receptionists = await Receptionist.find()
            .select('-password')
            .select('-__v');
        
        res.status(200).json({
            success: true,
            count: receptionists.length,
            data: receptionists
        });
    } catch (error) {
        console.error('Error fetching receptionists:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single receptionist by ID
exports.getReceptionistById = async (req, res) => {
    try {
        const receptionist = await Receptionist.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: receptionist
        });
    } catch (error) {
        console.error('Error fetching receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create a new receptionist
exports.createReceptionist = async (req, res) => {
    try {
        // Check if receptionist with this email or username already exists
        const existingReceptionist = await Receptionist.findOne({ 
            $or: [
                { email: req.body.email },
                { username: req.body.username }
            ]
        });

        if (existingReceptionist) {
            return res.status(400).json({
                success: false,
                message: 'Receptionist with this email or username already exists'
            });
        }
        
        // Generate unique employee ID
        const employeeId = 'RC' + Math.floor(10000 + Math.random() * 90000);
        
        // Create receptionist
        const receptionistData = {
            ...req.body,
            employeeId: employeeId,
            isActive: true
        };

        const receptionist = await Receptionist.create(receptionistData);
        
        res.status(201).json({
            success: true,
            message: 'Receptionist registered successfully',
            data: {
                receptionist: receptionist.toJSON(),
                employeeId: employeeId
            }
        });
    } catch (error) {
        console.error('Error creating receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering receptionist',
            error: error.message
        });
    }
};

// Update receptionist profile
exports.updateReceptionist = async (req, res) => {
    try {
        const { responsibilities, shift, ...updateData } = req.body;
        
        const receptionist = await Receptionist.findByIdAndUpdate(
            req.params.id,
            {
                ...updateData,
                responsibilities,
                shift,
                updatedAt: new Date()
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).select('-password');
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Receptionist profile updated successfully',
            data: receptionist
        });
    } catch (error) {
        console.error('Error updating receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating receptionist profile',
            error: error.message
        });
    }
};

// Manage student registrations
exports.managePendingRegistrations = async (req, res) => {
    try {
        // Get all pending student registrations
        const pendingStudents = await Student.find({
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
            message: 'Error retrieving pending registrations',
            error: error.message
        });
    }
};

// Approve student registration
exports.approveStudentRegistration = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Update student status
        student.studentInfo.status = 'active';
        await student.save();
        
        res.status(200).json({
            success: true,
            message: 'Student registration approved',
            data: student
        });
    } catch (error) {
        console.error('Error approving student registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving student registration',
            error: error.message
        });
    }
};

// Get course enrollment statistics
exports.getCourseEnrollmentStats = async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                $group: {
                    _id: '$category',
                    totalCourses: { $sum: 1 },
                    totalEnrollments: { $sum: { $size: '$students' } },
                    averageEnrollment: { $avg: { $size: '$students' } }
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching course enrollment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving course statistics',
            error: error.message
        });
    }
};

// Delete receptionist account
exports.deleteReceptionist = async (req, res) => {
    try {
        const receptionist = await Receptionist.findByIdAndDelete(req.params.id);
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Receptionist account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting receptionist:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting receptionist account',
            error: error.message
        });
    }
};

// Get receptionist's shift and responsibilities
exports.getReceptionistDetails = async (req, res) => {
    try {
        const receptionist = await Receptionist.findById(req.params.id)
            .select('shift responsibilities employeeId fullName');
        
        if (!receptionist) {
            return res.status(404).json({
                success: false,
                message: 'Receptionist not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: receptionist
        });
    } catch (error) {
        console.error('Error fetching receptionist details:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving receptionist details',
            error: error.message
        });
    }
};