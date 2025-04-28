// server/routes/students.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Get student dashboard data
router.get('/dashboard', protect, studentController.getStudentDashboard);

// Get all students (receptionist, teacher, manager only)
router.get('/', protect, authorize('receptionist', 'teacher', 'manager'), studentController.getAllStudents);

// Get a single student
router.get('/:id', protect, studentController.getStudent);

// Create a new student (receptionist and manager only)
router.post('/', protect, authorize('receptionist', 'manager'), studentController.createStudent);

// Update a student
router.put('/:id', protect, studentController.updateStudent);

// Delete a student (manager only)
router.delete('/:id', protect, authorize('manager'), studentController.deleteStudent);

// Get student's courses
router.get('/:id/courses', protect, studentController.getStudentCourses);

// Get student's assignments
router.get('/:id/assignments', protect, studentController.getStudentAssignments);

// Get student's progress
router.get('/:id/progress', protect, studentController.getStudentProgress);

// Update student attendance
router.put('/:studentId/attendance', protect, authorize('teacher', 'manager'), studentController.updateAttendance);

// Get pending student registrations (receptionist and manager only)
router.get('/registrations/pending', protect, authorize('receptionist', 'manager'), studentController.getPendingRegistrations);

// Approve student registration (receptionist and manager only)
router.put('/registrations/:id/approve', protect, authorize('receptionist', 'manager'), studentController.approveRegistration);

module.exports = router;