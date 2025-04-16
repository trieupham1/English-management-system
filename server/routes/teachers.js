const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all teachers (receptionist and manager only)
router.get('/', protect, authorize('receptionist', 'manager'), teacherController.getAllTeachers);

// Get a single teacher
router.get('/:id', protect, teacherController.getTeacher);

// Create a new teacher (manager only)
router.post('/', protect, authorize('manager'), teacherController.createTeacher);

// Update a teacher
router.put('/:id', protect, teacherController.updateTeacher);

// Delete a teacher (manager only)
router.delete('/:id', protect, authorize('manager'), teacherController.deleteTeacher);

// Get teacher's courses
router.get('/:id/courses', protect, teacherController.getTeacherCourses);

// Get teacher's schedule
router.get('/:id/schedule', protect, teacherController.getTeacherSchedule);

// Get assignments to grade
router.get('/:id/assignments/grade', protect, teacherController.getAssignmentsToGrade);

// Add lesson material
router.post('/:id/courses/:courseId/lessons/:lessonId/materials', 
    protect, 
    upload.single('file'), 
    teacherController.addLessonMaterial
);

// Update teacher's schedule
router.put('/:id/schedule', protect, teacherController.updateSchedule);

// Get students by course
router.get('/:id/courses/:courseId/students', protect, teacherController.getStudentsByCourse);

module.exports = router;