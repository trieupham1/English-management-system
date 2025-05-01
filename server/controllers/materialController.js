// controllers/materialController.js
const Material = require('../models/Material');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Get all materials (with optional filtering)
exports.getMaterials = async (req, res) => {
    try {
        const filter = {};
        
        // Apply filters if provided
        if (req.query.courseId) {
            filter.course = req.query.courseId;
        }
        
        if (req.query.type) {
            filter.type = req.query.type;
        }

        const materials = await Material.find(filter)
            .populate('course', 'name')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: materials.length,
            data: materials
        });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get a single material
exports.getMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id)
            .populate('course', 'name')
            .populate('uploadedBy', 'name');

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Increment view count
        material.viewCount += 1;
        await material.save();

        res.status(200).json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error('Error fetching material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Upload a new material
exports.uploadMaterial = async (req, res) => {
    try {
        // Add the teacher's ID as the uploader
        req.body.uploadedBy = req.user.id;
        
        // Handle file upload if present
        if (req.file) {
            req.body.file = req.file.path;
        }
        
        const material = await Material.create(req.body);

        res.status(201).json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error('Error uploading material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Update a material
exports.updateMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Check if user is the uploader of the material
        if (material.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this material'
            });
        }

        // Handle file upload if present
        if (req.file) {
            req.body.file = req.file.path;
        }

        const updatedMaterial = await Material.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedMaterial
        });
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Delete a material
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Check if user is the uploader of the material
        if (material.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this material'
            });
        }

        await material.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Download material (increment download count)
exports.downloadMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Increment download count
        material.downloadCount += 1;
        await material.save();

        // If material has a file, send the file path for download
        if (material.file) {
            return res.status(200).json({
                success: true,
                fileUrl: `/uploads/${material.file}`
            });
        }
        
        // If it's a URL material, send the URL
        if (material.url) {
            return res.status(200).json({
                success: true,
                fileUrl: material.url
            });
        }

        // If neither file nor URL is present
        res.status(400).json({
            success: false,
            message: 'No file or URL available for this material'
        });
    } catch (error) {
        console.error('Error downloading material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};