// server/routes/materials.js
const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { handleMulterError } = require('../middleware/upload');

// Get all materials
router.get('/', materialController.getAllMaterials);

// Get materials by course - put this BEFORE the :id route to avoid conflicts
router.get('/course/:courseId', materialController.getMaterialsByCourse);

// Get single material
router.get('/:id', materialController.getMaterial);

// Download material
router.get('/:id/download', materialController.downloadMaterial);

// Create new material - protected route
router.post(
    '/',
    protect,
    upload.single('file'),
    handleMulterError,
    materialController.createMaterial
);

// Update material - protected route
router.put(
    '/:id',
    protect,
    upload.single('file'),
    handleMulterError,
    materialController.updateMaterial
);

// Delete material - protected route
router.delete(
    '/:id',
    protect,
    materialController.deleteMaterial
);

module.exports = router;