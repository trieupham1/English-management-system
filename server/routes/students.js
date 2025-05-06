// server/routes/students.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Special routes (must come BEFORE parameter routes)
router.get('/dashboard', protect, studentController.getStudentDashboard);
router.get('/assignments', protect, studentController.getStudentAssignments);
router.get('/materials', protect, studentController.getCourseMaterials);
router.get('/registrations/pending', protect, authorize('receptionist', 'manager'), studentController.getPendingRegistrations);
router.put('/registrations/:id/approve', protect, authorize('receptionist', 'manager'), studentController.approveRegistration);
router.get('/courses', protect, studentController.getStudentCourses);
router.get('/byteacher', protect, authorize('teacher'), studentController.getStudentsByTeacher);
router.get('/courses/dropdown', protect, studentController.getCoursesForDropdown);
router.get('/materials/course/:courseId', protect, studentController.getMaterialsByCourse);
router.get('/debug-courses', async (req, res) => {
    try {
        const courses = await Course.find().limit(5);
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Debug courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
});

// Get all students (receptionist, teacher, manager only)
router.get('/', protect, authorize('receptionist', 'teacher', 'manager'), studentController.getAllStudents);

// Parameter routes (must come AFTER special routes)
router.get('/:id', protect, studentController.getStudent);
router.post('/', protect, authorize('receptionist', 'manager'), studentController.createStudent);
router.put('/:id', protect, studentController.updateStudent);
router.delete('/:id', protect, authorize('manager'), studentController.deleteStudent);
router.get('/:id/courses', protect, studentController.getStudentCourses);
router.get('/:id/assignments', protect, studentController.getStudentAssignments);
router.get('/:id/progress', protect, studentController.getStudentProgress);
router.put('/:studentId/attendance', protect, authorize('teacher', 'manager'), studentController.updateAttendance);

module.exports = router;