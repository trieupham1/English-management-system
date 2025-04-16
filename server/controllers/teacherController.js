const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const LessonMaterial = require('../models/LessonMaterial');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get all teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
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
        const teacher = await User.findById(req.params.id)
            .select('-password')
            .select('-__v');
        
        if (!teacher || teacher.role !== 'teacher') {
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
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Generate teacher ID
        const teacherId = 'T' + Math.floor(10000 + Math.random() * 90000);
        
        // Create teacher
        const teacher = await User.create({
            ...req.body,
            role: 'teacher',
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
        // Prevent role change
        if (req.body.role && req.body.role !== 'teacher') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change role'
            });
        }
        
        const teacher = await User.findByIdAndUpdate(
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
        const teacher = await User.findById(req.params.id);
        
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Update all courses taught by this teacher
        if (teacher.teacherInfo && teacher.teacherInfo.classes) {
            for (const courseId of teacher.teacherInfo.classes) {
                // This would need to be handled by admin - either delete the course
                // or reassign to another teacher
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
        const teacher = await User.findById(req.params.id)
            .select('teacherInfo.classes')
            .populate({
                path: 'teacherInfo.classes',
                select: 'name description level category schedule startDate endDate status',
            });
        
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            count: teacher.teacherInfo.classes.length,
            data: teacher.teacherInfo.classes
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
        const teacher = await User.findById(req.params.id)
            .select('teacherInfo.schedule')
            .populate({
                path: 'teacherInfo.schedule.course',
                select: 'name level'
            });
        
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: teacher.teacherInfo.schedule
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

// Get assignments to grade
exports.getAssignmentsToGrade = async (req, res) => {
    try {
        // Get all courses taught by this teacher
        const teacher = await User.findById(req.params.id)
            .select('teacherInfo.classes');
            
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Get all assignments for these courses
        const assignments = await Assignment.find({
            course: { $in: teacher.teacherInfo.classes }
        }).populate('course', 'name');
        
        // Filter for assignments with ungraded submissions
        const assignmentsToGrade = assignments.filter(assignment => 
            assignment.submissions.some(submission => !submission.grade)
        );
        
        // Format the response with submission counts
        const formattedAssignments = assignmentsToGrade.map(assignment => ({
            _id: assignment._id,
            title: assignment.title,
            course: assignment.course,
            dueDate: assignment.dueDate,
            totalSubmissions: assignment.submissions.length,
            ungradedSubmissions: assignment.submissions.filter(sub => !sub.grade).length
        }));
        
        res.status(200).json({
            success: true,
            count: formattedAssignments.length,
            data: formattedAssignments
        });
    } catch (error) {
        console.error('Error fetching assignments to grade:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Add lesson material
exports.addLessonMaterial = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const { title, description, type } = req.body;
        
        // Check if course and lesson exist
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Check if teacher is assigned to this course
        if (course.teacher.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add materials to this course'
            });
        }
        
        // Create material
        const material = await LessonMaterial.create({
            title,
            description,
            type,
            lesson: lessonId,
            course: courseId,
            uploadedBy: req.params.id,
            file: req.file ? req.file.path : null
        });
        
        // Add material to lesson
        lesson.materials.push(material._id);
        await lesson.save();
        
        res.status(201).json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error('Error adding lesson material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update teacher's schedule
exports.updateSchedule = async (req, res) => {
    try {
        const { schedule } = req.body;
        
        const teacher = await User.findById(req.params.id);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        teacher.teacherInfo.schedule = schedule;
        await teacher.save();
        
        res.status(200).json({
            success: true,
            data: teacher.teacherInfo.schedule
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get students by course
exports.getStudentsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Check if course exists and teacher is assigned to it
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        if (course.teacher.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view students for this course'
            });
        }
        
        // Get all students enrolled in this course
        const students = await Course.findById(courseId)
            .select('students')
            .populate({
                path: 'students.student',
                select: 'fullName email phone studentInfo.studentId studentInfo.currentLevel'
            });
        
        res.status(200).json({
            success: true,
            count: students.students.length,
            data: students.students
        });
    } catch (error) {
        console.error('Error fetching students by course:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = exports;