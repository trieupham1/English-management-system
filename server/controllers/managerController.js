const Manager = require('../models/Manager');
const jwt = require('jsonwebtoken');

// Register new manager
exports.register = async (req, res) => {
    try {
        const { username, password, fullName, email, phone, department } = req.body;
        
        // Check if manager already exists
        const existingManager = await Manager.findOne({ $or: [{ email }, { username }] });
        
        if (existingManager) {
            return res.status(400).json({ 
                success: false, 
                message: 'Manager with this email or username already exists' 
            });
        }
        
        // Create new manager
        const manager = new Manager({
            username,
            password,
            fullName,
            email,
            phone,
            department
        });
        
        await manager.save();
        
        // Generate token
        const token = jwt.sign(
            { id: manager._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Manager registered successfully',
            data: { manager: manager.toJSON(), token }
        });
        
    } catch (error) {
        console.error('Manager registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering manager',
            error: error.message
        });
    }
};
// Create Course
exports.createCourse = async (req, res) => {
    try {
        const Course = require('../models/Course');
        
        // Validate required fields
        const { name, level, category, teacher } = req.body;
        
        if (!name || !level || !category || !teacher) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, level, category, teacher'
            });
        }
        
        // Create new course
        const course = new Course(req.body);
        await course.save();
        
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
};
// Create student
exports.createStudent = async (req, res) => {
    try {
        const Student = require('../models/Student');
        
        // Check if username or email already exists
        const existingStudent = await Student.findOne({
            $or: [{ username: req.body.username }, { email: req.body.email }]
        });
        
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        
        // Create new student
        const student = new Student(req.body);
        await student.save();
        
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating student',
            error: error.message
        });
    }
};

// Create teacher
exports.createTeacher = async (req, res) => {
    try {
        const Teacher = require('../models/Teacher');
        
        // Check if username or email already exists
        const existingTeacher = await Teacher.findOne({
            $or: [{ username: req.body.username }, { email: req.body.email }]
        });
        
        if (existingTeacher) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }
        
        // Create new teacher
        const teacher = new Teacher(req.body);
        await teacher.save();
        
        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            data: teacher
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating teacher',
            error: error.message
        });
    }
};

// Login manager
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find manager by username
        const manager = await Manager.findOne({ username });
        
        if (!manager) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Check password
        const isMatch = await manager.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: manager._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
            { expiresIn: '1d' }
        );
        
        // Update last login
        manager.lastLogin = new Date();
        await manager.save();
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { 
                manager: manager.toJSON(), 
                token 
            }
        });
        
    } catch (error) {
        console.error('Manager login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// Get current manager profile
exports.getCurrentManager = async (req, res) => {
    try {
        const manager = await Manager.findById(req.user.id).select('-password');
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: manager
        });
        
    } catch (error) {
        console.error('Get current manager error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving manager profile',
            error: error.message
        });
    }
};

// Update manager profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, phone, department, permissions } = req.body;
        
        const manager = await Manager.findById(req.user.id);
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }
        
        // Update fields
        if (fullName) manager.fullName = fullName;
        if (email) manager.email = email;
        if (phone) manager.phone = phone;
        if (department) manager.department = department;
        if (permissions) manager.permissions = permissions;
        
        manager.updatedAt = new Date();
        
        await manager.save();
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: manager.toJSON()
        });
        
    } catch (error) {
        console.error('Update manager profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// Change manager password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const manager = await Manager.findById(req.user.id);
        
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }
        
        // Check if current password matches
        const isMatch = await manager.comparePassword(currentPassword);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        manager.password = newPassword;
        await manager.save();
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change manager password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// Get system statistics for dashboard
exports.getSystemStats = async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Teacher = require('../models/Teacher');
        const Course = require('../models/Course');
        const Report = require('../models/Report');
        
        // Count documents from each collection
        const totalStudents = await Student.countDocuments({ isActive: true });
        const totalTeachers = await Teacher.countDocuments({ isActive: true });
        const activeCourses = await Course.countDocuments({ status: 'active' });
        const newReports = await Report.countDocuments({ status: 'new' });
        
        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                activeCourses,
                newReports
            }
        });
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system statistics',
            error: error.message
        });
    }
};

// Get recent activities for dashboard
exports.getRecentActivities = async (req, res) => {
    try {
        const Student = require('../models/Student');
        const Teacher = require('../models/Teacher');
        const Course = require('../models/Course');
        const Assignment = require('../models/Assignment');
        
        // Get recent students
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(3);
            
        // Get recent teachers
        const recentTeachers = await Teacher.find()
            .sort({ createdAt: -1 })
            .limit(3);
            
        // Get recent courses
        const recentCourses = await Course.find()
            .sort({ createdAt: -1 })
            .limit(3);
        
        // Combine and format activities
        const activities = [];
        
        // Add student registrations as activities
        recentStudents.forEach(student => {
            activities.push({
                type: 'user',
                description: `New student ${student.fullName} registered`,
                timestamp: student.createdAt
            });
        });
        
        // Add teacher registrations as activities
        recentTeachers.forEach(teacher => {
            activities.push({
                type: 'user',
                description: `New teacher ${teacher.fullName} joined`,
                timestamp: teacher.createdAt
            });
        });
        
        // Add course creations as activities
        recentCourses.forEach(course => {
            activities.push({
                type: 'course',
                description: `New course "${course.name || course.title}" created`,
                timestamp: course.createdAt
            });
        });
        
        // Sort activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Return the 10 most recent activities
        const recentActivities = activities.slice(0, 10);
        
        res.status(200).json({
            success: true,
            data: recentActivities
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activities',
            error: error.message
        });
    }
};
// Add to managerController.js
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        // Try to find and update the user as a student first
        const Student = require('../models/Student');
        let student = await Student.findById(id);
        
        if (student) {
            // Update student's status
            student.isActive = isActive;
            
            // Update nested status field if it exists
            if (student.studentInfo) {
                student.studentInfo.status = isActive ? 'active' : 'inactive';
            }
            
            await student.save();
            
            return res.status(200).json({
                success: true,
                message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: student
            });
        }
        
        // If not a student, try as a teacher
        const Teacher = require('../models/Teacher');
        let teacher = await Teacher.findById(id);
        
        if (teacher) {
            teacher.isActive = isActive;
            await teacher.save();
            
            return res.status(200).json({
                success: true,
                message: `Teacher ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: teacher
            });
        }
        
        // If neither student nor teacher found
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
        
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling user status',
            error: error.message
        });
    }
};


// Stubs for other controller methods
exports.getAllUsers = async (req, res, next) => {
    // Implementation would go here
    res.locals.data = {
        success: true,
        data: [] // Placeholder
    };
    next();
};

exports.getUserById = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        data: {} // Placeholder
    });
};

exports.updateUser = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        message: 'User updated successfully'
    });
};

exports.deleteUser = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        message: 'User deleted successfully'
    });
};

exports.getStaffInformation = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        data: [] // Placeholder
    });
};

exports.getStaffWorkSchedules = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        data: [] // Placeholder
    });
};

exports.getAllCourses = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        data: [] // Placeholder
    });
};

exports.getCourseById = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        data: {} // Placeholder
    });
};

exports.updateCourse = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        message: 'Course updated successfully'
    });
};

exports.deleteCourse = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        message: 'Course deleted successfully'
    });
};

exports.getSystemSettings = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        data: {} // Placeholder
    });
};

exports.updateSystemSettings = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        message: 'Settings updated successfully'
    });
};

exports.updateChatbot = async (req, res) => {
    // Implementation would go here
    res.status(200).json({
        success: true,
        message: 'Chatbot updated successfully'
    });
};

// Logout manager
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};