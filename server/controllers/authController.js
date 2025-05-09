const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Manager = require('../models/Manager');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Utility functions
const getUserModel = (role) => {
    switch(role) {
        case 'student': return Student;
        case 'teacher': return Teacher;
        case 'manager': return Manager;
        default: throw new Error('Invalid role');
    }
};

const generateUniqueId = (role) => {
    const prefix = {
        'student': 'ST',
        'teacher': 'T',
        'manager': 'MG'
    };
    return `${prefix[role]}${Math.floor(10000 + Math.random() * 90000)}`;
};

const validateRegistrationData = (role, body) => {
    const requiredFields = {
        'base': ['username', 'password', 'fullName', 'email', 'phone'],
        'student': ['dateOfBirth', 'currentLevel'],
        'teacher': ['specialization', 'qualifications'],
        'manager': ['department']
    };

    // Check base required fields
    for (let field of requiredFields['base']) {
        if (!body[field]) {
            throw new Error(`${field} is required`);
        }
    }

    // Check role-specific fields
    for (let field of requiredFields[role] || []) {
        if (!body[field]) {
            throw new Error(`${field} is required for ${role} registration`);
        }
    }
};

// Authentication Controller
const authController = {
    // Generic user registration
    register: async (req, res) => {
        try {
            const { username, password, fullName, email, phone, role } = req.body;
            
            // Validate input
            validateRegistrationData(role, req.body);
            
            // Get appropriate model
            const UserModel = getUserModel(role);
            
            // Check if user already exists
            const existingUser = await UserModel.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User with this email or username already exists' 
                });
            }
            
            // Create new user with role-specific logic
            let user;
            switch(role) {
                case 'student':
                    const { dateOfBirth, currentLevel } = req.body;
                    user = new UserModel({
                        username,
                        password,
                        fullName,
                        email,
                        phone,
                        studentInfo: {
                            dateOfBirth,
                            currentLevel,
                            studentId: generateUniqueId('student'),
                            status: 'active', // Changed from 'pending' to 'active' for testing
                            enrollmentDate: new Date()
                        }
                    });
                    break;
                
                case 'teacher':
                    const { specialization, qualifications } = req.body;
                    user = new UserModel({
                        username,
                        password,
                        fullName,
                        email,
                        phone,
                        teacherInfo: {
                            specialization,
                            qualifications,
                            teacherId: generateUniqueId('teacher')
                        },
                        isActive: true
                    });
                    break;
                
                case 'manager':
                    const { department } = req.body;
                    user = new UserModel({
                        username,
                        password,
                        fullName,
                        email,
                        phone,
                        department,
                        managerId: generateUniqueId('manager'),
                        isActive: true
                    });
                    break;
                
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid user role'
                    });
            }
            
            // Save user
            await user.save();
            
            // Generate token
            const token = jwt.sign(
                { id: user._id, role: role },
                process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                { expiresIn: '1d' }
            );
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: { 
                    user: {
                        ...user.toJSON(),
                        role
                    },
                    token,
                    userId: user[`${role}Info`]?.[`${role}Id`] || user.managerId
                }
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error registering user',
                error: error.toString()
            });
        }
    },

    // Login implementation
    login: async (req, res) => {
        try {
            const { username, password, role } = req.body;
            
            // Validate input
            if (!username || !password || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide username, password, and role'
                });
            }
            
            // Log incoming request for debugging
            console.log(`Login attempt: ${username} as ${role}`);
            
            // Get appropriate model based on role
            let UserModel;
            try {
                UserModel = getUserModel(role);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role specified'
                });
            }
            
            // Find user by username
            const user = await UserModel.findOne({ username });
            
            // Check if user exists
            if (!user) {
                console.log(`Login failed: User ${username} not found with role ${role}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Check if password matches
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                console.log(`Login failed: Password mismatch for ${username}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            // Enhanced check for active status
if (role === 'student') {
    // For students, check both the nested status and the main isActive flag
    if (user.studentInfo?.status !== 'active' || user.isActive === false) {
        return res.status(403).json({
            success: false,
            message: 'Your account is not active. Please contact administration.'
        });
    }
} else if (['teacher', 'manager'].includes(role)) {
    // For teachers and managers, check isActive flag
    if (user.isActive === false) {
        return res.status(403).json({
            success: false,
            message: 'Your account is currently inactive.'
        });
    }
}
console.log(`User ${username} status check:`, {
    role,
    isActive: user.isActive,
    studentStatus: user.studentInfo?.status
});
            // Generate JWT token
            const token = jwt.sign(
                { id: user._id, role },
                process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                { expiresIn: '1d' }
            );
            
            // Update last login timestamp
            user.lastLogin = new Date();
            await user.save();
            
            // Get user ID based on role
            let userId;
            switch(role) {
                case 'student':
                    userId = user.studentInfo?.studentId;
                    break;
                case 'teacher':
                    userId = user.teacherInfo?.teacherId;
                    break;
                case 'manager':
                    userId = user.managerId;
                    break;
            }
            
            // Set cookie for token
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });
            
            // Log successful login
            console.log(`Login successful: ${username} as ${role}`);
            
            // Send response
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        ...user.toJSON(),
                        role
                    },
                    token,
                    userId
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: error.message
            });
        }
    },

    // Get current user information
    getCurrentUser: async (req, res) => {
        try {
            const userId = req.user.id;
            const role = req.user.role;
            
            // Get appropriate model
            const UserModel = getUserModel(role);
            
            // Find user by ID
            const user = await UserModel.findById(userId).select('-password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        ...user.toJSON(),
                        role
                    }
                }
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving user information',
                error: error.message
            });
        }
    },

    // Logout user
    logout: (req, res) => {
        try {
            // Clear token cookie
            res.cookie('token', '', {
                httpOnly: true,
                expires: new Date(0)
            });
            
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during logout',
                error: error.message
            });
        }
    },

    // Change password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
            const role = req.user.role;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide current and new password'
                });
            }
            
            // Get appropriate model
            const UserModel = getUserModel(role);
            
            // Find user by ID
            const user = await UserModel.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Check if current password matches
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            
            // Update password
            user.password = newPassword;
            await user.save();
            
            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Error changing password',
                error: error.message
            });
        }
    },

    // Role-specific registration methods
    registerStudent: async (req, res) => {
        try {
            const { username, password, fullName, email, phone, dateOfBirth, currentLevel } = req.body;
            
            // Validate input
            validateRegistrationData('student', req.body);
            
            // Check if student already exists
            const existingStudent = await Student.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingStudent) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student with this email or username already exists' 
                });
            }
            
            // Create new student
            const student = new Student({
                username,
                password,
                fullName,
                email,
                phone,
                studentInfo: {
                    dateOfBirth,
                    currentLevel,
                    studentId: generateUniqueId('student'),
                    status: 'active', // Changed from 'pending' to 'active' for testing
                    enrollmentDate: new Date()
                }
            });
            
            await student.save();
            
            // Generate token
            const token = jwt.sign(
                { id: student._id, role: 'student' },
                process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                { expiresIn: '1d' }
            );
            
            res.status(201).json({
                success: true,
                message: 'Student registered successfully',
                data: { 
                    user: {
                        ...student.toJSON(),
                        role: 'student'
                    },
                    token,
                    studentId: student.studentInfo.studentId
                }
            });
        } catch (error) {
            console.error('Student registration error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error registering student',
                error: error.toString()
            });
        }
    },

    registerTeacher: async (req, res) => {
        try {
            const { username, password, fullName, email, phone, specialization, qualifications } = req.body;
            
            // Validate input
            validateRegistrationData('teacher', req.body);
            
            // Check if teacher already exists
            const existingTeacher = await Teacher.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingTeacher) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Teacher with this email or username already exists' 
                });
            }
            
            // Create new teacher
            const teacher = new Teacher({
                username,
                password,
                fullName,
                email,
                phone,
                teacherInfo: {
                    specialization,
                    qualifications,
                    teacherId: generateUniqueId('teacher')
                },
                isActive: true
            });
            
            await teacher.save();
            
            // Generate token
            const token = jwt.sign(
                { id: teacher._id, role: 'teacher' },
                process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                { expiresIn: '1d' }
            );
            
            res.status(201).json({
                success: true,
                message: 'Teacher registered successfully',
                data: { 
                    user: {
                        ...teacher.toJSON(),
                        role: 'teacher'
                    },
                    token,
                    teacherId: teacher.teacherInfo.teacherId
                }
            });
        } catch (error) {
            console.error('Teacher registration error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error registering teacher',
                error: error.toString()
            });
        }
    },

    registerManager: async (req, res) => {
        try {
            const { username, password, fullName, email, phone, department } = req.body;
            
            // Validate input
            validateRegistrationData('manager', req.body);
            
            // Check if manager already exists
            const existingManager = await Manager.findOne({ 
                $or: [{ email }, { username }] 
            });
            
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
                department,
                managerId: generateUniqueId('manager'),
                isActive: true
            });
            
            await manager.save();
            
            // Generate token
            const token = jwt.sign(
                { id: manager._id, role: 'manager' },
                process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                { expiresIn: '1d' }
            );
            
            res.status(201).json({
                success: true,
                message: 'Manager registered successfully',
                data: { 
                    user: {
                        ...manager.toJSON(),
                        role: 'manager'
                    },
                    token,
                    managerId: manager.managerId
                }
            });
        } catch (error) {
            console.error('Manager registration error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error registering manager',
                error: error.toString()
            });
        }
    },

    // Forgot password implementation
    forgotPassword: async (req, res) => {
        try {
            const { email, role } = req.body;
            
            if (!email || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email and role'
                });
            }
            
            // Get appropriate model
            const UserModel = getUserModel(role);
            
            // Find user by email
            const user = await UserModel.findOne({ email });
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'No user found with that email'
                });
            }
            
            // Generate reset token
            const resetToken = crypto.randomBytes(20).toString('hex');
            
            // Hash token and set to resetPasswordToken field
            const resetPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            
            // Set expiration (10 minutes)
            const resetPasswordExpire = Date.now() + 10 * 60 * 1000;
            
            // Update user with reset token info
            user.resetPasswordToken = resetPasswordToken;
            user.resetPasswordExpire = resetPasswordExpire;
            
            await user.save();
            
            // In a real app, you would send an email with the reset link
            // For testing purposes, return the token in the response
            res.status(200).json({
                success: true,
                message: 'Password reset token generated',
                data: {
                    resetToken // Only in development - in production, you'd send this via email
                }
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating reset token',
                error: error.message
            });
        }
    },

    // Reset password implementation
    resetPassword: async (req, res) => {
        try {
            const { resetToken, newPassword, role } = req.body;
            
            if (!resetToken || !newPassword || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide reset token, new password, and role'
                });
            }
            
            // Hash token to match hashed token in database
            const resetPasswordToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');
            
            // Get appropriate model
            const UserModel = getUserModel(role);
            
            // Find user by reset token and check if token is still valid
            const user = await UserModel.findOne({
                resetPasswordToken,
                resetPasswordExpire: { $gt: Date.now() }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }
            
            // Set new password
            user.password = newPassword;
            
            // Clear reset token fields
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            
            await user.save();
            
            // Generate new login token
            const token = jwt.sign(
                { id: user._id, role },
                process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
                { expiresIn: '1d' }
            );
            
            res.status(200).json({
                success: true,
                message: 'Password reset successful',
                data: { token }
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Error resetting password',
                error: error.message
            });
        }
    }
};

// Export the entire controller
module.exports = authController;