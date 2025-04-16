const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const dirs = [
        './uploads',
        './uploads/materials',
        './uploads/assignments',
        './uploads/profiles'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Create directories on startup
createUploadDirs();

// Set storage engine for files
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Determine the destination folder based on the file type
        let uploadPath = './uploads';
        
        if (req.originalUrl.includes('materials')) {
            uploadPath = './uploads/materials';
        } else if (req.originalUrl.includes('assignments')) {
            uploadPath = './uploads/assignments';
        } else if (req.originalUrl.includes('profiles')) {
            uploadPath = './uploads/profiles';
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Define allowed file types based on the route
    let allowedTypes = [];
    
    if (req.originalUrl.includes('profiles')) {
        // For profile pictures, only allow images
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    } else if (req.originalUrl.includes('materials')) {
        // For course materials, allow documents, pdfs, images, archives
        allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'text/plain',
            'video/mp4',
            'audio/mpeg'
        ];
    } else if (req.originalUrl.includes('assignments')) {
        // For assignments, allow documents, pdfs, images
        allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'text/plain'
        ];
    } else {
        // Default - allow common document types
        allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'text/plain'
        ];
    }
    
    // Check if the file type is allowed
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

// File size limits
const limits = {
    fileSize: 10 * 1024 * 1024 // 10MB size limit
};

// Create and export the upload middleware
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: limits
});

// Error handling for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    } else if (err) {
        // An unknown error occurred
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;