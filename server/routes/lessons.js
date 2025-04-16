const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all lessons for a course
router.get('/course/:courseId', protect, lessonController.getCourseLessons);

// Get a single lesson
router.get('/:id', protect, lessonController.getLesson);

// Create a new lesson (teacher and manager only)
router.post('/course/:courseId', protect, authorize('teacher', 'manager'), lessonController.createLesson);

// Update a lesson (teacher and manager only)
router.put('/:id', protect, authorize('teacher', 'manager'), lessonController.updateLesson);

// Delete a lesson (teacher and manager only)
router.delete('/:id', protect, authorize('teacher', 'manager'), lessonController.deleteLesson);

// Upload lesson material
router.post('/:lessonId/materials', 
    protect, 
    authorize('teacher', 'manager'), 
    upload.single('file'), 
    lessonController.uploadMaterial
);

// Delete lesson material
router.delete('/materials/:materialId', 
    protect, 
    authorize('teacher', 'manager'), 
    lessonController.deleteMaterial
);

// Create an assignment for a lesson
router.post('/:lessonId/assignments', 
    protect, 
    authorize('teacher', 'manager'), 
    lessonController.createAssignment
);

// Get all assignments for a course
router.get('/course/:courseId/assignments', 
    protect, 
    lessonController.getCourseAssignments
);

// Get a single assignment
router.get('/assignments/:id', 
    protect, 
    lessonController.getAssignment
);

// Submit assignment (for students)
router.post('/assignments/:assignmentId/submit', 
    protect, 
    authorize('student'), 
    upload.single('file'), 
    lessonController.submitAssignment
);

// Grade assignment submission (for teachers)
router.put('/assignments/:assignmentId/grade/:studentId', 
    protect, 
    authorize('teacher', 'manager'), 
    lessonController.gradeSubmission
);

module.exports = router;