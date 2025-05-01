// routes/materials.js
const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all materials
// GET /api/materials
router.get('/', protect, materialController.getMaterials);

// Get a single material
// GET /api/materials/:id
router.get('/:id', protect, materialController.getMaterial);

// Upload a new material
// POST /api/materials
router.post(
    '/', 
    protect, 
    authorize('teacher', 'admin'), 
    upload.single('file'), 
    materialController.uploadMaterial
);

// Update a material
// PUT /api/materials/:id
router.put(
    '/:id', 
    protect, 
    authorize('teacher', 'admin'), 
    upload.single('file'), 
    materialController.updateMaterial
);

// Delete a material
// DELETE /api/materials/:id
router.delete(
    '/:id', 
    protect, 
    authorize('teacher', 'admin'), 
    materialController.deleteMaterial
);

// Download material
// GET /api/materials/:id/download
router.get(
    '/:id/download', 
    protect, 
    materialController.downloadMaterial
);

module.exports = router;