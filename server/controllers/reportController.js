// server/controllers/reportController.js

const Report = require('../models/Report');
const Course = require('../models/Course');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// Helper function to extract user ID from request
const extractUserId = (user) => {
    if (!user) return null;
    return user._id || user.id || user.userId || (user.toObject && user.toObject()._id);
};

// Get all reports
exports.getAllReports = async (req, res) => {
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
        
        console.log('Reports query:', query);
        
        // Find reports that match query
        const reports = await Report.find(query).sort({ createdAt: -1 });
        
        // Manually populate course and teacher data
        const populatedReports = await Promise.all(reports.map(async (report) => {
            const reportObj = report.toObject();
            
            try {
                // Get course name
                const course = await Course.findById(report.course).select('name').lean();
                if (course) {
                    reportObj.course = {
                        _id: course._id,
                        name: course.name
                    };
                }
                
                // Get teacher name
                if (report.generatedBy) {
                    const teacher = await Teacher.findById(report.generatedBy).select('fullName').lean();
                    if (teacher) {
                        reportObj.generatedBy = {
                            _id: teacher._id,
                            name: teacher.fullName
                        };
                    }
                }
                
                // Get student name for individual reports
                if (report.type === 'individual' && report.student) {
                    const student = await Student.findById(report.student).select('name').lean();
                    if (student) {
                        reportObj.student = {
                            _id: student._id,
                            name: student.name
                        };
                    }
                }
            } catch (error) {
                console.error('Error populating report data:', error);
                // Continue with unpopulated data
            }
            
            return reportObj;
        }));
        
        res.status(200).json({
            success: true,
            count: populatedReports.length,
            data: populatedReports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get single report
exports.getReport = async (req, res) => {
    try {
        // Find the report without populate
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Increment view count
        report.viewCount += 1;
        await report.save();
        
        // Manually populate related data
        try {
            // Get course data
            const course = await Course.findById(report.course).select('name').lean();
            
            // Get teacher data
            let teacher = null;
            if (report.generatedBy) {
                teacher = await Teacher.findById(report.generatedBy).select('fullName').lean();
            }
            
            // Get student data for individual reports
            let student = null;
            if (report.type === 'individual' && report.student) {
                student = await Student.findById(report.student).select('name').lean();
            }
            
            // Create response object
            const response = report.toObject();
            
            // Add populated data if available
            if (course) {
                response.course = {
                    _id: course._id,
                    name: course.name
                };
            }
            
            if (teacher) {
                response.generatedBy = {
                    _id: teacher._id,
                    name: teacher.fullName
                };
            }
            
            if (student) {
                response.student = {
                    _id: student._id,
                    name: student.name
                };
            }
            
            res.status(200).json({
                success: true,
                data: response
            });
        } catch (populateError) {
            console.error('Error populating references:', populateError);
            
            // Still return the report even if we can't populate
            res.status(200).json({
                success: true,
                data: report
            });
        }
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// Create report with duplicate prevention
exports.createReport = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('Request user:', req.user);
        console.log('Request headers:', req.headers);
        
        // Check for duplicate submissions based on clientId header
        if (req.headers['x-client-id']) {
            const clientId = req.headers['x-client-id'];
            console.log('Client ID from headers:', clientId);
            
            // Initialize the global processed IDs object if it doesn't exist
            if (!global.processedReportClientIds) {
                global.processedReportClientIds = {};
            }
            
            // If this client ID has been processed, return the cached response
            if (global.processedReportClientIds[clientId]) {
                console.log('Duplicate submission detected with client ID:', clientId);
                return res.status(200).json({
                    success: true,
                    message: 'Report already submitted',
                    data: global.processedReportClientIds[clientId]
                });
            }
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
        
        // Create report object
        const reportData = {
            title: req.body.title,
            description: req.body.description || '',
            type: req.body.type,
            course: course._id,
            generatedBy: userId,
            academicPeriod: req.body.academicPeriod || 'monthly',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add student reference for individual reports
        if (req.body.type === 'individual' && req.body.student) {
            // Verify the student exists
            const student = await Student.findById(req.body.student);
            if (!student) {
                if (req.file) {
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting file after student not found:', unlinkError);
                    }
                }
                
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            
            reportData.student = student._id;
        } else if (req.body.type === 'class') {
            // For class reports, get the student count
            const studentCount = course.students ? course.students.length : 0;
            reportData.studentCount = studentCount;
        }
        
        // Add file path if file was uploaded
        if (req.file) {
            reportData.file = req.file.filename;
        }
        
        console.log('Report data to create:', reportData);
        
        // Create report
        const report = await Report.create(reportData);
        
        // Populate course name for response
        await report.populate('course', 'name');
        
        // Store in processed IDs to prevent duplicates if client ID provided
        if (req.headers['x-client-id']) {
            global.processedReportClientIds[req.headers['x-client-id']] = report;
            
            // Clean up old entries after some time to prevent memory growth
            setTimeout(() => {
                if (global.processedReportClientIds && 
                    global.processedReportClientIds[req.headers['x-client-id']]) {
                    delete global.processedReportClientIds[req.headers['x-client-id']];
                }
            }, 30 * 60 * 1000); // Remove after 30 minutes
        }
        
        res.status(201).json({
            success: true,
            data: report
        });
        
    } catch (error) {
        console.error('Error creating report:', error);
        
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
// Update report
exports.updateReport = async (req, res) => {
    try {
        let report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Extract user ID
        const userId = extractUserId(req.user);
        
        // Check if user is authorized (owner or admin)
        const isOwner = report.generatedBy && report.generatedBy.toString() === userId.toString();
        const isAuthorized = isOwner || req.user.role === 'admin' || req.user.role === 'manager';
        
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this report'
            });
        }
        
        // Update with new file if uploaded
        if (req.file) {
            // Delete old file if exists
            if (report.file) {
                try {
                    const filePath = path.join(__dirname, '../../uploads/reports', report.file);
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
        
        // Update report
        report = await Report.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        // Populate course and user
        await report.populate('course', 'name');
        await report.populate('generatedBy', 'fullName');
        
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error updating report:', error);
        
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

// Delete report
exports.deleteReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        console.log('Delete request for report ID:', reportId);
        
        // Validate report ID
        if (!mongoose.isValidObjectId(reportId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID format'
            });
        }
        
        // Find the report
        const report = await Report.findById(reportId);
        
        if (!report) {
            console.log('Report not found with ID:', reportId);
            // Return success since the goal is to delete the report
            return res.status(200).json({
                success: true,
                message: 'Report not found or already deleted',
                data: {}
            });
        }
        
        console.log('Report found:', report._id);
        
        // Extract user ID
        const userId = extractUserId(req.user);
        
        if (!userId) {
            return res.status(403).json({
                success: false,
                message: 'User ID not found in request'
            });
        }
        
        // Check authorization
        let isAuthorized = false;
        
        // Check if user is admin or manager
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            isAuthorized = true;
        }
        // Check if user is the owner
        else if (report.generatedBy) {
            const generatedById = report.generatedBy.toString();
            const userIdString = userId.toString();
            isAuthorized = generatedById === userIdString;
        }
        
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this report'
            });
        }
        
        // Delete file from storage if exists
        if (report.file) {
            try {
                const filePath = path.join(__dirname, '../../uploads/reports', report.file);
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
            const result = await Report.deleteOne({ _id: reportId });
            
            if (result.deletedCount === 0) {
                console.log('No document was deleted');
                // Still return success since the report doesn't exist
                return res.status(200).json({
                    success: true,
                    message: 'Report already deleted',
                    data: {}
                });
            }
            
            console.log('Report deleted successfully from database');
            
            // Send success response
            res.status(200).json({
                success: true,
                message: 'Report deleted successfully',
                data: {}
            });
            
        } catch (dbError) {
            console.error('Database deletion error:', dbError);
            throw dbError;
        }
        
    } catch (error) {
        console.error('Error in deleteReport:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: ' + error.message,
            error: error.message
        });
    }
};

// Download report
exports.downloadReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Increment download count
        report.downloadCount += 1;
        await report.save();
        
        // Check if file exists
        if (report.file) {
            // Get file path
            const filePath = path.join(__dirname, '../../uploads/reports', report.file);
            
            // Check if file exists on disk
            if (fs.existsSync(filePath)) {
                return res.download(filePath);
            }
        }
        
        // If no file or file not found, generate PDF on the fly
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.pdf`);
        
        // Pipe the PDF output to the response
        doc.pipe(res);
        
        // Populate course and student data
        let courseName = 'Unknown Course';
        let studentName = '';
        
        try {
            const course = await Course.findById(report.course).select('name').lean();
            if (course) {
                courseName = course.name;
            }
            
            if (report.type === 'individual' && report.student) {
                const student = await Student.findById(report.student).select('name').lean();
                if (student) {
                    studentName = student.name;
                }
            }
        } catch (error) {
            console.error('Error populating report data for PDF:', error);
        }
        
        // Add content to PDF
        doc.fontSize(25).text('Progress Report', {
            align: 'center'
        });
        
        doc.moveDown();
        doc.fontSize(18).text(report.title, {
            align: 'center'
        });
        
        doc.moveDown();
        doc.fontSize(12).text(`Course: ${courseName}`, {
            align: 'left'
        });
        
        doc.fontSize(12).text(`Type: ${report.type === 'individual' ? 'Individual Report' : 'Class Report'}`, {
            align: 'left'
        });
        
        doc.fontSize(12).text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, {
            align: 'left'
        });
        
        if (report.type === 'individual' && studentName) {
            doc.fontSize(12).text(`Student: ${studentName}`, {
                align: 'left'
            });
        } else if (report.type === 'class') {
            doc.fontSize(12).text(`Number of Students: ${report.studentCount}`, {
                align: 'left'
            });
        }
        
        doc.moveDown();
        doc.fontSize(14).text('Description', {
            align: 'left',
            underline: true
        });
        
        doc.fontSize(12).text(report.description || 'No description provided.', {
            align: 'left'
        });
        
        // Finalize the PDF
        doc.end();
        
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
// Modified getReportsByCourse function with better error handling and logging
exports.getReportsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        console.log('Fetching reports for course ID:', courseId);
        
        // Validate course ID
        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID format'
            });
        }
        
        // Convert string ID to ObjectId if needed
        const courseObjectId = mongoose.Types.ObjectId(courseId);
        
        // Ensure we're querying with the correct data type
        const reports = await Report.find({ 
            course: courseId 
        }).sort({ createdAt: -1 });
        
        console.log(`Found ${reports.length} reports for course:`, courseId);
        
        // Manually populate related data
        const populatedReports = await Promise.all(reports.map(async (report) => {
            const reportObj = report.toObject();
            
            try {
                // Get course name
                const course = await Course.findById(report.course).select('name level category').lean();
                if (course) {
                    reportObj.course = {
                        _id: course._id,
                        name: course.name,
                        level: course.level,
                        category: course.category
                    };
                }
                
                // Get teacher name
                if (report.generatedBy) {
                    const teacher = await Teacher.findById(report.generatedBy).select('fullName').lean();
                    if (teacher) {
                        reportObj.generatedBy = {
                            _id: teacher._id,
                            name: teacher.fullName
                        };
                    }
                }
                
                // Get student name for individual reports
                if (report.type === 'individual' && report.student) {
                    const student = await Student.findById(report.student).select('name').lean();
                    if (student) {
                        reportObj.student = {
                            _id: student._id,
                            name: student.name
                        };
                    }
                }
            } catch (error) {
                console.error('Error populating report data:', error);
            }
            
            return reportObj;
        }));
        
        res.status(200).json({
            success: true,
            count: populatedReports.length,
            data: populatedReports
        });
    } catch (error) {
        console.error('Error fetching course reports:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Modified getReportsByTeacher function with filtering support
exports.getReportsByTeacher = async (req, res) => {
    try {
        // Extract user ID from auth middleware
        const teacherId = extractUserId(req.user);
        
        if (!teacherId) {
            return res.status(403).json({
                success: false,
                message: 'User ID not found in request'
            });
        }
        
        console.log('Fetching reports for teacher:', teacherId);
        console.log('Query parameters:', req.query);
        
        // Build query object
        const query = { generatedBy: teacherId };
        
        // Add course filter if provided
        if (req.query.courseIds) {
            const courseId = req.query.courseIds;
            if (mongoose.isValidObjectId(courseId)) {
                query.course = courseId;
                console.log('Filtering by course:', courseId);
            }
        }
        
        // Add type filter if provided
        if (req.query.type) {
            query.type = req.query.type;
            console.log('Filtering by type:', req.query.type);
        }
        
        console.log('Final query:', query);
        
        // Find reports created by this teacher with filters
        const reports = await Report.find(query).sort({ createdAt: -1 });
        
        console.log(`Found ${reports.length} reports for teacher with filters`);
        
        // Manually populate related data
        const populatedReports = await Promise.all(reports.map(async (report) => {
            const reportObj = report.toObject();
            
            try {
                // Get course name
                const course = await Course.findById(report.course).select('name level category').lean();
                if (course) {
                    reportObj.course = {
                        _id: course._id.toString(), // Convert ObjectId to string
                        name: course.name,
                        level: course.level,
                        category: course.category
                    };
                }
                
                // Get student name for individual reports
                if (report.type === 'individual' && report.student) {
                    const student = await Student.findById(report.student).select('name').lean();
                    if (student) {
                        reportObj.student = {
                            _id: student._id.toString(), // Convert ObjectId to string
                            name: student.name
                        };
                    }
                }
            } catch (error) {
                console.error('Error populating report data:', error);
            }
            
            return reportObj;
        }));
        
        res.status(200).json({
            success: true,
            count: populatedReports.length,
            data: populatedReports
        });
    } catch (error) {
        console.error('Error fetching teacher reports:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};


// Generate PDF report
exports.generatePDF = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Create a PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.pdf`);
        
        // Pipe the PDF output to the response
        doc.pipe(res);
        
        // Populate course and student data
        let courseName = 'Unknown Course';
        let studentName = '';
        let teacherName = 'Unknown Teacher';
        
        try {
            const course = await Course.findById(report.course).select('name').lean();
            if (course) {
                courseName = course.name;
            }
            
            if (report.generatedBy) {
                const teacher = await Teacher.findById(report.generatedBy).select('fullName').lean();
                if (teacher) {
                    teacherName = teacher.fullName;
                }
            }
            
            if (report.type === 'individual' && report.student) {
                const student = await Student.findById(report.student).select('name').lean();
                if (student) {
                    studentName = student.name;
                }
            }
        } catch (error) {
            console.error('Error populating report data for PDF:', error);
        }
        
        // Add content to PDF with improved formatting
        doc.fontSize(25).text('English Learning Center', {
            align: 'center'
        });
        
        doc.moveDown();
        doc.fontSize(20).text('Progress Report', {
            align: 'center'
        });
        
        doc.moveDown();
        doc.fontSize(16).text(report.title, {
            align: 'center'
        });
        
        // Add a separator line
        doc.moveDown();
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown();
        
        // Report details
        doc.fontSize(12).text(`Course: ${courseName}`, {
            align: 'left'
        });
        
        doc.fontSize(12).text(`Type: ${report.type === 'individual' ? 'Individual Report' : 'Class Report'}`, {
            align: 'left'
        });
        
        doc.fontSize(12).text(`Generated By: ${teacherName}`, {
            align: 'left'
        });
        
        doc.fontSize(12).text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, {
            align: 'left'
        });
        
        if (report.type === 'individual' && studentName) {
            doc.fontSize(12).text(`Student: ${studentName}`, {
                align: 'left'
            });
        } else if (report.type === 'class') {
            doc.fontSize(12).text(`Number of Students: ${report.studentCount}`, {
                align: 'left'
            });
        }
        
        // Add a separator line
        doc.moveDown();
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown();
        
        // Report content
        doc.fontSize(14).text('Report Content', {
            align: 'left',
            underline: true
        });
        
        doc.moveDown();
        doc.fontSize(12).text(report.description || 'No description provided.', {
            align: 'left'
        });
        
        // Add footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            
            // Footer with page number
            doc.fontSize(10)
               .text(
                    `Page ${i + 1} of ${pageCount}`, 
                    50, 
                    doc.page.height - 50, 
                    { align: 'center' }
                );
        }
        
        // Finalize the PDF
        doc.end();
        
    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

module.exports = exports;