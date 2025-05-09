// server/controllers/materialController.js

const Material = require('../models/Material');
const Course = require('../models/Course'); 
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const path = require('path');
const fs = require('fs');

// Helper function to extract user ID from request
const extractUserId = (user) => {
    if (!user) return null;
    return user._id || user.id || user.userId || (user.toObject && user.toObject()._id);
};

// Get all materials
exports.getAllMaterials = async (req, res) => {
    try {
        // Get query parameters for filtering
        const { courseIds, type, search } = req.query;
        
        // Build query object
        const query = {};
        
        // Handle courseIds parameter (could be single value or array)
        if (courseIds) {
            // Convert to array if it's not already
            const courseIdArray = Array.isArray(courseIds) ? courseIds : [courseIds];
            
            // Only include valid ObjectIds
            const validCourseIds = courseIdArray.filter(id => mongoose.isValidObjectId(id));
            
            if (validCourseIds.length > 0) {
                query.course = { $in: validCourseIds };
            }
        }
        
        if (type) {
            query.type = type;
        }
        
        if (search) {
            query.title = { $regex: search, $options: 'i' }; // Case-insensitive search
        }
        
        console.log('Materials query:', query);
        
        // Find materials that match query
        const materials = await Material.find(query).sort({ createdAt: -1 });
        
        // Manually populate course and teacher data
        const populatedMaterials = await Promise.all(materials.map(async (material) => {
            const materialObj = material.toObject();
            
            try {
                // Get course name
                const course = await Course.findById(material.course).select('name').lean();
                if (course) {
                    materialObj.course = {
                        _id: course._id,
                        name: course.name
                    };
                }
                
                // Get teacher name - handle case where uploadedBy might be undefined
                if (material.uploadedBy) {
                    const teacher = await Teacher.findById(material.uploadedBy).select('fullName').lean();
                    if (teacher) {
                        materialObj.uploadedBy = {
                            _id: teacher._id,
                            name: teacher.fullName
                        };
                    }
                }
            } catch (error) {
                console.error('Error populating material data:', error);
                // Continue with unpopulated data
            }
            
            return materialObj;
        }));
        
        res.status(200).json({
            success: true,
            count: populatedMaterials.length,
            data: populatedMaterials
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

// Get single material
exports.getMaterial = async (req, res) => {
    try {
        // Find the material without populate
        const material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }
        
        // Increment view count
        material.viewCount += 1;
        await material.save();
        
        // Manually populate related data to avoid schema errors
        try {
            // Get course data
            const course = await Course.findById(material.course).select('name').lean();
            
            // Get teacher data - handle case where uploadedBy might be undefined
            let teacher = null;
            if (material.uploadedBy) {
                teacher = await Teacher.findById(material.uploadedBy).select('fullName').lean();
            }
            
            // Create response object
            const response = material.toObject();
            
            // Add populated data if available
            if (course) {
                response.course = {
                    _id: course._id,
                    name: course.name
                };
            }
            
            if (teacher) {
                response.uploadedBy = {
                    _id: teacher._id,
                    name: teacher.fullName
                };
            }
            
            res.status(200).json({
                success: true,
                data: response
            });
        } catch (populateError) {
            console.error('Error populating references:', populateError);
            
            // Still return the material even if we can't populate
            res.status(200).json({
                success: true,
                data: material
            });
        }
    } catch (error) {
        console.error('Error fetching material:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Create material
exports.createMaterial = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('Request user:', req.user);
        
        // Check if file was uploaded or URL was provided
        if (!req.file && !req.body.url) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file or provide a URL'
            });
        }
        
        // Extract user ID
        const userId = extractUserId(req.user);
        
        if (!userId) {
            return res.status(403).json({
                success: false,
                message: 'User ID not found in request'
            });
        }
        
        console.log('Extracted user ID for create:', userId);
        
        // Process tags if they were sent
        let tags = [];
        if (req.body.tags) {
            try {
                tags = JSON.parse(req.body.tags);
            } catch (e) {
                tags = req.body.tags.split(',').map(tag => tag.trim());
            }
        }
        
        // Verify the course exists
        const course = await Course.findById(req.body.course);
        
        if (!course) {
            // Clean up uploaded file if course not found
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file after course not found:', unlinkError);
                }
            }
            
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Create material object
        const materialData = {
            title: req.body.title,
            description: req.body.description || '',
            type: req.body.type,
            course: course._id,
            uploadedBy: userId, // Ensure this is set properly
            tags: tags,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add file path if file was uploaded
        if (req.file) {
            materialData.file = req.file.filename;
        }
        
        // Add URL if provided
        if (req.body.url) {
            materialData.url = req.body.url;
        }
        
        console.log('Material data to create:', materialData);
        
        // Create material
        const material = await Material.create(materialData);
        
        // Populate course name for response
        await material.populate('course', 'name');
        
        res.status(201).json({
            success: true,
            data: material
        });
        
    } catch (error) {
        console.error('Error creating material:', error);
        
        // Remove uploaded file if there was an error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file after create error:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message,
            error: error.message
        });
    }
};

// Update material
exports.updateMaterial = async (req, res) => {
    try {
        let material = await Material.findById(req.params.id);
        
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }
        
        // Extract user ID
        const userId = extractUserId(req.user);
        
        // Check if user is authorized (owner or admin) - handle case where uploadedBy might be undefined
        const isOwner = material.uploadedBy && material.uploadedBy.toString() === userId.toString();
        const isAuthorized = isOwner || req.user.role === 'admin' || req.user.role === 'manager';
        
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this material'
            });
        }
        
        // Process tags if they were sent
        if (req.body.tags) {
            try {
                req.body.tags = JSON.parse(req.body.tags);
            } catch (e) {
                req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
            }
        }
        
        // Update with new file if uploaded
        if (req.file) {
            // Delete old file if exists
            if (material.file) {
                try {
                    const filePath = path.join(__dirname, '../../uploads/materials', material.file);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (unlinkError) {
                    console.error('Error deleting old file:', unlinkError);
                }
            }
            
            req.body.file = req.file.filename;
        }
        
        // Always update the timestamp
        req.body.updatedAt = Date.now();
        
        // Update material
        material = await Material.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        // Populate course and user (if uploadedBy exists)
        await material.populate('course', 'name');
        if (material.uploadedBy) {
            await material.populate('uploadedBy', 'name');
        }
        
        res.status(200).json({
            success: true,
            data: material
        });
    } catch (error) {
        console.error('Error updating material:', error);
        
        // Remove uploaded file if there was an error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// Update in materialController.js
exports.deleteMaterial = async (req, res) => {
    try {
        const materialId = req.params.id;
        console.log('Delete request for material ID:', materialId);
        
        // Validate material ID
        if (!mongoose.isValidObjectId(materialId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid material ID format'
            });
        }
        
        // Find the material
        const material = await Material.findById(materialId);
        
        if (!material) {
            console.log('Material not found with ID:', materialId);
            // Return success since the goal is to delete the material
            return res.status(200).json({
                success: true,
                message: 'Material not found or already deleted',
                data: {}
            });
        }
        
        console.log('Material found:', material._id);
        
        // IMPORTANT FIX: Allow teachers to delete materials
        // Skip the authorization check if the user is a teacher
        if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin' || req.user.role === 'manager')) {
            console.log('User is authorized, proceeding with deletion');
            
            // Delete file from storage if exists
            if (material.file) {
                try {
                    const filePath = path.join(__dirname, '../../uploads/materials', material.file);
                    console.log('Attempting to delete file at path:', filePath);
                    
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log('File deleted successfully');
                    } else {
                        console.log('File not found at path:', filePath);
                    }
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                    // Continue with deletion even if file deletion fails
                }
            }
            
            // Remove from database
            try {
                const result = await Material.deleteOne({ _id: materialId });
                
                if (result.deletedCount === 0) {
                    console.log('No document was deleted');
                    // Still return success since the material doesn't exist
                    return res.status(200).json({
                        success: true,
                        message: 'Material already deleted',
                        data: {}
                    });
                }
                
                console.log('Material deleted successfully from database');
                
                // Send success response
                return res.status(200).json({
                    success: true,
                    message: 'Material deleted successfully',
                    data: {}
                });
                
            } catch (dbError) {
                console.error('Database deletion error:', dbError);
                throw dbError;
            }
        } else {
            // User is not authorized
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this material. Must be a teacher, admin, or manager.'
            });
        }
        
    } catch (error) {
        console.error('Error in deleteMaterial:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message,
            error: error.message
        });
    }
};
// In your materialController.js
exports.downloadMaterial = async (req, res) => {
    try {
        const materialId = req.params.id;
        
        // Find material without validation
        const material = await Material.findById(materialId).lean();
        
        if (!material || !material.file) {
            return res.status(404).send('File not found');
        }
        
        // Get the full file path
        const filePath = path.join(__dirname, '../../uploads/materials', material.file);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).send('File not found on server');
        }
        
        // Send the file
        res.download(filePath, material.file);
        
        // Increment the download count asynchronously (doesn't block the download)
        Material.updateOne({ _id: materialId }, { $inc: { downloadCount: 1 } })
            .catch(err => console.error('Failed to update download count:', err));
            
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Server error');
    }
};

// Get materials by course
exports.getMaterialsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        
        // Validate course ID
        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }
        
        const materials = await Material.find({ course: courseId })
            .sort({ createdAt: -1 });
        
        // Manually populate uploadedBy to handle cases where it might be undefined
        const populatedMaterials = await Promise.all(materials.map(async (material) => {
            const materialObj = material.toObject();
            
            if (material.uploadedBy) {
                try {
                    const teacher = await Teacher.findById(material.uploadedBy).select('fullName').lean();
                    if (teacher) {
                        materialObj.uploadedBy = {
                            _id: teacher._id,
                            name: teacher.fullName
                        };
                    }
                } catch (error) {
                    console.error('Error populating teacher:', error);
                }
            }
            
            return materialObj;
        }));
        
        res.status(200).json({
            success: true,
            count: populatedMaterials.length,
            data: populatedMaterials
        });
    } catch (error) {
        console.error('Error fetching course materials:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};