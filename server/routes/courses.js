const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Get all courses
router.get('/', protect, courseController.getAllCourses);

// Get a single course
router.get('/:id', protect, courseController.getCourse);

// Create a new course (manager and teacher only)
router.post('/', protect, authorize('manager', 'teacher'), courseController.createCourse);

// Update a course (manager and teacher only)
router.put('/:id', protect, authorize('manager', 'teacher'), courseController.updateCourse);

// Delete a course (manager only)
router.delete('/:id', protect, authorize('manager'), courseController.deleteCourse);

// Enroll a student in a course (receptionist and manager only)
router.post('/:id/enroll', protect, authorize('receptionist', 'manager'), courseController.enrollStudent);

// Remove a student from a course (receptionist and manager only)
router.delete('/:id/students/:studentId', protect, authorize('receptionist', 'manager'), courseController.removeStudent);

// Update student payment status (receptionist and manager only)
router.put('/:id/payment/:studentId', protect, authorize('receptionist', 'manager'), courseController.updatePaymentStatus);

// Get all courses for a specific teacher
router.get('/teacher/:teacherId', protect, courseController.getTeacherCourses);

// Get all students enrolled in a specific course
router.get('/:id/students', protect, courseController.getCourseStudents);

module.exports = router;