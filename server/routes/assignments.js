// routes/assignments.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all assignments
// GET /api/assignments
router.get('/', protect, assignmentController.getAssignments);

// Get a single assignment
// GET /api/assignments/:id
router.get('/:id', protect, assignmentController.getAssignment);

// Create a new assignment (with file upload support)
// POST /api/assignments
router.post(
    '/', 
    protect, 
    authorize('teacher'), // Remove 'admin' if you only want teachers to create assignments
    upload.single('file'), // Add this line to handle file uploads
    assignmentController.createAssignment
);

// Update an assignment
// PUT /api/assignments/:id
router.put(
    '/:id', 
    protect, 
    authorize('teacher', 'admin'), 
    assignmentController.updateAssignment
);

// Delete an assignment
// DELETE /api/assignments/:id
router.delete(
    '/:id', 
    protect, 
    authorize('teacher', 'admin'), 
    assignmentController.deleteAssignment
);

// Submit an assignment (for students)
// POST /api/assignments/:id/submit
router.post(
    '/:id/submit', 
    protect, 
    authorize('student'), 
    upload.single('file'), 
    assignmentController.submitAssignment
);

// Grade a submission
// PUT /api/assignments/:id/grade/:studentId
router.put(
    '/:id/grade/:studentId', 
    protect, 
    authorize('teacher', 'admin'), 
    assignmentController.gradeSubmission
);

// Get all submissions for an assignment
// GET /api/assignments/:id/submissions
router.get(
    '/:id/submissions', 
    protect, 
    authorize('teacher', 'admin'), 
    assignmentController.getSubmissions
);

// Remove a submission
// POST /api/assignments/:id/remove-submission
router.post(
    '/:id/remove-submission', 
    protect, 
    authorize('student'), 
    assignmentController.removeSubmission
);

module.exports = router;