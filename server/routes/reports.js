// server/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth'); 
const upload = require('../middleware/upload');
const { handleMulterError } = require('../middleware/upload');

// Get all reports
router.get('/', reportController.getAllReports);

// Get reports by course
router.get('/course/:courseId', reportController.getReportsByCourse);

// Get reports by current teacher (protected)
router.get('/teacher', 
    authMiddleware.protect,
    reportController.getReportsByTeacher
);

// Get single report
router.get('/:id', reportController.getReport);

// Download report
router.get('/:id/download', reportController.downloadReport);

// Get PDF version of report
router.get('/:id/pdf', reportController.generatePDF);

// Create new report - protected route
router.post(
    '/',
    authMiddleware.protect,
    upload.single('file'),
    handleMulterError,
    reportController.createReport
);

// Update report - protected route
router.put(
    '/:id',
    authMiddleware.protect,
    upload.single('file'),
    handleMulterError,
    reportController.updateReport
);

// Delete report - protected route
router.delete(
    '/:id',
    authMiddleware.protect,
    reportController.deleteReport
);

module.exports = router;