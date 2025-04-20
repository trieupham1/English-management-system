const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Manager = require('../models/Manager');
const Receptionist = require('../models/receptionist');
const jwt = require('jsonwebtoken');

// Utility function to get model based on role
const getUserModel = (role) => {
    switch(role) {
        case 'student': return Student;
        case 'teacher': return Teacher;
        case 'manager': return Manager;
        case 'receptionist': return Receptionist;
        default: throw new Error('Invalid role');
    }
};

// Register new user
exports.register = async (req, res) => {
    try {
        console.log('Register attempt with:', req.body);
        const { username, password, fullName, email, phone, role } = req.body;
        
        // Get appropriate model
        const UserModel = getUserModel(role);
        
        // Check if user already exists
        const existingUser = await UserModel.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            console.log('User already exists:', existingUser.username);
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
                        studentId: 'ST' + Math.floor(10000 + Math.random() * 90000),
                        status: 'pending'
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
                        teacherId: 'T' + Math.floor(10000 + Math.random() * 90000)
                    }
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
                    department
                });
                break;
            
            case 'receptionist':
                const { employeeId, shift } = req.body;
                user = new UserModel({
                    username,
                    password,
                    fullName,
                    email,
                    phone,
                    employeeId,
                    shift
                });
                break;
            
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }
        
        await user.save();
        console.log('User created successfully:', user.username);
        
        // Return success response without password
        const userResponse = user.toJSON();
        
        // Generate token
        const token = jwt.sign(
            { id: user._id, role: role },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
            { expiresIn: '1d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: userResponse, token }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        console.log('Detailed Login Attempt:', {
            username: req.body.username,
            role: req.body.role,
            passwordLength: req.body.password.length
        });
        
        const { username, password, role } = req.body;
        
        // Get appropriate model
        const UserModel = getUserModel(role);
        
        // Find user by username
        const user = await UserModel.findOne({ username });
        
        console.log('User Found:', user ? {
            id: user._id,
            username: user.username,
            storedPasswordHash: user.password
        } : 'No user found');
        
        if (!user) {
            console.log(`No user found with username: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // More detailed password checking
        console.log('Attempting password comparison');
        const isMatch = await user.comparePassword(password);
        
        console.log('Password Comparison Result:', {
            username: user.username,
            isMatch
        });
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { id: user._id, role: role },
            process.env.JWT_SECRET || 'your_jwt_secret_key_for_english_center_app',
            { expiresIn: '1d' }
        );
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Return user data and token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { 
                user: user.toJSON(), 
                token 
            }
        });
        
    } catch (error) {
        console.error('Comprehensive Login Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const { role } = req.user;
        const UserModel = getUserModel(role);
        
        const user = await UserModel.findById(req.user.id)
            .select('-password');
            
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
        
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user',
            error: error.message
        });
    }
};

// Logout user
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const { role } = req.user;
        
        const UserModel = getUserModel(role);
        
        // Find user
        const user = await UserModel.findById(req.user.id);
        
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
};

// Forgot password - generates reset token
exports.forgotPassword = async (req, res) => {
    try {
        const { email, role } = req.body;
        
        // Get appropriate model
        const UserModel = getUserModel(role);
        
        // Find user by email
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { id: user._id, role },
            process.env.JWT_RESET_SECRET || 'reset_password_secret_key_for_english_center',
            { expiresIn: '15m' }
        );
        
        // In a real application, you would send an email with the reset link
        // For now, just return the token
        
        res.status(200).json({
            success: true,
            message: 'Password reset token generated',
            resetToken
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_RESET_SECRET || 'reset_password_secret_key_for_english_center'
        );
        
        // Get appropriate model
        const UserModel = getUserModel(decoded.role);
        
        // Find user
        const user = await UserModel.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};