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
// Get assignments to grade
exports.getAssignmentsToGrade = async (req, res) => {
    try {
        const teacherId = req.params.id;
        
        // Find courses taught by this teacher
        const teacher = await Teacher.findById(teacherId).select('classes');
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Find assignments from courses taught by this teacher
        const assignments = await Assignment.find({
            course: { $in: teacher.classes },
            status: 'submitted'
        }).populate({
            path: 'course',
            select: 'name'
        }).populate({
            path: 'student',
            select: 'studentInfo.studentId name'
        });
        
        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
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
        const teacherId = req.params.id;
        
        // Check if teacher exists and teaches this course
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Check if teacher is assigned to this course
        if (!teacher.classes.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to add materials to this course'
            });
        }
        
        // Check if lesson exists and belongs to the course
        const lesson = await Lesson.findOne({
            _id: lessonId,
            course: courseId
        });
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found or does not belong to this course'
            });
        }
        
        // Create a new lesson material
        let materialData = {
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            lesson: lessonId,
            course: courseId,
            addedBy: teacherId
        };
        
        // Add file path if file was uploaded
        if (req.file) {
            materialData.filePath = req.file.path;
            materialData.fileName = req.file.originalname;
        } else if (req.body.link) {
            materialData.link = req.body.link;
        }
        
        const material = await LessonMaterial.create(materialData);
        
        // Update the lesson with the new material
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
        const teacherId = req.params.id;
        
        // Check if teacher exists
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Validate that the user is authorized (should be the teacher themselves or an admin)
        if (req.user.id !== teacherId && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this teacher\'s schedule'
            });
        }
        
        // Update the schedule
        teacher.schedule = req.body.schedule;
        await teacher.save();
        
        res.status(200).json({
            success: true,
            data: teacher.schedule
        });
    } catch (error) {
        console.error('Error updating teacher schedule:', error);
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
        const { id, courseId } = req.params;
        
        // Check if teacher exists and teaches this course
        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }
        
        // Check if teacher is assigned to this course
        if (!teacher.classes.includes(courseId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view students for this course'
            });
        }
        
        // Get the course with enrolled students
        const course = await Course.findById(courseId)
            .populate({
                path: 'students',
                select: 'name email studentInfo'
            });
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            count: course.students.length,
            data: course.students
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