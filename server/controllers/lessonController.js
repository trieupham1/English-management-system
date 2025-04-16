const Lesson = require('../models/Lesson');
const LessonMaterial = require('../models/LessonMaterial');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

// Get all lessons for a course
exports.getCourseLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find({ course: req.params.courseId })
            .populate('materials')
            .sort({ date: 1 });
        
        res.status(200).json({
            success: true,
            count: lessons.length,
            data: lessons
        });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single lesson
exports.getLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id)
            .populate('course', 'name level')
            .populate('materials');
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Get assignments for this lesson
        const assignments = await Assignment.find({ lesson: req.params.id });
        
        res.status(200).json({
            success: true,
            data: { lesson, assignments }
        });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create a new lesson
exports.createLesson = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Create lesson
        const lesson = await Lesson.create({
            ...req.body,
            course: courseId
        });
        
        // Add lesson to course
        course.lessons.push(lesson._id);
        await course.save();
        
        res.status(201).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update a lesson
exports.updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: lesson
        });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete a lesson
exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Remove lesson from course
        await Course.findByIdAndUpdate(
            lesson.course,
            { $pull: { lessons: lesson._id } }
        );
        
        // Delete all materials associated with this lesson
        await LessonMaterial.deleteMany({ lesson: lesson._id });
        
        // Delete all assignments associated with this lesson
        await Assignment.deleteMany({ lesson: lesson._id });
        
        // Delete the lesson
        await lesson.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Upload lesson material
exports.uploadMaterial = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        // Check if lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Create material
        const material = await LessonMaterial.create({
            ...req.body,
            lesson: lessonId,
            course: lesson.course,
            uploadedBy: req.user.id,
            file: req.file ? req.file.path : null
        });
        
        // Add material to lesson
        lesson.materials.push(material._id);
        await lesson.save();
        
        // Add material to course
        await Course.findByIdAndUpdate(
            lesson.course,
            { $push: { materials: material._id } }
        );
        
        res.status(201).json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error('Error uploading material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete lesson material
exports.deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        
        const material = await LessonMaterial.findById(materialId);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }
        
        // Remove material from lesson
        await Lesson.findByIdAndUpdate(
            material.lesson,
            { $pull: { materials: material._id } }
        );
        
        // Remove material from course
        await Course.findByIdAndUpdate(
            material.course,
            { $pull: { materials: material._id } }
        );
        
        // Delete the material
        await material.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create an assignment for a lesson
exports.createAssignment = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        // Check if lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Create assignment
        const assignment = await Assignment.create({
            ...req.body,
            lesson: lessonId,
            course: lesson.course,
            createdBy: req.user.id
        });
        
        res.status(201).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get all assignments for a course
exports.getCourseAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ course: req.params.courseId })
            .populate('lesson', 'title date')
            .sort({ dueDate: 1 });
        
        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single assignment
exports.getAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('lesson', 'title date')
            .populate('course', 'name level')
            .populate('submissions.student', 'fullName studentInfo.studentId');
        
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: assignment
        });
    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Submit assignment (for students)
exports.submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        
        // Check if student is enrolled in the course
        const course = await Course.findById(assignment.course);
        const isEnrolled = course.students.some(
            s => s.student.toString() === req.user.id
        );
        
        if (!isEnrolled) {
            return res.status(403).json({
                success: false,
                message: 'Student not enrolled in this course'
            });
        }
        
        // Check if assignment is past due date
        if (new Date(assignment.dueDate) < new Date() && !assignment.allowLateSubmissions) {
            return res.status(400).json({
                success: false,
                message: 'Assignment is past due date and late submissions are not allowed'
            });
        }
        
        // Check if student has already submitted
        const submissionIndex = assignment.submissions.findIndex(
            s => s.student.toString() === req.user.id
        );
        
        if (submissionIndex !== -1) {
            // Update existing submission
            assignment.submissions[submissionIndex] = {
                ...assignment.submissions[submissionIndex],
                content: req.body.content,
                file: req.file ? req.file.path : assignment.submissions[submissionIndex].file,
                submittedAt: Date.now(),
                isLate: new Date(assignment.dueDate) < new Date()
            };
        } else {
            // Add new submission
            assignment.submissions.push({
                student: req.user.id,
                content: req.body.content,
                file: req.file ? req.file.path : null,
                submittedAt: Date.now(),
                isLate: new Date(assignment.dueDate) < new Date()
            });
        }
        
        await assignment.save();
        
        res.status(200).json({
            success: true,
            message: 'Assignment submitted successfully',
            data: assignment.submissions.find(s => s.student.toString() === req.user.id)
        });
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Grade assignment submission (for teachers)
exports.gradeSubmission = async (req, res) => {
    try {
        const { assignmentId, studentId } = req.params;
        const { grade, feedback } = req.body;
        
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }
        
        // Find submission
        const submissionIndex = assignment.submissions.findIndex(
            s => s.student.toString() === studentId
        );
        
        if (submissionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }
        
        // Update submission with grade and feedback
        assignment.submissions[submissionIndex].grade = grade;
        assignment.submissions[submissionIndex].feedback = feedback;
        assignment.submissions[submissionIndex].gradedAt = Date.now();
        assignment.submissions[submissionIndex].gradedBy = req.user.id;
        
        await assignment.save();
        
        res.status(200).json({
            success: true,
            message: 'Submission graded successfully',
            data: assignment.submissions[submissionIndex]
        });
    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};