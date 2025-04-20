const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const LessonMaterial = require('../models/LessonMaterial');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get all teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
            .select('-password')
            .select('-__v');
        
        res.status(200).json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single teacher
exports.getTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
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
        console.error('Error fetching teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create a new teacher
exports.createTeacher = async (req, res) => {
    try {
        // Check if teacher with this email already exists
        const existingTeacher = await Teacher.findOne({ email: req.body.email });
        if (existingTeacher) {
            return res.status(400).json({
                success: false,
                message: 'Teacher with this email already exists'
            });
        }
        
        // Generate teacher ID
        const teacherId = 'T' + Math.floor(10000 + Math.random() * 90000);
        
        // Create teacher
        const teacher = await Teacher.create({
            ...req.body,
            teacherInfo: {
                ...req.body.teacherInfo,
                teacherId
            }
        });
        
        res.status(201).json({
            success: true,
            data: teacher
        });
    } catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update a teacher
exports.updateTeacher = async (req, res) => {
    try {
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
            data: teacher
        });
    } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete a teacher
exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Update all courses taught by this teacher
        if (teacher.classes) {
            for (const courseId of teacher.classes) {
                await Course.findByIdAndUpdate(
                    courseId,
                    { status: 'cancelled' }
                );
            }
        }
        
        // Delete the teacher
        await teacher.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get teacher's courses
exports.getTeacherCourses = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .select('classes')
            .populate({
                path: 'classes',
                select: 'name description level category schedule startDate endDate status',
            });
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            count: teacher.classes.length,
            data: teacher.classes
        });
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get teacher's schedule
exports.getTeacherSchedule = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .select('schedule')
            .populate({
                path: 'schedule.course',
                select: 'name level'
            });
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: teacher.schedule
        });
    } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Additional methods from the original controller can be similarly adapted

module.exports = exports;