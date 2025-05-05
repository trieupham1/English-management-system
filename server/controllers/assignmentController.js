// controllers/assignmentController.js
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Get all assignments (with optional filtering)
exports.getAssignments = async (req, res) => {
    try {
        const filter = {};
        
        // Check for teacher's courses filtering (array of course IDs)
        if (req.query.courseIds) {
            // Convert to array if it's not already (handles both single value and array)
            const courseIds = Array.isArray(req.query.courseIds) 
                ? req.query.courseIds 
                : [req.query.courseIds];
            
            console.log('Filtering assignments by teacher courses:', courseIds);
            
            // Use MongoDB $in operator to filter by multiple course IDs
            filter.course = { $in: courseIds };
        }
        // Backward compatibility for single course filtering
        else if (req.query.courseId || req.query.course) {
            filter.course = req.query.courseId || req.query.course;
        }
        
        // Status filtering
        if (req.query.status) {
            if (req.query.status === 'active') {
                filter.isActive = true;
            } else if (req.query.status === 'inactive' || req.query.status === 'closed') {
                filter.isActive = false;
            }
        }
        
        // Search filtering
        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: 'i' };
        }
        
        console.log('Assignment filter query:', filter);

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
// In your createAssignment function, update to handle FormData properly:

exports.createAssignment = async (req, res) => {
    try {
        console.log('Creating assignment with data:', req.body);
        console.log('File received:', req.file);
        
        const { title, course, dueDate, totalPoints, instructions } = req.body;
        
        // Get the teacher ID from the authenticated user
        const teacherId = req.user._id;
        
        console.log('Teacher ID:', teacherId);
        console.log('Course ID:', course);
        
        // Verify the teacher is assigned to this course
        const courseExists = await Course.findOne({
            _id: course,
            teacher: teacherId
        });
        
        if (!courseExists) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to create assignments for this course'
            });
        }
        
        // Create assignment data
        const assignmentData = {
            title,
            course,
            instructions,
            dueDate,
            totalPoints: totalPoints || 100,
            createdBy: teacherId,
            isActive: true,
            attachments: [],
            submissions: []
        };
        
        // Handle file attachment if provided
        if (req.file) {
            assignmentData.attachments = [{
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size
            }];
        }
        
        console.log('Assignment data to create:', assignmentData);
        
        // Create the assignment
        const assignment = await Assignment.create(assignmentData);
        
        // Populate the course information for the response
        await assignment.populate('course', 'name level');
        await assignment.populate('createdBy', 'fullName');
        
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

        // Look for studentId in query parameters first, then body, then user object
        const studentId = req.query.studentId || req.body.student || (req.user ? req.user.id : null);

        console.log("Final student ID being used:", studentId);
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        // Check if assignment is past due date
        const isPastDue = new Date(assignment.dueDate) < new Date();

         // Check if student has already submitted
         const existingSubmission = assignment.submissions.find(
            sub => sub.student && sub.student.toString() === studentId
        );

        if (existingSubmission) {
            // Update existing submission
            existingSubmission.content = req.body.content;
            existingSubmission.submittedAt = Date.now();
            existingSubmission.isLate = isPastDue;
            
            if (req.file) {
                existingSubmission.file = req.file.path;
            }
        } else 
        // Add submission
        assignment.submissions.push({
            student: studentId,  // This is the important part - using the found studentId
            content: req.body.content || '',
            file: req.file ? req.file.path : null,
            submittedAt: Date.now(),
            isLate: new Date(assignment.dueDate) < new Date()
        });

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

// Remove a submission
exports.removeSubmission = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Find the student's submission index
        const submissionIndex = assignment.submissions.findIndex(
            sub => sub.student.toString() === req.user.id
        );

        if (submissionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'No submission found for this user'
            });
        }

        // Remove the submission from the array
        assignment.submissions.splice(submissionIndex, 1);

        await assignment.save();

        res.status(200).json({
            success: true,
            message: 'Submission removed successfully'
        });
    } catch (error) {
        console.error('Error removing submission:', error);
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