const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { protect, authorize } = require('../middleware/auth');

// Dashboard route
router.get('/dashboard', protect, authorize('receptionist'), receptionistController.getDashboardData);

// Student registration and management routes
router.post('/students/register', protect, authorize('receptionist'), receptionistController.registerStudent);
router.post('/students/assign-class', protect, authorize('receptionist'), receptionistController.assignStudentToClass);
router.get('/students/pending', protect, authorize('receptionist'), receptionistController.getPendingRegistrations);
router.put('/students/:studentId/approve', protect, authorize('receptionist'), receptionistController.approveStudent);
router.put('/students/:studentId/activate', protect, authorize('receptionist'), receptionistController.activateStudent);
router.get('/students', protect, authorize('receptionist'), receptionistController.getAllStudents);

// Class schedule routes
router.get('/classes/schedule', protect, authorize('receptionist'), receptionistController.getClassesSchedule);

// Receptionist management routes - admin only
router.get('/', protect, authorize('manager'), receptionistController.getAllReceptionists);
router.get('/:id', protect, authorize('manager', 'receptionist'), receptionistController.getReceptionistById);
router.post('/', protect, authorize('manager'), receptionistController.createReceptionist);
router.put('/:id', protect, authorize('manager', 'receptionist'), receptionistController.updateReceptionist);
router.delete('/:id', protect, authorize('manager'), receptionistController.deleteReceptionist);

module.exports = router;