// controllers/assignmentController.js
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Get all assignments (with optional filtering)
exports.getAssignments = async (req, res) => {
    try {
        const filter = {};
        
        // Apply filters if provided
        if (req.query.courseId) {
            filter.course = req.query.courseId;
        }
        
        if (req.query.status) {
            filter.isActive = req.query.status === 'active';
        }

        const assignments = await Assignment.find(filter)
            .populate('course', 'name')
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
            .populate('course', 'name')
            .populate('submissions.student', 'name');

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

// Create a new assignment
exports.createAssignment = async (req, res) => {
    try {
        // Add the teacher's ID as the creator
        req.body.createdBy = req.user.id;
        
        const assignment = await Assignment.create(req.body);

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

// Update an assignment
exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

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
        console.error('Error updating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check if user is the creator of the assignment
        if (assignment.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this assignment'
            });
        }

        await assignment.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting assignment:', error);
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
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Check if assignment is past due date
        const isPastDue = new Date(assignment.dueDate) < new Date();
        
        // Check if student has already submitted
        const existingSubmission = assignment.submissions.find(
            sub => sub.student.toString() === req.user.id
        );

        if (existingSubmission) {
            // Update existing submission
            existingSubmission.content = req.body.content;
            existingSubmission.submittedAt = Date.now();
            existingSubmission.isLate = isPastDue;
            
            if (req.file) {
                existingSubmission.file = req.file.path;
            }
        } else {
            // Add new submission
            assignment.submissions.push({
                student: req.user.id,
                content: req.body.content,
                file: req.file ? req.file.path : null,
                submittedAt: Date.now(),
                isLate: isPastDue
            });
        }

        await assignment.save();

        res.status(200).json({
            success: true,
            message: 'Assignment submitted successfully'
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

// Grade assignment submission
exports.gradeSubmission = async (req, res) => {
    try {
        const { grade, feedback } = req.body;
        const { id, studentId } = req.params;

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Find the student's submission
        const submission = assignment.submissions.find(
            sub => sub.student.toString() === studentId
        );

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Update the submission with grade and feedback
        submission.grade = grade;
        submission.feedback = feedback;
        submission.gradedAt = Date.now();
        submission.gradedBy = req.user.id;

        await assignment.save();

        res.status(200).json({
            success: true,
            data: submission
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

// Get all submissions for an assignment
exports.getSubmissions = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('submissions.student', 'name email')
            .populate('course', 'name');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                title: assignment.title,
                dueDate: assignment.dueDate,
                totalPoints: assignment.totalPoints,
                className: assignment.course ? assignment.course.name : 'Unknown',
                totalStudents: assignment.course ? assignment.course.students.length : 0,
                submissions: assignment.submissions.map(sub => ({
                    studentId: sub.student._id,
                    studentName: sub.student.name || sub.student.email,
                    submittedAt: sub.submittedAt,
                    isLate: sub.isLate,
                    grade: sub.grade,
                    feedback: sub.feedback,
                    content: sub.content,
                    fileName: sub.file ? sub.file.split('/').pop() : null,
                    fileUrl: sub.file ? `/uploads/${sub.file}` : null
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};