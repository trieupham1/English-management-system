const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Course = require('../models/Course');

// Routes that don't require ID parameter should come first

// Get authenticated teacher's courses (no ID needed, uses req.user)
router.get('/my-courses', protect, authorize('teacher'), async (req, res) => {
    try {
        // Get teacher ID from the authenticated user
        const teacherId = req.user._id;
        
        // Find courses where this teacher is assigned
        const courses = await Course.find({ teacher: teacherId })
            .select('_id name level category')
            .lean();
        
        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
});

// Get all teachers (receptionist and manager only)
router.get('/', protect, authorize('receptionist', 'manager'), teacherController.getAllTeachers);

// Create a new teacher (manager only)
router.post('/', protect, authorize('manager'), teacherController.createTeacher);

// Routes with ID parameter

// Get a single teacher
router.get('/:id', protect, teacherController.getTeacher);

// Update a teacher
router.put('/:id', protect, teacherController.updateTeacher);

// Delete a teacher (manager only)
router.delete('/:id', protect, authorize('manager'), teacherController.deleteTeacher);

// Get teacher's courses (using ID parameter)
router.get('/:id/courses', protect, teacherController.getTeacherCourses);

// Get teacher's schedule
router.get('/:id/schedule', protect, teacherController.getTeacherSchedule);

// Update teacher's schedule
router.put('/:id/schedule', protect, teacherController.updateSchedule);

// Get assignments to grade
router.get('/:id/assignments/grade', protect, teacherController.getAssignmentsToGrade);

// Get students by course
router.get('/:id/courses/:courseId/students', protect, teacherController.getStudentsByCourse);

// Add lesson material
router.post('/:id/courses/:courseId/lessons/:lessonId/materials', 
    protect, 
    upload.single('file'), 
    teacherController.addLessonMaterial
);

module.exports = router;